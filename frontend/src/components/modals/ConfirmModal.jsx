import { modalOverlay } from "../../styles/styles";

function JoinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

const VARIANTS = {
  danger: {
    icon: <DangerIcon />,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
    actionBg: "#dc2626",
    actionHover: "#b91c1c",
  },
  warning: {
    icon: <WarningIcon />,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    actionBg: "#d97706",
    actionHover: "#b45309",
  },
  join: {
    icon: <JoinIcon />,
    iconBg: "#eff6ff",
    iconColor: "#1d4ed8",
    actionBg: "#1a472a",
    actionHover: "#0f3d2a",
  },
  info: {
    icon: <InfoIcon />,
    iconBg: "#f0fdf4",
    iconColor: "#15803d",
    actionBg: "#1a472a",
    actionHover: "#0f3d2a",
  },
};

export default function ConfirmModal({ confirmModal, setConfirmModal, t }) {
  if (!confirmModal) return null;

  const close = () => setConfirmModal(null);
  const variantName = confirmModal.variant || (confirmModal.danger === false ? "warning" : "danger");
  const variant = VARIANTS[variantName] || VARIANTS.danger;

  return (
    <div style={modalOverlay} onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t?.surface || "#fff",
          borderRadius: 18,
          padding: 30,
          width: 374,
          maxWidth: "94vw",
          boxShadow: "0 24px 70px rgba(15,23,42,.24)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 18,
            background: variant.iconBg,
            color: variant.iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
          }}
        >
          {confirmModal.icono || variant.icon}
        </div>

        <h3 style={{ margin: "0 0 8px", color: t?.text || "#111827", fontSize: 21, fontWeight: 700, letterSpacing: 0 }}>
          {confirmModal.titulo || "N'estàs segur?"}
        </h3>

        <p style={{ color: t?.textSecondary || "#64748b", fontSize: 14, margin: "0 auto 26px", lineHeight: 1.65, maxWidth: 300 }}>
          {confirmModal.mensaje}
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={close}
            style={{
              flex: 1,
              padding: "12px",
              background: "#f3f4f6",
              color: t?.textSecondary || "#475569",
              border: "none",
              borderRadius: 11,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
          >
            Cancel·lar
          </button>

          <button
            onClick={() => { confirmModal.onConfirm(); close(); }}
            style={{
              flex: 1,
              padding: "12px",
              background: variant.actionBg,
              color: "#fff",
              border: "none",
              borderRadius: 11,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: `0 12px 24px ${variant.actionBg}33`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = variant.actionHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = variant.actionBg; }}
          >
            {confirmModal.accion || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
