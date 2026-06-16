export function generarHorarios(horaInicio, horaFin, duracion) {
  const slots = [];
  const [hI, mI] = horaInicio.split(":").map(Number);
  const [hF, mF] = horaFin.split(":").map(Number);
  let mins = hI * 60 + mI;
  const fin = hF * 60 + mF;
  while (mins + duracion <= fin) {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    mins += duracion;
  }
  return slots;
}

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoy() {
  return dateKey(new Date());
}

export function fechasDesde(base, dias) {
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(`${base}T12:00:00`);
    d.setDate(d.getDate() + i);
    return dateKey(d);
  });
}

export function formatFecha(f) {
  const [y, m, d] = f.split("-");
  const dies  = ["Dg", "Dl", "Dm", "Dc", "Dj", "Dv", "Ds"];
  const mesos = ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"];
  const date = new Date(y, m - 1, d);
  return `${dies[date.getDay()]} ${d} ${mesos[m - 1]}`;
}

export function iniciales(nombre) {
  return nombre.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export function colorAvatar(id) {
  const cols = ["#1a472a", "#1a5276", "#6c3483", "#7d6608", "#c0392b", "#117a65", "#1f618d", "#784212"];
  return cols[id % cols.length];
}

// Genera una data en format YYYYMMDDTHHmmss per a calendaris
function toCalDate(fecha, hora, offsetMins = 0) {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  const date = new Date(y, m - 1, d, h, min + offsetMins);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

export function googleCalendarUrl(fecha, hora, duracion, titulo, descripcion) {
  const start = toCalDate(fecha, hora);
  const end = toCalDate(fecha, hora, duracion);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo,
    dates: `${start}/${end}`,
    details: descripcion,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function descargarIcs(fecha, hora, duracion, titulo, descripcion) {
  const start = toCalDate(fecha, hora);
  const end = toCalDate(fecha, hora, duracion);
  const stamp = toCalDate(hoy(), new Date().toTimeString().slice(0, 5));
  const contenido = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pista de Pàdel//CA",
    "BEGIN:VEVENT",
    `UID:${start}-padel@reservas`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${descripcion}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Recordatori: ${titulo}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([contenido], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reserva-padel-${fecha}-${hora.replace(":", "")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
