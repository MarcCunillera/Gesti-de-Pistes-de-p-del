import { modalOverlay } from "../../styles/styles";
import { formatFecha, googleCalendarUrl } from "../../utils/helpers";

export default function ReservaConfirmModal({ data, onClose, config, t }) {
  if (!data) return null;
  const { fecha, hora, abierto } = data;
  const duracion = config?.duracion || 90;
  const titulo = abierto ? "Partit obert de pàdel" : "Reserva pista pàdel - Torrelameu";
  const desc = "Pista pàdel Torrelameu - La pleta";
  const [h, m] = hora.split(":").map(Number);
  const tot = h * 60 + m + duracion;
  const horaFi = `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`;
  const mes = ["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"][parseInt(fecha.split("-")[1]) - 1];

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: t?.surface || "#fff", borderRadius: 18, width: 360, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,.18)", position: "relative", overflow: "hidden" }}
      >
        {/* Franja verde */}
        <div style={{ height: 4, background: "linear-gradient(90deg,#4ade80,#22c55e)" }} />

        <div style={{ padding: "24px 24px 20px" }}>
          {/* Tancar */}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

          {/* Capçalera */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Reserva confirmada</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: t?.text || "#111827" }}>{formatFecha(fecha)}</span>
              <span style={{ fontWeight: 500, fontSize: 14, color: "#6b7280" }}>{hora} – {horaFi}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: abierto ? "#eff6ff" : "#f0fdf4", color: abierto ? "#1d4ed8" : "#15803d", border: `1px solid ${abierto ? "#93c5fd" : "#86efac"}`, borderRadius: 20, padding: "2px 10px" }}>
                {abierto ? "Obert" : "Privat"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>Pista pàdel Torrelameu - La pleta</span>
            </div>
          </div>

          {/* Info del evento */}
          <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ textAlign: "center", minWidth: 36, flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: t?.text || "#111827", lineHeight: 1 }}>{fecha.split("-")[2]}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{mes}</div>
              </div>
              <div style={{ width: 1, height: 36, background: "#e5e7eb", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: t?.text || "#111827", marginBottom: 2 }}>{titulo}</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>{duracion} min · {hora} – {horaFi}</div>
              </div>
            </div>
          </div>

          {/* Botón Google Calendar */}
          <a
            href={googleCalendarUrl(fecha, hora, duracion, titulo, desc)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "10px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 9, fontWeight: 600, fontSize: 13, color: "#374151", textDecoration: "none", marginBottom: 10, boxSizing: "border-box" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M44 20H24v8h11.3C34.1 32.9 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"/>
              <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.8 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#FBBC05" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.5 35.9 26.9 37 24 37c-5.6 0-10.4-3.8-12-9l-6.6 5.1C9.3 39.2 16.2 44 24 44z"/>
              <path fill="#EA4335" d="M44 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Afegir a Google Calendar
          </a>

          <button
            onClick={onClose}
            style={{ width: "100%", padding: "10px", background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}