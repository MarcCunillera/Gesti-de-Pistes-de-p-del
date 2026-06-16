const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { SECRET } = require("../middleware/auth");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const { sendPasswordReset } = require("../services/mail");
const { createEmailVerification, ensureEmailCanBeSent } = require("../services/emailVerification");

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Massa intents. Torna-ho a provar d'aquí a 15 minuts" },
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user) =>
  jwt.sign(
    { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    SECRET,
    { expiresIn: "7d" }
  );

const publicUser = (user) => {
  const { password: _, ...userData } = user;
  return userData;
};

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Cal indicar correu i contrasenya" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.get("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Credencials incorrectes" });
  }

  if (!user.activo) {
    return res.status(403).json({ error: "Compte desactivat" });
  }

  if (Number(user.email_verified) !== 1) {
    return res.status(403).json({ error: "Has de verificar el teu correu abans d'iniciar sessió" });
  }

  res.json({ token: createToken(user), user: publicUser(user) });
});

router.post("/register", authLimiter, async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Tots els camps són obligatoris" });
  }

  const normalizedName = nombre.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedName) return res.status(400).json({ error: "El nom és obligatori" });
  if (!emailRegex.test(normalizedEmail)) return res.status(400).json({ error: "Format de correu invàlid" });
  if (password.length < 6) return res.status(400).json({ error: "La contrasenya ha de tenir com a mínim 6 caràcters" });
  try {
    ensureEmailCanBeSent();
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }

  const exists = await db.get("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
  if (exists) return res.status(409).json({ error: "Aquest correu ja està registrat" });

  const hash = bcrypt.hashSync(password, 10);
  const result = await db.run(
    "INSERT INTO users (nombre, email, password, rol, onboarding_done, email_verified) VALUES (?, ?, ?, 'usuario', 0, 0) RETURNING id",
    [normalizedName, normalizedEmail, hash]
  );

  const user = await db.get(
    "SELECT id, nombre, email, rol, activo, avatar, avatar_color, lado, mano, telefono, onboarding_done, email_verified, created_at FROM users WHERE id = ?",
    [result.insertedId]
  );

  try {
    await createEmailVerification(user);
  } catch (err) {
    await db.run("DELETE FROM users WHERE id = ?", [user.id]);
    console.error("Error enviant el correu de verificació:", err.message);
    return res.status(503).json({ error: "No s'ha pogut enviar el correu de verificació. Revisa la configuració SMTP." });
  }

  res.status(201).json({
    ok: true,
    pendingVerification: true,
    message: "Compte creat. Revisa el teu correu per verificar-lo abans d'iniciar sessió.",
  });
});

router.post("/google", authLimiter, async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: "GOOGLE_CLIENT_ID no està configurat" });

    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "Cal indicar la credencial de Google" });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload) return res.status(401).json({ error: "Token de Google invàlid" });

    const email = payload.email ? payload.email.trim().toLowerCase() : "";
    const nombre = payload.name || email;
    const avatar = payload.picture || null;

    if (!email || !payload.email_verified) return res.status(401).json({ error: "Compte de Google no verificat" });

    let user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    let isNewUser = false;

    if (user && !user.activo) return res.status(403).json({ error: "Compte desactivat" });

    if (!user) {
      const randomPassword = bcrypt.hashSync(`google_${Date.now()}_${Math.random()}`, 10);
      const result = await db.run(
        "INSERT INTO users (nombre, email, password, rol, activo, avatar, onboarding_done, email_verified) VALUES (?, ?, ?, 'usuario', 1, ?, 0, 1) RETURNING id",
        [nombre, email, randomPassword, avatar]
      );
      user = await db.get("SELECT * FROM users WHERE id = ?", [result.insertedId]);
      isNewUser = true;
    }

    res.json({ token: createToken(user), user: publicUser(user), isNewUser });
  } catch (err) {
    console.error("Error d'inici de sessió amb Google:", err);
    res.status(401).json({ error: "Inici de sessió amb Google invàlid" });
  }
});

router.post("/resend-verification", authLimiter, async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const okMessage = "Si el correu existeix i no està verificat, rebràs un correu de verificació.";

  if (!email || !emailRegex.test(email)) return res.json({ ok: true, message: okMessage });

  const user = await db.get("SELECT id, nombre, email, activo, email_verified FROM users WHERE email = ?", [email]);
  if (!user || !user.activo || Number(user.email_verified) === 1) return res.json({ ok: true, message: okMessage });

  try {
    await createEmailVerification(user);
  } catch (err) {
    console.error("Error reenviant el correu de verificació:", err.message);
    return res.status(503).json({ error: "No s'ha pogut enviar el correu de verificació. Revisa la configuració SMTP." });
  }

  res.json({ ok: true, message: okMessage });
});

router.post("/verify-email", authLimiter, async (req, res) => {
  const token = (req.body.token || "").trim();
  if (!token) return res.status(400).json({ error: "Cal indicar el token de verificació" });

  const verification = await db.get(
    `SELECT ev.id, ev.user_id, ev.expires_at, ev.used, u.activo
     FROM email_verifications ev
     JOIN users u ON u.id = ev.user_id
     WHERE ev.token = ?`,
    [token]
  );

  if (!verification || verification.used || !verification.activo) {
    return res.status(400).json({ error: "Enllaç invàlid o caducat" });
  }

  if (new Date(verification.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: "Enllaç caducat" });
  }

  await db.tx(async (trx) => {
    await trx.run("UPDATE users SET email_verified = 1 WHERE id = ?", [verification.user_id]);
    await trx.run("UPDATE email_verifications SET used = 1 WHERE id = ?", [verification.id]);
  });

  res.json({ ok: true, message: "Correu verificat correctament. Ja pots iniciar sessió." });
});

router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const okMessage = "Si el correu existeix, rebràs un correu per recuperar la contrasenya.";

    if (!email || !emailRegex.test(email)) return res.json({ ok: true, message: okMessage });

    const user = await db.get("SELECT id, nombre, email, activo FROM users WHERE email = ?", [email]);
    if (!user || !user.activo) return res.json({ ok: true, message: okMessage });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await db.tx(async (trx) => {
      await trx.run("UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0", [user.id]);
      await trx.run("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)", [user.id, token, expiresAt]);
    });

    const appUrl = process.env.APP_URL || "http://localhost:3003";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    try {
      await sendPasswordReset(user, resetUrl);
    } catch (err) {
      console.error("Error enviant el correu de recuperació:", err.message);
    }

    res.json({ ok: true, message: okMessage });
  } catch (err) {
    console.error("Error forgot-password:", err);
    res.status(500).json({ error: "Error intern recuperant la contrasenya" });
  }
});

router.post("/reset-password", authLimiter, async (req, res) => {
  const token = (req.body.token || "").trim();
  const password = req.body.password || "";

  if (!token || !password) return res.status(400).json({ error: "Cal indicar el token i la contrasenya nova" });
  if (password.length < 6) return res.status(400).json({ error: "La contrasenya ha de tenir com a mínim 6 caràcters" });

  const reset = await db.get(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used, u.activo
     FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE pr.token = ?`,
    [token]
  );

  if (!reset || reset.used || !reset.activo) return res.status(400).json({ error: "Enllaç invàlid o caducat" });
  if (new Date(reset.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Enllaç caducat" });

  const hash = bcrypt.hashSync(password, 10);

  await db.tx(async (trx) => {
    await trx.run("UPDATE users SET password = ? WHERE id = ?", [hash, reset.user_id]);
    await trx.run("UPDATE password_resets SET used = 1 WHERE id = ?", [reset.id]);
  });

  res.json({ ok: true, message: "Contrasenya actualitzada correctament" });
});

module.exports = router;
