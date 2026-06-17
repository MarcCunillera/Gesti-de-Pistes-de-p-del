const nodemailer = require("nodemailer");

const mailEnabled =
  process.env.MAIL_HOST &&
  process.env.MAIL_USER &&
  process.env.MAIL_PASS &&
  process.env.MAIL_FROM;

const transporter = mailEnabled
  ? nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: process.env.MAIL_SECURE === "true",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })
  : null;

function isMailEnabled() {
  return Boolean(transporter);
}

if (transporter) {
  transporter
    .verify()
    .then(() => console.log("SMTP configurat correctament"))
    .catch((err) => console.error("Error SMTP:", err.message));
}

const appUrl = process.env.APP_URL || "http://localhost:3003";

const LOGO_URL = `https://raw.githubusercontent.com/MarcCunillera/Gesti-de-Pistes-de-p-del/Develop/frontend/public/Escut_de_Torrelameu.svg`;

async function sendMailSafe({ to, subject, html }) {
  if (!transporter || !to) {
    const err = new Error("SMTP no està configurat");
    err.code = "MAIL_NOT_CONFIGURED";
    throw err;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dateKey(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const day = String(value.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text;
}

function formatReservaFecha(value) {
  const key = dateKey(value);
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return key;

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  return new Intl.DateTimeFormat("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatReservaHora(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hour = String(value.getUTCHours()).padStart(2, "0");
    const minute = String(value.getUTCMinutes()).padStart(2, "0");
    return `${hour}:${minute}`;
  }

  const text = String(value);
  const match = text.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : text;
}

function layout(title, subtitle, body, buttonText = "Obrir aplicació", buttonUrl = appUrl) {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#eef4f0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef4f0;padding:28px 12px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #dbe7df;box-shadow:0 18px 45px rgba(15,23,42,.10);">
            
            <tr>
              <td style="background:#1a472a;padding:30px 28px;text-align:center;color:#ffffff;">
                <div style="width:72px;height:72px;margin:0 auto 16px;border-radius:50%;background:#ffffff;display:inline-block;text-align:center;line-height:72px;">
                  <img src="${LOGO_URL}" alt="Torrelameu" width="48" height="48" style="width:48px;height:48px;vertical-align:middle;object-fit:contain;" />
                </div>

                <h1 style="margin:0;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:-.5px;">
                  ${escapeHtml(title)}
                </h1>

                <p style="margin:10px 0 0;color:#cde7d7;font-size:14px;line-height:1.5;">
                  ${escapeHtml(subtitle)}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:30px 28px;">
                ${body}

                <div style="text-align:center;margin:30px 0 10px;">
                  <a href="${buttonUrl}" style="display:inline-block;background:#1a472a;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;padding:13px 24px;border-radius:12px;">
                    ${escapeHtml(buttonText)}
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
                  Pista Municipal de Pàdel de Torrelameu<br/>
                  <a href="${appUrl}" style="color:#1a472a;text-decoration:none;font-weight:700;">${appUrl}</a>
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

function reservaCard(reserva) {
  const fecha = formatReservaFecha(reserva.fecha);
  const hora = formatReservaHora(reserva.hora);

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 12px;color:#64748b;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;">
            Detalls de la reserva
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Data</td>
              <td align="right" style="padding:8px 0;color:#0f172a;font-size:15px;font-weight:800;">
                ${escapeHtml(fecha)}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Hora</td>
              <td align="right" style="padding:8px 0;color:#0f172a;font-size:15px;font-weight:800;">
                ${escapeHtml(hora)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function paragraph(text) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155;">${text}</p>`;
}

async function sendReservaConfirmada(user, reserva) {
  await sendMailSafe({
    to: user.email,
    subject: "Reserva confirmada - Pàdel Torrelameu",
    html: layout(
      "Reserva confirmada",
      "La teva pista ja està reservada.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(user.nombre)}</strong>,`)}
        ${paragraph("La teva reserva s'ha registrat correctament.")}
        ${reservaCard(reserva)}
      `
    ),
  });
}

async function sendReservaCancelada(user, reserva) {
  await sendMailSafe({
    to: user.email,
    subject: "Reserva cancel·lada - Pàdel Torrelameu",
    html: layout(
      "Reserva cancel·lada",
      "La reserva indicada ha estat cancel·lada.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(user.nombre)}</strong>,`)}
        ${paragraph("La teva reserva ha estat cancel·lada.")}
        ${reservaCard(reserva)}
      `
    ),
  });
}

async function sendSolicitudPartida(organitzador, solicitant, reserva) {
  await sendMailSafe({
    to: organitzador.email,
    subject: "Nova sol·licitud per unir-se a una partida",
    html: layout(
      "Nova sol·licitud",
      "Tens una nova petició per a la teva partida.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(organitzador.nombre)}</strong>,`)}
        ${paragraph(`<strong>${escapeHtml(solicitant.nombre)}</strong> vol unir-se a la teva partida.`)}
        ${reservaCard(reserva)}
        ${paragraph("Pots acceptar o rebutjar la sol·licitud des de l'aplicació.")}
      `,
      "Gestionar sol·licitud"
    ),
  });
}

async function sendSolicitudAcceptada(user, reserva) {
  await sendMailSafe({
    to: user.email,
    subject: "Sol·licitud acceptada - Pàdel Torrelameu",
    html: layout(
      "Sol·licitud acceptada",
      "Ja formes part de la partida.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(user.nombre)}</strong>,`)}
        ${paragraph("La teva sol·licitud per unir-te a la partida ha estat acceptada.")}
        ${reservaCard(reserva)}
      `
    ),
  });
}

async function sendSolicitudRebutjada(user, reserva) {
  await sendMailSafe({
    to: user.email,
    subject: "Sol·licitud rebutjada - Pàdel Torrelameu",
    html: layout(
      "Sol·licitud rebutjada",
      "La teva petició no ha estat acceptada.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(user.nombre)}</strong>,`)}
        ${paragraph("La teva sol·licitud per unir-te a la partida ha estat rebutjada.")}
        ${reservaCard(reserva)}
      `
    ),
  });
}

async function sendInvitacioPartida(user, organitzador, reserva) {
  await sendMailSafe({
    to: user.email,
    subject: "T'han convidat a una partida - Pàdel Torrelameu",
    html: layout(
      "Invitació a partida",
      "T'han convidat a jugar una partida de pàdel.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(user.nombre)}</strong>,`)}
        ${paragraph(`<strong>${escapeHtml(organitzador.nombre)}</strong> t'ha convidat a una partida.`)}
        ${reservaCard(reserva)}
        ${paragraph("Pots acceptar o rebutjar la invitació des de l'aplicació.")}
      `,
      "Veure invitació"
    ),
  });
}

async function sendPasswordReset(user, resetUrl) {
  await sendMailSafe({
    to: user.email,
    subject: "Recuperar contrasenya - Pàdel Torrelameu",
    html: layout(
      "Recuperar contrasenya",
      "Hem rebut una sol·licitud per canviar la teva contrasenya.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(user.nombre)}</strong>,`)}
        ${paragraph("Prem el botó següent per crear una nova contrasenya. Aquest enllaç caduca en 30 minuts.")}
        ${paragraph("Si no has demanat aquest canvi, pots ignorar aquest correu.")}
      `,
      "Canviar contrasenya",
      resetUrl
    ),
  });
}

async function sendEmailVerification(user, verifyUrl) {
  await sendMailSafe({
    to: user.email,
    subject: "Verifica el teu correu - Padel Torrelameu",
    html: layout(
      "Verifica el teu correu",
      "Confirma el teu compte per poder accedir a l'aplicacio.",
      `
        ${paragraph(`Hola <strong>${escapeHtml(user.nombre)}</strong>,`)}
        ${paragraph("Prem el boto seguent per validar el teu correu electronic. Aquest enllac caduca en 24 hores.")}
        ${paragraph("Si no has creat cap compte, pots ignorar aquest correu.")}
      `,
      "Verificar correu",
      verifyUrl
    ),
  });
}

module.exports = {
  sendReservaConfirmada,
  sendReservaCancelada,
  sendSolicitudPartida,
  sendSolicitudAcceptada,
  sendSolicitudRebutjada,
  sendInvitacioPartida,
  sendPasswordReset,
  sendEmailVerification,
  isMailEnabled,
};
