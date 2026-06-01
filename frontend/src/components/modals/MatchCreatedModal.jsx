import { useState } from "react";
import { formatFecha } from "../../utils/helpers";
import UserAvatar from "../UserAvatar";
import { modalOverlay } from "../../styles/styles";

export default function MatchCreatedModal({ reserva, onClose, users, session, amics, solicitudsPartidaInvitades, invitarJugador, t }) {
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!reserva) return null;

  const C = {
    surface: t?.surface || "#fff",
    border:  t?.border  || "#e5e7eb",
    text:    t?.text    || "#111827",
  };

  const invitadesReserva = (solicitudsPartidaInvitades || []).filter(s => s.reserva_id === reserva.id);
  const invitadesIds     = invitadesReserva.map(s => s.de_id);
  const jaAlPartit       = reserva.jugadores || [];
  const amicsDisponibles = (amics || []).filter(a => !jaAlPartit.includes(a.id) && !invitadesIds.includes(a.id));
  const amicsInvitats    = (amics || []).filter(a => invitadesIds.includes(a.id));
  const lliures          = 4 - (jaAlPartit.length || 0);

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.surface, borderRadius: 18, width: 400, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,.18)", position: "relative", overflow: "hidden" }}
      >
        {/* Franja azul */}
        <div style={{ height: 4, background: "#60a5fa" }} />

        <div style={{ padding: "22px 24px 24px" }}>
          {/* Cerrar */}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

          {/* Cabecera */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0284c7", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Partido creado</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{formatFecha(reserva.fecha)}</span>
              <span style={{ fontWeight: 500, fontSize: 14, color: "#6b7280" }}>{reserva.hora}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 20, padding: "2px 10px" }}>Abierto</span>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{jaAlPartit.length}/4 jugadores</div>
          </div>

          {/* Jugadores */}
          <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: "14px 14px 10px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              {jaAlPartit.map(function(id) {
                const u = users.find(x => x.id === id);
                const esTu = id === session.id;
                return (
                  <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <UserAvatar user={u || { id, nombre: "?" }} size={38} outline={esTu ? "2px solid #60a5fa" : "none"} outlineOffset={2} />
                    <span style={{ fontSize: 11, color: esTu ? "#1d4ed8" : "#374151", fontWeight: esTu ? 700 : 400, maxWidth: 52, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {esTu ? "tú" : u?.nombre?.split(" ")[0] || "?"}
                    </span>
                  </div>
                );
              })}
              {Array.from({ length: lliures }).map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: 0.35 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f3f4f6", border: "1.5px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 16 }}>+</div>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>Libre</span>
                </div>
              ))}
            </div>
          </div>

          {/* Invitar */}
          {lliures > 0 && (amicsDisponibles.length > 0 || amicsInvitats.length > 0) && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setInviteOpen(o => !o)}
                style={{ background: "none", border: "1px solid " + C.border, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer", width: "100%" }}
              >
                {inviteOpen ? "Cerrar" : "Invitar jugador"}
              </button>
              {inviteOpen && (
                <div style={{ marginTop: 8, background: C.surface, border: "1px solid " + C.border, borderRadius: 10, padding: "10px 12px" }}>
                  {amicsDisponibles.length === 0 && amicsInvitats.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>Todos tus amigos ya están invitados.</p>
                  ) : (
                    amicsDisponibles.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                        <UserAvatar user={a} size={28} />
                        <span style={{ fontSize: 12, flex: 1, color: C.text }}>{a.nombre || "?"}</span>
                        <button
                          onClick={() => invitarJugador(reserva.id, a.id)}
                          style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 7, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                        >Invitar</button>
                      </div>
                    ))
                  )}
                  {amicsInvitats.map(a => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6, opacity: 0.65 }}>
                      <UserAvatar user={a} size={28} />
                      <span style={{ fontSize: 12, flex: 1, color: C.text }}>{a.nombre || "?"}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d", borderRadius: 7, padding: "3px 10px" }}>Pendiente</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            style={{ width: "100%", padding: "10px", background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
