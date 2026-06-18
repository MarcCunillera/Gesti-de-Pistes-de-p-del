import { formatFecha } from "../../utils/helpers";
import { modalOverlay } from "../../styles/styles";

export default function ReservationModal({ reservaModal, setReservaModal, config, session, hacerReserva, t }) {
  if (!reservaModal) return null;

  const C = {
    surface: t?.surface || "#fff",
    surfaceAlt: t?.surfaceAlt || "#f9fafb",
    border: t?.border || "#e5e7eb",
    text: t?.text || "#111827",
    secondary: t?.textSecondary || "#6b7280",
    muted: t?.textMuted || "#9ca3af",
  };
  const dark = !["#fff", "#ffffff"].includes((C.surface || "").toLowerCase());

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
        <div style={{ fontSize: 12, color: C.secondary, marginTop: 2 }}>{description}</div>
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
        <button onClick={close} style={{ position: "absolute", top: 14, right: 14, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, color: C.secondary, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
          ×
        </button>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0, marginBottom: 4 }}>Nova reserva</div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t?.text || "#111827" }}>
            {formatFecha(reservaModal.fecha)}
          </h3>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill color={dark ? "#86efac" : "#16a34a"} bg={dark ? "rgba(34,197,94,.14)" : "#f0fdf4"} border={dark ? "rgba(74,222,128,.32)" : "#86efac"}>{reservaModal.hora}</Pill>
            <Pill color={C.secondary} bg={C.surfaceAlt} border={C.border}>{config.duracion} min</Pill>
            <Pill color={C.secondary} bg={C.surfaceAlt} border={C.border}>{session.nombre}</Pill>
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0, marginBottom: 10 }}>
          Tipus de reserva
        </div>

        <OptionCard
          onClick={() => { hacerReserva(reservaModal.fecha, reservaModal.hora, false); close(); }}
          color={{ bg: dark ? "rgba(34,197,94,.14)" : "#f0fdf4", border: dark ? "rgba(74,222,128,.32)" : "#86efac", icon: dark ? "rgba(34,197,94,.18)" : "#dcfce7", text: dark ? "#bbf7d0" : "#14532d" }}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
          title="Reserva privada"
          description="Només tu i les persones que convidis"
        />
        <OptionCard
          onClick={() => { hacerReserva(reservaModal.fecha, reservaModal.hora, true); close(); }}
          color={{ bg: dark ? "rgba(59,130,246,.14)" : "#eff6ff", border: dark ? "rgba(96,165,250,.32)" : "#93c5fd", icon: dark ? "rgba(59,130,246,.18)" : "#dbeafe", text: dark ? "#bfdbfe" : "#1d4ed8" }}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          title="Partit obert"
          description="Fins a 4 jugadors — altres s'hi poden unir"
        />

        <button onClick={close} style={{ marginTop: 6, width: "100%", padding: "10px", background: "transparent", color: C.muted, border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Cancel·lar
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