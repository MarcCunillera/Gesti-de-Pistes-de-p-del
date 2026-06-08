const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { SECRET } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const { sendPasswordReset } = require("../services/mail");

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Vuelve a intentarlo en 15 minutos" },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user) =>
  jwt.sign(
    { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    SECRET,
    { expiresIn: "7d" }
  );

const publicUser = (user) => {
  const { password: _, ...userData } = user;
  return userData;
};

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contrasena requeridos" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.get("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  if (!user.activo) {
    return res.status(403).json({ error: "Cuenta desactivada" });
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

router.post("/register", authLimiter, async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const normalizedName = nombre.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName) return res.status(400).json({ error: "El nombre es obligatorio" });
  if (!emailRegex.test(normalizedEmail)) return res.status(400).json({ error: "Formato de email invalido" });
  if (password.length < 6) return res.status(400).json({ error: "La contrasena debe tener minimo 6 caracteres" });

  const exists = await db.get("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
  if (exists) return res.status(409).json({ error: "Email ya registrado" });

  const hash = bcrypt.hashSync(password, 10);
  const result = await db.run(
    "INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, 'usuario') RETURNING id",
    [normalizedName, normalizedEmail, hash]
  );

  const user = await db.get(
    "SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users WHERE id = ?",
    [result.insertedId]
  );

  res.status(201).json({ token: createToken(user), user });
});

router.post("/google", authLimiter, async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: "GOOGLE_CLIENT_ID no esta configurado" });

    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Credencial de Google requerida" });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload) return res.status(401).json({ error: "Token de Google invalido" });

    const email = payload.email ? payload.email.trim().toLowerCase() : "";
    const nombre = payload.name || email;
    const avatar = payload.picture || null;

    if (!email || !payload.email_verified) return res.status(401).json({ error: "Cuenta de Google no verificada" });

    let user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    if (user && !user.activo) return res.status(403).json({ error: "Cuenta desactivada" });

    if (!user) {
      const randomPassword = bcrypt.hashSync(`google_${Date.now()}_${Math.random()}`, 10);
      const result = await db.run(
        "INSERT INTO users (nombre, email, password, rol, activo, avatar) VALUES (?, ?, ?, 'usuario', 1, ?) RETURNING id",
        [nombre, email, randomPassword, avatar]
      );
      user = await db.get("SELECT * FROM users WHERE id = ?", [result.insertedId]);
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    console.error("Error login Google:", err);
    res.status(401).json({ error: "Login con Google invalido" });
  }
});

router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const okMessage = "Si el email existe, recibiras un correo para recuperar la contrasena.";

    if (!email || !emailRegex.test(email)) return res.json({ ok: true, message: okMessage });

    const user = await db.get("SELECT id, nombre, email, activo FROM users WHERE email = ?", [email]);
    if (!user || !user.activo) return res.json({ ok: true, message: okMessage });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await db.tx(async (trx) => {
      await trx.run("UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0", [user.id]);
      await trx.run("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)", [user.id, token, expiresAt]);
    });

    const appUrl = process.env.APP_URL || "http://localhost:3003";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordReset(user, resetUrl);
    } catch (err) {
      console.error("Error enviando correo de recuperacion:", err.message);
    }

    res.json({ ok: true, message: okMessage });
  } catch (err) {
    console.error("Error forgot-password:", err);
    res.status(500).json({ error: "Error interno recuperando contrasena" });
  }
});

router.post("/reset-password", authLimiter, async (req, res) => {
  const token = (req.body.token || "").trim();
  const password = req.body.password || "";

  if (!token || !password) return res.status(400).json({ error: "Token y nueva contrasena requeridos" });
  if (password.length < 6) return res.status(400).json({ error: "La contrasena debe tener minimo 6 caracteres" });

  const reset = await db.get(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used, u.activo
     FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE pr.token = ?`,
    [token]
  );

  if (!reset || reset.used || !reset.activo) return res.status(400).json({ error: "Enlace invalido o caducado" });
  if (new Date(reset.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Enlace caducado" });

  const hash = bcrypt.hashSync(password, 10);

  await db.tx(async (trx) => {
    await trx.run("UPDATE users SET password = ? WHERE id = ?", [hash, reset.user_id]);
    await trx.run("UPDATE password_resets SET used = 1 WHERE id = ?", [reset.id]);
  });

  res.json({ ok: true, message: "Contrasena actualizada correctamente" });
});

module.exports = router;
