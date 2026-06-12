const db = require("../db");
const { verifyToken } = require("../services/jwt");

async function authMiddleware(req, res, next) {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : header;

  try {
    const decoded = verifyToken(token);

    const user = await db.get(
      "SELECT id, nombre, email, rol, activo, email_verified FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        error: "Usuario no encontrado"
      });
    }

    if (user.activo !== 1) {
      return res.status(401).json({
        error: "Usuario desactivado"
      });
    }

    if (Number(user.email_verified) !== 1) {
      return res.status(401).json({
        error: "Correo pendiente de verificacion"
      });
    }

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      error: "Token inválido o expirado"
    });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.rol !== "admin") {
    return res.status(403).json({ error: "Solo administradores" });
  }

  next();
}

module.exports = { authMiddleware, adminMiddleware };
