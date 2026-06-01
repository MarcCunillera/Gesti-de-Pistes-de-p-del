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

const appUrl = process.env.APP_URL || "http://localhost:3003";

async function sendMailSafe({ to, subject, html }) {
  if (!transporter || !to) return;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
}

function layout(title, body) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#111827;">
      <div style="background:#1a472a;color:white;padding:18px 22px;border-radius:12px 12px 0 0;">
        <h2 style="margin:0;">${title}</h2>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:0;padding:22px;border-radius:0 0 12px 12px;">
        ${body}
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:22px 0;" />
        <p style="font-size:13px;color:#6b7280;">
          Pista Municipal de Pàdel de Torrelameu<br/>
          <a href="${appUrl}">${appUrl}</a>
        </p>
      </div>
    </div>
  `;
}

function reservaInfo(reserva) {
  return `
    <p><strong>Data:</strong> ${reserva.fecha}</p>
    <p><strong>Hora:</strong> ${reserva.hora}</p>
  `;
}

async function sendReservaConfirmada(user, reserva) {
  await sendMailSafe({
    to: user.email,
    subject: "Reserva confirmada - Pàdel Torrelameu",
    html: layout(
      "Reserva confirmada",
      `
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>La teva reserva s'ha registrat correctament.</p>
        ${reservaInfo(reserva)}
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
      `
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>La teva reserva ha estat cancel·lada.</p>
        ${reservaInfo(reserva)}
      `
    ),
  });
}

async function sendSolicitudPartida(organitzador, solicitant, reserva) {
  await sendMailSafe({
    to: organitzador.email,
    subject: "Nova sol·licitud per unir-se a una partida",
    html: layout(
      "Nova sol·licitud de partida",
      `
        <p>Hola <strong>${organitzador.nombre}</strong>,</p>
        <p><strong>${solicitant.nombre}</strong> vol unir-se a la teva partida.</p>
        ${reservaInfo(reserva)}
        <p>Pots acceptar o rebutjar la sol·licitud des de l'aplicació.</p>
      `
    ),
  });
}

async function sendSolicitudAcceptada(user, reserva) {
  await sendMailSafe({
    to: user.email,
    subject: "Sol·licitud acceptada - Pàdel Torrelameu",
    html: layout(
      "Sol·licitud acceptada",
      `
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>La teva sol·licitud per unir-te a la partida ha estat acceptada.</p>
        ${reservaInfo(reserva)}
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
      `
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p>La teva sol·licitud per unir-te a la partida ha estat rebutjada.</p>
        ${reservaInfo(reserva)}
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
      `
        <p>Hola <strong>${user.nombre}</strong>,</p>
        <p><strong>${organitzador.nombre}</strong> t'ha convidat a una partida.</p>
        ${reservaInfo(reserva)}
        <p>Pots acceptar o rebutjar la invitació des de l'aplicació.</p>
      `
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
};