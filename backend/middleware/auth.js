const jwt    = require("jsonwebtoken");

// El secret SEMPRE ve de la variable d'entorn.
// Si no existeix, el procés s'atura per evitar desplegar amb secret insegur.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error("❌  ERROR: JWT_SECRET no definit. Defineix-lo al fitxer .env");
  process.exit(1);
}

function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ error: "Token requerit" });

  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token invàlid o expirat" });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.rol !== "admin")
    return res.status(403).json({ error: "Només administradors" });
  next();
}

module.exports = { authMiddleware, adminMiddleware, SECRET };