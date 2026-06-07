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
    {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
    SECRET,
    { expiresIn: "7d" }
  );

const publicUser = (user) => {
  const { password: _, ...userData } = user;
  return userData;
};

// POST /api/auth/login
router.post("/login", authLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  if (!user.activo) {
    return res.status(403).json({ error: "Cuenta desactivada" });
  }

  const ok = bcrypt.compareSync(password, user.password);

  if (!ok) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const token = createToken(user);

  res.json({
    token,
    user: publicUser(user),
  });
});

// POST /api/auth/register
router.post("/register", authLimiter, (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const normalizedName = nombre.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName) {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: "Formato de email inválido" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "La contraseña debe tener mínimo 6 caracteres",
    });
  }

  const exists = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (exists) {
    return res.status(409).json({ error: "Email ya registrado" });
  }

  const hash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare(
      "INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, 'usuario')"
    )
    .run(normalizedName, normalizedEmail, hash);

  const user = db
    .prepare(
      "SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users WHERE id = ?"
    )
    .get(result.lastInsertRowid);

  const token = createToken(user);

  res.status(201).json({ token, user });
});

// POST /api/auth/google
router.post("/google", authLimiter, async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        error: "GOOGLE_CLIENT_ID no está configurado",
      });
    }

    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Credencial de Google requerida" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: "Token de Google inválido" });
    }

    const email = payload.email ? payload.email.trim().toLowerCase() : "";
    const nombre = payload.name || email;
    const avatar = payload.picture || null;

    if (!email || !payload.email_verified) {
      return res.status(401).json({
        error: "Cuenta de Google no verificada",
      });
    }

    let user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (user && !user.activo) {
      return res.status(403).json({ error: "Cuenta desactivada" });
    }

    if (!user) {
      const randomPassword = bcrypt.hashSync(
        `google_${Date.now()}_${Math.random()}`,
        10
      );

      const result = db
        .prepare(
          "INSERT INTO users (nombre, email, password, rol, activo, avatar) VALUES (?, ?, ?, 'usuario', 1, ?)"
        )
        .run(nombre, email, randomPassword, avatar);

      user = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(result.lastInsertRowid);
    }

    const token = createToken(user);

    res.json({
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Error login Google:", err);
    res.status(401).json({ error: "Login con Google inválido" });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email || !emailRegex.test(email)) {
      return res.json({
        ok: true,
        message: "Si el email existe, recibirás un correo para recuperar la contraseña.",
      });
    }

    const user = db
      .prepare("SELECT id, nombre, email, activo FROM users WHERE email = ?")
      .get(email);

    if (!user || !user.activo) {
      return res.json({
        ok: true,
        message: "Si el email existe, recibirás un correo para recuperar la contraseña.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(
      "UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0"
    ).run(user.id);

    db.prepare(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).run(user.id, token, expiresAt);

    const appUrl = process.env.APP_URL || "http://localhost:3003";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordReset(user, resetUrl);
    } catch (err) {
      console.error("Error enviant correu de recuperació:", err.message);
    }

    res.json({
      ok: true,
      message: "Si el email existe, recibirás un correo para recuperar la contraseña.",
    });
  } catch (err) {
    console.error("Error forgot-password:", err);
    res.status(500).json({ error: "Error intern recuperant contrasenya" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", authLimiter, (req, res) => {
  const token = (req.body.token || "").trim();
  const password = req.body.password || "";

  if (!token || !password) {
    return res.status(400).json({ error: "Token y nueva contraseña requeridos" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "La contraseña debe tener mínimo 6 caracteres",
    });
  }

  const reset = db
    .prepare(
      `SELECT pr.id, pr.user_id, pr.expires_at, pr.used, u.activo
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token = ?`
    )
    .get(token);

  if (!reset || reset.used || !reset.activo) {
    return res.status(400).json({ error: "Enlace inválido o caducado" });
  }

  if (new Date(reset.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: "Enlace caducado" });
  }

  const hash = bcrypt.hashSync(password, 10);

  const tx = db.transaction(() => {
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
      hash,
      reset.user_id
    );

    db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(
      reset.id
    );
  });

  tx();

  res.json({
    ok: true,
    message: "Contraseña actualizada correctamente",
  });
});

module.exports = router;