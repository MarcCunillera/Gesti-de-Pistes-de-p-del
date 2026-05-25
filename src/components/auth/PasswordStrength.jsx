export function getRequisitos(pwd) {
  return [
    { ok: pwd.length >= 6,           label: "Mínimo 6 caracteres" },
    { ok: /[A-Z]/.test(pwd),         label: "Una mayúscula" },
    { ok: /[0-9]/.test(pwd),         label: "Un número" },
  ];
}

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const reqs = getRequisitos(password);
  const ok = reqs.filter((r) => r.ok).length;
  const colors = ["#dc2626", "#f59e0b", "#16a34a"];
  const barColor = colors[ok - 1] || "#dc2626";

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < ok ? barColor : "#e5e7eb", transition: "background 0.2s" }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {reqs.map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: r.ok ? "#16a34a" : "#9ca3af" }}>
            <span>{r.ok ? "✓" : "○"}</span>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
