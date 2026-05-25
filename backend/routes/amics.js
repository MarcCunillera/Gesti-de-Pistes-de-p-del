const router = require("express").Router();
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");

// GET /api/amics — llista d'amics de l'usuari
router.get("/", authMiddleware, (req, res) => {
  const amics = db
    .prepare(
      `SELECT u.id, u.nombre, u.email, u.avatar, u.avatar_color
       FROM amics a
       JOIN users u ON u.id = a.amic_id
       WHERE a.user_id = ?
       ORDER BY u.nombre`
    )
    .all(req.user.id);
  res.json(amics);
});

// GET /api/amics/solicituds — sol·licituds pendents rebudes
router.get("/solicituds", authMiddleware, (req, res) => {
  const sols = db
    .prepare(
      `SELECT s.id, s.estat, s.created_at,
              u.id as de_id, u.nombre as de_nombre, u.email as de_email, u.avatar, u.avatar_color
       FROM solicituds_amic s
       JOIN users u ON u.id = s.de_user_id
       WHERE s.a_user_id = ? AND s.estat = 'pendent'
       ORDER BY s.created_at DESC`
    )
    .all(req.user.id);
  res.json(sols);
});

// GET /api/amics/solicituds/enviades — sol·licituds enviades pendents
router.get("/solicituds/enviades", authMiddleware, (req, res) => {
  const sols = db
    .prepare(
      `SELECT s.id, s.estat, s.created_at,
              u.id as a_id, u.nombre as a_nombre, u.email as a_email, u.avatar, u.avatar_color
       FROM solicituds_amic s
       JOIN users u ON u.id = s.a_user_id
       WHERE s.de_user_id = ? AND s.estat = 'pendent'
       ORDER BY s.created_at DESC`
    )
    .all(req.user.id);
  res.json(sols);
});

// POST /api/amics/solicituds — enviar sol·licitud
router.post("/solicituds", authMiddleware, (req, res) => {
  const { a_user_id } = req.body;
  if (!a_user_id) return res.status(400).json({ error: "a_user_id requerit" });
  if (a_user_id === req.user.id) return res.status(400).json({ error: "No et pots afegir a tu mateix" });

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(a_user_id);
  if (!target) return res.status(404).json({ error: "Usuari no trobat" });

  // Ja amics?
  const jaAmic = db
    .prepare("SELECT id FROM amics WHERE user_id = ? AND amic_id = ?")
    .get(req.user.id, a_user_id);
  if (jaAmic) return res.status(409).json({ error: "Ja sou amics" });

  try {
    const r = db
      .prepare("INSERT INTO solicituds_amic (de_user_id, a_user_id) VALUES (?, ?)")
      .run(req.user.id, a_user_id);
    res.status(201).json({ id: r.lastInsertRowid, estat: "pendent" });
  } catch {
    res.status(409).json({ error: "Sol·licitud ja existent" });
  }
});

// PATCH /api/amics/solicituds/:id — acceptar o rebutjar
router.patch("/solicituds/:id", authMiddleware, (req, res) => {
  const { estat } = req.body; // 'acceptada' | 'rebutjada'
  if (!["acceptada", "rebutjada"].includes(estat))
    return res.status(400).json({ error: "Estat invàlid" });

  const sol = db.prepare("SELECT * FROM solicituds_amic WHERE id = ?").get(req.params.id);
  if (!sol) return res.status(404).json({ error: "Sol·licitud no trobada" });
  if (sol.a_user_id !== req.user.id) return res.status(403).json({ error: "Sense permís" });

  db.prepare("UPDATE solicituds_amic SET estat = ? WHERE id = ?").run(estat, sol.id);

  if (estat === "acceptada") {
    // Crear relació bidireccional
    const ins = db.prepare("INSERT OR IGNORE INTO amics (user_id, amic_id) VALUES (?, ?)");
    ins.run(sol.de_user_id, sol.a_user_id);
    ins.run(sol.a_user_id, sol.de_user_id);
  }

  res.json({ ok: true, estat });
});

// DELETE /api/amics/:amicId — eliminar amic
router.delete("/:amicId", authMiddleware, (req, res) => {
  const amicId = parseInt(req.params.amicId);
  db.prepare("DELETE FROM amics WHERE (user_id = ? AND amic_id = ?) OR (user_id = ? AND amic_id = ?)").run(
    req.user.id, amicId, amicId, req.user.id
  );
  res.json({ ok: true });
});

module.exports = router;
