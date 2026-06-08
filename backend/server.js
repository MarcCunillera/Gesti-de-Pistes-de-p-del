require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

const originalRouter = express.Router;
express.Router = function patchedRouter(...args) {
  const router = originalRouter.apply(this, args);
  for (const method of ["get", "post", "put", "patch", "delete", "use"]) {
    const original = router[method].bind(router);
    router[method] = (...routeArgs) => original(...routeArgs.map((arg) => {
      if (typeof arg !== "function") return arg;
      return function wrappedAsync(req, res, next) {
        Promise.resolve(arg(req, res, next)).catch(next);
      };
    }));
  }
  return router;
};

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .concat(["http://localhost:3003", "http://localhost:5173"]);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origen no permitido - ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/reservas", require("./routes/reservas"));
app.use("/api/amics", require("./routes/amics"));

app.get("/api/health", (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error("Error API:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));
}

db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend Padel escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error inicializando PostgreSQL:", err);
    process.exit(1);
  });
