const router = require("express").Router();
const db = require("../db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  sendReservaConfirmada,
  sendReservaCancelada,
  sendSolicitudPartida,
  sendSolicitudAcceptada,
  sendSolicitudRebutjada,
  sendInvitacioPartida,
} = require("../services/mail");

const getJugadors = (reservaId) =>
  db
    .prepare(
      `SELECT u.id, u.nombre, u.avatar, u.avatar_color
       FROM reserva_jugadores rj
       JOIN users u ON u.id = rj.user_id
       WHERE rj.reserva_id = ?`
    )
    .all(reservaId);

const enrichReserva = (r) => ({ ...r, jugadors: getJugadors(r.id) });

const getConfigValue = (key, fallback) => {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
  return row ? row.value : fallback;
};

const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Europe/Madrid";

function getLocalNowKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = {};
  for (const p of parts) {
    if (p.type !== "literal") values[p.type] = p.value;
  }

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function slotHasStarted(fecha, hora) {
  return `${fecha}T${hora}` <= getLocalNowKey();
}

const isValidDate = (fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha);
const isValidTime = (hora) => /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);

const isPastSlot = (fecha, hora) => {
  return slotHasStarted(fecha, hora);
};

const isAllowedSlot = (hora) => {
  const horaInicio = getConfigValue("horaInicio", "08:00");
  const horaFin = getConfigValue("horaFin", "23:00");
  const duracion = parseInt(getConfigValue("duracion", "90"), 10);

  const slot = timeToMinutes(hora);
  const inicio = timeToMinutes(horaInicio);
  const fin = timeToMinutes(horaFin);

  if (slot < inicio || slot >= fin) return false;

  return (slot - inicio) % duracion === 0;
};

// GET /api/reservas/all — totes les reserves confirmades per al calendari
function cancelExpiredOpenMatches() {
  const rows = db
    .prepare(
      `SELECT id, fecha, hora
       FROM reservas
       WHERE estado = 'confirmada' AND abierto = 1`
    )
    .all();

  const expired = rows.filter((r) => {
    return slotHasStarted(r.fecha, r.hora) && getJugadors(r.id).length < 4;
  });

  if (expired.length === 0) return 0;

  const cancel = db.transaction((reservasToCancel) => {
    for (const r of reservasToCancel) {
      db.prepare("UPDATE reservas SET estado = 'cancelada', abierto = 0 WHERE id = ?").run(r.id);
      db.prepare(
        "UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND estat IN ('pendent', 'invitat')"
      ).run(r.id);
    }
  });

  cancel(expired);
  return expired.length;
}

router.use((req, res, next) => {
  try {
    cancelExpiredOpenMatches();
  } catch (err) {
    console.error("Error cancelando partidas abiertas caducadas:", err.message);
  }
  next();
});

router.get("/all", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.* FROM reservas r
       WHERE r.estado = 'confirmada'
       ORDER BY r.fecha, r.hora`
    )
    .all();

  res.json(rows.map(enrichReserva));
});

// POST /api/reservas
router.post("/", authMiddleware, async (req, res) => {
  const { fecha, hora, abierto } = req.body;

  if (!fecha || !hora) {
    return res.status(400).json({ error: "Fecha y hora requeridas" });
  }

  if (!isValidDate(fecha)) {
    return res.status(400).json({ error: "Formato de fecha inválido" });
  }

  if (!isValidTime(hora)) {
    return res.status(400).json({ error: "Formato de hora inválido" });
  }

  if (isPastSlot(fecha, hora)) {
    return res.status(400).json({ error: "No se pueden hacer reservas en el pasado" });
  }

  if (!isAllowedSlot(hora)) {
    return res.status(400).json({ error: "Hora fuera del horario permitido" });
  }

  const bloq = db
    .prepare("SELECT id FROM bloqueados WHERE fecha = ? AND hora = ?")
    .get(fecha, hora);

  if (bloq) {
    return res.status(409).json({ error: "Franja bloqueada" });
  }

  const ocupat = db
    .prepare(
      "SELECT id FROM reservas WHERE fecha = ? AND hora = ? AND estado = 'confirmada'"
    )
    .get(fecha, hora);

  if (ocupat) {
    return res.status(409).json({ error: "Franja ya reservada" });
  }

  const maxReservas = parseInt(getConfigValue("maxReservas", "3"), 10);
  const today = new Date().toISOString().split("T")[0];

  const activas = db
    .prepare(
      "SELECT COUNT(*) as n FROM reservas WHERE user_id = ? AND fecha >= ? AND estado = 'confirmada'"
    )
    .get(req.user.id, today);

  if (activas.n >= maxReservas) {
    return res.status(409).json({
      error: `Límite de ${maxReservas} reservas activas`,
    });
  }

  let result;

  try {
    result = db
      .prepare(
        "INSERT INTO reservas (user_id, fecha, hora, estado, abierto) VALUES (?, ?, ?, 'confirmada', ?)"
      )
      .run(req.user.id, fecha, hora, abierto ? 1 : 0);
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Franja ya reservada" });
    }

    console.error("Error creant reserva:", err);
    return res.status(500).json({ error: "Error interno creando la reserva" });
  }

  db.prepare(
    "INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?)"
  ).run(result.lastInsertRowid, req.user.id);

  const r = db
    .prepare("SELECT * FROM reservas WHERE id = ?")
    .get(result.lastInsertRowid);

  const user = db
    .prepare("SELECT id, nombre, email FROM users WHERE id = ?")
    .get(req.user.id);

  try {
    await sendReservaConfirmada(user, r);
  } catch (err) {
    console.error("Error enviant correu de reserva:", err.message);
  }

  res.status(201).json(enrichReserva(r));
});

// ── Sol·licituds de partida ─────────────────────────────────────────────────

router.get("/solicituds/meues", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT sp.id, sp.reserva_id, sp.estat, sp.created_at,
              r.fecha, r.hora, r.user_id as organitzador_id,
              u.nombre as organitzador_nombre, u.avatar_color as organitzador_color
       FROM solicituds_partida sp
       JOIN reservas r ON r.id = sp.reserva_id
       JOIN users u ON u.id = r.user_id
       WHERE sp.de_user_id = ? AND sp.estat IN ('pendent', 'invitat') AND r.estado = 'confirmada'
       ORDER BY r.fecha, r.hora`
    )
    .all(req.user.id);

  res.json(rows);
});

router.get("/solicituds/invitades", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT sp.id, sp.reserva_id, sp.estat, sp.created_at,
              r.fecha, r.hora,
              u.id as de_id, u.nombre as de_nombre, u.email as de_email,
              u.avatar, u.avatar_color
       FROM solicituds_partida sp
       JOIN reservas r ON r.id = sp.reserva_id
       JOIN users u ON u.id = sp.de_user_id
       WHERE r.user_id = ? AND sp.estat = 'invitat' AND r.estado = 'confirmada'
       ORDER BY sp.created_at`
    )
    .all(req.user.id);

  res.json(rows);
});

router.get("/solicituds/pendent", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT sp.id, sp.reserva_id, sp.estat, sp.created_at,
              r.fecha, r.hora,
              u.id as de_id, u.nombre as de_nombre, u.email as de_email,
              u.avatar, u.avatar_color
       FROM solicituds_partida sp
       JOIN reservas r ON r.id = sp.reserva_id
       JOIN users u ON u.id = sp.de_user_id
       WHERE r.user_id = ? AND sp.estat = 'pendent' AND r.estado = 'confirmada'
       ORDER BY sp.created_at`
    )
    .all(req.user.id);

  res.json(rows);
});

router.patch("/solicituds/:id", authMiddleware, async (req, res) => {
  const sp = db
    .prepare("SELECT * FROM solicituds_partida WHERE id = ?")
    .get(req.params.id);

  if (!sp) return res.status(404).json({ error: "Solicitud no encontrada" });

  const r = db
    .prepare("SELECT * FROM reservas WHERE id = ?")
    .get(sp.reserva_id);

  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  const esOrganitzador = r.user_id === req.user.id;
  const esInvitat = sp.de_user_id === req.user.id && sp.estat === "invitat";

  if (!esOrganitzador && !esInvitat) {
    return res.status(403).json({ error: "Sin permiso" });
  }

  const { estat } = req.body;

  if (estat !== "acceptada" && estat !== "rebutjada") {
    return res.status(400).json({ error: "Estado inválido" });
  }

  if (esOrganitzador && sp.estat !== "pendent") {
    return res.status(400).json({ error: "Esta solicitud no está pendiente" });
  }

  if (esInvitat && sp.estat !== "invitat") {
    return res.status(400).json({ error: "Esta invitación no está activa" });
  }

  if (estat === "acceptada") {
    const jugadors = getJugadors(r.id);

    if (jugadors.length >= 4) {
      return res.status(409).json({ error: "Partida ya completa" });
    }

    const jaEsta = jugadors.find((j) => j.id === sp.de_user_id);

    if (!jaEsta) {
      db.prepare(
        "INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?)"
      ).run(r.id, sp.de_user_id);
    }
  }

  db.prepare("UPDATE solicituds_partida SET estat = ? WHERE id = ?").run(
    estat,
    sp.id
  );

  const user = db
    .prepare("SELECT id, nombre, email FROM users WHERE id = ?")
    .get(sp.de_user_id);

  try {
    if (estat === "acceptada") {
      await sendSolicitudAcceptada(user, r);
    } else {
      await sendSolicitudRebutjada(user, r);
    }
  } catch (err) {
    console.error("Error enviant correu de sol·licitud:", err.message);
  }

  res.json({ ok: true, estat });
});

router.post("/:id/unirse", authMiddleware, async (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (!r.abierto) return res.status(403).json({ error: "Partida privada" });
  if (r.estado !== "confirmada") return res.status(409).json({ error: "Partida no activa" });

  if (r.user_id === req.user.id) {
    return res.status(409).json({ error: "Eres el organizador" });
  }

  const jugadors = getJugadors(r.id);

  if (jugadors.length >= 4) {
    return res.status(409).json({ error: "Partida completa" });
  }

  const jaEsta = jugadors.find((j) => j.id === req.user.id);

  if (jaEsta) {
    return res.status(409).json({ error: "Ya estás en la partida" });
  }

  const existent = db
    .prepare(
      "SELECT id FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?"
    )
    .get(r.id, req.user.id);

  if (existent) {
    return res.status(409).json({ error: "Ya has enviado una solicitud" });
  }

  db.prepare(
    "INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'pendent')"
  ).run(r.id, req.user.id);

  const organitzador = db
    .prepare("SELECT id, nombre, email FROM users WHERE id = ?")
    .get(r.user_id);

  const solicitant = db
    .prepare("SELECT id, nombre, email FROM users WHERE id = ?")
    .get(req.user.id);

  try {
    await sendSolicitudPartida(organitzador, solicitant, r);
  } catch (err) {
    console.error("Error enviant correu de sol·licitud de partida:", err.message);
  }

  res.status(201).json({ ok: true, message: "Sol·licitud enviada" });
});

router.post("/:id/sortir", authMiddleware, async (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  if (r.user_id === req.user.id) {
    return res.status(400).json({
      error: "El organizador no puede salir, cancela la reserva",
    });
  }

  db.prepare(
    "DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?"
  ).run(r.id, req.user.id);

  db.prepare(
    "UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND de_user_id = ?"
  ).run(r.id, req.user.id);

  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

router.delete("/:id/jugadors/:userId", authMiddleware, async (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sin permiso — no eres el organizador" });
  }

  const userId = parseInt(req.params.userId, 10);

  if (userId === r.user_id) {
    return res.status(400).json({ error: "No puedes expulsar al organizador" });
  }

  db.prepare(
    "DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?"
  ).run(r.id, userId);

  db.prepare(
    "UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND de_user_id = ?"
  ).run(r.id, userId);

  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

router.post("/:id/invitar", authMiddleware, async (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sin permiso — no eres el organizador" });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id requerido" });
  }

  const jugadors = getJugadors(r.id);

  if (jugadors.length >= 4) {
    return res.status(409).json({ error: "Partida completa" });
  }

  const jaEsta = jugadors.find((j) => j.id === user_id);

  if (jaEsta) {
    return res.status(409).json({ error: "El jugador ya está en la partida" });
  }

  const existent = db
    .prepare(
      "SELECT id, estat FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?"
    )
    .get(r.id, user_id);

  if (existent) {
    if (existent.estat === "invitat") {
      return res.status(409).json({
        error: "Ya tienes una invitación pendiente para este jugador",
      });
    }

    if (existent.estat === "acceptada") {
      return res.status(409).json({ error: "El jugador ya está en la partida" });
    }

    db.prepare("UPDATE solicituds_partida SET estat = 'invitat' WHERE id = ?").run(
      existent.id
    );
  } else {
    db.prepare(
      "INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'invitat')"
    ).run(r.id, user_id);
  }

  const userInvitat = db
    .prepare("SELECT id, nombre, email FROM users WHERE id = ?")
    .get(user_id);

  const organitzador = db
    .prepare("SELECT id, nombre, email FROM users WHERE id = ?")
    .get(req.user.id);

  try {
    await sendInvitacioPartida(userInvitat, organitzador, r);
  } catch (err) {
    console.error("Error enviant correu d'invitació:", err.message);
  }

  res.json({ ok: true, message: "Invitació enviada — l'amic ha de confirmar" });
});

router.patch("/:id/abierto", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sin permiso" });
  }

  const { abierto } = req.body;

  db.prepare("UPDATE reservas SET abierto = ? WHERE id = ?").run(
    abierto ? 1 : 0,
    r.id
  );

  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

// ── Bloqueats ────────────────────────────────────────────────────────────────

router.get("/bloqueados", authMiddleware, (req, res) => {
  res.json(db.prepare("SELECT * FROM bloqueados ORDER BY fecha, hora").all());
});

router.post("/bloqueados", authMiddleware, adminMiddleware, (req, res) => {
  const { fecha, hora } = req.body;

  if (!fecha || !hora) {
    return res.status(400).json({ error: "Se requiere fecha y hora" });
  }

  if (!isValidDate(fecha)) {
    return res.status(400).json({ error: "Formato de fecha inválido" });
  }

  if (!isValidTime(hora)) {
    return res.status(400).json({ error: "Formato de hora inválido" });
  }

  if (!isAllowedSlot(hora)) {
    return res.status(400).json({ error: "Hora fuera del horario permitido" });
  }

  try {
    const r = db
      .prepare("INSERT INTO bloqueados (fecha, hora) VALUES (?, ?)")
      .run(fecha, hora);

    res.status(201).json({ id: r.lastInsertRowid, fecha, hora });
  } catch {
    res.status(409).json({ error: "Ya bloqueado" });
  }
});

router.post("/bloqueados/batch", authMiddleware, adminMiddleware, (req, res) => {
  const { fechaInicio, fechaFin, horas, diasSemana } = req.body || {};

  if (!fechaInicio || !fechaFin || !Array.isArray(horas) || horas.length === 0) {
    return res.status(400).json({ error: "Se requiere fechaInicio, fechaFin y horas" });
  }

  const diasSeleccionados = Array.isArray(diasSemana) && diasSemana.length > 0
    ? diasSemana.map((d) => Number(d))
    : [0, 1, 2, 3, 4, 5, 6];

  if (diasSeleccionados.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    return res.status(400).json({ error: "Dias de la semana invalidos" });
  }

  const diasSet = new Set(diasSeleccionados);

  if (!isValidDate(fechaInicio) || !isValidDate(fechaFin)) {
    return res.status(400).json({ error: "Formato de fecha inválido" });
  }

  if (new Date(fechaInicio) > new Date(fechaFin)) {
    return res.status(400).json({ error: "Rango de fechas inválido" });
  }

  for (const hora of horas) {
    if (!isValidTime(hora)) {
      return res.status(400).json({ error: "Formato de hora inválido" });
    }
    if (!isAllowedSlot(hora)) {
      return res.status(400).json({ error: "Hora fuera del horario permitido" });
    }
  }

  const toInsert = [];
  const d = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  while (d <= fin) {
    const f = d.toISOString().split("T")[0];
    if (diasSet.has(d.getUTCDay())) {
      for (const h of horas) {
        toInsert.push([f, h]);
      }
    }
    d.setDate(d.getDate() + 1);
  }

  const insertOrIgnore = db.prepare("INSERT OR IGNORE INTO bloqueados (fecha, hora) VALUES (?, ?)");
  const readBySlot = db.prepare("SELECT id, fecha, hora FROM bloqueados WHERE fecha = ? AND hora = ?");

  const created = db.transaction((rows) => {
    const inserted = [];
    for (const [f, h] of rows) {
      const r = insertOrIgnore.run(f, h);
      if (r.changes > 0) {
        inserted.push(readBySlot.get(f, h));
      }
    }
    return inserted;
  })(toInsert);

  res.status(201).json({ created });
});

router.delete("/bloqueados/:id", authMiddleware, adminMiddleware, (req, res) => {
  db.prepare("DELETE FROM bloqueados WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── Config ───────────────────────────────────────────────────────────────────

router.get("/config", authMiddleware, (req, res) => {
  const rows = db.prepare("SELECT key, value FROM config").all();
  const obj = {};

  rows.forEach((r) => {
    obj[r.key] = r.value;
  });

  res.json(obj);
});

router.put("/config", authMiddleware, adminMiddleware, (req, res) => {
  const upsert = db.prepare(
    "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)"
  );

  const update = db.transaction((data) => {
    Object.entries(data).forEach(([k, v]) => {
      upsert.run(k, String(v));
    });
  });

  update(req.body);
  res.json({ ok: true });
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) {
    return res.status(404).json({ error: "Reserva no trobada" });
  }

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sin permiso" });
  }

  const cancelReserva = db.transaction(() => {
    db.prepare("UPDATE reservas SET estado = 'cancelada', abierto = 0 WHERE id = ?").run(r.id);
    db.prepare(
      "UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND estat IN ('pendent', 'invitat')"
    ).run(r.id);
  });

  try {
    cancelReserva();
  } catch (err) {
    console.error("Error cancelant reserva:", err);
    return res.status(500).json({ error: "Error interno cancelando la reserva" });
  }

  const user = db
    .prepare("SELECT id, nombre, email FROM users WHERE id = ?")
    .get(r.user_id);

  try {
    await sendReservaCancelada(user, r);
  } catch (err) {
    console.error(
      "Error enviant correu de cancel·lació:",
      err.message
    );
  }

  res.json({ ok: true });
});

module.exports = router;
