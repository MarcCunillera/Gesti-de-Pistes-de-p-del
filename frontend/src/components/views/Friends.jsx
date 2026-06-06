import { useState, useEffect, useRef } from "react";
import { api } from "../../utils/api";
import Avatar from "../UserAvatar";

function Btn({ onClick, variant, children, style }) {
  const [hover, setHover] = useState(false);
  const variants = {
    primary: { bg: "#1a2e1a", color: "#fff", border: "#1a2e1a" },
    default: { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" },
    danger:  { bg: "#fff", color: "#dc2626", border: "#fca5a5" },
    confirm: { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  };
  const s = variants[variant || "default"];
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: s.bg, color: s.color, border: "1px solid " + s.border, borderRadius: 7, padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12, opacity: hover ? 0.75 : 1, transition: "opacity 0.12s", ...style }}>
      {children}
    </button>
  );
}

export default function Friends({ session, users, showToast, onSolicitudsChange, refreshKey, onOpenUserProfile, t }) {
  const [tab, setTab] = useState("amics");
  const [amics, setAmics] = useState([]);
  const [solicituds, setSolicituds] = useState([]);
  const [enviades, setEnviades] = useState([]);
  const [buscar, setBuscar] = useState("");
  const [buscarDebounced, setBuscarDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviandoId, setEnviandoId] = useState(null);
  const debounceRef = useRef(null);
  var C = {
    surface:    t?.surface    || "#fff",
    surfaceAlt: t?.surfaceAlt || "#f9fafb",
    border:     t?.border     || "#e5e7eb",
    text:       t?.text       || "#111827",
    secondary:  t?.textSecondary || "#6b7280",
    muted:      t?.textMuted  || "#9ca3af",
  };

  useEffect(function() {
    var firstLoad = amics.length === 0 && solicituds.length === 0 && enviades.length === 0;
    if (firstLoad) setLoading(true);
    Promise.all([api.getAmics(), api.getSolicituds(), api.getEnviades()])
      .then(function(res) {
        setAmics(res[0]);
        setSolicituds(res[1]);
        setEnviades(res[2]);
        if (onSolicitudsChange) onSolicitudsChange(res[1].length);
      })
      .catch(function(e) { showToast(e.message, "error"); })
      .finally(function() { if (firstLoad) setLoading(false); });
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce del buscador — espera 300ms tras dejar de escribir
  useEffect(function() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(function() {
      setBuscarDebounced(buscar.trim());
    }, 300);
    return function() { clearTimeout(debounceRef.current); };
  }, [buscar]);

  // Limpiar búsqueda al cambiar de pestaña
  useEffect(function() {
    setBuscar("");
    setBuscarDebounced("");
  }, [tab]);

  var amicIds = amics.map(function(a) { return a.id; });
  var enviadesIds = enviades.map(function(s) { return s.a_id; });
  var resultats = buscarDebounced.length >= 2 ? users.filter(function(u) {
    return u.id !== session.id &&
      u.activo !== false &&
      amicIds.indexOf(u.id) === -1 &&
      enviadesIds.indexOf(u.id) === -1 &&
      u.nombre.toLowerCase().indexOf(buscarDebounced.toLowerCase()) !== -1;
  }) : [];

  function enviarSolicitud(userId) {
    if (enviandoId) return; // evitar doble envío
    var u = users.find(function(x) { return x.id === userId; });
    setEnviandoId(userId);
    api.enviarSolicitud(userId)
      .then(function(data) {
        showToast("Solicitud enviada a " + (u ? u.nombre : ""));
        if (u) setEnviades(function(prev) { return prev.concat([{ id: data.id, a_id: u.id, a_nombre: u.nombre, a_email: u.email, avatar: u.avatar, avatar_color: u.avatar_color }]); });
        // Limpiar búsqueda para feedback visual claro
        setBuscar("");
        setBuscarDebounced("");
      })
      .catch(function(e) { showToast(e.message, "error"); })
      .finally(function() { setEnviandoId(null); });
  }

  function responder(id, estat) {
    api.respondSolicitud(id, estat)
      .then(function() {
        setSolicituds(function(ss) { return ss.filter(function(s) { return s.id !== id; }); });
        if (onSolicitudsChange) onSolicitudsChange(solicituds.filter(function(s) { return s.id !== id; }).length);
        if (estat === "acceptada") {
          showToast("Amigo añadido");
          return api.getAmics().then(function(a) { setAmics(a); });
        } else {
          showToast("Solicitud rechazada");
        }
      })
      .catch(function(e) { showToast(e.message, "error"); });
  }

  function eliminarAmic(amicId) {
    if (!window.confirm("¿Eliminar este amigo?")) return;
    api.eliminarAmic(amicId)
      .then(function() {
        setAmics(function(as) { return as.filter(function(a) { return a.id !== amicId; }); });
        showToast("Amigo eliminado");
      })
      .catch(function(e) { showToast(e.message, "error"); });
  }

  function obrirPerfil(user) {
    if (onOpenUserProfile && user && user.id) onOpenUserProfile(user);
  }

  var TABS = [
    { key: "amics", label: "Mis amigos" },
    { key: "buscar", label: "Añadir amigo" },
    { key: "pendents", label: "Solicitudes" },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>Amigos</h2>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>
          {amics.length} amigo{amics.length !== 1 ? "s" : ""}
          {solicituds.length > 0 && <span style={{ marginLeft: 10, fontWeight: 600, color: "#374151" }}>{solicituds.length} solicitud{solicituds.length !== 1 ? "es" : ""} pendiente{solicituds.length !== 1 ? "s" : ""}</span>}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 9, padding: 3, marginBottom: 24, width: "fit-content", border: "1px solid #e5e7eb" }}>
        {TABS.map(function(tb) {
          var active = tab === tb.key;
          return (
            <button key={tb.key} onClick={function() { setTab(tb.key); }}
              style={{ padding: "7px 16px", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500, background: active ? "#fff" : "transparent", color: active ? "#111827" : "#6b7280", boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .12s", display: "flex", alignItems: "center", gap: 6 }}>
              {tb.label}
              {tb.key === "pendents" && solicituds.length > 0 && (
                <span style={{ background: "#111827", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{solicituds.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Mis amigos ── */}
      {tab === "amics" && (
        <div>
          {loading ? (
            <div style={{ color: C.muted, fontSize: 13 }}>Cargando...</div>
          ) : amics.length === 0 ? (
            <div style={{ background: C.surface, borderRadius: 12, padding: "40px 24px", textAlign: "center", border: "1px solid #e5e7eb" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 20 }}>👥</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Sin amigos todavía</div>
              <div style={{ fontSize: 12, color: C.muted }}>Usa "Añadir amigo" para buscar</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {amics.map(function(a) {
                return (
                  <div key={a.id} style={{ background: C.surface, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar user={a} size={38} onClick={function() { obrirPerfil(a); }} />
                      <div>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{a.nombre}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{a.email}</div>
                      </div>
                    </div>
                    <Btn onClick={function() { eliminarAmic(a.id); }} variant="danger">Eliminar</Btn>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sugerencias */}
          {(function() {
            var sugerencias = users.filter(function(u) {
              return u.id !== session.id &&
                u.activo !== false &&
                amicIds.indexOf(u.id) === -1 &&
                enviadesIds.indexOf(u.id) === -1 &&
                solicituds.every(function(s) { return s.de_id !== u.id; });
            }).slice(0, 5);
            if (sugerencias.length === 0) return null;
            return (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                  Quizás los conozcas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sugerencias.map(function(u) {
                    return (
                      <div key={u.id} style={{ background: C.surface, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar user={u} size={38} onClick={function() { obrirPerfil(u); }} />
                          <div>
                            <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{u.nombre}</div>
                          </div>
                        </div>
                        <Btn
                          onClick={function() { enviarSolicitud(u.id); }}
                          variant="confirm"
                          style={{ opacity: enviandoId === u.id ? 0.5 : 1, pointerEvents: enviandoId ? "none" : "auto" }}
                        >
                          {enviandoId === u.id ? "Enviando…" : "+ Añadir"}
                        </Btn>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab: Añadir amigo ── */}
      {tab === "buscar" && (
        <div>
          <input
            placeholder="Buscar por nombre..."
            value={buscar}
            onChange={function(e) { setBuscar(e.target.value); }}
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginBottom: 14, outline: "none", color: "#111827" }}
            autoFocus
          />
          {buscar.length > 0 && buscar.length < 2 && (
            <div style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>Escribe al menos 2 caracteres</div>
          )}
          {buscar.length >= 2 && buscar !== buscarDebounced && (
            <div style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>Buscando…</div>
          )}
          {buscarDebounced.length >= 2 && buscar === buscarDebounced && resultats.length === 0 && (
            <div style={{ background: C.surface, borderRadius: 12, padding: "24px 20px", textAlign: "center", color: C.muted, border: "1px solid #e5e7eb", fontSize: 13 }}>
              No se encontraron usuarios para "{buscar}"
            </div>
          )}
          {resultats.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {resultats.map(function(u) {
                return (
                  <div key={u.id} style={{ background: C.surface, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar user={u} size={38} onClick={function() { obrirPerfil(u); }} />
                      <div>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{u.nombre}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{u.email}</div>
                      </div>
                    </div>
                    <Btn
                      onClick={function() { enviarSolicitud(u.id); }}
                      variant="confirm"
                      style={{ opacity: enviandoId === u.id ? 0.5 : 1, pointerEvents: enviandoId ? "none" : "auto" }}
                    >
                      {enviandoId === u.id ? "Enviando…" : "+ Añadir"}
                    </Btn>
                  </div>
                );
              })}
            </div>
          )}

          {enviades.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Solicitudes enviadas ({enviades.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {enviades.map(function(s) {
                  var userEnviat = { id: s.a_id, nombre: s.a_nombre, email: s.a_email, avatar: s.avatar, avatar_color: s.avatar_color };
                  return (
                    <div key={s.id} style={{ background: C.surface, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", opacity: 0.75 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar user={userEnviat} size={38} onClick={function() { obrirPerfil(userEnviat); }} />
                        <div>
                          <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{s.a_nombre}</div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{s.a_email}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 600, background: C.surfaceAlt, borderRadius: 6, padding: "4px 10px", border: "1px solid #e5e7eb" }}>Pendiente</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Solicitudes pendientes ── */}
      {tab === "pendents" && (
        <div>
          {loading ? (
            <div style={{ color: C.muted, fontSize: 13 }}>Cargando...</div>
          ) : solicituds.length === 0 ? (
            <div style={{ background: C.surface, borderRadius: 12, padding: "40px 24px", textAlign: "center", border: "1px solid #e5e7eb" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 20 }}>🎉</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Sin solicitudes pendientes</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {solicituds.map(function(s) {
                var userSolicitant = { id: s.de_id, nombre: s.de_nombre, email: s.de_email, avatar: s.avatar, avatar_color: s.avatar_color };
                return (
                  <div key={s.id} style={{ background: C.surface, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.04)", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <Avatar user={userSolicitant} size={38} onClick={function() { obrirPerfil(userSolicitant); }} />
                      <div>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{s.de_nombre}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{s.de_email}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn onClick={function() { responder(s.id, "acceptada"); }} variant="primary">Aceptar</Btn>
                      <Btn onClick={function() { responder(s.id, "rebutjada"); }}>Rechazar</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
