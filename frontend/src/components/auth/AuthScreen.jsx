import { useState } from "react";
import PasswordStrength from "./PasswordStrength";

/* ── Iconos SVG inline ─────────────────────────────────── */
const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── Ilustración pista de pàdel ─────────────────────────── */
const CourtIllustration = () => (
  <svg viewBox="0 0 280 160" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", maxWidth: 320, opacity: 0.22 }}>
    <rect x="10" y="10" width="260" height="140" rx="3" stroke="white" strokeWidth="2" />
    <line x1="140" y1="10" x2="140" y2="150" stroke="white" strokeWidth="2.5" />
    <line x1="10" y1="80" x2="270" y2="80" stroke="white" strokeWidth="1.5" />
    <line x1="55" y1="10" x2="55" y2="150" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" />
    <line x1="225" y1="10" x2="225" y2="150" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" />
    <circle cx="140" cy="80" r="6" fill="white" opacity="0.5" />
    <circle cx="90" cy="50" r="5" fill="white" opacity="0.4" />
    <circle cx="195" cy="115" r="5" fill="white" opacity="0.4" />
    <rect x="10" y="10" width="30" height="140" rx="2" stroke="white" strokeWidth="1" opacity="0.3" />
    <rect x="240" y="10" width="30" height="140" rx="2" stroke="white" strokeWidth="1" opacity="0.3" />
  </svg>
);

/* ── Input con icono ────────────────────────────────────── */
function IconInput({ icon, ...props }) {
  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <span style={{
        position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
        color: "#9ca3af", pointerEvents: "none", display: "flex", alignItems: "center",
      }}>
        {icon}
      </span>
      <input className="auth-input" {...props} />
    </div>
  );
}

/* ── Componente principal ───────────────────────────────── */
export default function AuthScreen({
  authTab, setAuthTab,
  loginForm, setLoginForm,
  regForm, setRegForm,
  authError, login, registro,
}) {
  const [showPwdReqs, setShowPwdReqs] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Panel izquierdo — branding */}
      <div className="auth-panel-left" style={{
        flex: "0 0 44%",
        background: "linear-gradient(155deg, #0f2d1a 0%, #1a472a 45%, #2d6a4f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 40px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Círculos decorativos de fondo */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 340 }}>
          {/* Logo */}
          <div style={{
            width: 72, height: 72,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 32px",
            border: "1.5px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 0 20" strokeDasharray="4 2" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>

          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            Pistes de Pàdel
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, margin: "0 0 40px", lineHeight: 1.6 }}>
            Gestió de reserves del poble
          </p>

          <CourtIllustration />

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "🗓️", text: "Reserva la teva pista en segons" },
              { icon: "👥", text: "Convida amics a la partida" },
              { icon: "📊", text: "Historial de reserves al moment" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                <span style={{ fontSize: 18, width: 28, textAlign: "center" }}>{icon}</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="auth-panel-right" style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "48px 40px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Cabecera mobile (solo visible en móvil cuando panel izquierdo está oculto) */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              width: 52, height: 52,
              background: "#1a472a",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 0 20" strokeDasharray="4 2" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.3px" }}>
              {authTab === "login" ? "Benvingut/a de nou" : "Crea el teu compte"}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
              {authTab === "login"
                ? "Entra per gestionar les teves reserves"
                : "Registra't per reservar pistes"}
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            background: "#f1f5f9",
            borderRadius: 12,
            padding: 4,
            marginBottom: 28,
            gap: 4,
          }}>
            {[["login", "Entrar"], ["registro", "Registrar-se"]].map(([t, label]) => (
              <button
                key={t}
                className="auth-tab-btn"
                onClick={() => { setAuthTab(t); setShowPwdReqs(false); }}
                style={{
                  borderRadius: 9,
                  background: authTab === t ? "#fff" : "transparent",
                  color: authTab === t ? "#1a472a" : "#6b7280",
                  boxShadow: authTab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Formulario */}
          <div key={authTab} className="auth-form-section">
            {authTab === "login" ? (
              <>
                <IconInput
                  icon={<IconEmail />}
                  type="email"
                  placeholder="Correu electrònic"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
                <IconInput
                  icon={<IconLock />}
                  type="password"
                  placeholder="Contrasenya"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && login()}
                  autoComplete="current-password"
                />
                <button
                  onClick={login}
                  style={{
                    display: "block", width: "100%",
                    padding: "13px", marginTop: 4,
                    background: "#1a472a", color: "#fff",
                    border: "none", borderRadius: 10,
                    fontWeight: 700, fontSize: 15,
                    cursor: "pointer", letterSpacing: "0.2px",
                    transition: "background 0.2s, transform 0.1s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#153d24")}
                  onMouseLeave={(e) => (e.target.style.background = "#1a472a")}
                >
                  Entrar
                </button>

                {/* Credenciales demo */}
                <div style={{
                  marginTop: 20,
                  padding: "12px 14px",
                  background: "#f0fdf4",
                  borderRadius: 10,
                  border: "1px solid #bbf7d0",
                }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Credencials de demo
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 12, color: "#166534" }}>
                    <strong>Admin:</strong> admin@padel.com · Admin123
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>
                    <strong>Usuari:</strong> marc@padel.com · Padel1
                  </p>
                </div>
              </>
            ) : (
              <>
                <IconInput
                  icon={<IconUser />}
                  type="text"
                  placeholder="Nom complet"
                  value={regForm.nombre}
                  onChange={(e) => setRegForm((f) => ({ ...f, nombre: e.target.value }))}
                  autoComplete="name"
                />
                <IconInput
                  icon={<IconEmail />}
                  type="email"
                  placeholder="Correu electrònic"
                  value={regForm.email}
                  onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
                <IconInput
                  icon={<IconLock />}
                  type="password"
                  placeholder="Contrasenya"
                  value={regForm.password}
                  onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                  onFocus={() => setShowPwdReqs(true)}
                  autoComplete="new-password"
                />
                {showPwdReqs && <PasswordStrength password={regForm.password} />}
                <button
                  onClick={registro}
                  style={{
                    display: "block", width: "100%",
                    padding: "13px", marginTop: 4,
                    background: "#1a472a", color: "#fff",
                    border: "none", borderRadius: 10,
                    fontWeight: 700, fontSize: 15,
                    cursor: "pointer", letterSpacing: "0.2px",
                    transition: "background 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#153d24")}
                  onMouseLeave={(e) => (e.target.style.background = "#1a472a")}
                >
                  Crear compte
                </button>
              </>
            )}

            {authError && (
              <div style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                color: "#dc2626",
                fontSize: 13,
                textAlign: "center",
              }}>
                {authError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
