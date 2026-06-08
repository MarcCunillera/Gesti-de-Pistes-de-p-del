const router = require("express").Router();
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
  const amics = await db.all(
    `SELECT u.id, u.nombre, u.email, u.avatar, u.avatar_color
     FROM amics a
     JOIN users u ON u.id = a.amic_id
     WHERE a.user_id = ?
     ORDER BY u.nombre`,
    [req.user.id]
  );
  res.json(amics);
});

router.get("/solicituds", authMiddleware, async (req, res) => {
  const sols = await db.all(
    `SELECT s.id, s.estat, s.created_at,
            u.id as de_id, u.nombre as de_nombre, u.email as de_email, u.avatar, u.avatar_color
     FROM solicituds_amic s
     JOIN users u ON u.id = s.de_user_id
     WHERE s.a_user_id = ? AND s.estat = 'pendent'
     ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  res.json(sols);
});

router.get("/solicituds/enviades", authMiddleware, async (req, res) => {
  const sols = await db.all(
    `SELECT s.id, s.estat, s.created_at,
            u.id as a_id, u.nombre as a_nombre, u.email as a_email, u.avatar, u.avatar_color
     FROM solicituds_amic s
     JOIN users u ON u.id = s.a_user_id
     WHERE s.de_user_id = ? AND s.estat = 'pendent'
     ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  res.json(sols);
});

router.post("/solicituds", authMiddleware, async (req, res) => {
  const { a_user_id } = req.body;
  if (!a_user_id) return res.status(400).json({ error: "a_user_id requerido" });
  if (Number(a_user_id) === req.user.id) return res.status(400).json({ error: "No puedes agregarte a ti mismo" });

  const target = await db.get("SELECT id FROM users WHERE id = ?", [a_user_id]);
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  const jaAmic = await db.get("SELECT id FROM amics WHERE user_id = ? AND amic_id = ?", [req.user.id, a_user_id]);
  if (jaAmic) return res.status(409).json({ error: "Ya sois amigos" });

  try {
    const r = await db.run(
      "INSERT INTO solicituds_amic (de_user_id, a_user_id) VALUES (?, ?) RETURNING id",
      [req.user.id, a_user_id]
    );
    res.status(201).json({ id: r.insertedId, estat: "pendent" });
  } catch {
    res.status(409).json({ error: "Solicitud ya existente" });
  }
});

router.patch("/solicituds/:id", authMiddleware, async (req, res) => {
  const { estat } = req.body;
  if (!["acceptada", "rebutjada"].includes(estat)) return res.status(400).json({ error: "Estado invalido" });

  const sol = await db.get("SELECT * FROM solicituds_amic WHERE id = ?", [req.params.id]);
  if (!sol) return res.status(404).json({ error: "Solicitud no encontrada" });
  if (sol.a_user_id !== req.user.id) return res.status(403).json({ error: "Sin permiso" });

  await db.tx(async (trx) => {
    await trx.run("UPDATE solicituds_amic SET estat = ? WHERE id = ?", [estat, sol.id]);

    if (estat === "acceptada") {
      await trx.run("INSERT INTO amics (user_id, amic_id) VALUES (?, ?) ON CONFLICT (user_id, amic_id) DO NOTHING", [sol.de_user_id, sol.a_user_id]);
      await trx.run("INSERT INTO amics (user_id, amic_id) VALUES (?, ?) ON CONFLICT (user_id, amic_id) DO NOTHING", [sol.a_user_id, sol.de_user_id]);
    }
  });

  res.json({ ok: true, estat });
});

router.delete("/:amicId", authMiddleware, async (req, res) => {
  const amicId = parseInt(req.params.amicId, 10);
  await db.run(
    "DELETE FROM amics WHERE (user_id = ? AND amic_id = ?) OR (user_id = ? AND amic_id = ?)",
    [req.user.id, amicId, amicId, req.user.id]
  );
  res.json({ ok: true });
});

module.exports = router;
