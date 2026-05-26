import { useState } from "react";
import UserAvatar from "../UserAvatar";

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

export default function Header({ session, setVista, setSession, dark, toggleDark, t }) {
  const [userHover, setUserHover] = useState(false);
  const [btnHover, setBtnHover] = useState(null);

  const bg        = t?.surface    || "#fff";
  const border    = t?.border     || "#e5e7eb";
  const textMain  = t?.text       || "#111827";
  const textMuted = t?.textSecondary || "#6b7280";
  const surfaceH  = t?.surfaceAlt || "#f9fafb";
  const borderH   = t?.border     || "#d1d5db";

  function HdrBtn({ id, onClick, title, children }) {
    const hov = btnHover === id;
    return (
      <button
        onClick={onClick}
        title={title}
        onMouseEnter={() => setBtnHover(id)}
        onMouseLeave={() => setBtnHover(null)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          gap: 6, background: hov ? surfaceH : "transparent",
          border: "1px solid", borderColor: hov ? borderH : border,
          color: textMuted, borderRadius: 7, padding: "6px 10px",
          cursor: "pointer", fontSize: 12, fontWeight: 600,
          transition: "background 0.12s, border-color 0.12s",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div style={{
      background: bg,
      borderBottom: "1px solid " + border,
      padding: "0 24px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/Escut_de_Torrelameu.svg" alt="Torrelameu" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: textMain, letterSpacing: -0.3 }}>
          Pista de Pàdel Torrelameu
        </span>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <HdrBtn id="dark" onClick={toggleDark} title={dark ? "Modo claro" : "Modo oscuro"}>
          {dark ? <IconSun /> : <IconMoon />}
        </HdrBtn>

        {/* User chip */}
        <div
          onClick={() => setVista("perfil")}
          onMouseEnter={() => setUserHover(true)}
          onMouseLeave={() => setUserHover(false)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", padding: "5px 10px 5px 5px",
            borderRadius: 8, border: "1px solid",
            borderColor: userHover ? borderH : border,
            background: userHover ? surfaceH : bg,
            transition: "background 0.12s, border-color 0.12s",
          }}
        >
          <UserAvatar user={session} size={28} />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: textMain }}>
              {session.nombre}
            </div>
            {session.rol === "admin" && (
              <div style={{ fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: 0.3, textTransform: "uppercase" }}>
                Admin
              </div>
            )}
          </div>
        </div>

        <HdrBtn id="salir" onClick={() => setSession(null)} title="Cerrar sesión">
          <IconLogout />
          <span className="header-name">Salir</span>
        </HdrBtn>
      </div>
    </div>
  );
}
