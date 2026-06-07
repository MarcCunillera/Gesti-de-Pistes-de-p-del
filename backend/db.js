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

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── Índexs i migracions ──────────────────────────────────────────────────────
// Eliminem l'índex antic (fecha, hora, estado) que bloquejava cancel·lacions
// múltiples al mateix slot, i el substituïm per un índex parcial que només
// impedeix dues reserves CONFIRMADES al mateix slot.
try { db.prepare("DROP INDEX IF EXISTS idx_reservas_fecha_hora_estado").run(); } catch (_) { }
try {
  db.prepare(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_fecha_hora_confirmada ON reservas(fecha, hora) WHERE estado = 'confirmada'"
  ).run();
} catch (err) {
  console.error("No s'ha pogut crear l'índex parcial de reserves:", err.message);
}

// Migracions de camps nous a users
const migrationsUsers = [
  "ALTER TABLE users ADD COLUMN lado TEXT DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN mano TEXT DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN telefono TEXT DEFAULT NULL",
];
for (const sql of migrationsUsers) {
  try { db.prepare(sql).run(); } catch (_) { }
}

// ── Configuració per defecte ──────────────────────────────────────────────────
const insertConfig = db.prepare(
  "INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)"
);
insertConfig.run("horaInicio", "08:00");
insertConfig.run("horaFin", "23:00");
insertConfig.run("duracion", "90");
insertConfig.run("diasVista", "7");
insertConfig.run("maxReservas", "3");

// ── Administrador inicial (si la taula és buida) ──────────────────────────────
const countUsers = db.prepare("SELECT COUNT(*) as n FROM users").get();

if (countUsers.n === 0) {
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const initialAdminName =
    process.env.INITIAL_ADMIN_NAME || "Administrador";

  if (initialAdminEmail && initialAdminPassword) {
    const hashAdmin = bcrypt.hashSync(initialAdminPassword, 10);

    db.prepare(`
      INSERT INTO users
      (nombre, email, password, rol, activo)
      VALUES (?, ?, ?, 'admin', 1)
    `).run(
      initialAdminName,
      initialAdminEmail,
      hashAdmin
    );

    console.log(
      `Administrador inicial creat: ${initialAdminEmail}`
    );
  } else {
    console.warn(`
No hi ha cap usuari a la base de dades.
Defineix les variables d'entorn:

INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD
INITIAL_ADMIN_NAME

per crear automàticament el primer administrador.
`);
  }
}

module.exports = db;