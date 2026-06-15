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

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Europe/Madrid";

function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};
  for (const p of parts) if (p.type !== "literal") values[p.type] = p.value;
  return `${values.year}-${values.month}-${values.day}`;
}

function addDaysKey(fecha, days) {
  const [y, m, d] = fecha.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return date.toISOString().split("T")[0];
}

function weekdayKey(fecha) {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

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
  for (const p of parts) if (p.type !== "literal") values[p.type] = p.value;
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

const slotHasStarted = (fecha, hora) => `${fecha}T${hora}` <= getLocalNowKey();
const isValidDate = (fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha);
const isValidTime = (hora) => /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
const isPastSlot = (fecha, hora) => slotHasStarted(fecha, hora);

async function getJugadors(reservaId, client) {
  return db.all(
    `SELECT u.id, u.nombre, u.avatar, u.avatar_color
     FROM reserva_jugadores rj
     JOIN users u ON u.id = rj.user_id
     WHERE rj.reserva_id = ?`,
    [reservaId],
    client
  );
}

async function enrichReserva(r) {
  return { ...r, jugadors: await getJugadors(r.id) };
}

async function getConfigValue(key, fallback) {
  const row = await db.get("SELECT value FROM config WHERE key = ?", [key]);
  return row ? row.value : fallback;
}

async function isAllowedSlot(hora) {
  const horaInicio = await getConfigValue("horaInicio", "08:00");
  const horaFin = await getConfigValue("horaFin", "23:00");
  const duracion = parseInt(await getConfigValue("duracion", "90"), 10);
  const slot = timeToMinutes(hora);
  const inicio = timeToMinutes(horaInicio);
  const fin = timeToMinutes(horaFin);

  if (slot < inicio || slot >= fin) return false;
  return (slot - inicio) % duracion === 0;
}

async function cancelExpiredOpenMatches() {
  const rows = await db.all(
    `SELECT r.id, r.fecha, r.hora, COUNT(rj.user_id)::int as jugadors_count
     FROM reservas r
     LEFT JOIN reserva_jugadores rj ON rj.reserva_id = r.id
     WHERE r.estado = 'confirmada' AND r.abierto = 1
     GROUP BY r.id, r.fecha, r.hora`
  );

  const expired = rows.filter((r) => slotHasStarted(r.fecha, r.hora) && r.jugadors_count < 4);

  if (expired.length === 0) return 0;

  await db.tx(async (trx) => {
    for (const r of expired) {
      await trx.run("UPDATE reservas SET estado = 'cancelada', abierto = 0 WHERE id = ?", [r.id]);
      await trx.run(
        "UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND estat IN ('pendent', 'invitat')",
        [r.id]
      );
    }
  });

  return expired.length;
}

router.use(authMiddleware);

router.use(async (req, res, next) => {
  try {
    await cancelExpiredOpenMatches();
  } catch (err) {
    console.error("Error cancelando partidas abiertas caducadas:", err.message);
  }
  next();
});

router.get("/all", async (req, res) => {
  const where = req.user.rol === "admin" ? "" : "WHERE r.estado = 'confirmada'";
  const rows = await db.all(
    `SELECT r.* FROM reservas r
     ${where}
     ORDER BY r.fecha, r.hora`
  );
  res.json(await Promise.all(rows.map(enrichReserva)));
});

router.post("/", async (req, res) => {
  const { fecha, hora, abierto } = req.body;

  if (!fecha || !hora) return res.status(400).json({ error: "Fecha y hora requeridas" });
  if (!isValidDate(fecha)) return res.status(400).json({ error: "Formato de fecha invalido" });
  if (!isValidTime(hora)) return res.status(400).json({ error: "Formato de hora invalido" });
  if (isPastSlot(fecha, hora)) return res.status(400).json({ error: "No se pueden hacer reservas en el pasado" });
  if (!(await isAllowedSlot(hora))) return res.status(400).json({ error: "Hora fuera del horario permitido" });

  const bloq = await db.get("SELECT id FROM bloqueados WHERE fecha = ? AND hora = ?", [fecha, hora]);
  if (bloq) return res.status(409).json({ error: "Franja bloqueada" });

  const ocupat = await db.get(
    "SELECT id FROM reservas WHERE fecha = ? AND hora = ? AND estado = 'confirmada'",
    [fecha, hora]
  );
  if (ocupat) return res.status(409).json({ error: "Franja ya reservada" });

  const maxReservas = parseInt(await getConfigValue("maxReservas", "3"), 10);
  const today = localDateKey();
  const activas = await db.get(
    "SELECT COUNT(*)::int as n FROM reservas WHERE user_id = ? AND fecha >= ? AND estado = 'confirmada'",
    [req.user.id, today]
  );
  if (activas.n >= maxReservas) return res.status(409).json({ error: `Limite de ${maxReservas} reservas activas` });

  let reservaId;
  try {
    await db.tx(async (trx) => {
      const result = await trx.run(
        "INSERT INTO reservas (user_id, fecha, hora, estado, abierto) VALUES (?, ?, ?, 'confirmada', ?) RETURNING id",
        [req.user.id, fecha, hora, abierto ? 1 : 0]
      );
      reservaId = result.insertedId;
      await trx.run("INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?)", [reservaId, req.user.id]);
    });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Franja ya reservada" });
    console.error("Error creando reserva:", err);
    return res.status(500).json({ error: "Error interno creando la reserva" });
  }

  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [reservaId]);
  const user = await db.get("SELECT id, nombre, email FROM users WHERE id = ?", [req.user.id]);

  try {
    await sendReservaConfirmada(user, r);
  } catch (err) {
    console.error("Error enviando correo de reserva:", err.message);
  }

  res.status(201).json(await enrichReserva(r));
});

router.get("/solicituds/meues", async (req, res) => {
  const rows = await db.all(
    `SELECT sp.id, sp.reserva_id, sp.estat, sp.created_at,
            r.fecha, r.hora, r.user_id as organitzador_id,
            u.nombre as organitzador_nombre, u.avatar_color as organitzador_color
     FROM solicituds_partida sp
     JOIN reservas r ON r.id = sp.reserva_id
     JOIN users u ON u.id = r.user_id
     WHERE sp.de_user_id = ? AND sp.estat IN ('pendent', 'invitat') AND r.estado = 'confirmada'
     ORDER BY r.fecha, r.hora`,
    [req.user.id]
  );
  res.json(rows);
});

router.get("/solicituds/invitades", async (req, res) => {
  const rows = await db.all(
    `SELECT sp.id, sp.reserva_id, sp.estat, sp.created_at,
            r.fecha, r.hora,
            u.id as de_id, u.nombre as de_nombre,
            u.avatar, u.avatar_color
     FROM solicituds_partida sp
     JOIN reservas r ON r.id = sp.reserva_id
     JOIN users u ON u.id = sp.de_user_id
     WHERE r.user_id = ? AND sp.estat = 'invitat' AND r.estado = 'confirmada' AND u.activo = 1
     ORDER BY sp.created_at`,
    [req.user.id]
  );
  res.json(rows);
});

router.get("/solicituds/pendent", async (req, res) => {
  const rows = await db.all(
    `SELECT sp.id, sp.reserva_id, sp.estat, sp.created_at,
            r.fecha, r.hora,
            u.id as de_id, u.nombre as de_nombre,
            u.avatar, u.avatar_color
     FROM solicituds_partida sp
     JOIN reservas r ON r.id = sp.reserva_id
     JOIN users u ON u.id = sp.de_user_id
     WHERE r.user_id = ? AND sp.estat = 'pendent' AND r.estado = 'confirmada' AND u.activo = 1
     ORDER BY sp.created_at`,
    [req.user.id]
  );
  res.json(rows);
});

router.patch("/solicituds/:id", async (req, res) => {
  const sp = await db.get("SELECT * FROM solicituds_partida WHERE id = ?", [req.params.id]);
  if (!sp) return res.status(404).json({ error: "Solicitud no encontrada" });

  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [sp.reserva_id]);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });

  const esOrganitzador = r.user_id === req.user.id;
  const esInvitat = sp.de_user_id === req.user.id && sp.estat === "invitat";
  if (!esOrganitzador && !esInvitat) return res.status(403).json({ error: "Sin permiso" });

  const { estat } = req.body;
  if (!["acceptada", "rebutjada"].includes(estat)) return res.status(400).json({ error: "Estado invalido" });
  if (esOrganitzador && sp.estat !== "pendent") return res.status(400).json({ error: "Esta solicitud no esta pendiente" });
  if (esInvitat && sp.estat !== "invitat") return res.status(400).json({ error: "Esta invitacion no esta activa" });

  if (estat === "acceptada") {
    try {
      await db.tx(async (trx) => {
        const locked = await trx.get("SELECT * FROM reservas WHERE id = ? FOR UPDATE", [r.id]);
        if (!locked || locked.estado !== "confirmada") {
          const err = new Error("Partida no activa");
          err.status = 409;
          throw err;
        }

        const count = await trx.get("SELECT COUNT(*)::int as n FROM reserva_jugadores WHERE reserva_id = ?", [r.id]);
        const jaEsta = await trx.get("SELECT 1 FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?", [r.id, sp.de_user_id]);
        if (!jaEsta && count.n >= 4) {
          const err = new Error("Partida ya completa");
          err.status = 409;
          throw err;
        }

        await trx.run("INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?) ON CONFLICT (reserva_id, user_id) DO NOTHING", [r.id, sp.de_user_id]);
        await trx.run("UPDATE solicituds_partida SET estat = ? WHERE id = ?", [estat, sp.id]);
      });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  } else {
    await db.run("UPDATE solicituds_partida SET estat = ? WHERE id = ?", [estat, sp.id]);
  }

  const user = await db.get("SELECT id, nombre, email FROM users WHERE id = ?", [sp.de_user_id]);
  try {
    if (estat === "acceptada") await sendSolicitudAcceptada(user, r);
    else await sendSolicitudRebutjada(user, r);
  } catch (err) {
    console.error("Error enviando correo de solicitud:", err.message);
  }

  res.json({ ok: true, estat });
});

router.post("/:id/unirse", async (req, res) => {
  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [req.params.id]);

  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (!r.abierto) return res.status(403).json({ error: "Partida privada" });
  if (r.estado !== "confirmada") return res.status(409).json({ error: "Partida no activa" });
  if (r.user_id === req.user.id) return res.status(409).json({ error: "Eres el organizador" });

  const jugadors = await getJugadors(r.id);
  if (jugadors.length >= 4) return res.status(409).json({ error: "Partida completa" });
  if (jugadors.find((j) => j.id === req.user.id)) return res.status(409).json({ error: "Ya estas en la partida" });

  const existent = await db.get(
    "SELECT id FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?",
    [r.id, req.user.id]
  );
  if (existent) return res.status(409).json({ error: "Ya has enviado una solicitud" });

  await db.run("INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'pendent')", [r.id, req.user.id]);

  const organitzador = await db.get("SELECT id, nombre, email FROM users WHERE id = ?", [r.user_id]);
  const solicitant = await db.get("SELECT id, nombre, email FROM users WHERE id = ?", [req.user.id]);

  try {
    await sendSolicitudPartida(organitzador, solicitant, r);
  } catch (err) {
    console.error("Error enviando correo de solicitud de partida:", err.message);
  }

  res.status(201).json({ ok: true, message: "Solicitud enviada" });
});

router.post("/:id/sortir", async (req, res) => {
  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [req.params.id]);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (r.user_id === req.user.id) return res.status(400).json({ error: "El organizador no puede salir, cancela la reserva" });

  await db.tx(async (trx) => {
    await trx.run("DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?", [r.id, req.user.id]);
    await trx.run("UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND de_user_id = ?", [r.id, req.user.id]);
  });

  res.json(await enrichReserva(await db.get("SELECT * FROM reservas WHERE id = ?", [r.id])));
});

router.delete("/:id/jugadors/:userId", async (req, res) => {
  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [req.params.id]);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin") return res.status(403).json({ error: "Sin permiso - no eres el organizador" });

  const userId = parseInt(req.params.userId, 10);
  if (userId === r.user_id) return res.status(400).json({ error: "No puedes expulsar al organizador" });

  await db.tx(async (trx) => {
    await trx.run("DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?", [r.id, userId]);
    await trx.run("UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND de_user_id = ?", [r.id, userId]);
  });

  res.json(await enrichReserva(await db.get("SELECT * FROM reservas WHERE id = ?", [r.id])));
});

router.post("/:id/invitar", async (req, res) => {
  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [req.params.id]);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin") return res.status(403).json({ error: "Sin permiso - no eres el organizador" });

  const userId = Number(req.body.user_id);
  if (!Number.isInteger(userId)) return res.status(400).json({ error: "user_id requerido" });

  const userInvitat = await db.get("SELECT id, nombre, email, activo FROM users WHERE id = ?", [userId]);
  if (!userInvitat || userInvitat.activo !== 1) return res.status(404).json({ error: "Usuario no encontrado" });
  if (userId === req.user.id) return res.status(400).json({ error: "No puedes invitarte a ti mismo" });
  if (req.user.rol !== "admin") {
    const esAmic = await db.get("SELECT 1 FROM amics WHERE user_id = ? AND amic_id = ?", [req.user.id, userId]);
    if (!esAmic) return res.status(403).json({ error: "Solo puedes invitar a tus amigos" });
  }

  const jugadors = await getJugadors(r.id);
  if (jugadors.length >= 4) return res.status(409).json({ error: "Partida completa" });
  if (jugadors.find((j) => j.id === userId)) return res.status(409).json({ error: "El jugador ya esta en la partida" });

  const existent = await db.get(
    "SELECT id, estat FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?",
    [r.id, userId]
  );

  if (existent) {
    if (existent.estat === "invitat") return res.status(409).json({ error: "Ya tienes una invitacion pendiente para este jugador" });
    if (existent.estat === "acceptada") return res.status(409).json({ error: "El jugador ya esta en la partida" });
    await db.run("UPDATE solicituds_partida SET estat = 'invitat' WHERE id = ?", [existent.id]);
  } else {
    await db.run("INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'invitat')", [r.id, userId]);
  }

  const organitzador = await db.get("SELECT id, nombre, email FROM users WHERE id = ?", [req.user.id]);

  try {
    await sendInvitacioPartida(userInvitat, organitzador, r);
  } catch (err) {
    console.error("Error enviando correo de invitacion:", err.message);
  }

  res.json({ ok: true, message: "Invitacion enviada - el amigo debe confirmar" });
});

router.patch("/:id/abierto", async (req, res) => {
  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [req.params.id]);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin") return res.status(403).json({ error: "Sin permiso" });

  const { abierto } = req.body;
  await db.run("UPDATE reservas SET abierto = ? WHERE id = ?", [abierto ? 1 : 0, r.id]);
  res.json(await enrichReserva(await db.get("SELECT * FROM reservas WHERE id = ?", [r.id])));
});

router.get("/bloqueados", async (req, res) => {
  res.json(await db.all("SELECT * FROM bloqueados ORDER BY fecha, hora"));
});

router.post("/bloqueados", adminMiddleware, async (req, res) => {
  const { fecha, hora } = req.body;

  if (!fecha || !hora) return res.status(400).json({ error: "Se requiere fecha y hora" });
  if (!isValidDate(fecha)) return res.status(400).json({ error: "Formato de fecha invalido" });
  if (!isValidTime(hora)) return res.status(400).json({ error: "Formato de hora invalido" });
  if (!(await isAllowedSlot(hora))) return res.status(400).json({ error: "Hora fuera del horario permitido" });

  try {
    const r = await db.run("INSERT INTO bloqueados (fecha, hora) VALUES (?, ?) RETURNING id", [fecha, hora]);
    res.status(201).json({ id: r.insertedId, fecha, hora });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Ya bloqueado" });
    throw err;
  }
});

router.post("/bloqueados/batch", adminMiddleware, async (req, res) => {
  const { fechaInicio, fechaFin, horas, diasSemana } = req.body || {};

  if (!fechaInicio || !fechaFin || !Array.isArray(horas) || horas.length === 0) {
    return res.status(400).json({ error: "Se requiere fechaInicio, fechaFin y horas" });
  }

  const diasSeleccionados = Array.isArray(diasSemana) && diasSemana.length > 0
    ? diasSemana.map((d) => Number(d))
    : [];

  if (diasSeleccionados.length === 0) return res.status(400).json({ error: "Selecciona al menos un dia de la semana" });
  if (diasSeleccionados.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    return res.status(400).json({ error: "Dias de la semana invalidos" });
  }

  if (!isValidDate(fechaInicio) || !isValidDate(fechaFin)) return res.status(400).json({ error: "Formato de fecha invalido" });
  if (new Date(fechaInicio) > new Date(fechaFin)) return res.status(400).json({ error: "Rango de fechas invalido" });

  for (const hora of horas) {
    if (!isValidTime(hora)) return res.status(400).json({ error: "Formato de hora invalido" });
    if (!(await isAllowedSlot(hora))) return res.status(400).json({ error: "Hora fuera del horario permitido" });
  }

  const diasSet = new Set(diasSeleccionados);
  const toInsert = [];
  for (let f = fechaInicio; f <= fechaFin; f = addDaysKey(f, 1)) {
    if (diasSet.has(weekdayKey(f))) {
      for (const h of horas) toInsert.push([f, h]);
    }
  }

  const created = await db.tx(async (trx) => {
    const inserted = [];
    for (const [f, h] of toInsert) {
      const r = await trx.run(
        "INSERT INTO bloqueados (fecha, hora) VALUES (?, ?) ON CONFLICT (fecha, hora) DO NOTHING RETURNING id, fecha, hora",
        [f, h]
      );
      if (r.row) inserted.push(r.row);
    }
    return inserted;
  });

  res.status(201).json({ created });
});

router.delete("/bloqueados/:id", adminMiddleware, async (req, res) => {
  await db.run("DELETE FROM bloqueados WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

router.get("/config", async (req, res) => {
  const rows = await db.all("SELECT key, value FROM config");
  const obj = {};
  rows.forEach((r) => { obj[r.key] = r.value; });
  res.json(obj);
});

router.put("/config", adminMiddleware, async (req, res) => {
  const allowedKeys = new Set(["horaInicio", "horaFin", "duracion", "diasVista", "maxReservas"]);
  const next = {};

  for (const [k, v] of Object.entries(req.body || {})) {
    if (!allowedKeys.has(k)) return res.status(400).json({ error: `Config invalida: ${k}` });
    next[k] = v;
  }

  if (next.horaInicio !== undefined && !isValidTime(String(next.horaInicio))) return res.status(400).json({ error: "Hora de inicio invalida" });
  if (next.horaFin !== undefined && !isValidTime(String(next.horaFin))) return res.status(400).json({ error: "Hora de fin invalida" });

  const horaInicio = String(next.horaInicio ?? await getConfigValue("horaInicio", "08:00"));
  const horaFin = String(next.horaFin ?? await getConfigValue("horaFin", "23:00"));
  if (timeToMinutes(horaInicio) >= timeToMinutes(horaFin)) return res.status(400).json({ error: "La hora de inicio debe ser anterior a la hora de fin" });

  if (next.duracion !== undefined && ![30, 45, 60, 90, 120].includes(Number(next.duracion))) return res.status(400).json({ error: "Duracion invalida" });
  if (next.diasVista !== undefined && ![3, 5, 7].includes(Number(next.diasVista))) return res.status(400).json({ error: "Dias visibles invalidos" });
  if (next.maxReservas !== undefined && ![1, 2, 3, 4, 5].includes(Number(next.maxReservas))) return res.status(400).json({ error: "Limite de reservas invalido" });

  await db.tx(async (trx) => {
    for (const [k, v] of Object.entries(next)) {
      await trx.run(
        "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [k, String(v)]
      );
    }
  });
  res.json({ ok: true });
});

router.delete("/:id", async (req, res) => {
  const r = await db.get("SELECT * FROM reservas WHERE id = ?", [req.params.id]);
  if (!r) return res.status(404).json({ error: "Reserva no encontrada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin") return res.status(403).json({ error: "Sin permiso" });

  try {
    await db.tx(async (trx) => {
      await trx.run("UPDATE reservas SET estado = 'cancelada', abierto = 0 WHERE id = ?", [r.id]);
      await trx.run(
        "UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND estat IN ('pendent', 'invitat')",
        [r.id]
      );
    });
  } catch (err) {
    console.error("Error cancelando reserva:", err);
    return res.status(500).json({ error: "Error interno cancelando la reserva" });
  }

  const user = await db.get("SELECT id, nombre, email FROM users WHERE id = ?", [r.user_id]);
  try {
    await sendReservaCancelada(user, r);
  } catch (err) {
    console.error("Error enviando correo de cancelacion:", err.message);
  }

  res.json({ ok: true });
});

module.exports = router;
