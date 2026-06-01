const router = require("express").Router();
const db = require("../db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

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

const isValidDate = (fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha);
const isValidTime = (hora) => /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);

const isPastSlot = (fecha, hora) => {
  const slotDate = new Date(`${fecha}T${hora}:00`);
  return slotDate.getTime() < Date.now();
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

// GET /api/reservas
router.get("/", authMiddleware, (req, res) => {
  let rows;

  if (req.user.rol === "admin") {
    rows = db.prepare("SELECT * FROM reservas ORDER BY fecha, hora").all();
  } else {
    rows = db
      .prepare(
        `SELECT DISTINCT r.* FROM reservas r
         LEFT JOIN reserva_jugadores rj ON rj.reserva_id = r.id
         WHERE r.user_id = ? OR rj.user_id = ?
         ORDER BY r.fecha, r.hora`
      )
      .all(req.user.id, req.user.id);
  }

  res.json(rows.map(enrichReserva));
});

// GET /api/reservas/all — totes les reserves confirmades per al calendari
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
router.post("/", authMiddleware, (req, res) => {
  const { fecha, hora, abierto } = req.body;

  if (!fecha || !hora) {
    return res.status(400).json({ error: "Data i hora requerides" });
  }

  if (!isValidDate(fecha)) {
    return res.status(400).json({ error: "Format de data invàlid" });
  }

  if (!isValidTime(hora)) {
    return res.status(400).json({ error: "Format d'hora invàlid" });
  }

  if (isPastSlot(fecha, hora)) {
    return res.status(400).json({ error: "No es poden fer reserves en el passat" });
  }

  if (!isAllowedSlot(hora)) {
    return res.status(400).json({ error: "Hora fora de l'horari permès" });
  }

  const bloq = db
    .prepare("SELECT id FROM bloqueados WHERE fecha = ? AND hora = ?")
    .get(fecha, hora);

  if (bloq) {
    return res.status(409).json({ error: "Franja bloquejada" });
  }

  const ocupat = db
    .prepare(
      "SELECT id FROM reservas WHERE fecha = ? AND hora = ? AND estado = 'confirmada'"
    )
    .get(fecha, hora);

  if (ocupat) {
    return res.status(409).json({ error: "Franja ja reservada" });
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
      error: `Límit de ${maxReservas} reserves actives`,
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
      return res.status(409).json({ error: "Franja ja reservada" });
    }

    console.error("Error creant reserva:", err);
    return res.status(500).json({ error: "Error intern creant la reserva" });
  }

  db.prepare(
    "INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?)"
  ).run(result.lastInsertRowid, req.user.id);

  const r = db
    .prepare("SELECT * FROM reservas WHERE id = ?")
    .get(result.lastInsertRowid);

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

router.patch("/solicituds/:id", authMiddleware, (req, res) => {
  const sp = db
    .prepare("SELECT * FROM solicituds_partida WHERE id = ?")
    .get(req.params.id);

  if (!sp) return res.status(404).json({ error: "Sol·licitud no trobada" });

  const r = db
    .prepare("SELECT * FROM reservas WHERE id = ?")
    .get(sp.reserva_id);

  if (!r) return res.status(404).json({ error: "Reserva no trobada" });

  const esOrganitzador = r.user_id === req.user.id;
  const esInvitat = sp.de_user_id === req.user.id && sp.estat === "invitat";

  if (!esOrganitzador && !esInvitat) {
    return res.status(403).json({ error: "Sense permís" });
  }

  const { estat } = req.body;

  if (estat !== "acceptada" && estat !== "rebutjada") {
    return res.status(400).json({ error: "Estat invàlid" });
  }

  if (esOrganitzador && sp.estat !== "pendent") {
    return res.status(400).json({ error: "Aquesta sol·licitud no és pendent" });
  }

  if (esInvitat && sp.estat !== "invitat") {
    return res.status(400).json({ error: "Aquesta invitació no és activa" });
  }

  if (estat === "acceptada") {
    const jugadors = getJugadors(r.id);

    if (jugadors.length >= 4) {
      return res.status(409).json({ error: "Partida ja completa" });
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

  res.json({ ok: true, estat });
});

router.post("/:id/unirse", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no trobada" });
  if (!r.abierto) return res.status(403).json({ error: "Partida privada" });
  if (r.estado !== "confirmada") return res.status(409).json({ error: "Partida no activa" });

  if (r.user_id === req.user.id) {
    return res.status(409).json({ error: "Ets l'organitzador" });
  }

  const jugadors = getJugadors(r.id);

  if (jugadors.length >= 4) {
    return res.status(409).json({ error: "Partida completa" });
  }

  const jaEsta = jugadors.find((j) => j.id === req.user.id);

  if (jaEsta) {
    return res.status(409).json({ error: "Ja ets a la partida" });
  }

  const existent = db
    .prepare(
      "SELECT id FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?"
    )
    .get(r.id, req.user.id);

  if (existent) {
    return res.status(409).json({ error: "Ja has enviat una sol·licitud" });
  }

  db.prepare(
    "INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'pendent')"
  ).run(r.id, req.user.id);

  res.status(201).json({ ok: true, message: "Sol·licitud enviada" });
});

router.post("/:id/sortir", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no trobada" });

  if (r.user_id === req.user.id) {
    return res.status(400).json({
      error: "L'organitzador no pot sortir, cancel·la la reserva",
    });
  }

  db.prepare(
    "DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?"
  ).run(r.id, req.user.id);

  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

router.delete("/:id/jugadors/:userId", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no trobada" });

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sense permís — no ets l'organitzador" });
  }

  const userId = parseInt(req.params.userId, 10);

  if (userId === r.user_id) {
    return res.status(400).json({ error: "No pots expulsar l'organitzador" });
  }

  db.prepare(
    "DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?"
  ).run(r.id, userId);

  db.prepare(
    "UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND de_user_id = ?"
  ).run(r.id, userId);

  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

router.post("/:id/invitar", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no trobada" });

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sense permís — no ets l'organitzador" });
  }

  if (!r.abierto) {
    return res.status(400).json({ error: "El partit no és obert" });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id requerit" });
  }

  const jugadors = getJugadors(r.id);

  if (jugadors.length >= 4) {
    return res.status(409).json({ error: "Partida completa" });
  }

  const jaEsta = jugadors.find((j) => j.id === user_id);

  if (jaEsta) {
    return res.status(409).json({ error: "El jugador ja és al partit" });
  }

  const existent = db
    .prepare(
      "SELECT id, estat FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?"
    )
    .get(r.id, user_id);

  if (existent) {
    if (existent.estat === "invitat") {
      return res.status(409).json({
        error: "Ja tens una invitació pendent per a aquest jugador",
      });
    }

    if (existent.estat === "acceptada") {
      return res.status(409).json({ error: "El jugador ja és al partit" });
    }

    db.prepare("UPDATE solicituds_partida SET estat = 'invitat' WHERE id = ?").run(
      existent.id
    );
  } else {
    db.prepare(
      "INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'invitat')"
    ).run(r.id, user_id);
  }

  res.json({ ok: true, message: "Invitació enviada — l'amic ha de confirmar" });
});

router.patch("/:id/abierto", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no trobada" });

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sense permís" });
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
    return res.status(400).json({ error: "Cal data i hora" });
  }

  if (!isValidDate(fecha)) {
    return res.status(400).json({ error: "Format de data invàlid" });
  }

  if (!isValidTime(hora)) {
    return res.status(400).json({ error: "Format d'hora invàlid" });
  }

  if (!isAllowedSlot(hora)) {
    return res.status(400).json({ error: "Hora fora de l'horari permès" });
  }

  try {
    const r = db
      .prepare("INSERT INTO bloqueados (fecha, hora) VALUES (?, ?)")
      .run(fecha, hora);

    res.status(201).json({ id: r.lastInsertRowid, fecha, hora });
  } catch {
    res.status(409).json({ error: "Ja bloquejat" });
  }
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

router.delete("/:id", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);

  if (!r) return res.status(404).json({ error: "Reserva no trobada" });

  if (r.user_id !== req.user.id && req.user.rol !== "admin") {
    return res.status(403).json({ error: "Sense permís" });
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
    return res.status(500).json({ error: "Error intern cancelant la reserva" });
  }

  res.json({ ok: true });
});

module.exports = router;