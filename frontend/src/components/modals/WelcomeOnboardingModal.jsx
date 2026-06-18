import { useMemo, useState } from "react";

const PALETTE = [
  "#1a2e1a", "#1e3a5f", "#6b21a8", "#9a3412",
  "#0f4c81", "#065f46", "#7c2d12", "#374151",
];

const MANOS = [
  { value: "diestro", label: "Dretà" },
  { value: "zurdo", label: "Esquerrà" },
];

const LADOS = [
  { value: "derecha", label: "Dreta" },
  { value: "reves", label: "Revés" },
  { value: "ambos", label: "Qualsevol" },
];

function initials(name) {
  return (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function IconCalendar({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 14h2M12 14h2M16 14h1M8 17h2M12 17h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M18 10a3 3 0 1 0-2-5.2M20 19c0-1.8-1-3.2-2.6-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSpark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconUser({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M5 20c0-3 2.7-5 7-5s7 2 7 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4h3l1.5 4-2 1.2c.9 1.9 2.4 3.4 4.3 4.3l1.2-2 4 1.5v3c0 1.1-.9 2-2 2C10.4 18 6 13.6 6 7c0-1.1.9-3 1-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHand({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11M10 11V5.5a1.5 1.5 0 0 1 3 0V11M13 11V7a1.5 1.5 0 0 1 3 0v6M16 13v-2a1.5 1.5 0 0 1 3 0v3c0 4-2.8 7-7 7h-1c-2.4 0-4.2-1.2-5.2-3.2L4 14.5A1.7 1.7 0 0 1 6.8 13l1.7 1.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCourt({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M5 12h14M12 3v18M5 8h14M5 16h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconArrowRight({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WelcomeIcon({ children, color, softColor }) {
  return (
    <div style={{
      width: 42,
      height: 42,
      borderRadius: 12,
      background: softColor,
      color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, softColor, C }) {
  return (
    <div style={{
      background: C.surfaceAlt,
      border: "1px solid " + C.border,
      borderRadius: 12,
      padding: 14,
      minHeight: 126,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <WelcomeIcon color={color} softColor={softColor}>{icon}</WelcomeIcon>
      <div>
        <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{title}</div>
        <div style={{ color: C.secondary, fontSize: 12, marginTop: 5, lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}

function StepRow({ icon, title, desc, color, softColor, C }) {
  return (
    <div style={{
      display: "flex",
      gap: 13,
      alignItems: "flex-start",
      padding: 13,
      borderRadius: 12,
      border: "1px solid " + C.border,
      background: C.surfaceAlt,
    }}>
      <WelcomeIcon color={color} softColor={softColor}>{icon}</WelcomeIcon>
      <div>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{title}</div>
        <div style={{ color: C.secondary, fontSize: 12, marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}

export default function WelcomeOnboardingModal({ session, t, onFinish, onSkip }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    telefono: session?.telefono || "",
    mano: session?.mano || "",
    lado: session?.lado || "",
    avatar_color: session?.avatar_color || "#1a2e1a",
  });

  const C = {
    surface: t?.surface || "#fff",
    surfaceAlt: t?.surfaceAlt || "#f9fafb",
    border: t?.border || "#e5e7eb",
    text: t?.text || "#111827",
    muted: t?.textMuted || "#9ca3af",
    secondary: t?.textSecondary || "#6b7280",
    primary: t?.primary || "#1a2e1a",
    inputBg: t?.inputBg || "#fff",
    inputBorder: t?.inputBorder || "#d1d5db",
  };

  const steps = useMemo(() => [
    { label: "Benvinguda", icon: <IconSpark size={15} /> },
    { label: "Ús ràpid", icon: <IconCalendar size={15} /> },
    { label: "Perfil", icon: <IconUser size={15} /> },
  ], []);

  const softPrimary = "rgba(26, 46, 26, 0.09)";
  const softBlue = "rgba(30, 58, 95, 0.1)";
  const softAmber = "rgba(154, 52, 18, 0.1)";

  const btn = {
    border: "none",
    borderRadius: 10,
    padding: "10px 15px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    minHeight: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    lineHeight: 1,
  };

  const ghostBtn = {
    ...btn,
    background: C.surfaceAlt,
    color: C.secondary,
    border: "1px solid " + C.border,
  };

  const primaryBtn = {
    ...btn,
    background: C.primary,
    color: "#fff",
    boxShadow: "0 10px 22px rgba(26,46,26,.18)",
  };

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function finish(skip) {
    setSaving(true);
    const payload = skip ? {} : form;
    Promise.resolve(skip ? onSkip(payload) : onFinish(payload))
      .finally(() => setSaving(false));
  }

  function segmentStyle(selected) {
    return {
      ...ghostBtn,
      background: selected ? C.primary : C.surface,
      color: selected ? "#fff" : C.text,
      border: "1px solid " + (selected ? C.primary : C.border),
      boxShadow: selected ? "0 8px 18px rgba(26,46,26,.14)" : "none",
    };
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 80,
      background: "rgba(17, 24, 39, 0.52)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 690,
        maxHeight: "92vh",
        overflow: "auto",
        background: C.surface,
        border: "1px solid " + C.border,
        borderRadius: 18,
        boxShadow: "0 22px 60px rgba(0,0,0,.24)",
      }}>
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid " + C.border }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 9px",
                borderRadius: 999,
                background: softPrimary,
                color: C.primary,
                fontSize: 11,
                fontWeight: 700,
                marginBottom: 10,
              }}>
                <IconSpark size={14} />
                Primer accés
              </div>
              <h2 style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 800, letterSpacing: 0 }}>
                Benvingut a Pàdel Torrelameu
              </h2>
              <p style={{ margin: "6px 0 0", color: C.secondary, fontSize: 13, lineHeight: 1.45 }}>
                Et deixem el compte a punt i el perfil preparat per reservar amb comoditat.
              </p>
            </div>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: form.avatar_color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
              boxShadow: "0 10px 24px rgba(0,0,0,.18)",
              border: "4px solid " + C.surface,
              outline: "1px solid " + C.border,
            }}>
              {initials(session?.nombre)}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 18 }}>
            {steps.map((item, i) => {
              const active = i === step;
              const done = i < step;
              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                    borderRadius: 10,
                    padding: "8px 9px",
                    border: "1px solid " + (active ? C.primary : C.border),
                    background: active ? softPrimary : C.surfaceAlt,
                    color: active || done ? C.primary : C.muted,
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    background: active || done ? C.primary : C.surface,
                    color: active || done ? "#fff" : C.muted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {done ? <IconCheck size={13} /> : item.icon}
                  </div>
                  <div style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    fontWeight: 700,
                  }}>
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "22px 26px 24px" }}>
          {step === 0 && (
            <div>
              <h3 style={{ margin: "0 0 8px", color: C.text, fontSize: 16, fontWeight: 700 }}>
                Hola, {session?.nombre || "jugador"}
              </h3>
              <p style={{ margin: "0 0 16px", color: C.secondary, fontSize: 14, lineHeight: 1.55 }}>
                Des d'aquí podràs reservar pista, crear partits oberts, unir-te a partides d'altres jugadors i gestionar els teus amics.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 10 }}>
                <FeatureCard
                  C={C}
                  color={C.primary}
                  softColor={softPrimary}
                  icon={<IconCalendar />}
                  title="Calendari"
                  desc="Tria dia, pista i franja horària disponible en pocs passos."
                />
                <FeatureCard
                  C={C}
                  color="#1e3a5f"
                  softColor={softBlue}
                  icon={<IconUsers />}
                  title="Partits oberts"
                  desc="Crea una partida i deixa places obertes per completar el grup."
                />
                <FeatureCard
                  C={C}
                  color="#9a3412"
                  softColor={softAmber}
                  icon={<IconSpark />}
                  title="Amics"
                  desc="Guarda contactes per convidar-los ràpidament quan reservis."
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={{ margin: "0 0 8px", color: C.text, fontSize: 16, fontWeight: 700 }}>
                Com funciona
              </h3>
              <p style={{ margin: "0 0 16px", color: C.secondary, fontSize: 14, lineHeight: 1.55 }}>
                El flux està pensat per reservar ràpid i organitzar partits sense haver de fer-ho tot per missatges.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <StepRow
                  C={C}
                  color={C.primary}
                  softColor={softPrimary}
                  icon={<IconCalendar />}
                  title="Reserva privada"
                  desc="Escull una franja lliure i confirma la teva reserva al calendari."
                />
                <StepRow
                  C={C}
                  color="#1e3a5f"
                  softColor={softBlue}
                  icon={<IconUsers />}
                  title="Partit obert"
                  desc="Si falten jugadors, obre la partida perquè altres puguin demanar unir-s'hi."
                />
                <StepRow
                  C={C}
                  color="#9a3412"
                  softColor={softAmber}
                  icon={<IconCheck />}
                  title="Sol·licituds"
                  desc="L'organitzador decideix qui entra i manté la partida ordenada."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ margin: "0 0 8px", color: C.text, fontSize: 16, fontWeight: 700 }}>
                Personalitza el teu perfil
              </h3>
              <p style={{ margin: "0 0 16px", color: C.secondary, fontSize: 14, lineHeight: 1.55 }}>
                És opcional, però ajuda a muntar partits més equilibrats i fàcils de coordinar.
              </p>

              <div style={{ display: "grid", gap: 14 }}>
                <label style={{
                  display: "grid",
                  gap: 7,
                  padding: 13,
                  borderRadius: 12,
                  border: "1px solid " + C.border,
                  background: C.surfaceAlt,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: 0 }}>
                    <IconPhone size={16} />
                    Telèfon
                  </span>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => update("telefono", e.target.value)}
                    placeholder="+34 600 000 000"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 12px",
                      border: "1px solid " + C.inputBorder,
                      borderRadius: 10,
                      background: C.inputBg,
                      color: C.text,
                      outline: "none",
                      fontSize: 14,
                    }}
                  />
                </label>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}>
                  <div style={{ padding: 13, borderRadius: 12, border: "1px solid " + C.border, background: C.surfaceAlt }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: 0, marginBottom: 9 }}>
                      <IconHand size={16} />
                      Mà preferida
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {MANOS.map((m) => {
                        const selected = form.mano === m.value;
                        return (
                          <button key={m.value} type="button" onClick={() => update("mano", selected ? "" : m.value)} style={segmentStyle(selected)}>
                            {selected && <IconCheck size={14} />}
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ padding: 13, borderRadius: 12, border: "1px solid " + C.border, background: C.surfaceAlt }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: 0, marginBottom: 9 }}>
                      <IconCourt size={16} />
                      Posició a la pista
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {LADOS.map((l) => {
                        const selected = form.lado === l.value;
                        return (
                          <button key={l.value} type="button" onClick={() => update("lado", selected ? "" : l.value)} style={segmentStyle(selected)}>
                            {selected && <IconCheck size={14} />}
                            {l.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {!session?.avatar && (
                  <div style={{ padding: 13, borderRadius: 12, border: "1px solid " + C.border, background: C.surfaceAlt }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: 0 }}>
                        Color de l'avatar
                      </div>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: form.avatar_color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 }}>
                        {initials(session?.nombre)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => update("avatar_color", color)}
                          title={color}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: color,
                            border: form.avatar_color === color ? "3px solid " + C.text : "3px solid " + C.surface,
                            outline: "1px solid " + C.border,
                            cursor: "pointer",
                            boxShadow: form.avatar_color === color ? "0 8px 16px rgba(0,0,0,.16)" : "none",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: "16px 26px 22px",
          borderTop: "1px solid " + C.border,
          display: "flex",
          gap: 10,
          justifyContent: "space-between",
          flexWrap: "wrap",
          background: C.surface,
        }}>
          <button type="button" onClick={() => finish(true)} disabled={saving} style={{ ...ghostBtn, opacity: saving ? 0.6 : 1 }}>
            Ometre per ara
          </button>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} disabled={saving} style={ghostBtn}>
                Enrere
              </button>
            )}
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => setStep((s) => s + 1)} style={primaryBtn}>
                Següent
                <IconArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={() => finish(false)} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Desant..." : "Començar"}
                {!saving && <IconCheck size={15} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
