import { useMemo, useState } from "react";
import { formatFecha } from "../../utils/helpers";
import UserAvatar from "../UserAvatar";

function Tag({ children, variant = "default" }) {
  const styles = {
    default: { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" },
    green:   { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    blue:    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    amber:   { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: "2px 8px", letterSpacing: 0.1 }}>
      {children}
    </span>
  );
}

function Btn({ onClick, variant = "default", children, style, href, target, rel }) {
  const [hover, setHover] = useState(false);
  const variants = {
    default: { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" },
    primary: { bg: "#1a2e1a", color: "#fff",    border: "#1a2e1a" },
    ghost:   { bg: "transparent", color: "#6b7280", border: "#e5e7eb" },
    danger:  { bg: "#fff",    color: "#dc2626", border: "#fca5a5" },
    confirm: { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  };
  const s = variants[variant] || variants.default;
  const baseStyle = {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    borderRadius: 7, padding: "7px 14px", cursor: "pointer",
    fontWeight: 600, fontSize: 12, textDecoration: "none",
    opacity: hover ? 0.75 : 1, transition: "opacity 0.12s",
    ...style,
  };
  if (href) {
    return <a href={href} target={target} rel={rel} style={baseStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>{children}</a>;
  }
  return (
    <button onClick={onClick} style={baseStyle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children}
    </button>
  );
}

function SectionTitle({ children, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8 }}>{children}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, fontWeight: 700, background: "#f3f4f6", color: "#6b7280", borderRadius: 20, padding: "1px 8px", border: "1px solid #e5e7eb" }}>{count}</span>
      )}
    </div>
  );
}

export default function MyReservations({ session, misReservas, misPartidos, users, cancelarReserva, salirPartido, toggleAbierto, setVista, config, solicitudsPartidaPendent, respondSolicitudPartida, expulsarJugador, invitarJugador, amics, solicitudsPartidaInvitades, solicitudsPartidaMeues, respondreInvitacioPartida, onOpenUserProfile, t }) {
  var C = {
    surface:    t?.surface    || "#fff",
    surfaceAlt: t?.surfaceAlt || "#f9fafb",
    border:     t?.border     || "#e5e7eb",
    text:       t?.text       || "#111827",
    secondary:  t?.textSecondary || "#6b7280",
    muted:      t?.textMuted  || "#9ca3af",
    inputBg:    t?.inputBg    || "#fff",
    primary:    t?.primary    || "#1a2e1a",
  };
  const [inviteOpen, setInviteOpen] = useState(null);
  const usersMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);
  function obrirPerfil(user) {
    if (onOpenUserProfile && user && user.id) onOpenUserProfile(user);
  }
  const totalActivas = misReservas.length + misPartidos.length;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>Mis reservas</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted }}>
            {totalActivas === 0
              ? "Sin reservas activas"
              : `${totalActivas} reserva${totalActivas !== 1 ? "s" : ""} activa${totalActivas !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Btn variant="primary" onClick={() => setVista("calendario")}>Nueva reserva</Btn>
      </div>

      {/* Invitaciones pendientes */}
      {solicitudsPartidaMeues && solicitudsPartidaMeues.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle count={solicitudsPartidaMeues.length}>Pendiente de ti</SectionTitle>
          {solicitudsPartidaMeues.map(function(s) {
            var esInvitacio = s.estat === "invitat";
            return (
              <div key={s.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.05)", marginBottom: 8, overflow: "hidden" }}>
                <div style={{ height: 2, background: esInvitacio ? "#4ade80" : "#fbbf24" }} />
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 3 }}>
                      {esInvitacio ? "Invitación recibida" : "Solicitud enviada"}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {esInvitacio
                        ? <span><strong>{s.organitzador_nombre}</strong> · {formatFecha(s.fecha)} a las {s.hora}</span>
                        : <span>Esperando a <strong>{s.organitzador_nombre}</strong> · {formatFecha(s.fecha)} {s.hora}</span>}
                    </div>
                  </div>
                  {esInvitacio && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Btn variant="confirm" onClick={() => respondreInvitacioPartida(s.id, "acceptada")}>Aceptar</Btn>
                      <Btn variant="danger" onClick={() => respondreInvitacioPartida(s.id, "rebutjada")}>Rechazar</Btn>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Estado vacío */}
      {totalActivas === 0 ? (
        <div style={{ background: "#fff", borderRadius: 14, padding: "52px 24px", textAlign: "center", border: "1px solid #e5e7eb" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>🎾</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 }}>Sin reservas activas</div>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>Reserva una pista para empezar a jugar</p>
          <Btn variant="primary" onClick={() => setVista("calendario")}>Ver disponibilidad</Btn>
        </div>
      ) : (
        <>
          {/* Mis reservas */}
          {misReservas.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <SectionTitle count={misReservas.length}>Mis reservas</SectionTitle>
              {[...misReservas].sort((a, b) => (a.fecha + a.hora > b.fecha + b.hora ? 1 : -1)).map(function(r) {
                var pendentsDeR = (solicitudsPartidaPendent || []).filter(function(s) { return s.reserva_id === r.id; });
                var lliures = Math.max(0, 4 - (r.jugadores?.length || 0) - pendentsDeR.length);
                return (
                  <div key={r.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.05)", marginBottom: 10, border: "1px solid #e5e7eb" }}>
                    <div style={{ height: 3, background: r.abierto ? "#60a5fa" : "linear-gradient(90deg,#4ade80,#22c55e)" }} />
                    <div style={{ padding: "18px 20px" }}>

                      {!r.abierto ? (
                        /* ── TARJETA PRIVADA ── */
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{formatFecha(r.fecha)}</span>
                              <span style={{ fontWeight: 500, fontSize: 14, color: "#6b7280" }}>{r.hora}</span>
                              <Tag variant="green">Privado</Tag>
                            </div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>Solo tú · {config.duracion} min</div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              <Btn onClick={() => toggleAbierto(r.id)}>Abrir partido</Btn>
                              <Btn onClick={() => cancelarReserva(r.id, formatFecha(r.fecha))} variant="danger">Cancelar</Btn>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── TARJETA ABIERTA ── */
                        <div>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{formatFecha(r.fecha)}</span>
                                <span style={{ fontWeight: 500, fontSize: 14, color: "#6b7280" }}>{r.hora}</span>
                                <Tag variant="blue">Abierto</Tag>
                              </div>
                              <div style={{ fontSize: 12, color: "#9ca3af" }}>{r.jugadores?.length}/4 jugadores · {config.duracion} min</div>
                            </div>
                          </div>

                          {/* Jugadores horizontal */}
                          <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: "14px 14px 10px", marginBottom: 14 }}>
                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                            {r.jugadores?.map(function(id) {
                              var u = usersMap.get(id);
                              var jugador = u || { id, nombre: "?" };
                              var esOrg = id === r.userId;
                              return (
                                <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
                                  <UserAvatar
                                    user={jugador}
                                    size={38}
                                    outline={esOrg ? "2px solid #374151" : "none"}
                                    outlineOffset={2}
                                    onClick={function() { obrirPerfil(jugador); }}
                                  />
                                  <span style={{ fontSize: 11, color: "#374151", fontWeight: esOrg ? 700 : 400, maxWidth: 52, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {u?.nombre?.split(" ")[0] || "?"}
                                  </span>
                                  {esOrg && <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 600, letterSpacing: 0.2 }}>Org.</span>}
                                  {!esOrg && (
                                    <button onClick={() => expulsarJugador(r.id, id, u?.nombre || "Jugador")} title="Expulsar" style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#9ca3af", fontSize: 9, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1 }}>✕</button>
                                  )}
                                </div>
                              );
                            })}

                            {/* Solicitudes pendientes inline */}
                            {pendentsDeR.map(function(s) {
                              var pendingUser = usersMap.get(s.de_id) || { id: s.de_id, nombre: s.de_nombre, avatar: s.avatar, avatar_color: s.avatar_color };
                              return (
                                <div key={"sol-" + s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                  <UserAvatar user={pendingUser} size={38} outline="1.5px dashed #d1d5db" outlineOffset={2} onClick={function() { obrirPerfil(pendingUser); }} />
                                  <span style={{ fontSize: 11, color: "#374151", fontWeight: 500, maxWidth: 52, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {s.de_nombre?.split(" ")[0] || "?"}
                                  </span>
                                  <div style={{ display: "flex", gap: 3 }}>
                                    <button onClick={() => respondSolicitudPartida(s.id, "acceptada")} title="Aceptar" style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 5, padding: "1px 6px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>✓</button>
                                    <button onClick={() => respondSolicitudPartida(s.id, "rebutjada")} title="Rechazar" style={{ background: "none", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: 5, padding: "1px 6px", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>✕</button>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Plazas libres */}
                            {Array.from({ length: lliures }).map(function(_, i) {
                              return (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.35 }}>
                                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e2e8f0", border: "1.5px dashed #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16 }}>+</div>
                                  <span style={{ fontSize: 11, color: "#64748b" }}>Libre</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Invitar */}
                          {(r.jugadores?.length || 0) < 4 && (
                            <div style={{ marginTop: 10 }}>
                              <Btn onClick={() => setInviteOpen(inviteOpen === r.id ? null : r.id)} variant="ghost">
                                {inviteOpen === r.id ? "Cerrar" : "Invitar jugador"}
                              </Btn>
                              {inviteOpen === r.id && (function() {
                                var invitadesReserva = (solicitudsPartidaInvitades || []).filter(function(s) { return s.reserva_id === r.id; });
                                var invitadesIds = invitadesReserva.map(function(s) { return s.de_id; });
                                var jaAlPartit = r.jugadores || [];
                                var amicsInvitats = (amics || []).filter(function(a) { return invitadesIds.includes(a.id); });
                                var amicsDisponibles = (amics || []).filter(function(a) { return !jaAlPartit.includes(a.id) && !invitadesIds.includes(a.id); });
                                return (
                                  <div style={{ marginTop: 8, background: C.surface, border: "1px solid " + C.border, borderRadius: 10, padding: "10px 12px" }}>
                                    {amicsDisponibles.length === 0 && amicsInvitats.length === 0 ? (
                                      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Todos tus amigos ya están en el partido.</p>
                                    ) : (
                                      amicsDisponibles.map(function(a) {
                                        return (
                                          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                                            <UserAvatar user={a} size={28} onClick={function() { obrirPerfil(a); }} />
                                            <span style={{ fontSize: 12, flex: 1, color: "#111827" }}>{a.nombre || "?"}</span>
                                            <Btn onClick={() => invitarJugador(r.id, a.id)} variant="confirm">Invitar</Btn>
                                          </div>
                                        );
                                      })
                                    )}
                                    {amicsInvitats.map(function(a) {
                                      return (
                                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6, opacity: 0.65 }}>
                                          <UserAvatar user={a} size={28} onClick={function() { obrirPerfil(a); }} />
                                          <span style={{ fontSize: 12, flex: 1, color: "#111827" }}>{a.nombre || "?"}</span>
                                          <Tag variant="amber">Pendiente</Tag>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                          {/* Acciones partido abierto */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 4 }}>
                            <Btn onClick={() => toggleAbierto(r.id)}>Hacer privado</Btn>
                            <Btn onClick={() => cancelarReserva(r.id, formatFecha(r.fecha))} variant="danger" style={{ marginLeft: "auto" }}>
                              Cancelar
                            </Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Partidos en los que participo */}
          {misPartidos.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <SectionTitle count={misPartidos.length}>Partidos en los que participo</SectionTitle>
              {[...misPartidos].sort((a, b) => (a.fecha + a.hora > b.fecha + b.hora ? 1 : -1)).map(function(r) {
                var org = usersMap.get(r.userId);
                return (
                  <div key={r.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.05)", marginBottom: 10, border: "1px solid #e5e7eb" }}>
                    <div style={{ height: 3, background: "#60a5fa" }} />
                    <div style={{ padding: "18px 20px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{formatFecha(r.fecha)}</span>
                            <span style={{ fontWeight: 500, fontSize: 14, color: "#6b7280" }}>{r.hora}</span>
                            <Tag variant="blue">Participas</Tag>
                          </div>
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>
                            Organiza: <strong style={{ color: "#374151", fontWeight: 600 }}>{org?.nombre}</strong> · {r.jugadores?.length}/4 · {config.duracion} min
                          </div>
                        </div>
                      </div>

                      {/* Jugadores */}
                      <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: "14px 14px 10px", marginBottom: 14 }}>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                          {r.jugadores?.map(function(id) {
                            var u = usersMap.get(id);
                            var jugador = u || { id, nombre: "?" };
                            var esOrg = id === r.userId;
                            var esTu = id === session.id;
                            return (
                              <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <UserAvatar
                                  user={esTu ? session : jugador}
                                  size={38}
                                  outline={esOrg ? "2px solid #374151" : esTu ? "2px solid #60a5fa" : "none"}
                                  outlineOffset={2}
                                  onClick={function() { obrirPerfil(esTu ? session : jugador); }}
                                />
                                <span style={{ fontSize: 11, color: esTu ? "#1d4ed8" : "#374151", fontWeight: esTu || esOrg ? 700 : 400, maxWidth: 52, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {esTu ? "tú" : u?.nombre?.split(" ")[0] || "?"}
                                </span>
                                {esOrg && <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 600, letterSpacing: 0.2 }}>Org.</span>}
                              </div>
                            );
                          })}
                          {Array.from({ length: 4 - (r.jugadores?.length || 0) }).map(function(_, i) {
                            return (
                              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.35 }}>
                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e2e8f0", border: "1.5px dashed #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16 }}>+</div>
                                <span style={{ fontSize: 11, color: "#64748b" }}>Libre</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 4 }}>
                        <Btn onClick={() => salirPartido(r.id)} variant="danger" style={{ marginLeft: "auto" }}>Salir del partido</Btn>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}


    </div>
  );
}
