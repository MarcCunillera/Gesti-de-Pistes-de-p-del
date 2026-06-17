import { useMemo, useState } from "react";
import { formatFecha } from "../../utils/helpers";
import UserAvatar from "../UserAvatar";

const LADOS = [
  { value: "derecha", label: "Dreta" },
  { value: "reves", label: "Revés" },
  { value: "ambos", label: "Qualsevol" },
];

const MANOS = [
  { value: "diestro", label: "Dretà" },
  { value: "zurdo", label: "Esquerrà" },
];

function PreferenceCard({ icon, title, subtitle, C }) {
  return (
    <div
      style={{
        flex: "1 1 220px",
        background: C.surfaceAlt,
        borderRadius: 12,
        border: "1px solid " + C.border,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 74,
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1, width: 30, textAlign: "center" }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 3 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label, color, border, C }) {
  return (
    <div style={{ flex: "1 1 110px", textAlign: "center", padding: "8px 12px", borderRight: border ? "1px solid " + C.border : "none" }}>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 5 }}>
        {label}
      </div>
    </div>
  );
}

function Button({ onClick, children, variant, disabled, theme, dark }) {
  const styles = {
    default: { bg: dark ? theme.surfaceAlt : "#fff", color: dark ? theme.text : "#374151", border: dark ? theme.border : "#e5e7eb" },
    primary: { bg: dark ? theme.primary : "#1a2e1a", color: dark ? "#0f172a" : "#fff", border: dark ? theme.primary : "#1a2e1a" },
    green: { bg: dark ? "rgba(34,197,94,.14)" : "#f0fdf4", color: dark ? "#86efac" : "#15803d", border: dark ? "rgba(74,222,128,.32)" : "#86efac" },
    amber: { bg: dark ? "rgba(245,158,11,.14)" : "#fffbeb", color: dark ? "#fcd34d" : "#92400e", border: dark ? "rgba(251,191,36,.32)" : "#fde68a" },
    danger: { bg: dark ? "rgba(239,68,68,.12)" : "#fff", color: dark ? "#fca5a5" : "#dc2626", border: dark ? "rgba(248,113,113,.32)" : "#fca5a5" },
  };
  const s = styles[variant || "default"];
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid " + s.border,
        background: s.bg,
        color: s.color,
        borderRadius: 8,
        padding: "8px 14px",
        minHeight: 34,
        fontSize: 12,
        fontWeight: 800,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.72 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export default function UserProfile({
  user,
  session,
  amics,
  solicitudsAmicRebudes,
  solicitudsAmicEnviades,
  reservas,
  users,
  onBack,
  onOpenUserProfile,
  onEnviarSolicitud,
  onRespondSolicitud,
  onEliminarAmic,
  t,
}) {
  const [actionLoading, setActionLoading] = useState(false);

  const C = {
    surface: t?.surface || "#fff",
    surfaceAlt: t?.surfaceAlt || "#f9fafb",
    border: t?.border || "#e5e7eb",
    text: t?.text || "#111827",
    secondary: t?.textSecondary || "#6b7280",
    muted: t?.textMuted || "#9ca3af",
    primary: t?.primary || "#1a2e1a",
  };
  const dark = !["#fff", "#ffffff"].includes((C.surface || "").toLowerCase());

  const usersMap = useMemo(function () {
    const m = new Map();
    (users || []).forEach(function (u) { m.set(u.id, u); });
    return m;
  }, [users]);

  function runAction(fn) {
    if (!fn || actionLoading) return;
    setActionLoading(true);
    Promise.resolve(fn()).finally(function () { setActionLoading(false); });
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <Button onClick={onBack}>Tornar</Button>
        <div style={{ marginTop: 16, background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: 24, color: C.secondary }}>
          Usuari no trobat.
        </div>
      </div>
    );
  }

  const esTu = session && user.id === session.id;
  const esAmic = (amics || []).some(function (a) { return a.id === user.id; });
  const solicitudEnviada = (solicitudsAmicEnviades || []).find(function (s) { return s.a_id === user.id; });
  const solicitudRebuda = (solicitudsAmicRebudes || []).find(function (s) { return s.de_id === user.id; });
  const puedeVerContacto = esTu || esAmic || session?.rol === "admin";
  const now = new Date();

  const partidosPublicos = (reservas || [])
    .filter(function (r) {
      return r.estado === "confirmada" &&
        r.abierto &&
        new Date(r.fecha + "T" + r.hora) >= now &&
        ((r.jugadores || []).indexOf(user.id) !== -1 || r.userId === user.id);
    })
    .sort(function (a, b) { return (a.fecha + a.hora) > (b.fecha + b.hora) ? 1 : -1; });

  const reservasUsuario = (reservas || []).filter(function (r) {
    return r.userId === user.id && r.estado === "confirmada" && new Date(r.fecha + "T" + r.hora) >= now;
  }).length;
  const partitsUsuario = (reservas || []).filter(function (r) {
    return (r.jugadores || []).indexOf(user.id) !== -1 &&
      r.userId !== user.id &&
      r.estado === "confirmada" &&
      new Date(r.fecha + "T" + r.hora) >= now;
  }).length;
  const amigosCount = Number.isFinite(Number(user.amigos_count)) ? Number(user.amigos_count) : 0;
  const manoInfo = MANOS.find(function (m) { return m.value === user.mano; });
  const ladoInfo = LADOS.find(function (l) { return l.value === user.lado; });
  const relation = esTu
    ? { label: "El teu perfil", color: C.secondary, bg: C.surfaceAlt, border: C.border, bar: C.primary }
    : esAmic
      ? { label: "Amic", color: dark ? "#86efac" : "#15803d", bg: dark ? "rgba(34,197,94,.14)" : "#f0fdf4", border: dark ? "rgba(74,222,128,.32)" : "#86efac", bar: "#22c55e" }
      : solicitudRebuda
        ? { label: "Sol·licitud rebuda", color: dark ? "#fcd34d" : "#92400e", bg: dark ? "rgba(245,158,11,.14)" : "#fffbeb", border: dark ? "rgba(251,191,36,.32)" : "#fde68a", bar: "#f59e0b" }
        : solicitudEnviada
          ? { label: "Sol·licitud enviada", color: dark ? "#93c5fd" : "#1d4ed8", bg: dark ? "rgba(59,130,246,.14)" : "#eff6ff", border: dark ? "rgba(96,165,250,.32)" : "#bfdbfe", bar: "#60a5fa" }
          : { label: "No és amic", color: C.secondary, bg: C.surfaceAlt, border: C.border, bar: "#9ca3af" };

  function relationButtons() {
    if (esTu) return <Button variant="default" disabled theme={C} dark={dark}>El teu perfil</Button>;
    if (esAmic) {
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button variant="danger" onClick={function () { onEliminarAmic && onEliminarAmic(user); }} theme={C} dark={dark}>
            Eliminar
          </Button>
        </div>
      );
    }
    if (solicitudRebuda) {
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button variant="primary" disabled={actionLoading} onClick={function () { runAction(function () { return onRespondSolicitud && onRespondSolicitud(solicitudRebuda.id, "acceptada", user); }); }} theme={C} dark={dark}>
            {actionLoading ? "Desant..." : "Acceptar"}
          </Button>
          <Button disabled={actionLoading} onClick={function () { runAction(function () { return onRespondSolicitud && onRespondSolicitud(solicitudRebuda.id, "rebutjada", user); }); }} theme={C} dark={dark}>
            Rebutjar
          </Button>
        </div>
      );
    }
    if (solicitudEnviada) return <Button variant="amber" disabled theme={C} dark={dark}>Sol·licitud enviada</Button>;
    return (
      <Button variant="primary" disabled={actionLoading} onClick={function () { runAction(function () { return onEnviarSolicitud && onEnviarSolicitud(user); }); }} theme={C} dark={dark}>
        {actionLoading ? "Enviant..." : "Afegir amic"}
      </Button>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: -0.3 }}>
            Perfil d'usuari
          </h2>
          <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 13 }}>
            Informació pública i activitat de partits oberts
          </p>
        </div>
        <Button onClick={onBack} theme={C} dark={dark}>Tornar</Button>
      </div>

      <section style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 18 }}>
        <div style={{ height: 3, background: relation.bar }} />
        <div style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
              <UserAvatar user={user} size={72} outline={`1px solid ${C.border}`} outlineOffset={2} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>
                    {user.nombre || "Usuario"}
                  </h3>
                  <span style={{ fontSize: 11, fontWeight: 800, color: relation.color, background: relation.bg, border: "1px solid " + relation.border, borderRadius: 20, padding: "3px 9px" }}>
                    {relation.label}
                  </span>
                </div>
                {puedeVerContacto && (user.email || user.telefono) ? (
                  <div style={{ fontSize: 13, color: C.muted }}>
                    {user.email && (
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </div>
                    )}
                    {user.telefono && (
                      <div style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.telefono}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    @{(user.nombre || "usuario").toLowerCase().replace(/\s+/g, ".")}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              {relationButtons()}
            </div>
          </div>

          <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

          <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
            <StatItem value={reservasUsuario} label="Reserves" color={dark ? "#86efac" : "#1a2e1a"} border C={C} />
            <StatItem value={partitsUsuario} label="Partits" color={dark ? "#93c5fd" : "#2563eb"} border C={C} />
            <StatItem value={amigosCount} label="Amics" color={dark ? "#6ee7b7" : "#059669"} C={C} />
          </div>
        </div>
      </section>

      {(manoInfo || ladoInfo) && (
        <section style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,.04)", marginBottom: 18, overflow: "hidden" }}>
          <div style={{ padding: "18px 28px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 16 }}>
              Preferències del jugador
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {manoInfo && (
                <PreferenceCard
                  icon="👋"
                  title={manoInfo.label}
                  subtitle="Mà preferida"
                  C={C}
                />
              )}
              {ladoInfo && (
                <PreferenceCard
                  icon="📍"
                  title={ladoInfo.label}
                  subtitle="Posició a la pista"
                  C={C}
                />
              )}
            </div>
          </div>
        </section>
      )}

      <section style={{ background: C.surface, border: "1px solid " + C.border, borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.text }}>
            Partits públics
          </h3>
          <span style={{ fontSize: 11, fontWeight: 800, background: C.surfaceAlt, color: C.secondary, border: "1px solid " + C.border, borderRadius: 20, padding: "2px 8px" }}>
            {partidosPublicos.length}
          </span>
        </div>

        {partidosPublicos.length === 0 ? (
          <div style={{ border: "1px dashed " + C.border, borderRadius: 10, padding: "24px 14px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            No té partits oberts pròxims.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {partidosPublicos.map(function (r) {
              const jugadores = (r.jugadores || []).map(function (id) {
                return usersMap.get(id) || { id, nombre: "?" };
              });
              return (
                <div key={r.id} style={{ border: "1px solid " + C.border, borderRadius: 10, padding: "12px 14px", background: C.surfaceAlt }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{formatFecha(r.fecha)} - {r.hora}</div>
                      <div style={{ marginTop: 2, fontSize: 12, color: C.secondary }}>
                        {r.userId === user.id ? "Organitzador" : "Hi participa"} - {(r.jugadores || []).length}/4
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: dark ? "#93c5fd" : "#1d4ed8", background: dark ? "rgba(59,130,246,.14)" : "#eff6ff", border: `1px solid ${dark ? 'rgba(96,165,250,.32)' : '#bfdbfe'}`, borderRadius: 20, padding: "3px 9px" }}>
                      Obert
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {jugadores.map(function (jugador) {
                      const jugadorEsTu = jugador.id === session?.id;
                      return (
                        <UserAvatar
                          key={jugador.id}
                          user={jugadorEsTu ? session : jugador}
                          size={30}
                          outline={jugador.id === r.userId ? `2px solid ${dark ? '#cbd5e1' : '#374151'}` : jugadorEsTu ? "2px solid #60a5fa" : "none"}
                          outlineOffset={2}
                          onClick={function () { if (onOpenUserProfile) onOpenUserProfile(jugadorEsTu ? session : jugador); }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
