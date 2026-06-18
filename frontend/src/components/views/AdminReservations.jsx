import { useState } from "react";
import { formatFecha } from "../../utils/helpers";
import UserAvatar from "../UserAvatar";

const TABS = [
  { key: "proximas", label: "Pròximes" },
  { key: "pasadas", label: "Passades" },
  { key: "canceladas", label: "Cancelades" },
  { key: "todas", label: "Totes" },
];

function normalizarBusqueda(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function AdminReservations({ reservas, users, cancelarReserva, onOpenUserProfile, t }) {
  var surface = t?.surface || '#fff';
  var border = t?.border || '#e5e7eb';
  var textMain = t?.text || '#111827';
  var textMuted = t?.textSecondary || '#6b7280';
  var primary = t?.primary || '#1a2e1a';
  var surfaceAlt = t?.surfaceAlt || '#f9fafb';
  var inputBg = t?.inputBg || '#fff';
  var cardShadow = t?.cardShadow || '0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06)';
  var isDark = !['#fff', '#ffffff'].includes((surface || '').toLowerCase());
  const [tab, setTab] = useState("proximas");
  const [busqueda, setBusqueda] = useState("");

  const ahora = new Date();
  const usersMap = new Map((users || []).map((u) => [u.id, u]));

  const getEstadoLabel = (r) => {
    const dt = new Date(`${r.fecha}T${r.hora}`);
    if (r.estado === "cancelada") return "Cancelada";
    if (dt < ahora) return "Completada";
    if (r.abierto) return `Obert ${r.jugadores?.length || 0}/4`;
    return "Privada";
  };

  const conUsuario = reservas.map((r) => ({
    ...r,
    usuario: usersMap.get(r.userId),
    jugadoresData: (r.jugadores || []).map((id) => usersMap.get(id)).filter(Boolean),
  }));

  const filtradas = conUsuario
    .filter((r) => {
      const dt = new Date(`${r.fecha}T${r.hora}`);
      if (tab === "proximas") return r.estado === "confirmada" && dt >= ahora;
      if (tab === "pasadas") return r.estado === "confirmada" && dt < ahora;
      if (tab === "canceladas") return r.estado === "cancelada";
      return true;
    })
    .filter((r) => {
      const q = normalizarBusqueda(busqueda);
      if (!q) return true;
      const campos = [
        r.usuario?.nombre,
        r.usuario?.email,
        r.fecha,
        formatFecha(r.fecha),
        r.hora,
        r.estado,
        r.abierto ? "obert partit obert" : "privat reserva privada",
        getEstadoLabel(r),
        ...r.jugadoresData.map((u) => u.nombre),
        ...r.jugadoresData.map((u) => u.email),
      ];
      return normalizarBusqueda(campos.join(" ")).includes(q);
    })
    .sort((a, b) => {
      const da = new Date(`${a.fecha}T${a.hora}`);
      const db = new Date(`${b.fecha}T${b.hora}`);
      return tab === "pasadas" || tab === "canceladas" ? db - da : da - db;
    });

  const proximas = conUsuario.filter((r) => r.estado === "confirmada" && new Date(`${r.fecha}T${r.hora}`) >= ahora).length;
  const pasadas = conUsuario.filter((r) => r.estado === "confirmada" && new Date(`${r.fecha}T${r.hora}`) < ahora).length;
  const canceladas = conUsuario.filter((r) => r.estado === "cancelada").length;
  const partidos = conUsuario.filter((r) => r.estado === "confirmada" && r.abierto && new Date(`${r.fecha}T${r.hora}`) >= ahora).length;

  const statCard = (label, value, bg, color) => (
    <div style={{ background: bg, borderRadius: 12, padding: "14px 20px", flex: 1, minWidth: 100, border: `1px solid ${isDark ? border : 'transparent'}` }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color, opacity: 0.75, marginTop: 2 }}>{label}</div>
    </div>
  );

  const estadoBadge = (r) => {
    const dt = new Date(`${r.fecha}T${r.hora}`);
    if (r.estado === "cancelada") return { label: "Cancelada", bg: isDark ? "rgba(239,68,68,.12)" : "#fef2f2", color: isDark ? "#fca5a5" : "#dc2626", border: isDark ? "rgba(248,113,113,.32)" : "#fecaca", bar: "#f87171" };
    if (dt < ahora) return { label: "Completada", bg: isDark ? "rgba(34,197,94,.14)" : "#f0fdf4", color: isDark ? "#86efac" : "#15803d", border: isDark ? "rgba(74,222,128,.32)" : "#bbf7d0", bar: "#4ade80" };
    if (r.abierto) return { label: `Obert ${r.jugadores?.length}/4`, bg: isDark ? "rgba(59,130,246,.14)" : "#eff6ff", color: isDark ? "#93c5fd" : "#1d4ed8", border: isDark ? "rgba(96,165,250,.32)" : "#bfdbfe", bar: "#60a5fa" };
    return { label: "Privada", bg: isDark ? "rgba(34,197,94,.14)" : "#f0fdf4", color: isDark ? "#86efac" : "#15803d", border: isDark ? "rgba(74,222,128,.32)" : "#bbf7d0", bar: "#4ade80" };
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: textMain, margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Historial de reserves</h2>
        <p style={{ margin: 0, color: textMuted, fontSize: 13 }}>{reservas.length} reserves en total</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {statCard("Pròximes", proximas, isDark ? "rgba(74,222,128,.12)" : "#e8f5e9", isDark ? "#86efac" : "#1a472a")}
        {statCard("Completades", pasadas, isDark ? "rgba(34,197,94,.14)" : "#f0fdf4", isDark ? "#86efac" : "#16a34a")}
        {statCard("Cancelades", canceladas, isDark ? "rgba(239,68,68,.12)" : "#fef2f2", isDark ? "#fca5a5" : "#c0392b")}
        {statCard("Partits oberts", partidos, isDark ? "rgba(59,130,246,.14)" : "#e8f0fe", isDark ? "#93c5fd" : "#1a73e8")}
      </div>

      {/* Tabs + búsqueda */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", background: surfaceAlt, borderRadius: 10, padding: 3, gap: 2, border: `1px solid ${border}`, width: "100%", boxSizing: "border-box", overflowX: "auto", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ background: tab === t.key ? surface : 'transparent', color: tab === t.key ? primary : textMuted, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: tab === t.key ? 700 : 500, fontSize: 13, boxShadow: tab === t.key ? (isDark ? '0 1px 4px rgba(0,0,0,.28)' : '0 1px 4px rgba(0,0,0,.1)') : "none", transition: "all 0.15s" }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar usuari, jugador, data..."
          style={{ flex: 1, minWidth: 180, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}`, fontSize: 13, outline: 'none', background: isDark ? surfaceAlt : inputBg, color: textMain }}
        />
      </div>

      {/* Lista */}
      {filtradas.length === 0 ? (
        <div style={{ background: surface, borderRadius: 14, padding: "40px 24px", textAlign: "center", border: `1px solid ${border}`, color: textMuted }}>
          <div style={{ fontSize: 14 }}>No hi ha reserves en aquesta secció</div>
        </div>
      ) : (
        <div>
          {filtradas.map((r) => {
            const badge = estadoBadge(r);
            const esPasadaOCancelada = r.estado === "cancelada" || new Date(`${r.fecha}T${r.hora}`) < ahora;
            return (
              <div key={r.id} style={{ background: surface, borderRadius: 12, overflow: "hidden", boxShadow: isDark ? cardShadow : '0 1px 3px rgba(0,0,0,.05)', marginBottom: 10, border: `1px solid ${border}`, opacity: esPasadaOCancelada ? 0.8 : 1 }}>
                <div style={{ height: 2, background: badge.bar }} />
                <div style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: textMain }}>{formatFecha(r.fecha)}</span>
                      <span style={{ fontWeight: 500, fontSize: 14, color: textMuted }}>{r.hora}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, borderRadius: 6, padding: "2px 8px", letterSpacing: 0 }}>
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: textMuted }}>
                      <UserAvatar user={r.usuario || { id: r.userId, nombre: "?" }} size={22} onClick={function() { if (onOpenUserProfile) onOpenUserProfile(r.usuario || { id: r.userId, nombre: "?" }); }} />
                      <span style={{ fontWeight: 600 }}>{r.usuario?.nombre || "Usuari eliminat"}</span>
                      {r.jugadores?.length > 1 && (
                        <span style={{ color: textMuted, fontSize: 12 }}>
                          · {r.jugadoresData.map((u) => u.nombre).filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.estado === "confirmada" && new Date(`${r.fecha}T${r.hora}`) >= ahora ? (
                    <button
                      onClick={() => cancelarReserva(r.id, r)}
                      style={{ background: isDark ? "rgba(239,68,68,.12)" : "#fff", color: isDark ? "#fca5a5" : "#dc2626", border: `1px solid ${isDark ? 'rgba(248,113,113,.32)' : '#fca5a5'}`, borderRadius: 7, padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12, flexShrink: 0 }}
                    >
                      Cancel·lar
                    </button>
                  ) : (
                    <span style={{ fontSize: 13, color: textMuted, flexShrink: 0 }}>
                      {r.estado === "cancelada" ? "✕" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: textMuted, textAlign: "center", marginTop: 8 }}>
            {filtradas.length} resultat{filtradas.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
