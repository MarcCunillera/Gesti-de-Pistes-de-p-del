const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const dbDir = process.env.DB_DIR || __dirname;
fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, "padel.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Taules ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'usuario',
    activo INTEGER NOT NULL DEFAULT 1,
    avatar TEXT,
    avatar_color TEXT DEFAULT '#1a472a',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'confirmada',
    abierto INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reserva_jugadores (
    reserva_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (reserva_id, user_id),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bloqueados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    UNIQUE(fecha, hora)
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS amics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amic_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, amic_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (amic_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS solicituds_amic (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    de_user_id INTEGER NOT NULL,
    a_user_id INTEGER NOT NULL,
    estat TEXT NOT NULL DEFAULT 'pendent',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(de_user_id, a_user_id),
    FOREIGN KEY (de_user_id) REFERENCES users(id),
    FOREIGN KEY (a_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS solicituds_partida (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reserva_id INTEGER NOT NULL,
    de_user_id INTEGER NOT NULL,
    estat TEXT NOT NULL DEFAULT 'pendent',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(reserva_id, de_user_id),
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (de_user_id) REFERENCES users(id)
  );
`);

// ── Configuració per defecte ──────────────────────────────────────────────────
const insertConfig = db.prepare(
  "INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)"
);
insertConfig.run("horaInicio", "09:00");
insertConfig.run("horaFin", "22:00");
insertConfig.run("duracion", "90");
insertConfig.run("diasVista", "7");
insertConfig.run("maxReservas", "3");

// ── Usuaris inicials (si la taula és buida) ───────────────────────────────────
const countUsers = db.prepare("SELECT COUNT(*) as n FROM users").get();
if (countUsers.n === 0) {
  const hashAdmin = bcrypt.hashSync("Admin123", 10);
  const hashUser = bcrypt.hashSync("Padel1", 10);

  const ins = db.prepare(
    "INSERT INTO users (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, 1)"
  );

  const adminId = ins.run("Admin", "admin@padel.com", hashAdmin, "admin").lastInsertRowid;
  const u1 = ins.run("Marc", "marc@padel.com", hashUser, "usuario").lastInsertRowid;
  const u2 = ins.run("Maria Lopez", "maria@padel.com", hashUser, "usuario").lastInsertRowid;
  const u3 = ins.run("Juan Garcia", "juan@padel.com", hashUser, "usuario").lastInsertRowid;
  const u4 = ins.run("Carlos Roca", "carlos@padel.com", hashUser, "usuario").lastInsertRowid;
  const u5 = ins.run("Ana Ferrer", "ana@padel.com", hashUser, "usuario").lastInsertRowid;

  // Reserves de demo
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const pasado = new Date();
  pasado.setDate(pasado.getDate() + 2);
  const fmt = (d) => d.toISOString().split("T")[0];

  const insR = db.prepare(
    "INSERT INTO reservas (user_id, fecha, hora, estado, abierto) VALUES (?, ?, ?, 'confirmada', ?)"
  );
  const insJ = db.prepare(
    "INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?)"
  );

  // Reserva privada marc
  const r1 = insR.run(u1, fmt(manana), "10:30", 0).lastInsertRowid;
  insJ.run(r1, u1);

  // Partido abierto marc
  const r2 = insR.run(u1, fmt(manana), "13:30", 1).lastInsertRowid;
  insJ.run(r2, u1);
  insJ.run(r2, u2);

  // Partido abierto maria
  const r3 = insR.run(u2, fmt(pasado), "10:30", 1).lastInsertRowid;
  insJ.run(r3, u2);
  insJ.run(r3, u3);
}

module.exports = db;
