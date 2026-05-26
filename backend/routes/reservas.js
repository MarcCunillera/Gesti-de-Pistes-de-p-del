const router = require("express").Router();
const db = require("../db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const getJugadors = (reservaId) =>
  db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.avatar, u.avatar_color
       FROM reserva_jugadores rj
       JOIN users u ON u.id = rj.user_id
       WHERE rj.reserva_id = ?`
    )
    .all(reservaId);

const enrichReserva = (r) => ({ ...r, jugadors: getJugadors(r.id) });

// GET /api/reservas — totes (admin) o les del user
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

// GET /api/reservas/all — totes obertes (per al calendari) + les pròpies
router.get("/all", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT DISTINCT r.* FROM reservas r
       LEFT JOIN reserva_jugadores rj ON rj.reserva_id = r.id
       WHERE r.estado = 'confirmada'
         AND (r.abierto = 1 OR r.user_id = ? OR rj.user_id = ?)
       ORDER BY r.fecha, r.hora`
    )
    .all(req.user.id, req.user.id);
  res.json(rows.map(enrichReserva));
});

// POST /api/reservas
router.post("/", authMiddleware, (req, res) => {
  const { fecha, hora, abierto } = req.body;
  if (!fecha || !hora) return res.status(400).json({ error: "Data i hora requerides" });

  // Comprovar bloqueig
  const bloq = db.prepare("SELECT id FROM bloqueados WHERE fecha = ? AND hora = ?").get(fecha, hora);
  if (bloq) return res.status(409).json({ error: "Franja bloquejada" });

  // Comprovar ocupat
  const ocupat = db
    .prepare("SELECT id FROM reservas WHERE fecha = ? AND hora = ? AND estado = 'confirmada'")
    .get(fecha, hora);
  if (ocupat) return res.status(409).json({ error: "Franja ja reservada" });

  // Comprovar límit d'actives
  const configMaxRow = db.prepare("SELECT value FROM config WHERE key = 'maxReservas'").get();
  const maxReservas = configMaxRow ? parseInt(configMaxRow.value) : 3;
  const now = new Date().toISOString().split("T")[0];
  const activas = db
    .prepare(
      "SELECT COUNT(*) as n FROM reservas WHERE user_id = ? AND fecha >= ? AND estado = 'confirmada'"
    )
    .get(req.user.id, now);
  if (activas.n >= maxReservas)
    return res.status(409).json({ error: `Límit de ${maxReservas} reserves actives` });

  const result = db
    .prepare("INSERT INTO reservas (user_id, fecha, hora, estado, abierto) VALUES (?, ?, ?, 'confirmada', ?)")
    .run(req.user.id, fecha, hora, abierto ? 1 : 0);

  db.prepare("INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?)").run(result.lastInsertRowid, req.user.id);

  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(enrichReserva(r));
});

// ── Sol·licituds de partida ─────────────────────────────────────────────────

// GET /api/reservas/solicituds/meues — sol·licituds enviades i invitacions rebudes per l'usuari
router.get("/solicituds/meues", authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      `SELECT sp.id, sp.reserva_id, sp.estat, sp.created_at,
              r.fecha, r.hora, r.user_id as organitzador_id,
              u.nombre as organitzador_nombre, u.avatar_color as organitzador_color
       FROM solicituds_partida sp
       JOIN reservas r ON r.id = sp.reserva_id
       JOIN users u ON u.id = r.user_id
       WHERE sp.de_user_id = ? AND sp.estat IN ('pendent', 'invitat')
       ORDER BY r.fecha, r.hora`
    )
    .all(req.user.id);
  res.json(rows);
});

// GET /api/reservas/solicituds/invitades — invitacions que he enviat als meus partits
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
       WHERE r.user_id = ? AND sp.estat = 'invitat'
       ORDER BY sp.created_at`
    )
    .all(req.user.id);
  res.json(rows);
});

// GET /api/reservas/solicituds/pendent — sol·licituds rebudes als meus partits
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
       WHERE r.user_id = ? AND sp.estat = 'pendent'
       ORDER BY sp.created_at`
    )
    .all(req.user.id);
  res.json(rows);
});

// PATCH /api/reservas/solicituds/:id — acceptar/rebutjar
// - Organitzador respon a sol·licituds 'pendent'
// - Invitat respon a invitacions 'invitat'
router.patch("/solicituds/:id", authMiddleware, (req, res) => {
  const sp = db.prepare("SELECT * FROM solicituds_partida WHERE id = ?").get(req.params.id);
  if (!sp) return res.status(404).json({ error: "Sol·licitud no trobada" });

  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(sp.reserva_id);
  if (!r) return res.status(404).json({ error: "Reserva no trobada" });

  const esOrganitzador = r.user_id === req.user.id;
  const esInvitat = sp.de_user_id === req.user.id && sp.estat === "invitat";
  if (!esOrganitzador && !esInvitat)
    return res.status(403).json({ error: "Sense permís" });

  const { estat } = req.body; // 'acceptada' | 'rebutjada'
  if (estat !== "acceptada" && estat !== "rebutjada")
    return res.status(400).json({ error: "Estat invàlid" });

  // Organitzador només pot respondre sol·licituds 'pendent'; invitat només 'invitat'
  if (esOrganitzador && sp.estat !== "pendent")
    return res.status(400).json({ error: "Aquesta sol·licitud no és pendent" });
  if (esInvitat && sp.estat !== "invitat")
    return res.status(400).json({ error: "Aquesta invitació no és activa" });

  db.prepare("UPDATE solicituds_partida SET estat = ? WHERE id = ?").run(estat, sp.id);

  if (estat === "acceptada") {
    const jugadors = getJugadors(r.id);
    if (jugadors.length >= 4)
      return res.status(409).json({ error: "Partida ja completa" });
    const jaEsta = jugadors.find((j) => j.id === sp.de_user_id);
    if (!jaEsta) {
      db.prepare("INSERT INTO reserva_jugadores (reserva_id, user_id) VALUES (?, ?)").run(r.id, sp.de_user_id);
    }
  }

  res.json({ ok: true, estat: estat });
});

// POST /api/reservas/:id/unirse — crea sol·licitud de partida
router.post("/:id/unirse", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no trobada" });
  if (!r.abierto) return res.status(403).json({ error: "Partida privada" });
  if (r.estado !== "confirmada") return res.status(409).json({ error: "Partida no activa" });
  if (r.user_id === req.user.id)
    return res.status(409).json({ error: "Ets l'organitzador" });

  const jugadors = getJugadors(r.id);
  if (jugadors.length >= 4) return res.status(409).json({ error: "Partida completa" });
  const jaEsta = jugadors.find((j) => j.id === req.user.id);
  if (jaEsta) return res.status(409).json({ error: "Ja ets a la partida" });

  const existent = db.prepare("SELECT id FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?").get(r.id, req.user.id);
  if (existent) return res.status(409).json({ error: "Ja has enviat una sol·licitud" });

  db.prepare("INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'pendent')").run(r.id, req.user.id);

  res.status(201).json({ ok: true, message: "Sol·licitud enviada" });
});

// POST /api/reservas/:id/sortir
router.post("/:id/sortir", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no trobada" });
  if (r.user_id === req.user.id) return res.status(400).json({ error: "L'organitzador no pot sortir, cancel·la la reserva" });
  db.prepare("DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?").run(r.id, req.user.id);
  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

// DELETE /api/reservas/:id/jugadors/:userId — organitzador expulsa un jugador
router.delete("/:id/jugadors/:userId", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no trobada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin")
    return res.status(403).json({ error: "Sense permís — no ets l'organitzador" });
  const userId = parseInt(req.params.userId);
  if (userId === r.user_id)
    return res.status(400).json({ error: "No pots expulsar l'organitzador" });
  db.prepare("DELETE FROM reserva_jugadores WHERE reserva_id = ? AND user_id = ?").run(r.id, userId);
  // Cancel·la la sol·licitud pendent si n'hi havia
  db.prepare("UPDATE solicituds_partida SET estat = 'rebutjada' WHERE reserva_id = ? AND de_user_id = ?").run(r.id, userId);
  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

// POST /api/reservas/:id/invitar — organitzador invita directament un amic
router.post("/:id/invitar", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no trobada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin")
    return res.status(403).json({ error: "Sense permís — no ets l'organitzador" });
  if (!r.abierto) return res.status(400).json({ error: "El partit no és obert" });
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id requerit" });

  const jugadors = getJugadors(r.id);
  if (jugadors.length >= 4) return res.status(409).json({ error: "Partida completa" });
  const jaEsta = jugadors.find((j) => j.id === user_id);
  if (jaEsta) return res.status(409).json({ error: "El jugador ja és al partit" });

  // Crea una invitació pendent (l'amic ha d'acceptar)
  const existent = db.prepare("SELECT id, estat FROM solicituds_partida WHERE reserva_id = ? AND de_user_id = ?").get(r.id, user_id);
  if (existent) {
    if (existent.estat === "invitat") return res.status(409).json({ error: "Ja tens una invitació pendent per a aquest jugador" });
    if (existent.estat === "acceptada") return res.status(409).json({ error: "El jugador ja és al partit" });
    // Si estava rebutjada o pendent, la re-activem com a invitació
    db.prepare("UPDATE solicituds_partida SET estat = 'invitat' WHERE id = ?").run(existent.id);
  } else {
    db.prepare("INSERT INTO solicituds_partida (reserva_id, de_user_id, estat) VALUES (?, ?, 'invitat')").run(r.id, user_id);
  }
  res.json({ ok: true, message: "Invitació enviada — l'amic ha de confirmar" });
});

// PATCH /api/reservas/:id/abierto
router.patch("/:id/abierto", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no trobada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin")
    return res.status(403).json({ error: "Sense permís" });
  const { abierto } = req.body;
  db.prepare("UPDATE reservas SET abierto = ? WHERE id = ?").run(abierto ? 1 : 0, r.id);
  res.json(enrichReserva(db.prepare("SELECT * FROM reservas WHERE id = ?").get(r.id)));
});

// DELETE /api/reservas/:id — cancel·lar
router.delete("/:id", authMiddleware, (req, res) => {
  const r = db.prepare("SELECT * FROM reservas WHERE id = ?").get(req.params.id);
  if (!r) return res.status(404).json({ error: "Reserva no trobada" });
  if (r.user_id !== req.user.id && req.user.rol !== "admin")
    return res.status(403).json({ error: "Sense permís" });
  db.prepare("UPDATE reservas SET estado = 'cancelada' WHERE id = ?").run(r.id);
  res.json({ ok: true });
});

// ── Bloqueats (admin) ─────────────────────────────────────────────────────────

// GET /api/reservas/bloqueados
router.get("/bloqueados", authMiddleware, (req, res) => {
  res.json(db.prepare("SELECT * FROM bloqueados ORDER BY fecha, hora").all());
});

// POST /api/reservas/bloqueados
router.post("/bloqueados", authMiddleware, adminMiddleware, (req, res) => {
  const { fecha, hora } = req.body;
  if (!fecha || !hora) return res.status(400).json({ error: "Cal data i hora" });
  try {
    const r = db.prepare("INSERT INTO bloqueados (fecha, hora) VALUES (?, ?)").run(fecha, hora);
    res.status(201).json({ id: r.lastInsertRowid, fecha, hora });
  } catch {
    res.status(409).json({ error: "Ja bloquejat" });
  }
});

// DELETE /api/reservas/bloqueados/:id
router.delete("/bloqueados/:id", authMiddleware, adminMiddleware, (req, res) => {
  db.prepare("DELETE FROM bloqueados WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── Config ────────────────────────────────────────────────────────────────────

// GET /api/reservas/config
router.get("/config", authMiddleware, (req, res) => {
  const rows = db.prepare("SELECT key, value FROM config").all();
  const obj = {};
  rows.forEach((r) => (obj[r.key] = r.value));
  res.json(obj);
});

// PUT /api/reservas/config (admin)
router.put("/config", authMiddleware, adminMiddleware, (req, res) => {
  const upsert = db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)");
  const update = db.transaction((data) => {
    Object.entries(data).forEach(([k, v]) => upsert.run(k, String(v)));
  });
  update(req.body);
  res.json({ ok: true });
});

module.exports = router;
