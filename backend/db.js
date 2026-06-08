const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL no definida. PostgreSQL es obligatorio.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

function sqlParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function query(sql, params = [], client = pool) {
  return client.query(sqlParams(sql), params);
}

async function all(sql, params = [], client = pool) {
  const result = await query(sql, params, client);
  return result.rows;
}

async function get(sql, params = [], client = pool) {
  const result = await query(sql, params, client);
  return result.rows[0];
}

async function run(sql, params = [], client = pool) {
  const result = await query(sql, params, client);
  return {
    changes: result.rowCount,
    insertedId: result.rows?.[0]?.id,
    row: result.rows?.[0],
  };
}

async function tx(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work({
      query: (sql, params = []) => query(sql, params, client),
      all: (sql, params = []) => all(sql, params, client),
      get: (sql, params = []) => get(sql, params, client),
      run: (sql, params = []) => run(sql, params, client),
    });
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function init() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'usuario',
      activo INTEGER NOT NULL DEFAULT 1,
      avatar TEXT,
      avatar_color TEXT DEFAULT '#1a472a',
      created_at TIMESTAMPTZ DEFAULT now(),
      lado TEXT DEFAULT NULL,
      mano TEXT DEFAULT NULL,
      telefono TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS reservas (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'confirmada',
      abierto INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS reserva_jugadores (
      reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (reserva_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS bloqueados (
      id SERIAL PRIMARY KEY,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      UNIQUE(fecha, hora)
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS amics (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amic_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, amic_id)
    );

    CREATE TABLE IF NOT EXISTS solicituds_amic (
      id SERIAL PRIMARY KEY,
      de_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      a_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      estat TEXT NOT NULL DEFAULT 'pendent',
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(de_user_id, a_user_id)
    );

    CREATE TABLE IF NOT EXISTS solicituds_partida (
      id SERIAL PRIMARY KEY,
      reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
      de_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      estat TEXT NOT NULL DEFAULT 'pendent',
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(reserva_id, de_user_id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  await query("DROP INDEX IF EXISTS idx_reservas_fecha_hora_estado");
  await query(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_fecha_hora_confirmada ON reservas(fecha, hora) WHERE estado = 'confirmada'"
  );

  await query("INSERT INTO config (key, value) VALUES ('horaInicio', '08:00') ON CONFLICT (key) DO NOTHING");
  await query("INSERT INTO config (key, value) VALUES ('horaFin', '23:00') ON CONFLICT (key) DO NOTHING");
  await query("INSERT INTO config (key, value) VALUES ('duracion', '90') ON CONFLICT (key) DO NOTHING");
  await query("INSERT INTO config (key, value) VALUES ('diasVista', '7') ON CONFLICT (key) DO NOTHING");
  await query("INSERT INTO config (key, value) VALUES ('maxReservas', '3') ON CONFLICT (key) DO NOTHING");

  const countUsers = await get("SELECT COUNT(*)::int as n FROM users");

  if (countUsers.n === 0) {
    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const initialAdminName = process.env.INITIAL_ADMIN_NAME || "Administrador";

    if (initialAdminEmail && initialAdminPassword) {
      const hashAdmin = bcrypt.hashSync(initialAdminPassword, 10);
      await run(
        "INSERT INTO users (nombre, email, password, rol, activo) VALUES (?, ?, ?, 'admin', 1)",
        [initialAdminName, initialAdminEmail.trim().toLowerCase(), hashAdmin]
      );
      console.log(`Administrador inicial creat: ${initialAdminEmail}`);
    } else {
      console.warn("No hi ha cap usuari a PostgreSQL i no s'ha configurat administrador inicial.");
    }
  }
}

module.exports = {
  pool,
  init,
  query,
  all,
  get,
  run,
  tx,
};
