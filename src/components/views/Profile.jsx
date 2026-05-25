import { useState, useRef } from "react";
import { colorAvatar, iniciales } from "../../utils/helpers";
import PasswordStrength from "../auth/PasswordStrength";

const AVATAR_BACKEND = "http://localhost:4000";

const PALETTE = [
  "#1a2e1a", "#1e3a5f", "#6b21a8", "#9a3412",
  "#0f4c81", "#065f46", "#7c2d12", "#374151",
];



function Btn({ onClick, variant, children, style }) {
  const [hover, setHover] = useState(false);
  const variants = {
    primary: { bg: "#1a2e1a", color: "#fff", border: "#1a2e1a" },
    default: { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" },
    danger: { bg: "#fff", color: "#dc2626", border: "#fecaca" },
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
  var sz = size || 88;
  var src = session.avatar ? AVATAR_BACKEND + session.avatar : null;
  var bg = session.avatar_color || colorAvatar(session.id);
  if (src) {
    return (
      <img
        src={src}
        alt={session.nombre}
        style={{ width: sz, height: sz, borderRadius: "50%", objectFit: "cover", display: "block" }}
      />
    );
  }
  return (
    <div
      style={{
        width: sz, height: sz, borderRadius: "50%", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: Math.round(sz * 0.32), fontWeight: 700, flexShrink: 0,
      }}
    >
      {iniciales(session.nombre)}
    </div>
  );
}

export default function Profile({
  session, misReservas, misPartidos,
  perfilEdit, setPerfilEdit, guardarPerfil,
  pwdForm, setPwdForm, pwdError, cambiarPassword,
  subirAvatarFoto, eliminarAvatarFoto, t,
}) {
  var fileInputRef = useRef(null);
  var [avatarHover, setAvatarHover] = useState(false);

  var C = {
    surface:     t?.surface     || "#fff",
    surfaceAlt:  t?.surfaceAlt  || "#f9fafb",
    border:      t?.border      || "#e5e7eb",
    text:        t?.text        || "#111827",
    secondary:   t?.textSecondary || "#6b7280",
    muted:       t?.textMuted   || "#9ca3af",
    inputBg:     t?.inputBg     || "#fff",
    inputBorder: t?.inputBorder || "#d1d5db",
    primary:     t?.primary     || "#1a2e1a",
  };
  var inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid " + C.inputBorder,
    borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none",
    color: C.text, background: C.inputBg,
  };
  var labelStyle = {
    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5,
  };

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (file) subirAvatarFoto(file);
    e.target.value = "";
  }

  function startEdit() {
    setPerfilEdit({
      nombre: session.nombre,
      email: session.email,
      avatar_color: session.avatar_color || colorAvatar(session.id),
    });
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>
          Mi perfil
        </h2>
      </div>

      {/* Header card */}
      <div style={{
        background: C.surface, borderRadius: 12, padding: 28, border: "1px solid " + C.border,
        boxShadow: "0 1px 3px rgba(0,0,0,.04)", marginBottom: 16,
        display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap",
      }}>
        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div
            style={{ position: "relative", cursor: "pointer", borderRadius: "50%", flexShrink: 0 }}
            onMouseEnter={function() { setAvatarHover(true); }}
            onMouseLeave={function() { setAvatarHover(false); }}
            onClick={function() { fileInputRef.current && fileInputRef.current.click(); }}
            title="Cambiar foto de perfil"
          >
            <AvatarDisplay session={session} size={88} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center",
              justifyContent: "center", opacity: avatarHover ? 1 : 0,
              transition: "opacity 0.15s",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="4" stroke="#fff" strokeWidth="2"/>
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          {session.avatar ? (
            <button
              onClick={eliminarAvatarFoto}
              style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
            >
              Eliminar foto
            </button>
          ) : (
            <span style={{ fontSize: 11, color: C.muted }}>Subir foto</span>
          )}
        </div>

        {/* Name & stats */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: C.text }}>{session.nombre}</div>
            {session.rol === "admin" && (
              <span style={{ fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 5, padding: "1px 7px", letterSpacing: 0.4 }}>
                ADMIN
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: C.secondary, marginBottom: 18 }}>{session.email}</div>
          <div style={{ display: "flex", gap: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Reservas</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 2 }}>{misReservas.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Partidos</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text, marginTop: 2 }}>{misPartidos.length}</div>
            </div>
          </div>
        </div>

        {perfilEdit === null && (
          <Btn onClick={startEdit} style={{ alignSelf: "flex-start" }}>Editar perfil</Btn>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Edit form */}
        {perfilEdit !== null && (
          <div style={{
            background: C.surface, borderRadius: 12, padding: 24, border: "1px solid " + C.border,
            boxShadow: "0 1px 3px rgba(0,0,0,.04)", flex: "1 1 270px",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>
              Editar perfil
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Nombre</label>
              <input
                value={perfilEdit.nombre}
                onChange={function(e) { setPerfilEdit(function(p) { return Object.assign({}, p, { nombre: e.target.value }); }); }}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={perfilEdit.email}
                onChange={function(e) { setPerfilEdit(function(p) { return Object.assign({}, p, { email: e.target.value }); }); }}
                style={inputStyle}
              />
            </div>

            {!session.avatar && (
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Color del avatar</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {PALETTE.map(function(color) {
                    return (
                      <button
                        key={color}
                        onClick={function() { setPerfilEdit(function(p) { return Object.assign({}, p, { avatar_color: color }); }); }}
                        style={{
                          width: 28, height: 28, borderRadius: "50%", background: color,
                          border: perfilEdit.avatar_color === color ? "3px solid #111827" : "3px solid transparent",
                          outline: perfilEdit.avatar_color === color ? "2px solid #d1d5db" : "none",
                          cursor: "pointer", padding: 0, transition: "border 0.1s",
                        }}
                        title={color}
                      />
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", background: perfilEdit.avatar_color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }}>
                    {iniciales(perfilEdit.nombre || session.nombre)}
                  </div>
                  <span style={{ fontSize: 12, color: C.muted }}>Vista previa</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={guardarPerfil} variant="primary">Guardar</Btn>
              <Btn onClick={function() { setPerfilEdit(null); }}>Cancelar</Btn>
            </div>
          </div>
        )}

        {/* Password card */}
        <div style={{
          background: C.surface, borderRadius: 12, padding: 24, border: "1px solid " + C.border,
          boxShadow: "0 1px 3px rgba(0,0,0,.04)", flex: "1 1 270px",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 18 }}>
            Cambiar contraseña
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Contraseña actual</label>
            <input
              type="password"
              value={pwdForm.actual}
              onChange={function(e) { setPwdForm(function(p) { return Object.assign({}, p, { actual: e.target.value }); }); }}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Nueva contraseña</label>
            <input
              type="password"
              value={pwdForm.nueva}
              onChange={function(e) { setPwdForm(function(p) { return Object.assign({}, p, { nueva: e.target.value }); }); }}
              style={inputStyle}
            />
          </div>
          {pwdForm.nueva ? <PasswordStrength password={pwdForm.nueva} /> : <div style={{ marginBottom: 14 }} />}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Repetir nueva contraseña</label>
            <input
              type="password"
              value={pwdForm.repetir}
              onChange={function(e) { setPwdForm(function(p) { return Object.assign({}, p, { repetir: e.target.value }); }); }}
              style={inputStyle}
            />
          </div>
          {pwdError && <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 12px" }}>{pwdError}</p>}
          <Btn onClick={cambiarPassword} variant="primary">Actualizar contraseña</Btn>
        </div>
      </div>
    </div>
  );
}
