import { useEffect, useRef, useState } from "react";
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

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.8 21.8 0 015.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.8 21.8 0 01-2.16 3.19" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function InputField({ icon, ...props }) {
  const [focus, setFocus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = props.type === "password";

  return (
    <div className={`auth-field ${focus ? "is-focus" : ""}`}>
      <span>{icon}</span>

      <input
        {...props}
        type={
          isPassword
            ? (showPassword ? "text" : "password")
            : props.type
        }
        onFocus={(e) => {
          setFocus(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          props.onBlur?.(e);
        }}
      />

      {isPassword && (
        <button
          type="button"
          className="auth-eye-btn"
          onClick={() => setShowPassword((v) => !v)}
        >
          {showPassword ? <IconEyeOff /> : <IconEye />}
        </button>
      )}
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return <div className="auth-error">{message}</div>;
}

function SuccessBanner({ message }) {
  if (!message) return null;
  return <div className="auth-success">{message}</div>;
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

  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    const updateWidth = () => {
      const nextWidth = Math.max(
        220,
        Math.min(360, Math.floor(containerRef.current?.offsetWidth || 320))
      );
      setButtonWidth(nextWidth);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <>
      <div className="auth-separator">
        <span>o continua amb</span>
      </div>

      <div className="auth-google" ref={containerRef}>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (credentialResponse.credential) {
              loginGoogle(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error("Error iniciando sesión con Google");
          }}
          theme="outline"
          size="large"
          text="signin_with"
          shape="pill"
          width={buttonWidth}
        />
      </div>
    </>
  );
}

function LoginForm({ form, setForm, onSubmit, loginGoogle, setAuthTab }) {
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

      <button
        type="button"
        className="auth-link-button"
        onClick={() => setAuthTab("forgot")}
      >
        Has oblidat la contrasenya?
      </button>

      <GoogleLoginBlock loginGoogle={loginGoogle} />
    </>
  );
}

function RegisterForm({ form, setForm, onSubmit, loginGoogle }) {
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
      <GoogleLoginBlock loginGoogle={loginGoogle} />
    </>
  );
}

function EmailSentScreen({ email, message, setAuthTab }) {
  return (
    <div className="auth-sent">
      <div className="auth-sent-icon">
        <IconEmail />
      </div>

      <div className="auth-sent-copy">
        <p>{message || "Compte creat. Revisa el teu correu per activar-lo abans d'iniciar sessió."}</p>
        {email && <div className="auth-sent-email">{email}</div>}
        <span>L'enllaç caduca en 24 hores.</span>
      </div>

      <div className="auth-sent-actions">
        <button
          type="button"
          className="auth-primary"
          onClick={() => setAuthTab("login")}
        >
          Anar a l'inici de sessió
        </button>

        <button
          type="button"
          className="auth-link-button"
          onClick={() => setAuthTab("verify")}
        >
          No he rebut el correu
        </button>
      </div>
    </div>
  );
}

function ResendVerificationForm({ api, setAuthTab }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const enviar = () => {
    setMsg("");
    setError("");

    api.resendVerification(email)
      .then((data) => {
        setMsg(data.message || "Si el correu existeix, rebràs un correu de verificació.");
      })
      .catch((e) => {
        setError(e.message);
      });
  };

  return (
    <>
      <InputField
        icon={<IconEmail />}
        type="email"
        placeholder="Correu electrònic"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && enviar()}
        autoComplete="email"
      />

      {msg && <div className="auth-success">{msg}</div>}
      {error && <div className="auth-error">{error}</div>}

      <button className="auth-primary" type="button" onClick={enviar}>
        Reenviar correu de verificació
      </button>

      <button
        type="button"
        className="auth-link-button"
        onClick={() => setAuthTab("login")}
      >
        Tornar a l'inici de sessió
      </button>
    </>
  );
}

function ForgotPasswordForm({ api, setAuthTab }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const enviar = () => {
    setMsg("");
    setError("");

    api.forgotPassword(email)
      .then((data) => {
        setMsg(data.message || "Si el correu existeix, rebràs un correu.");
      })
      .catch((e) => {
        setError(e.message);
      });
  };

  return (
    <>
      <InputField
        icon={<IconEmail />}
        type="email"
        placeholder="Correu electrònic"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && enviar()}
        autoComplete="email"
      />

      {msg && <div className="auth-success">{msg}</div>}
      {error && <div className="auth-error">{error}</div>}

      <button className="auth-primary" type="button" onClick={enviar}>
        Enviar correu de recuperació
      </button>

      <button
        type="button"
        className="auth-link-button"
        onClick={() => setAuthTab("login")}
      >
        Tornar a l'inici de sessió
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
  authSuccess,
  login,
  registro,
  loginGoogle,
  api,
}) {
  const isLogin = authTab === "login";
  const isForgot = authTab === "forgot";
  const isVerifyPending = authTab === "verify";
  const isRegistered = authTab === "registered";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-glow" />

          <div className="auth-logo auth-logo-large">
            <img src="/Escut_de_Torrelameu.svg" alt="Escut de Torrelameu" />
          </div>

          <div>
            <h1>Pista de Pàdel</h1>
            <p>Torrelameu</p>
          </div>

          <div className="auth-brand-text">
            Gestiona les reserves de la pista municipal de manera ràpida i senzilla.
          </div>
        </div>

        <div className="auth-content">
          <div className="auth-logo auth-logo-small">
            <img src="/Escut_de_Torrelameu.svg" alt="Escut de Torrelameu" />
          </div>

          <div className="auth-heading">
            <h2>
              {isForgot
                ? "Recuperar contrasenya"
                : isVerifyPending
                  ? "Verificar correu"
                  : isRegistered
                    ? "Revisa el teu correu"
                    : isLogin
                      ? "Benvingut/da"
                      : "Crea el teu compte"}
            </h2>

            <p>
              {isForgot
                ? "Introdueix el teu correu electrònic per rebre un enllaç de recuperació."
                : isVerifyPending
                  ? "Introdueix el teu correu electrònic per rebre un altre enllaç de verificació."
                  : isRegistered
                    ? "T'hem enviat un enllaç per activar el teu compte."
                    : isLogin
                      ? "Accedeix per consultar i gestionar les teves reserves."
                      : "Registra't per començar a reservar la pista."}
            </p>
          </div>

          {!isForgot && !isVerifyPending && !isRegistered && (
            <TabBar
              activeTab={authTab}
              onTabChange={setAuthTab}
            />
          )}

          <div className="auth-form-section">
            {isRegistered ? (
              <EmailSentScreen
                email={loginForm.email}
                message={authSuccess}
                setAuthTab={setAuthTab}
              />
            ) : isVerifyPending ? (
              <ResendVerificationForm
                api={api}
                setAuthTab={setAuthTab}
              />
            ) : isForgot ? (
              <ForgotPasswordForm
                api={api}
                setAuthTab={setAuthTab}
              />
            ) : isLogin ? (
              <LoginForm
                form={loginForm}
                setForm={setLoginForm}
                onSubmit={login}
                loginGoogle={loginGoogle}
                setAuthTab={setAuthTab}
              />
            ) : (
              <RegisterForm
                form={regForm}
                setForm={setRegForm}
                onSubmit={registro}
                loginGoogle={loginGoogle}
              />
            )}

            {!isRegistered && <SuccessBanner message={authSuccess} />}
            <ErrorBanner message={authError} />
          </div>
        </div>
      </section>
    </main>
  );
}
