import { formatFecha } from "../../utils/helpers";
import UserAvatar from "../UserAvatar";
import { modalOverlay } from "../../styles/styles";

export default function MatchModal({ partidoModal, setPartidoModal, users, session, unirsePartido, salirPartido, solicitudsPartidaMeues, respondreInvitacio, onOpenUserProfile, t }) {
  if (!partidoModal) return null;
  const { reserva } = partidoModal;
  const numJugadors = reserva.jugadores?.length || 0;
  const lleno = numJugadors >= 4;
  const yaUnido = reserva.jugadores?.includes(session.id);
  const esOrganitzador = reserva.userId === session.id;
  const solEsme = (solicitudsPartidaMeues || []).find(function(s) { return s.reserva_id === reserva.id; });
  const teSolicitudPendent = solEsme && solEsme.estat === 'pendent';
  const teInvitacio = solEsme && solEsme.estat === 'invitat';
  const organitzador = users.find(function(u) { return u.id === reserva.userId; });

  const close = () => setPartidoModal(null);

  return (
    <div style={modalOverlay} onClick={close}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: t?.surface || "#fff", borderRadius: 18, padding: 28, width: 380, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,.18)", position: "relative" }}
      >
        {/* Cerrar */}
        <button onClick={close} style={{ position: "absolute", top: 14, right: 14, background: "#f3f4f6", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>

        {/* Cabecera */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#0284c7", textTransform: "uppercase", letterSpacing: 0.8 }}>Partido abierto</div>
            {lleno && <span style={{ fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 20, padding: "1px 8px" }}>Completo</span>}
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: t?.text || "#111827" }}>{formatFecha(reserva.fecha)}</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 600, background: "#f0f9ff", color: "#0284c7", border: "1px solid #7dd3fc", borderRadius: 20, padding: "2px 10px" }}>{reserva.hora}</span>
            <span style={{ fontSize: 12, fontWeight: 600, background: "#f9fafb", color: "#6b7280", border: "1px solid " + (t?.border || "#e5e7eb") + ",", borderRadius: 20, padding: "2px 10px" }}>Organiza: {organitzador?.nombre}</span>
          </div>
        </div>

        {/* Jugadores */}
        <div style={{ background: "#f9fafb", border: "1px solid " + (t?.border || "#e5e7eb") + ",", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>Jugadores</span>
            <span style={{ fontSize: 12, fontWeight: 700, background: numJugadors >= 4 ? "#fef2f2" : "#f0fdf4", color: numJugadors >= 4 ? "#dc2626" : "#16a34a", border: `1px solid ${numJugadors >= 4 ? "#fca5a5" : "#86efac"}`, borderRadius: 20, padding: "2px 10px" }}>
              {numJugadors}/4
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reserva.jugadores?.map(function(id, i) {
              const u = users.find(function(x) { return x.id === id; });
              const jugador = id === session.id ? session : (u || { id, nombre: "?" });
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <UserAvatar user={jugador} size={32} onClick={function() { if (onOpenUserProfile) onOpenUserProfile(jugador); }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: t?.text || "#111827" }}>{u?.nombre}</span>
                  {i === 0 && <span style={{ fontSize: 11, background: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d", borderRadius: 10, padding: "1px 7px", fontWeight: 600 }}>Organizador</span>}
                  {id === session.id && i !== 0 && <span style={{ fontSize: 11, background: "#f0f9ff", color: "#0284c7", border: "1px solid #7dd3fc", borderRadius: 10, padding: "1px 7px", fontWeight: 600 }}>Tú</span>}
                </div>
              );
            })}
            {Array.from({ length: 4 - numJugadors }).map(function(_, i) {
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.45 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>+</div>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>Plaza libre</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invitació rebuda */}
        {!yaUnido && !esOrganitzador && teInvitacio && (
          <div style={{ background: "#f0fdf4", border: "1.5px solid #6ee7b7", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: "#065f46", fontSize: 14, marginBottom: 10 }}>🎉 ¡Te han invitado a este partido!</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={function() { respondreInvitacio(solEsme.id, "acceptada"); close(); }}
                style={{ flex: 1, padding: "10px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >✓ Aceptar</button>
              <button
                onClick={function() { respondreInvitacio(solEsme.id, "rebutjada"); close(); }}
                style={{ flex: 1, padding: "10px", background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >✕ Rechazar</button>
            </div>
          </div>
        )}

        {/* Sol·licitud pendent */}
        {!yaUnido && !esOrganitzador && reserva.abierto && !teInvitacio && (
          teSolicitudPendent ? (
            <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#92400e", fontWeight: 600 }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              Solicitud enviada — esperando confirmación del organizador
            </div>
          ) : (
            <button
              onClick={!lleno ? function() { unirsePartido(reserva.id, reserva.fecha, reserva.hora); close(); } : undefined}
              disabled={lleno}
              style={{ display: "block", width: "100%", padding: "12px", background: lleno ? "#f3f4f6" : "#0284c7", color: lleno ? "#9ca3af" : "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: lleno ? "not-allowed" : "pointer", marginBottom: 10 }}
            >
              {lleno ? "Sin plazas disponibles" : "Solicitar unirse"}
            </button>
          )
        )}

        {/* Salir del partido */}
        {yaUnido && !esOrganitzador && (
          <button
            onClick={function() { salirPartido(reserva.id, reserva.fecha, reserva.hora); close(); }}
            style={{ display: "block", width: "100%", padding: "12px", background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10 }}
          >
            Salir del partido
          </button>
        )}

        <button onClick={close} style={{ width: "100%", padding: "10px", background: "transparent", color: "#9ca3af", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
