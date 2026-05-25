const router = require("express").Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

const safeUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

// GET /api/users — tots (admin) o llista pública
router.get("/", authMiddleware, (req, res) => {
  const rows = db
    .prepare("SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users ORDER BY id")
    .all();
  res.json(rows);
});

// GET /api/users/me
router.get("/me", authMiddleware, (req, res) => {
  const u = db
    .prepare("SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users WHERE id = ?")
    .get(req.user.id);
  if (!u) return res.status(404).json({ error: "Usuari no trobat" });
  res.json(u);
});

// PATCH /api/users/me — editar nom, email, avatar_color, password
router.patch("/me", authMiddleware, (req, res) => {
  const { nombre, email, avatar_color, currentPassword, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: "Cal la contrasenya actual" });
    if (!bcrypt.compareSync(currentPassword, user.password))
      return res.status(401).json({ error: "Contrasenya actual incorrecta" });
    if (newPassword.length < 6)
      return res.status(400).json({ error: "Mínimo 6 caràcters" });
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(bcrypt.hashSync(newPassword, 10), user.id);
  }
  if (nombre) db.prepare("UPDATE users SET nombre = ? WHERE id = ?").run(nombre, user.id);
  if (email) {
    const exists = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, user.id);
    if (exists) return res.status(400).json({ error: "Aquest email ja està en ús" });
    db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email, user.id);
  }
  if (avatar_color) db.prepare("UPDATE users SET avatar_color = ? WHERE id = ?").run(avatar_color, user.id);

  const updated = db.prepare("SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users WHERE id = ?").get(user.id);
  res.json(updated);
});

// POST /api/users/me/avatar
router.post("/me/avatar", authMiddleware, upload.single("avatar"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Cap fitxer rebut" });
  const url = `/uploads/${req.file.filename}`;
  db.prepare("UPDATE users SET avatar = ? WHERE id = ?").run(url, req.user.id);
  res.json({ avatar: url });
});

// DELETE /api/users/me/avatar — eliminar foto de perfil
router.delete("/me/avatar", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (user.avatar) {
    const filePath = path.join(__dirname, "..", user.avatar);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare("UPDATE users SET avatar = NULL WHERE id = ?").run(user.id);
  }
  const updated = db.prepare("SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users WHERE id = ?").get(user.id);
  res.json(updated);
});

// PATCH /api/users/:id — admin: canviar rol/activo
router.patch("/:id", authMiddleware, adminMiddleware, (req, res) => {
  const { rol, activo } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "Usuari no trobat" });
  if (rol) db.prepare("UPDATE users SET rol = ? WHERE id = ?").run(rol, user.id);
  if (activo !== undefined) db.prepare("UPDATE users SET activo = ? WHERE id = ?").run(activo ? 1 : 0, user.id);
  const updated = db.prepare("SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users WHERE id = ?").get(user.id);
  res.json(updated);
});

// DELETE /api/users/:id — admin only
router.delete("/:id", authMiddleware, adminMiddleware, (req, res) => {
  const u = db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id);
  if (!u) return res.status(404).json({ error: "Usuari no trobat" });
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
