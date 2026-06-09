import { useEffect, useState } from "react";

export default function VerifyEmailScreen({ token, api, onDone }) {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verificant el teu correu...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Enllac de verificacio invalid.");
      return;
    }

    api.verifyEmail(token)
      .then((data) => {
        setStatus("ok");
        setMessage(data.message || "Correu verificat correctament. Ja pots iniciar sessio.");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e.message || "No s'ha pogut verificar el correu.");
      });
  }, [api, token]);

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-glow" />

          <div className="auth-logo auth-logo-large">
            <img src="/Escut_de_Torrelameu.svg" alt="Escut de Torrelameu" />
          </div>

          <div>
            <h1>Pista de Padel</h1>
            <p>Torrelameu</p>
          </div>

          <div className="auth-brand-text">
            Confirmem el teu correu per activar el compte.
          </div>
        </div>

        <div className="auth-content">
          <div className="auth-logo auth-logo-small">
            <img src="/Escut_de_Torrelameu.svg" alt="Escut de Torrelameu" />
          </div>

          <div className="auth-heading">
            <h2>
              {status === "loading"
                ? "Verificant correu"
                : status === "ok"
                  ? "Correu verificat"
                  : "Verificacio no valida"}
            </h2>
            <p>{message}</p>
          </div>

          {status !== "loading" && (
            <button className="auth-primary" type="button" onClick={onDone}>
              Tornar a l'inici de sessio
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
