import { useState } from "react";
import PasswordStrength from "./PasswordStrength";

function IconLock() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

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

export default function ResetPasswordScreen({ token, api, onDone }) {
    const [password, setPassword] = useState("");
    const [repetir, setRepetir] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const [error, setError] = useState("");
    const [ok, setOk] = useState(false);

    const enviar = () => {
        setError("");

        if (password.length < 6) {
            setError("La contrasenya ha de tenir com a mínim 6 caràcters");
            return;
        }

        if (password !== repetir) {
            setError("Les contrasenyes no coincideixen");
            return;
        }

        api.resetPassword(token, password)
            .then(() => {
                setOk(true);
            })
            .catch((e) => {
                setError(e.message);
            });
    };

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
                        Crea una contrasenya nova per tornar a accedir.
                    </div>
                </div>

                <div className="auth-content">
                    <div className="auth-logo auth-logo-small">
                        <img src="/Escut_de_Torrelameu.svg" alt="Escut de Torrelameu" />
                    </div>

                    <div className="auth-heading">
                        <h2>{ok ? "Contrasenya actualitzada" : "Nova contrasenya"}</h2>
                        <p>
                            {ok
                                ? "Ja pots iniciar sessió amb la teva nova contrasenya."
                                : "Introdueix una contrasenya nova i segura."}
                        </p>
                    </div>

                    {ok ? (
                        <button className="auth-primary" type="button" onClick={onDone}>
                            Tornar a l'inici de sessió
                        </button>
                    ) : (
                        <div className="auth-form-section">
                            <div className="auth-field">
                                <span>
                                    <IconLock />
                                </span>

                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Nova contrasenya"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    {showPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </div>

                            <PasswordStrength password={password} />

                            <div className="auth-field">
                                <span>
                                    <IconLock />
                                </span>

                                <input
                                    type={showRepeatPassword ? "text" : "password"}
                                    placeholder="Repeteix la contrasenya"
                                    value={repetir}
                                    onChange={(e) => setRepetir(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && enviar()}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="auth-eye-btn"
                                    onClick={() => setShowRepeatPassword((v) => !v)}
                                >
                                    {showRepeatPassword ? <IconEyeOff /> : <IconEye />}
                                </button>
                            </div>

                            {error && <div className="auth-error">{error}</div>}

                            <button className="auth-primary" type="button" onClick={enviar}>
                                Canviar contrasenya
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}