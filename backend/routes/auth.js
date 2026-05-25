const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email i contrasenya requerits" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Credencials incorrectes" });
  if (!user.activo) return res.status(403).json({ error: "Compte desactivat" });

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) return res.status(401).json({ error: "Credencials incorrectes" });

  const token = jwt.sign(
    { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    SECRET,
    { expiresIn: "7d" }
  );

  const { password: _, ...userData } = user;
  res.json({ token, user: userData });
});

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password)
    return res.status(400).json({ error: "Tots els camps són obligatoris" });
  if (password.length < 6)
    return res.status(400).json({ error: "La contrasenya ha de tenir mínim 6 caràcters" });

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (exists) return res.status(409).json({ error: "Email ja registrat" });

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

module.exports = router;
