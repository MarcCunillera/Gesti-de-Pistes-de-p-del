import { useState } from "react";
import { inputStyle, btnPrimary } from "../../styles/styles";
import PasswordStrength from "./PasswordStrength";

export default function AuthScreen({ authTab, setAuthTab, loginForm, setLoginForm, regForm, setRegForm, authError, login, registro }) {
  const [showPwdReqs, setShowPwdReqs] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1a472a,#2d6a4f)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 340, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, background: "#1a472a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#fff", fontSize: 26, fontWeight: 700 }}>P</div>
          <h2 style={{ margin: "0 0 4px", color: "#1a472a" }}>Pista de Padel</h2>
          <p style={{ color: "#666", fontSize: 13, margin: 0 }}>Gestion de reservas del pueblo</p>
        </div>
        <div style={{ display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0e0" }}>
          {["login", "registro"].map((t) => (
            <button
              key={t}
              onClick={() => { setAuthTab(t); setShowPwdReqs(false); }}
              style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer", background: authTab === t ? "#1a472a" : "#f5f5f5", color: authTab === t ? "#fff" : "#333", fontWeight: authTab === t ? 700 : 400, fontSize: 14 }}
            >
              {t === "login" ? "Entrar" : "Registrarse"}
            </button>
          ))}
        </div>
        {authTab === "login" ? (
          <>
            <input placeholder="Email" value={loginForm.email} onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <input placeholder="Contraseña" type="password" value={loginForm.password} onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))} style={inputStyle} onKeyDown={(e) => e.key === "Enter" && login()} />
            <button onClick={login} style={btnPrimary}>Entrar</button>
            <p style={{ fontSize: 11, color: "#999", textAlign: "center", marginTop: 12 }}>Admin: admin@padel.com / Admin123 · Usuario: marc@padel.com / Padel1</p>
          </>
        ) : (
          <>
            <input placeholder="Nombre completo" value={regForm.nombre} onChange={(e) => setRegForm((f) => ({ ...f, nombre: e.target.value }))} style={inputStyle} />
            <input placeholder="Email" value={regForm.email} onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
            <input
              placeholder="Contraseña"
              type="password"
              value={regForm.password}
              onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
              onFocus={() => setShowPwdReqs(true)}
              style={inputStyle}
            />
            {showPwdReqs && <PasswordStrength password={regForm.password} />}
            <button onClick={registro} style={btnPrimary}>Registrarse</button>
          </>
        )}
        {authError && <p style={{ color: "#c0392b", fontSize: 13, textAlign: "center", marginTop: 8 }}>{authError}</p>}
      </div>
    </div>
  );
}
