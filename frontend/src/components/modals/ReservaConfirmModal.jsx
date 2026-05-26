import { modalOverlay } from "../../styles/styles";
import { formatFecha, googleCalendarUrl, descargarIcs } from "../../utils/helpers";

export default function ReservaConfirmModal({ data, onClose, config, t }) {
  if (!data) return null;
  const { fecha, hora, abierto } = data;
  const duracion = config?.duracion || 90;
  const titulo = abierto ? "Partido abierto de pàdel" : "Reserva pista pàdel - Torrelameu";
  const desc = "Pista pàdel Torrelameu - La pleta";

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t?.surface || "#fff",
          borderRadius: 20,
          padding: "36px 28px 28px",
          width: 340,
          maxWidth: "92vw",
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Icona check */}
        <div style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700, color: t?.text || "#111827" }}>
          Reserva confirmada
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: t?.textSecondary || "#6b7280" }}>
          Se ha añadido al calendario de Google
        </p>

        <div style={{ borderTop: `1px solid ${t?.border || "#e5e7eb"}`, borderBottom: `1px solid ${t?.border || "#e5e7eb"}`, padding: "18px 0", margin: "0 0 24px", textAlign: "left" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* Mini calendari */}
            <div style={{ textAlign: "center", minWidth: 40 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: t?.text || "#111827", lineHeight: 1 }}>{fecha.split("-")[2]}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(fecha.split("-")[1]) - 1]}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: t?.text || "#111827", marginBottom: 3 }}>
                {titulo}
              </div>
              <div style={{ fontSize: 12, color: t?.textSecondary || "#6b7280" }}>
                {formatFecha(fecha)} · {hora} – {(function() {
                  const [h, m] = hora.split(":").map(Number);
                  const tot = h * 60 + m + duracion;
                  return `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
                })()}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ fontSize: 12, color: t?.textSecondary || "#6b7280" }}>Pista pàdel Torrelameu - La pleta</span>
          </div>
        </div>

        {/* Botons */}
        <a
          href={googleCalendarUrl(fecha, hora, duracion, titulo, desc)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 600, fontSize: 13, color: "#374151", textDecoration: "none", marginBottom: 8, boxSizing: "border-box" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          {/* Logo Google Calendar */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44 20H24v8h11.3C34.1 32.9 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"/>
            <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.5 35.9 26.9 37 24 37c-5.6 0-10.4-3.8-12-9l-6.6 5.1C9.3 39.2 16.2 44 24 44z"/>
            <path fill="#EA4335" d="M44 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Abrir en Google Calendar
        </a>
        <button
          onClick={() => descargarIcs(fecha, hora, duracion, titulo, desc)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "11px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 600, fontSize: 13, color: "#374151", cursor: "pointer", marginBottom: 12, boxSizing: "border-box" }}
          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={e => e.currentTarget.style.background = "#fff"}
        >
          📅 Exportar .ics
        </button>

        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#1d4ed8", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: "4px 0" }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
