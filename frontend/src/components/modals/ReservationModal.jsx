import { formatFecha } from "../../utils/helpers";
import { modalOverlay } from "../../styles/styles";

export default function ReservationModal({ reservaModal, setReservaModal, config, session, hacerReserva, t }) {
  if (!reservaModal) return null;

  const close = () => setReservaModal(null);

  const OptionCard = ({ onClick, color, icon, title, description }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14, width: "100%",
        padding: "14px 16px", background: color.bg, border: `1.5px solid ${color.border}`,
        borderRadius: 12, cursor: "pointer", textAlign: "left", marginBottom: 10, transition: "opacity 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      <div style={{ width: 42, height: 42, borderRadius: 10, background: color.icon, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: color.text }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ marginLeft: "auto", fontSize: 18, color: color.border }}>›</div>
    </button>
  );

  return (
    <div style={modalOverlay} onClick={close}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: t?.surface || "#fff", borderRadius: 18, padding: 28, width: 360, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,.18)", position: "relative" }}
      >
        <button onClick={close} style={{ position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
          ×
        </button>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Nueva reserva</div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t?.text || "#111827" }}>
            {formatFecha(reservaModal.fecha)}
          </h3>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill color="#16a34a" bg="#f0fdf4" border="#86efac">{reservaModal.hora}</Pill>
            <Pill color="#6b7280" bg="#f9fafb" border="#e5e7eb">{config.duracion} min</Pill>
            <Pill color="#6b7280" bg="#f9fafb" border="#e5e7eb">{session.nombre}</Pill>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
          Tipo de reserva
        </div>

        <OptionCard
          onClick={() => { hacerReserva(reservaModal.fecha, reservaModal.hora, false); close(); }}
          color={{ bg: "#f0fdf4", border: "#86efac", icon: "#dcfce7", text: "#14532d" }}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
          title="Reserva privada"
          description="Solo tú y las personas que invites"
        />
        <OptionCard
          onClick={() => { hacerReserva(reservaModal.fecha, reservaModal.hora, true); close(); }}
          color={{ bg: "#eff6ff", border: "#93c5fd", icon: "#dbeafe", text: "#1d4ed8" }}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          title="Partido abierto"
          description="Hasta 4 jugadores — otros pueden unirse"
        />

        <button onClick={close} style={{ marginTop: 6, width: "100%", padding: "10px", background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Pill({ children, color, bg, border }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: "2px 10px" }}>
      {children}
    </span>
  );
}
