import UserAvatar from "../UserAvatar";

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Header({ session, setVista, setSession, dark, toggleDark, t }) {
  const surface = t?.surface || "#fff";
  const border = t?.border || "#e5e7eb";
  const text = t?.text || "#111827";
  const secondary = t?.textSecondary || "#6b7280";
  const isDark = !["#fff", "#ffffff"].includes((surface || "").toLowerCase());
  const dangerBg = isDark ? "rgba(239,68,68,.14)" : "#fff5f5";
  const dangerBorder = isDark ? "rgba(248,113,113,.34)" : "#fecaca";
  const dangerText = isDark ? "#fca5a5" : "#dc2626";

  return (
    <header
      className="app-header"
      style={{
        background: surface,
        borderBottomColor: border,
        boxShadow: isDark ? "0 1px 0 rgba(148,163,184,.12), 0 10px 24px rgba(2,6,23,.28)" : undefined,
      }}
    >
      <button
        type="button"
        className="app-header-brand"
        onClick={() => setVista("calendario")}
        style={{ color: text }}
      >
        <img src="/Escut_de_Torrelameu.svg" alt="Torrelameu" />
        <span style={{ color: text }}>
          <strong style={{ color: text }}>Pàdel Torrelameu</strong>
        </span>
      </button>

      <div className="app-header-actions">
        <button
          type="button"
          className="app-icon-btn"
          onClick={toggleDark}
          title={dark ? "Mode clar" : "Mode fosc"}
          style={{
            borderColor: border,
            background: surface,
            color: secondary,
          }}
        >
          {dark ? <IconSun /> : <IconMoon />}
        </button>

        <button
          type="button"
          className="app-user-chip"
          onClick={() => setVista("perfil")}
          style={{
            borderColor: border,
            background: surface,
            color: text,
          }}
        >
          <UserAvatar user={session} size={28} />
          <span style={{ color: text }}>
            <strong style={{ color: text }}>{session.nombre}</strong>
            {session.rol === "admin" && <small style={{ color: secondary }}>Admin</small>}
          </span>
        </button>

        <button
          type="button"
          className="app-icon-btn"
          onClick={() => setSession(null)}
          title="Sortir"
          style={{
            borderColor: dangerBorder,
            background: dangerBg,
            color: dangerText,
          }}
        >
          <IconLogout />
        </button>
      </div>
    </header>
  );
}