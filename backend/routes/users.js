const router = require("express").Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { createEmailVerification, ensureEmailCanBeSent } = require("../services/emailVerification");

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const colorRegex = /^#[0-9a-fA-F]{6}$/;
const ladosValidos = new Set(["derecha", "reves", "ambos"]);
const manosValidas = new Set(["diestro", "zurdo"]);
const telefonoRegex = /^[0-9+\s().-]{0,24}$/;

function isEmptyOrValid(value, validValues) {
  return value === undefined || value === null || value === "" || validValues.has(value);
}

function validateProfileFields({ avatar_color, lado, mano, telefono }) {
  if (avatar_color !== undefined && avatar_color !== null && avatar_color !== "" && !colorRegex.test(String(avatar_color))) {
    return "Color d'avatar invàlid";
  }
  if (!isEmptyOrValid(lado, ladosValidos)) return "Costat invàlid";
  if (!isEmptyOrValid(mano, manosValidas)) return "Mà invàlida";
  if (telefono !== undefined && telefono !== null && telefono !== "" && !telefonoRegex.test(String(telefono))) {
    return "Telèfon invàlid";
  }
  return null;
}

function deleteAvatarFile(avatarPath) {
  if (!avatarPath || !avatarPath.startsWith("/uploads/")) return;
  const filePath = path.join(__dirname, "..", avatarPath.replace(/^\//, ""));
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) { }
  }
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `avatar_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(new Error("Tipus de fitxer no permès"));
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return cb(new Error("Extensió de fitxer no permesa"));
    cb(null, true);
  },
});

router.get("/", authMiddleware, async (req, res) => {
  const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();

  if (req.user.rol === "admin") {
    const rows = await db.all(
    `SELECT id, nombre, email, rol, activo, avatar, avatar_color, lado, mano, telefono, onboarding_done, email_verified, created_at,
              (SELECT COUNT(*)::int FROM amics WHERE amics.user_id = users.id) as amigos_count
       FROM users
       ORDER BY id`
    );

    return res.json(rows.map((u) => ({
      ...u,
      protected_admin: initialAdminEmail && u.email && u.email.toLowerCase() === initialAdminEmail && u.rol === "admin",
    })));
  }

  const rows = await db.all(
    `SELECT id, nombre, avatar, avatar_color, lado, mano,
            (SELECT COUNT(*)::int FROM amics WHERE amics.user_id = users.id) as amigos_count
     FROM users
     WHERE activo = 1
     ORDER BY nombre`
  );
  res.json(rows);
});

router.get("/me", authMiddleware, async (req, res) => {
  const u = await db.get(
    "SELECT id, nombre, email, rol, activo, avatar, avatar_color, lado, mano, telefono, onboarding_done, email_verified, created_at FROM users WHERE id = ?",
    [req.user.id]
  );
  if (!u) return res.status(404).json({ error: "Usuari no trobat" });
  res.json(u);
});

router.patch("/me", authMiddleware, async (req, res) => {
  const { nombre, email, avatar_color, currentPassword, newPassword, lado, mano, telefono } = req.body;
  const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);

  const validationError = validateProfileFields({ avatar_color, lado, mano, telefono });
  if (validationError) return res.status(400).json({ error: validationError });

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "Cal indicar la contrasenya actual" });
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: "La contrasenya actual és incorrecta" });
    if (newPassword.length < 6) return res.status(400).json({ error: "Mínim 6 caràcters" });
  }

  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  const emailChanged = normalizedEmail && normalizedEmail !== user.email;

  if (emailChanged) {
    if (!emailRegex.test(normalizedEmail)) return res.status(400).json({ error: "Format de correu invàlid" });
    try {
      ensureEmailCanBeSent();
    } catch (err) {
      return res.status(503).json({ error: err.message });
    }
    const exists = await db.get("SELECT id FROM users WHERE email = ? AND id != ?", [normalizedEmail, user.id]);
    if (exists) return res.status(400).json({ error: "Aquest correu ja està en ús" });
  }

  await db.tx(async (trx) => {
    if (newPassword) await trx.run("UPDATE users SET password = ? WHERE id = ?", [bcrypt.hashSync(newPassword, 10), user.id]);
    if (nombre) await trx.run("UPDATE users SET nombre = ? WHERE id = ?", [nombre, user.id]);
    if (emailChanged) await trx.run("UPDATE users SET email = ?, email_verified = 0 WHERE id = ?", [normalizedEmail, user.id]);
    if (avatar_color) await trx.run("UPDATE users SET avatar_color = ? WHERE id = ?", [avatar_color, user.id]);
    if (lado !== undefined) await trx.run("UPDATE users SET lado = ? WHERE id = ?", [lado || null, user.id]);
    if (mano !== undefined) await trx.run("UPDATE users SET mano = ? WHERE id = ?", [mano || null, user.id]);
    if (telefono !== undefined) await trx.run("UPDATE users SET telefono = ? WHERE id = ?", [telefono || null, user.id]);
  });

  const updated = await db.get(
    "SELECT id, nombre, email, rol, activo, avatar, avatar_color, lado, mano, telefono, onboarding_done, email_verified, created_at FROM users WHERE id = ?",
    [user.id]
  );

  if (emailChanged) {
    try {
      await createEmailVerification(updated);
    } catch (err) {
      await db.run("UPDATE users SET email = ?, email_verified = ? WHERE id = ?", [user.email, user.email_verified, user.id]);
      console.error("Error enviant el correu de verificació:", err.message);
      return res.status(503).json({ error: "No s'ha pogut enviar el correu de verificació. Revisa la configuració SMTP." });
    }
  }

  res.json(updated);
});

router.patch("/me/onboarding", authMiddleware, async (req, res) => {
  const { telefono, lado, mano, avatar_color } = req.body || {};

  const validationError = validateProfileFields({ avatar_color, lado, mano, telefono });
  if (validationError) return res.status(400).json({ error: validationError });

  await db.run(
    `UPDATE users
     SET telefono = COALESCE(?, telefono),
         lado = COALESCE(?, lado),
         mano = COALESCE(?, mano),
         avatar_color = COALESCE(?, avatar_color),
         onboarding_done = 1
     WHERE id = ?`,
    [
      telefono !== undefined ? (telefono || null) : null,
      lado !== undefined ? (lado || null) : null,
      mano !== undefined ? (mano || null) : null,
      avatar_color !== undefined ? (avatar_color || null) : null,
      req.user.id,
    ]
  );

  const updated = await db.get(
    "SELECT id, nombre, email, rol, activo, avatar, avatar_color, lado, mano, telefono, onboarding_done, email_verified, created_at FROM users WHERE id = ?",
    [req.user.id]
  );

  res.json(updated);
});

router.post("/me/avatar", authMiddleware, (req, res) => {
  upload.single("avatar")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No s'ha rebut cap fitxer" });

    const user = await db.get("SELECT avatar FROM users WHERE id = ?", [req.user.id]);
    const url = `/uploads/${req.file.filename}`;
    await db.run("UPDATE users SET avatar = ? WHERE id = ?", [url, req.user.id]);

    if (user?.avatar && user.avatar !== url) deleteAvatarFile(user.avatar);
    res.json({ avatar: url });
  });
});

router.delete("/me/avatar", authMiddleware, async (req, res) => {
  const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (user.avatar) {
    deleteAvatarFile(user.avatar);
    await db.run("UPDATE users SET avatar = NULL WHERE id = ?", [user.id]);
  }
  const updated = await db.get(
    "SELECT id, nombre, email, rol, activo, avatar, avatar_color, lado, mano, telefono, onboarding_done, email_verified, created_at FROM users WHERE id = ?",
    [user.id]
  );
  res.json(updated);
});

router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { activo, rol } = req.body;

  const user = await db.get("SELECT id, email, rol FROM users WHERE id = ?", [userId]);
  if (!user) return res.status(404).json({ error: "Usuari no trobat" });

  const initialAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || "").trim().toLowerCase();
  const isProtectedAdmin = initialAdminEmail && user.email && user.email.toLowerCase() === initialAdminEmail && user.rol === "admin";

  if (userId === req.user.id && rol && rol !== "admin") return res.status(400).json({ error: "No et pots treure el teu propi rol d'admin" });
  if (isProtectedAdmin && rol !== undefined && rol !== "admin") return res.status(400).json({ error: "No es pot treure el rol a l'administrador principal" });
  if (rol && !["admin", "usuario"].includes(rol)) return res.status(400).json({ error: "Rol invàlid" });

  if (activo !== undefined) await db.run("UPDATE users SET activo = ? WHERE id = ?", [activo ? 1 : 0, userId]);
  if (rol !== undefined) await db.run("UPDATE users SET rol = ? WHERE id = ?", [rol, userId]);

  const updated = await db.get(
    `SELECT id, nombre, email, rol, activo, avatar, avatar_color, lado, mano, telefono, email_verified, created_at
     FROM users
     WHERE id = ?`,
    [userId]
  );

  res.json({
    ...updated,
    protected_admin: initialAdminEmail && updated.email && updated.email.toLowerCase() === initialAdminEmail && updated.rol === "admin",
  });
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const u = await db.get("SELECT id, nombre, activo FROM users WHERE id = ?", [userId]);

  if (!u) return res.status(404).json({ error: "Usuari no trobat" });
  if (userId === req.user.id) return res.status(400).json({ error: "No pots desactivar el teu propi compte" });

  await db.run("UPDATE users SET activo = 0 WHERE id = ?", [userId]);
  res.json({ ok: true, message: "Usuari desactivat" });
});

module.exports = router;
