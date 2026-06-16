const jwt    = require("jsonwebtoken");
const db = require("../db");

// El secret SEMPRE ve de la variable d'entorn.
// Si no existeix, el procés s'atura per evitar desplegar amb secret insegur.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error("ERROR: JWT_SECRET no definit. Defineix-lo al fitxer .env");
  process.exit(1);
}

async function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(401).json({ error: "Token obligatori" });
  }

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : header;

  try {
    const decoded = jwt.verify(token, SECRET);

    const user = await db.get(
      "SELECT id, nombre, email, rol, activo, email_verified FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        error: "Usuari no trobat"
      });
    }

    if (user.activo !== 1) {
      return res.status(401).json({
        error: "Usuari desactivat"
      });
    }

    if (Number(user.email_verified) !== 1) {
      return res.status(401).json({
        error: "Correu pendent de verificació"
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      error: "Token invàlid o caducat"
    });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.rol !== "admin") {
    return res.status(403).json({ error: "Només administradors" });
  }

  next();
}

module.exports = { authMiddleware, adminMiddleware, SECRET };
