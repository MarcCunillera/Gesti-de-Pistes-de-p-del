const crypto = require("crypto");
const db = require("../db");
const { isMailEnabled, sendEmailVerification } = require("./mail");

function ensureEmailCanBeSent() {
  if (!isMailEnabled()) {
    const err = new Error("SMTP no esta configurado. No se puede enviar el correo de verificacion.");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }
}

async function createEmailVerification(user) {
  ensureEmailCanBeSent();

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.tx(async (trx) => {
    await trx.run("UPDATE email_verifications SET used = 1 WHERE user_id = ? AND used = 0", [user.id]);
    await trx.run("INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)", [user.id, token, expiresAt]);
  });

  const appUrl = process.env.APP_URL || "http://localhost:3003";
  try {
    await sendEmailVerification(user, `${appUrl}/verify-email?token=${token}`);
  } catch (err) {
    await db.run("UPDATE email_verifications SET used = 1 WHERE token = ?", [token]);
    throw err;
  }
}

module.exports = {
  createEmailVerification,
  ensureEmailCanBeSent,
};
