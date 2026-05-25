import { modalOverlay } from "../../styles/styles";

export default function ConfirmModal({ confirmModal, setConfirmModal, t }) {
  if (!confirmModal) return null;
  const close = () => setConfirmModal(null);
  const peligroso = confirmModal.danger !== false;

  return (
    <div style={modalOverlay} onClick={close}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: t?.surface || "#fff", borderRadius: 18, padding: 28, width: 340, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,.18)", textAlign: "center" }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 16, background: peligroso ? "#fef2f2" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 24 }}>
          {confirmModal.icono || (peligroso ? "🗑" : "⚠️")}
        </div>
        <h3 style={{ margin: "0 0 8px", color: t?.text || "#111827", fontSize: 18, fontWeight: 800 }}>
          {confirmModal.titulo || "¿Estás seguro?"}
        </h3>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px", lineHeight: 1.65 }}>
          {confirmModal.mensaje}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={close}
            style={{ flex: 1, padding: "11px", background: "#f3f4f6", color: t?.textSecondary || "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}
          >
            Cancelar
          </button>
          <button
            onClick={() => { confirmModal.onConfirm(); close(); }}
            style={{ flex: 1, padding: "11px", background: peligroso ? "#dc2626" : "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {confirmModal.accion || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
