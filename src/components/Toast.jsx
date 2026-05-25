const VARIANTS = {
  ok:   { bg: "#14532d", icon: "✓", border: "#166534" },
  warn: { bg: "#92400e", icon: "⚠", border: "#b45309" },
  error:{ bg: "#991b1b", icon: "✕", border: "#b91c1c" },
  info: { bg: "#1e40af", icon: "ℹ", border: "#1d4ed8" },
};

export default function Toast({ toast }) {
  if (!toast) return null;
  const v = VARIANTS[toast.tipo] || VARIANTS.ok;
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: v.bg,
      color: "#fff",
      borderRadius: 10,
      padding: "12px 20px",
      fontWeight: 600,
      fontSize: 14,
      boxShadow: `0 4px 16px rgba(0,0,0,.25), 0 0 0 1px ${v.border}`,
      zIndex: 9999,
      whiteSpace: "nowrap",
      display: "flex",
      alignItems: "center",
      gap: 10,
      animation: "toast-in 0.2s ease",
    }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>{v.icon}</span>
      {toast.msg}
    </div>
  );
}

