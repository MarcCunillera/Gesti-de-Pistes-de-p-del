import { formatFecha } from "../../utils/helpers";
import { modalOverlay } from "../../styles/styles";

function Pill({ children, color, bg, border }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, background: bg, color, border: `1px solid ${border}`, borderRadius: 20, padding: "2px 10px" }}>
      {children}
    </span>
  );
}

function OptionCard({ onClick, color, icon, title, description }) {
  return (
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
}

function ActionBtn({ onClick, bg, color, border, children }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 16px", background: bg, border: `1.5px solid ${border}`, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10, textAlign: "left", transition: "opacity 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {children}
    </button>
  );
}

export default function AdminModal({ adminModal, setAdminModal, users, hacerReserva, cancelarReserva, toggleBloqueo, config, session, t }) {
  if (!adminModal) return null;

  const close = () => setAdminModal(null);
  const res = adminModal.res;
  const propietario = res ? users.find(function(u) { return u.id === res.userId; }) : null;

  return (
    <div style={modalOverlay} onClick={close}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: t?.surface || "#fff", borderRadius: 18, padding: 28, width: 360, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,.18)", position: "relative" }}
      >
        <button onClick={close} style={{ position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Nueva reserva</div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t?.text || "#111827" }}>
            {formatFecha(adminModal.fecha)}
          </h3>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Pill color="#16a34a" bg="#f0fdf4" border="#86efac">{adminModal.hora}</Pill>
            {config && <Pill color="#6b7280" bg="#f9fafb" border="#e5e7eb">{config.duracion} min</Pill>}
            {session && <Pill color="#6b7280" bg="#f9fafb" border="#e5e7eb">{session.nombre}</Pill>}
            {adminModal.bloq && <Pill color="#7c3aed" bg="#f5f3ff" border="#ddd6fe">Bloqueado</Pill>}
            {res && res.abierto && <Pill color="#0284c7" bg="#f0f9ff" border="#7dd3fc">Partido abierto</Pill>}
          </div>
        </div>

        {/* Info reserva actual */}
        {res && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Reserva activa</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: t?.text || "#111827" }}>{propietario?.nombre}</div>
            {res.abierto && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{res.jugadores?.length}/4 jugadores</div>}
          </div>
        )}

        {/* Tipus de reserva label */}
        {!adminModal.bloq && !res && (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
            Tipo de reserva
          </div>
        )}

        {/* Bloqueado: desbloquear */}
        {adminModal.bloq && (
          <OptionCard
            onClick={() => { toggleBloqueo(adminModal.fecha, adminModal.hora); close(); }}
            color={{ bg: "#f0fdf4", border: "#86efac", icon: "#dcfce7", text: "#14532d" }}
            icon="🔓"
            title="Desbloquear horario"
            description="Vuelve a estar disponible para reservas"
          />
        )}

        {/* Libre: reservar privada + partido abierto */}
        {!adminModal.bloq && !res && (
          <>
            <OptionCard
              onClick={() => { hacerReserva(adminModal.fecha, adminModal.hora, false); close(); }}
              color={{ bg: "#f0fdf4", border: "#86efac", icon: "#dcfce7", text: "#14532d" }}
              icon="🔒"
              title="Reserva privada"
              description="Solo tú y las personas que invites"
            />
            <OptionCard
              onClick={() => { hacerReserva(adminModal.fecha, adminModal.hora, true); close(); }}
              color={{ bg: "#eff6ff", border: "#93c5fd", icon: "#dbeafe", text: "#1d4ed8" }}
              icon="🏓"
              title="Partido abierto"
              description="Hasta 4 jugadores — otros pueden unirse"
            />
          </>
        )}

        {/* Reservada: cancelar */}
        {!adminModal.bloq && res && (
          <OptionCard
            onClick={() => { cancelarReserva(res.id); close(); }}
            color={{ bg: "#fef2f2", border: "#fca5a5", icon: "#fee2e2", text: "#dc2626" }}
            icon="🗑"
            title="Cancelar reserva"
            description={`Reserva de ${propietario?.nombre || "usuario"}`}
          />
        )}

        {/* No bloqueado: bloquear */}
        {!adminModal.bloq && (
          <ActionBtn onClick={() => { toggleBloqueo(adminModal.fecha, adminModal.hora); close(); }} bg="#f5f3ff" color="#7c3aed" border="#ddd6fe">
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>🚫</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#7c3aed" }}>Bloquear horario</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Nadie podrá reservar esta franja</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 18, color: "#ddd6fe" }}>›</div>
          </ActionBtn>
        )}

        <button onClick={close} style={{ marginTop: 6, width: "100%", padding: "10px", background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
