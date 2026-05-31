import { useState } from "react";
import PasswordStrength from "./PasswordStrength";
import { GoogleLogin } from "@react-oauth/google";

const IconEmail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16v16H4z" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function InputField({ icon, ...props }) {
  const [focus, setFocus] = useState(false);

  return (
    <div className={`auth-field ${focus ? "is-focus" : ""}`}>
      <span>{icon}</span>
      <input
        {...props}
        onFocus={(e) => {
          setFocus(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="auth-error">{message}</div>;
}

function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="auth-tabs">
      <button
        type="button"
        className={activeTab === "login" ? "active" : ""}
        onClick={() => onTabChange("login")}
      >
        Entrar
      </button>
      <button
        type="button"
        className={activeTab === "registro" ? "active" : ""}
        onClick={() => onTabChange("registro")}
      >
        Registrar-se
      </button>
    </div>
  );
}

function GoogleLoginBlock({ loginGoogle }) {
  if (!loginGoogle) return null;

  return (
    <>
      <div className="auth-separator">
        <span>o continua amb</span>
      </div>

      <div className="auth-google">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              loginGoogle(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error("Error iniciant sessió amb Google");
          }}
          theme="outline"
          size="large"
          text="signin_with"
          shape="pill"
          width="100%"
        />
      </div>
    </>
  );
}

function LoginForm({ form, setForm, onSubmit, loginGoogle }) {
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

      <button className="auth-primary" type="button" onClick={onSubmit}>
        Entrar
      </button>

      <GoogleLoginBlock loginGoogle={loginGoogle} />
    </>
  );
}

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
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        autoComplete="new-password"
      />

      {showPwdReqs && <PasswordStrength password={form.password} />}

      <button className="auth-primary" type="button" onClick={onSubmit}>
        Crear compte
      </button>
    </>
  );
}

export default function AuthScreen({
  authTab,
  setAuthTab,
  loginForm,
  setLoginForm,
  regForm,
  setRegForm,
  authError,
  login,
  registro,
  loginGoogle,
}) {
  const isLogin = authTab === "login";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-glow" />
          <div className="auth-logo auth-logo-large">
            <img src="/Escut_de_Torrelameu.svg" alt="Escut de Torrelameu" />
          </div>

          <div>
            <h1>Pistes de Pàdel</h1>
            <p>Torrelameu</p>
          </div>

          <div className="auth-brand-text">
            Gestiona les reserves de la pista municipal de forma ràpida i senzilla.
          </div>
        </div>

        <div className="auth-content">
          <div className="auth-logo auth-logo-small">
            <img src="/Escut_de_Torrelameu.svg" alt="Escut de Torrelameu" />
          </div>

          <div className="auth-heading">
            <h2>{isLogin ? "Benvingut/da" : "Crea el teu compte"}</h2>
            <p>
              {isLogin
                ? "Accedeix per consultar i gestionar les teves reserves."
                : "Registra’t per començar a reservar la pista."}
            </p>
          </div>

          <TabBar activeTab={authTab} onTabChange={setAuthTab} />

          <div className="auth-form-section">
            {isLogin ? (
              <LoginForm
                form={loginForm}
                setForm={setLoginForm}
                onSubmit={login}
                loginGoogle={loginGoogle}
              />
            ) : (
              <RegisterForm
                form={regForm}
                setForm={setRegForm}
                onSubmit={registro}
              />
            )}

            <ErrorBanner message={authError} />
          </div>
        </div>
      </section>
    </main>
  );
}