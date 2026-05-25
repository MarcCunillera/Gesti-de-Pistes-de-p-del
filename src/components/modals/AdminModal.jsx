import { formatFecha } from "../../utils/helpers";
import { modalOverlay } from "../../styles/styles";

export default function AdminModal({ adminModal, setAdminModal, users, hacerReserva, cancelarReserva, toggleBloqueo, t }) {
  if (!adminModal) return null;

  const close = () => setAdminModal(null);
  const res = adminModal.res;
  const propietario = res ? users.find(function(u) { return u.id === res.userId; }) : null;

  const ActionBtn = ({ onClick, bg, color, border, children }) => (
    <button
      onClick={onClick}
      style={{ display: "block", width: "100%", padding: "12px 16px", background: bg, color, border: border ? `1.5px solid ${border}` : "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8, textAlign: "left" }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {children}
    </button>
  );

  return (
    <div style={modalOverlay} onClick={close}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: t?.surface || "#fff", borderRadius: 18, padding: 28, width: 360, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,.18)", position: "relative" }}
      >
        <button onClick={close} style={{ position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Administrador</div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t?.text || "#111827" }}>{formatFecha(adminModal.fecha)}</h3>
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", borderRadius: 20, padding: "2px 10px" }}>{adminModal.hora}</span>
            {adminModal.bloq && <span style={{ fontSize: 12, fontWeight: 600, background: "#f9fafb", color: "#6b7280", border: "1px solid " + (t?.border || "#e5e7eb") + ",", borderRadius: 20, padding: "2px 10px" }}>Bloqueado</span>}
            {res && res.abierto && <span style={{ fontSize: 12, fontWeight: 600, background: "#f0f9ff", color: "#0284c7", border: "1px solid #7dd3fc", borderRadius: 20, padding: "2px 10px" }}>Partido abierto</span>}
          </div>
        </div>

        {/* Info reserva actual */}
        {res && (
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Reserva activa</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: t?.text || "#111827" }}>{propietario?.nombre}</div>
            {res.abierto && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{res.jugadores?.length}/4 jugadores</div>}
          </div>
        )}

        {/* Bloqueado: desbloquear */}
        {adminModal.bloq && (
          <ActionBtn onClick={() => { toggleBloqueo(adminModal.fecha, adminModal.hora); close(); }} bg="#f0fdf4" color="#14532d" border="#86efac">
            🔓 Desbloquear horario
          </ActionBtn>
        )}

        {/* Libre: reservar + bloquear */}
        {!adminModal.bloq && !res && (
          <ActionBtn onClick={() => { hacerReserva(adminModal.fecha, adminModal.hora, false); close(); }} bg="#f0fdf4" color="#14532d" border="#86efac">
            📅 Reservar manualmente
          </ActionBtn>
        )}

        {/* Reservada: cancelar */}
        {!adminModal.bloq && res && (
          <ActionBtn onClick={() => { cancelarReserva(res.id); close(); }} bg="#fef2f2" color="#dc2626" border="#fca5a5">
            🗑 Cancelar reserva
          </ActionBtn>
        )}

        {/* No bloqueado: bloquear */}
        {!adminModal.bloq && (
          <ActionBtn onClick={() => { toggleBloqueo(adminModal.fecha, adminModal.hora); close(); }} bg="#f5f3ff" color="#7c3aed" border="#ddd6fe">
            🚫 Bloquear horario
          </ActionBtn>
        )}

        <button onClick={close} style={{ width: "100%", padding: "10px", background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 4 }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
