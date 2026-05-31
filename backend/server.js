require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");

const app  = express();
const PORT = process.env.PORT || 4000;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Permet l'origen del frontend definit per variable d'entorn.
// En local accepta localhost:3003 i localhost:5173 (Vite dev).
// En producció, defineix FRONTEND_URL al .env.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)
  .concat(["http://localhost:3003", "http://localhost:5173"]);

app.use(cors({
  origin: (origin, cb) => {
    // Permet peticions sense origen (Postman, mòbil natiu, curl)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no permès — ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Servir uploads ────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Rutes ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/users",   require("./routes/users"));
app.use("/api/reservas",require("./routes/reservas"));
app.use("/api/amics",   require("./routes/amics"));

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Servir frontend estàtic (producció) ────────────────────────────────────────
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));
}

app.listen(PORT, () => {
  console.log(`✅  Backend Pàdel escoltant a http://localhost:${PORT}`);
});