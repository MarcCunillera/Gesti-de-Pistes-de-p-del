import { useState, useRef } from "react";
import { colorAvatar, iniciales } from "../../utils/helpers";
import PasswordStrength from "../auth/PasswordStrength";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const AVATAR_BACKEND = API_BASE.startsWith("http")
  ? API_BASE.replace(/\/api\/?$/, "")
  : "";

const PALETTE = [
  "#1a2e1a", "#1e3a5f", "#6b21a8", "#9a3412",
  "#0f4c81", "#065f46", "#7c2d12", "#374151",
];

const LADOS = [
  { value: "derecha", label: "Dreta"},
  { value: "reves", label: "Revés"},
  { value: "ambos", label: "Ambdós"},
];

const MANOS = [
  { value: "diestro", label: "Dretà" },
  { value: "zurdo",   label: "Esquerrà"   },
];

function IconHand() {
  return <span style={{ fontSize: 15, lineHeight: 1 }}>👋</span>;
}

function IconMapPin() {
  return <span style={{ fontSize: 15, lineHeight: 1 }}>📍</span>;
}

function IconFriends({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function Btn({ onClick, variant, children, style, theme, dark }) {
  const [hover, setHover] = useState(false);
  const variants = {
    primary: { bg: dark ? theme.primary : "#1a2e1a", color: dark ? "#0f172a" : "#fff", border: dark ? theme.primary : "#1a2e1a" },
    default: { bg: dark ? theme.surfaceAlt : "#f9fafb", color: dark ? theme.text : "#374151", border: dark ? theme.border : "#e5e7eb" },
    danger:  { bg: dark ? "rgba(239,68,68,.12)" : "#fff", color: dark ? "#fca5a5" : "#dc2626", border: dark ? "rgba(248,113,113,.32)" : "#fecaca" },
  };
  const s = variants[variant || "default"];
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", background: s.bg,
        color: s.color, border: "1px solid " + s.border, borderRadius: 7,
        padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13,
        opacity: hover ? 0.75 : 1, transition: "opacity 0.12s", ...style,
      }}
    >
      {children}
    </button>
  );
}

function AvatarDisplay({ session, size }) {
  const [imgError, setImgError] = useState(false);
  var sz = size || 88;
  var src = null;
  if (session.avatar && !imgError) {
    if (session.avatar.startsWith("http://") || session.avatar.startsWith("https://")) {
      src = session.avatar;
    } else {
      src = AVATAR_BACKEND + session.avatar;
    }
  }
  var bg = session.avatar_color || colorAvatar(session.id);
  if (src) {
    return (
      <img
        src={src} alt={session.nombre} referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{ width: sz, height: sz, borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: sz, height: sz, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: Math.round(sz * 0.32), fontWeight: 700, flexShrink: 0,
    }}>
      {iniciales(session.nombre)}
    </div>
  );
}

export default function Profile({
  session, misReservas, misPartidos, amics,
  perfilEdit, setPerfilEdit, guardarPerfil,
  pwdForm, setPwdForm, pwdError, cambiarPassword,
  subirAvatarFoto, eliminarAvatarFoto, t,
}) {
  var fileInputRef = useRef(null);
  var [avatarHover, setAvatarHover] = useState(false);
  var [copiedTel, setCopiedTel] = useState(false);

  function copiarTelefono() {
    if (!session.telefono) return;
    navigator.clipboard.writeText(session.telefono).then(() => {
      setCopiedTel(true);
      setTimeout(() => setCopiedTel(false), 1800);
    });
  }

  var C = {
    surface:    t?.surface      || "#fff",
    surfaceAlt: t?.surfaceAlt   || "#f9fafb",
    border:     t?.border       || "#e5e7eb",
    text:       t?.text         || "#111827",
    secondary:  t?.textSecondary|| "#6b7280",
    muted:      t?.textMuted    || "#9ca3af",
    inputBg:    t?.inputBg      || "#fff",
    inputBorder:t?.inputBorder  || "#d1d5db",
    primary:    t?.primary      || "#1a2e1a",
  };
  var dark = !["#fff", "#ffffff"].includes((C.surface || "").toLowerCase());

  var inputStyle = {
    width: "100%", padding: "11px 13px", border: "1px solid " + C.inputBorder,
    borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none",
    color: C.text, background: C.inputBg,
  };
  var labelStyle = {
    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5,
  };

  function segmentStyle(selected) {
    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: "9px 14px",
      minHeight: 38,
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      background: selected ? C.primary : C.surface,
      color: selected ? "#fff" : C.text,
      border: "1px solid " + (selected ? C.primary : C.border),
      boxShadow: selected ? "0 8px 18px rgba(26,46,26,.14)" : "none",
      transition: "all 0.15s ease",
    };
  }

  function sectionTitleStyle(iconColor) {
    return {
      ...labelStyle,
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
      color: iconColor || C.muted,
    };
  }

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (file) subirAvatarFoto(file);
    e.target.value = "";
  }

  function startEdit() {
    setPerfilEdit({
      nombre:       session.nombre,
      email:        session.email,
      telefono:     session.telefono || "",
      avatar_color: session.avatar_color || colorAvatar(session.id),
      lado:         session.lado || "",
      mano:         session.mano || "",
    });
  }

  // Estadísticas calculadas

  var ladoInfo  = LADOS.find(l => l.value === session.lado);
  var manoInfo  = MANOS.find(m => m.value === session.mano);
  var numAmics  = (amics || []).length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>
          El meu perfil
        </h2>
      </div>

      {/* ── Header card ─────────────────────────────────── */}
      <div style={{
        background: C.surface, borderRadius: 16,
        border: "1px solid " + C.border, boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        marginBottom: 16, overflow: "hidden",
      }}>
        <div style={{ padding: "24px 28px" }}>
          {/* Fila: avatar + info + botón */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div
                style={{ position: "relative", cursor: "pointer", borderRadius: "50%" }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Canviar foto de perfil"
              >
                <AvatarDisplay session={session} size={80} />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center",
                  justifyContent: "center", opacity: avatarHover ? 1 : 0, transition: "opacity 0.15s",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                      stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2" />
                  </svg>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
              {session.avatar && (
                <button onClick={eliminarAvatarFoto}
                  style={{ fontSize: 10, color: dark ? "#fca5a5" : "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                  Eliminar foto
                </button>
              )}
            </div>

            {/* Nom + email */}
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                <span style={{ fontWeight: 800, fontSize: 22, color: C.text, letterSpacing: -0.5 }}>{session.nombre}</span>
                {session.rol === "admin" && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: C.primary, color: dark ? "#0f172a" : "#fff", borderRadius: 4, padding: "2px 8px", letterSpacing: 0.8 }}>
                    ADMIN
                  </span>
                )}
              </div>
              <span style={{ fontSize: 13, color: C.muted }}>{session.email}</span>
              {session.telefono && (
                <div
                  onClick={copiarTelefono}
                  title="Copiar telèfon"
                  style={{ fontSize: 13, color: copiedTel ? (dark ? "#6ee7b7" : "#059669") : C.muted, marginTop: 4, cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s", width: "fit-content" }}
                >
                  {copiedTel ? "Copiat" : session.telefono}
                </div>
              )}
            </div>

            {perfilEdit === null && (
              <Btn onClick={startEdit} style={{ alignSelf: "flex-start", flexShrink: 0 }} theme={C} dark={dark}>Edita el perfil</Btn>
            )}
          </div>

          {/* Línea divisoria */}
          <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

          {/* Stats row */}
          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            {/* Reserves */}
            <div style={{ flex: "1 1 100px", textAlign: "center", padding: "8px 12px", borderRight: "1px solid " + C.border }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: dark ? "#86efac" : "#1a2e1a", lineHeight: 1 }}>{misReservas.length}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>Reserves</div>
            </div>
            {/* Partits */}
            <div style={{ flex: "1 1 100px", textAlign: "center", padding: "8px 12px", borderRight: "1px solid " + C.border }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: dark ? "#93c5fd" : "#2563eb", lineHeight: 1 }}>{misPartidos.length}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>Partits</div>
            </div>
            {/* Amics */}
            <div style={{ flex: "1 1 100px", textAlign: "center", padding: "8px 12px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: dark ? "#6ee7b7" : "#059669", lineHeight: 1, marginBottom: 2 }}>{numAmics}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>Amics</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Preferències del jugador ─────────────────────── */}
      {(manoInfo || ladoInfo) && (
        <div style={{
          background: C.surface, borderRadius: 16,
          border: "1px solid " + C.border, boxShadow: "0 1px 3px rgba(0,0,0,.04)",
          marginBottom: 16, overflow: "hidden",
        }}>
          <div style={{ padding: "18px 28px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 16 }}>Preferències del jugador</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {manoInfo && (
                <div style={{
                  flex: "1 1 140px", background: C.surfaceAlt, borderRadius: 12,
                  border: "1px solid " + C.border, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 28 }}>👋</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{manoInfo.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>Mà preferida</div>
                  </div>
                </div>
              )}
              {ladoInfo && (
                <div style={{
                  flex: "1 1 140px", background: C.surfaceAlt, borderRadius: 12,
                  border: "1px solid " + C.border, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 28 }}>📍</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{ladoInfo.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>Posició a la pista</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* ── Formulario edición ────────────────────────── */}
        {perfilEdit !== null && (
          <div style={{
            background: C.surface, borderRadius: 16, padding: 24,
            border: "1px solid " + C.border, boxShadow: "0 1px 3px rgba(0,0,0,.04)", flex: "1 1 300px",
          }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>Edita el perfil</div>
              <div style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5 }}>
                Actualitza les teves dades i preferències perquè el teu perfil quedi més complet.
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nom</label>
                <input value={perfilEdit.nombre}
                  onChange={e => setPerfilEdit(p => ({ ...p, nombre: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={perfilEdit.email}
                  onChange={e => setPerfilEdit(p => ({ ...p, email: e.target.value }))}
                  style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Telèfon</label>
                <input type="tel" value={perfilEdit.telefono}
                  onChange={e => setPerfilEdit(p => ({ ...p, telefono: e.target.value }))}
                  placeholder="+34 600 000 000"
                  style={inputStyle} />
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                paddingTop: 6,
                borderTop: "1px solid " + C.border,
              }}>
                <div>
                  <label style={sectionTitleStyle("#b08968")}>
                    <IconHand /> Mà preferida
                  </label>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {MANOS.map(m => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setPerfilEdit(p => ({ ...p, mano: p.mano === m.value ? "" : m.value }))}
                        style={segmentStyle(perfilEdit.mano === m.value)}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={sectionTitleStyle("#d9465f")}>
                    <IconMapPin /> Posició a la pista
                  </label>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {LADOS.map(l => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setPerfilEdit(p => ({ ...p, lado: p.lado === l.value ? "" : l.value }))}
                        style={segmentStyle(perfilEdit.lado === l.value)}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Color avatar */}
            {!session.avatar && (
              <div style={{ marginTop: 6, marginBottom: 20, paddingTop: 14, borderTop: "1px solid " + C.border }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Color de l'avatar</label>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", background: perfilEdit.avatar_color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0,
                  }}>
                    {iniciales(perfilEdit.nombre || session.nombre)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {PALETTE.map(color => (
                    <button key={color} type="button" onClick={() => setPerfilEdit(p => ({ ...p, avatar_color: color }))}
                      style={{
                        width: 30, height: 30, borderRadius: "50%", background: color,
                        border: perfilEdit.avatar_color === color ? `3px solid ${dark ? '#e2e8f0' : '#111827'}` : "3px solid " + C.surface,
                        outline: "1px solid " + C.border,
                        cursor: "pointer", padding: 0, transition: "all 0.15s",
                        boxShadow: perfilEdit.avatar_color === color ? "0 8px 16px rgba(0,0,0,.14)" : "none",
                      }} title={color} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <Btn onClick={guardarPerfil} variant="primary" theme={C} dark={dark}>Desar</Btn>
              <Btn onClick={() => setPerfilEdit(null)} theme={C} dark={dark}>Cancel·lar</Btn>
            </div>
          </div>
        )}

        {/* ── Canviar contrasenya ────────────────────────── */}
        <div style={{
          background: C.surface, borderRadius: 16, padding: 24,
          border: "1px solid " + C.border, boxShadow: "0 1px 3px rgba(0,0,0,.04)", flex: "1 1 270px",
        }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 6 }}>Canviar contrasenya</div>
            <div style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5 }}>
              Mantén el teu compte protegit actualitzant la contrasenya quan ho necessitis.
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Contrasenya actual</label>
              <input type="password" value={pwdForm.actual}
                onChange={e => setPwdForm(p => ({ ...p, actual: e.target.value }))}
                style={inputStyle} />
            </div>

            <div style={{ paddingTop: 6, borderTop: "1px solid " + C.border }}>
              <label style={labelStyle}>Nova contrasenya</label>
              <input type="password" value={pwdForm.nueva}
                onChange={e => setPwdForm(p => ({ ...p, nueva: e.target.value }))}
                style={inputStyle} />
              <div style={{ marginTop: 10 }}>
                {pwdForm.nueva ? <PasswordStrength password={pwdForm.nueva} /> : null}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Repetir nova contrasenya</label>
              <input type="password" value={pwdForm.repetir}
                onChange={e => setPwdForm(p => ({ ...p, repetir: e.target.value }))}
                style={inputStyle} />
            </div>
          </div>

          {pwdError && <p style={{ color: "#dc2626", fontSize: 12, margin: "14px 0 0" }}>{pwdError}</p>}

          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={cambiarPassword} variant="primary">Actualitzar contrasenya</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
