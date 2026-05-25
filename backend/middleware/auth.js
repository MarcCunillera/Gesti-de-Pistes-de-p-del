const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "padel_secret_dev_2024";

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
