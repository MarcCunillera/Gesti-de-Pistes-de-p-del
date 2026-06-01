const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { SECRET } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Vuelve a intentarlo en 15 minutos" },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/login
router.post("/login", authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email y contraseña requeridos" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });
  if (!user.activo) return res.status(403).json({ error: "Cuenta desactivada" });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: "Credenciales incorrectas" });

  const token = jwt.sign(
    { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    SECRET,
    { expiresIn: "7d" }
  );

  const { password: _, ...userData } = user;
  res.json({ token, user: userData });
});

// POST /api/auth/register
router.post("/register", authLimiter, (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  if (!emailRegex.test(email))
    return res.status(400).json({ error: "Formato de email inválido" });
  if (password.length < 6)
    return res.status(400).json({ error: "La contraseña debe tener mínimo 6 caracteres" });

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "Email ya registrado" });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, 'usuario')")
    .run(nombre, email, hash);

  const user = db.prepare("SELECT id, nombre, email, rol, activo, avatar, avatar_color, created_at FROM users WHERE id = ?").get(result.lastInsertRowid);
  const token = jwt.sign(
    { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    SECRET,
    { expiresIn: "7d" }
  );
  res.status(201).json({ token, user });
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: "Credencial de Google requerida" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const nombre = payload.name || email;
    const avatar = payload.picture || null;

    if (!email || !payload.email_verified) {
      return res.status(401).json({ error: "Cuenta de Google no verificada" });
    }

    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (user && !user.activo) {
      return res.status(403).json({ error: "Cuenta desactivada" });
    }

    if (!user) {
      const result = db
        .prepare(
          "INSERT INTO users (nombre, email, password, rol, activo, avatar) VALUES (?, ?, ?, 'usuario', 1, ?)"
        )
        .run(nombre, email, "GOOGLE_LOGIN", avatar);

      user = db
        .prepare("SELECT * FROM users WHERE id = ?")
        .get(result.lastInsertRowid);
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userData } = user;

    res.json({ token, user: userData });
  } catch (err) {
    console.error("Error login Google:", err);
    res.status(401).json({ error: "Login con Google inválido" });
  }
});

module.exports = router;
