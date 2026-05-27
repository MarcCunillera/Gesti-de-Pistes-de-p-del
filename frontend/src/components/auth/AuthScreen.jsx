import { useState } from "react";
import PasswordStrength from "./PasswordStrength";

/* ── Icons ──────────────────────────────────────────────── */
const IconEmail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/* ── Design tokens ──────────────────────────────────────── */
const tokens = {
  green900: "#0d2d1f",
  green800: "#0f3d2a",
  green700: "#1a472a",
  green600: "#1e5c35",
  green500: "#2d7a4a",
  greenLight: "#f0fdf4",
  greenBorder: "#bbf7d0",
  white: "#ffffff",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray400: "#94a3b8",
  gray500: "#6b7280",
  gray900: "#0f172a",
  red50: "#fef2f2",
  red200: "#fecaca",
  red600: "#dc2626",
};

/* ── Shared styles ──────────────────────────────────────── */
const inputStyle = {
  width: "100%",
  padding: "10px 12px 10px 38px",
  fontSize: 14,
  fontFamily: "inherit",
  color: tokens.gray900,
  background: tokens.white,
  border: `1px solid ${tokens.gray200}`,
  borderRadius: 8,
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

const primaryBtnStyle = {
  display: "block",
  width: "100%",
  padding: "11px",
  background: tokens.green700,
  color: tokens.white,
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  fontFamily: "inherit",
  cursor: "pointer",
  letterSpacing: "0.2px",
  transition: "background 0.15s",
  marginTop: 4,
};

/* ── InputField ─────────────────────────────────────────── */
function InputField({ icon, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <span style={{
        position: "absolute", left: 12, top: "50%",
        transform: "translateY(-50%)",
        color: focused ? tokens.green600 : tokens.gray400,
        pointerEvents: "none",
        display: "flex", alignItems: "center",
        transition: "color 0.15s",
      }}>
        {icon}
      </span>
      <input
        style={{
          ...inputStyle,
          borderColor: focused ? tokens.green600 : tokens.gray200,
          boxShadow: focused ? `0 0 0 3px rgba(26,71,42,0.08)` : "none",
          ...style,
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        {...props}
      />
    </div>
  );
}

/* ── PrimaryButton ──────────────────────────────────────── */
function PrimaryButton({ children, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      style={{ ...primaryBtnStyle, background: hovered ? tokens.green800 : tokens.green700 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

/* ── LeftPanel ──────────────────────────────────────────── */
function LeftPanel() {
  return (
    <div style={{
      flex: "0 0 46%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      minHeight: "100vh",
      background: `linear-gradient(145deg, ${tokens.green800} 0%, ${tokens.green600} 55%, ${tokens.green900} 100%)`,
      padding: "44px 40px",
      gap: 16,
    }}>
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -120, left: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
      <div style={{ position: "absolute", bottom: -100, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

      {/* Logo */}
      <div style={{
        position: "relative", zIndex: 1,
        width: 80, height: 80,
        background: tokens.white,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        <img
          src="/Escut_de_Torrelameu.svg"
          alt="Escut de Torrelameu"
          style={{ width: 54, height: 54, objectFit: "contain" }}
        />
      </div>

      {/* Brand text */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ color: tokens.white, fontWeight: 600, fontSize: 17, lineHeight: 1.2 }}>
          Pistes de Pàdel
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>
          Torrelameu
        </div>
      </div>
    </div>
  );
}

/* ── TabBar ─────────────────────────────────────────────── */
function TabBar({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: "flex",
      background: tokens.gray100,
      borderRadius: 10, padding: 3,
      marginBottom: 24, gap: 3,
    }}>
      {[["login", "Entrar"], ["registro", "Registrar-se"]].map(([tab, label]) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            flex: 1, padding: "8px 0",
            border: "none", borderRadius: 8,
            background: activeTab === tab ? tokens.white : "transparent",
            color: activeTab === tab ? tokens.green700 : tokens.gray500,
            fontWeight: activeTab === tab ? 600 : 400,
            fontSize: 13.5,
            fontFamily: "inherit",
            cursor: "pointer",
            boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.09)" : "none",
            transition: "all 0.15s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ── ErrorBanner ────────────────────────────────────────── */
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      marginTop: 12,
      padding: "10px 14px",
      background: tokens.red50,
      border: `1px solid ${tokens.red200}`,
      borderRadius: 8,
      color: tokens.red600,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 1.4,
    }}>
      {message}
    </div>
  );
}

/* ── LoginForm ──────────────────────────────────────────── */
function LoginForm({ form, setForm, onSubmit }) {
  return (
    <>
      <InputField
        icon={<IconEmail />}
        type="email"
        placeholder="Correu electrònic"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        autoComplete="email"
      />
      <InputField
        icon={<IconLock />}
        type="password"
        placeholder="Contrasenya"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        autoComplete="current-password"
      />
      <PrimaryButton onClick={onSubmit}>Entrar</PrimaryButton>
    </>
  );
}

/* ── RegisterForm ───────────────────────────────────────── */
function RegisterForm({ form, setForm, onSubmit }) {
  const [showPwdReqs, setShowPwdReqs] = useState(false);
  return (
    <>
      <InputField
        icon={<IconUser />}
        type="text"
        placeholder="Nom complet"
        value={form.nombre}
        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
        autoComplete="name"
      />
      <InputField
        icon={<IconEmail />}
        type="email"
        placeholder="Correu electrònic"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        autoComplete="email"
      />
      <InputField
        icon={<IconLock />}
        type="password"
        placeholder="Contrasenya"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        onFocus={() => setShowPwdReqs(true)}
        autoComplete="new-password"
      />
      {showPwdReqs && <PasswordStrength password={form.password} />}
      <PrimaryButton onClick={onSubmit}>Crear compte</PrimaryButton>
    </>
  );
}

/* ── RightPanel ─────────────────────────────────────────── */
function RightPanel({ authTab, setAuthTab, loginForm, setLoginForm, regForm, setRegForm, authError, login, registro }) {
  const isLogin = authTab === "login";

  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: tokens.gray50,
      padding: "48px 40px",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Mobile logo */}
        <div className="auth-mobile-logo" style={{
          width: 56, height: 56,
          background: tokens.greenLight,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          border: `2px solid ${tokens.greenBorder}`,
        }}>
          <img src="/Escut_de_Torrelameu.svg" alt="Escut" style={{ width: 38, height: 38, objectFit: "contain" }} />
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 5px", fontSize: 21, fontWeight: 700, color: tokens.gray900, letterSpacing: "-0.3px" }}>
            {isLogin ? "Benvingut/a de nou" : "Crea el teu compte"}
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: tokens.gray500 }}>
            {isLogin ? "Entra per gestionar les teves reserves" : "Registra't per reservar pistes"}
          </p>
        </div>

        <TabBar activeTab={authTab} onTabChange={(tab) => setAuthTab(tab)} />

        <div key={authTab} className="auth-form-section">
          {isLogin ? (
            <LoginForm form={loginForm} setForm={setLoginForm} onSubmit={login} />
          ) : (
            <RegisterForm form={regForm} setForm={setRegForm} onSubmit={registro} />
          )}
          <ErrorBanner message={authError} />
        </div>
      </div>
    </div>
  );
}

/* ── AuthScreen (root) ──────────────────────────────────── */
export default function AuthScreen({
  authTab, setAuthTab,
  loginForm, setLoginForm,
  regForm, setRegForm,
  authError, login, registro,
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <LeftPanel />
      <RightPanel
        authTab={authTab}
        setAuthTab={setAuthTab}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        regForm={regForm}
        setRegForm={setRegForm}
        authError={authError}
        login={login}
        registro={registro}
      />
    </div>
  );
}