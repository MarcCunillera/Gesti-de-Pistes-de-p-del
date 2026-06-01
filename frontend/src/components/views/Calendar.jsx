import { useState, useEffect } from "react";
import { hoy, formatFecha } from "../../utils/helpers";
import UserAvatar from "../UserAvatar";

function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return width;
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const ESTADOS = {
  libre:     { bg: "#f0fdf4", border: "#86efac", color: "#16a34a", dot: "#22c55e",    label: "Libre" },
  ocupado:   { bg: "#fef2f2", border: "#fca5a5", color: "#dc2626", dot: "#ef4444",    label: "Ocupado" },
  propio:    { bg: "#fffbeb", border: "#fcd34d", color: "#d97706", dot: "#f59e0b",    label: "Tu reserva" },
  unido:     { bg: "#eff6ff", border: "#93c5fd", color: "#2563eb", dot: "#60a5fa",    label: "Participas" },
  abierto:   { bg: "#f0f9ff", border: "#7dd3fc", color: "#0284c7", dot: "#38bdf8",    label: "Partido abierto" },
  bloqueado: { bg: "#f9fafb", border: "#e5e7eb", color: "#9ca3af", dot: "#d1d5db",    label: "Bloqueado" },
  pasado:    { bg: "transparent", border: "transparent", color: "#d1d5db", dot: null, label: "" },
};

const LEYENDA = ["libre", "ocupado", "propio", "abierto", "unido", "bloqueado"];

function Dot({ color, size = 8 }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function Celda({ estado, sublabel, onClick, esHoy }) {
  const [hover, setHover] = useState(false);
  const e = ESTADOS[estado];
  const activo = !!onClick;
  if (estado === "pasado") {
    return (
      <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: "#e5e7eb" }}>—</span>
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover && activo ? (estado === "libre" ? "#dcfce7" : e.bg) : e.bg,
        border: `1.5px solid ${hover && activo ? e.border : esHoy ? e.border : e.border + "99"}`,
        borderRadius: 8,
        padding: "7px 6px",
        cursor: activo ? "pointer" : "default",
        transition: "box-shadow 0.15s, transform 0.12s",
        transform: hover && activo ? "scale(1.03)" : "none",
        boxShadow: hover && activo ? `0 3px 10px ${e.dot}44` : "none",
        minHeight: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
      }}
    >
      <Dot color={e.dot} size={7} />
      <span style={{ fontSize: 10, fontWeight: 700, color: e.color, whiteSpace: "nowrap" }}>
        {sublabel || e.label}
      </span>
    </div>
  );
}

export default function Calendar({ session, fechas, HORARIOS, config, esBloqueado, getReserva, setBaseDate, baseDate, setAdminModal, setReservaModal, setPartidoModal, reservas, users, amics, pedirUnirse, t }) {
  const width = useWindowWidth();
  const esMobil = width < 640;
  const [diaAbierto, setDiaAbierto] = useState(null);

  const surface    = t?.surface    || "#ffffff";
  const surfaceAlt = t?.surfaceAlt || "#f9fafb";
  const border     = t?.border     || "#e5e7eb";
  const borderL    = t?.borderLight|| "#f3f4f6";
  const textMain   = t?.text       || "#111827";
  const textMuted  = t?.textMuted  || "#6b7280";
  const primary    = t?.primary    || "#14532d";

  const misF = new Set(
    (reservas || [])
      .filter(r => r.userId === session.id && r.estado === "confirmada" && new Date(`${r.fecha}T${r.hora}`) >= new Date())
      .map(r => r.fecha)
  );

  const calcEstado = (fecha, hora) => {
    const bloq   = esBloqueado(fecha, hora);
    const res    = getReserva(fecha, hora);
    const esPropia     = res?.userId === session.id;
    const yaEnPartido  = res?.jugadores?.includes(session.id) && !esPropia;
    const partidoAbierto = res?.abierto && !esPropia && !yaEnPartido;
    const pasado = new Date(`${fecha}T${hora}`) < new Date();
    let estado, sublabel, onClick;

    if (bloq) {
      estado  = "bloqueado";
      onClick = session.rol === "admin" ? () => setAdminModal({ fecha, hora, res: null, bloq: true }) : null;
    } else if (res) {
      if (esPropia) {
        estado   = "propio";
        sublabel = res.abierto ? `${res.jugadores?.length}/4` : undefined;
        onClick  = session.rol === "admin" ? () => setAdminModal({ fecha, hora, res, bloq: false }) : null;
      } else if (yaEnPartido) {
        estado   = "unido";
        sublabel = `${res.jugadores?.length}/4`;
        onClick  = () => setPartidoModal({ reserva: res });
      } else if (partidoAbierto) {
        estado   = "abierto";
        sublabel = `${res.jugadores?.length}/4`;
        onClick  = () => setPartidoModal({ reserva: res });
      } else {
        estado  = "ocupado";
        onClick = session.rol === "admin" ? () => setAdminModal({ fecha, hora, res, bloq: false }) : null;
      }
    } else if (pasado) {
      estado  = "pasado";
      onClick = session.rol === "admin" ? () => setAdminModal({ fecha, hora, res: null, bloq: false }) : null;
    } else {
      estado  = "libre";
      onClick = session.rol === "admin"
        ? () => setAdminModal({ fecha, hora, res: null, bloq: false })
        : () => setReservaModal({ fecha, hora });
    }
    return { estado, sublabel, onClick };
  };

  const irAtras = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - config.diasVista);
    setBaseDate(d.toISOString().split("T")[0]);
  };
  const irAdelante = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + config.diasVista);
    setBaseDate(d.toISOString().split("T")[0]);
  };

  const BtnNav = ({ onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px", background: surface, color: textMain,
        border: `1.5px solid ${border}`, borderRadius: 8, cursor: "pointer",
        fontSize: 13, fontWeight: 600, transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = surfaceAlt}
      onMouseLeave={e => e.currentTarget.style.background = surface}
    >
      {children}
    </button>
  );

  // ── Cabecera ──────────────────────────────────────────
  const Cabecera = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: primary, letterSpacing: -0.5 }}>
          Disponibilidad
        </h2>
        <p style={{ margin: "3px 0 0", fontSize: 13, color: textMuted }}>
          Selecciona una franja horaria para reservar
        </p>
      </div>
      {session.rol === "admin" && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <BtnNav onClick={irAtras}>‹ Anterior</BtnNav>
          <button
            onClick={() => setBaseDate(hoy())}
            style={{ padding: "8px 18px", background: primary, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            Hoy
          </button>
          <BtnNav onClick={irAdelante}>Siguiente ›</BtnNav>
        </div>
      )}
    </div>
  );

  // ── Leyenda ───────────────────────────────────────────
  const Leyenda = (
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
      {LEYENDA.map(k => {
        const e = ESTADOS[k];
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, background: e.bg, border: `1.5px solid ${e.border}`, borderRadius: 20, padding: "4px 12px" }}>
            <Dot color={e.dot} />
            <span style={{ fontSize: 11, fontWeight: 600, color: e.color }}>{e.label}</span>
          </div>
        );
      })}
    </div>
  );

  // ── Partits oberts ──────────────────────────────────────
  const ara = new Date();
  const amicIds = new Set((amics || []).map(a => a.id));
  const partitsOberts = (reservas || [])
    .filter(r => r.abierto && r.estado === "confirmada" && new Date(`${r.fecha}T${r.hora}`) >= ara && r.userId !== session.id && !(r.jugadores || []).includes(session.id))
    .sort((a, b) => (a.fecha + a.hora) > (b.fecha + b.hora) ? 1 : -1);
  const partitsAmics = partitsOberts.filter(r => amicIds.has(r.userId));
  const partitsResta = partitsOberts.filter(r => !amicIds.has(r.userId));
  const partitsOrdenats = [...partitsAmics, ...partitsResta];

  const PartitsOberts = partitsOrdenats.length === 0 ? null : (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: textMain }}>Partidos abiertos</h3>
        <span style={{ fontSize: 11, fontWeight: 700, background: "#e0f2fe", color: "#0284c7", border: "1px solid #7dd3fc", borderRadius: 20, padding: "2px 9px" }}>{partitsOrdenats.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {partitsOrdenats.map(function(r) {
          var org = (users || []).find(function(u) { return u.id === r.userId; });
          var esAmic = amicIds.has(r.userId);
          var lliures = 4 - (r.jugadores?.length || 0);
          return (
            <div key={r.id} style={{ background: surface, borderRadius: 12, border: `1px solid ${border}`, boxShadow: "0 1px 3px rgba(0,0,0,.05)", overflow: "hidden" }}>
              <div style={{ height: 2, background: "#38bdf8" }} />
              <div style={{ padding: "14px 18px" }}>
                {/* Fila superior: info + botó */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: textMain }}>{formatFecha(r.fecha)}</span>
                      <span style={{ fontWeight: 500, fontSize: 14, color: textMuted }}>{r.hora}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 6, padding: "2px 8px" }}>Abierto</span>
                      {esAmic && <span style={{ fontSize: 11, fontWeight: 600, background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 6, padding: "2px 8px" }}>Amigo</span>}
                    </div>
                    <div style={{ fontSize: 12, color: textMuted }}>
                      Organiza <strong style={{ color: textMain, fontWeight: 600 }}>{org?.nombre || "?"}</strong>
                      <span style={{ margin: "0 5px" }}>·</span>
                      <span style={{ fontWeight: 600, color: lliures > 0 ? "#0284c7" : textMuted }}>{r.jugadores?.length}/4</span>
                      {lliures > 0 && <span style={{ color: "#0284c7" }}> · {lliures} {lliures === 1 ? "plaza libre" : "plazas libres"}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => pedirUnirse(r.id, formatFecha(r.fecha), r.hora)}
                    style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0, transition: "opacity 0.12s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    Solicitar Unirse
                  </button>
                </div>
                {/* Avatars jugadors */}
                <div style={{ background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: 10, padding: "12px 14px 8px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
                  {(r.jugadores || []).map(function(id) {
                    var u = (users || []).find(function(x) { return x.id === id; });
                    var esOrg = id === r.userId;
                    return (
                      <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <UserAvatar user={u || { id, nombre: "?" }} size={36} outline={esOrg ? "2px solid #374151" : "none"} outlineOffset={2} />
                        <span style={{ fontSize: 10, color: esOrg ? "#374151" : textMuted, fontWeight: esOrg ? 700 : 400, maxWidth: 52, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{esOrg ? "Org." : u?.nombre?.split(" ")[0] || "?"}</span>
                      </div>
                    );
                  })}
                  {Array.from({ length: lliures }).map(function(_, i) {
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: 0.35 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e2e8f0", border: "1.5px dashed #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 16 }}>+</div>
                        <span style={{ fontSize: 10, color: "#64748b" }}>Libre</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Vista móvil ───────────────────────────────────────
  if (esMobil) {
    return (
      <>
        {Cabecera}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fechas.map(fecha => {
            const esHoy  = fecha === hoy();
            const obert  = diaAbierto === fecha;
            const dia    = new Date(fecha + "T12:00:00");
            const diaNom = DIAS[dia.getDay()];
            const mesNom = MESES[parseInt(fecha.split("-")[1]) - 1];
            const activas = HORARIOS.filter(h => calcEstado(fecha, h).estado !== "pasado");

            return (
              <div key={fecha} style={{ background: surface, borderRadius: 14, border: `1.5px solid ${esHoy ? "#86efac" : border}`, overflow: "hidden", boxShadow: obert ? "0 4px 16px rgba(0,0,0,.08)" : "none" }}>
                <button
                  onClick={() => setDiaAbierto(obert ? null : fecha)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: esHoy ? "#f0fdf4" : surfaceAlt, border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: esHoy ? "#dcfce7" : surface, border: `1.5px solid ${esHoy ? "#86efac" : border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: esHoy ? "#14532d" : textMain, lineHeight: 1 }}>{fecha.split("-")[2]}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: esHoy ? "#16a34a" : textMuted, textTransform: "uppercase", letterSpacing: 0.3 }}>{mesNom}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: esHoy ? "#14532d" : textMain }}>
                        {diaNom}
                        {esHoy && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac", borderRadius: 10, padding: "1px 7px" }}>Hoy</span>}
                        {misF.has(fecha) && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: "#fffbeb", color: "#d97706", border: "1px solid #fcd34d", borderRadius: 10, padding: "1px 7px" }}>Reserva</span>}
                      </div>
                      <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>{activas.length} franjas disponibles</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 20, color: textMuted, display: "inline-block", transform: obert ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
                </button>

                {obert && (
                  <div style={{ borderTop: `1px solid ${borderL}`, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {HORARIOS.map(hora => {
                      const { estado, sublabel, onClick } = calcEstado(fecha, hora);
                      if (estado === "pasado") return null;
                      const e = ESTADOS[estado];
                      return (
                        <div
                          key={hora}
                          onClick={onClick}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: e.bg, border: `1.5px solid ${e.border}`, borderRadius: 10, cursor: onClick ? "pointer" : "default" }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 14, color: textMain }}>{hora}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <Dot color={e.dot} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: e.color }}>{sublabel || e.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {Leyenda}
        {PartitsOberts}
      </>
    );
  }

  // ── Vista escritorio ──────────────────────────────────
  return (
    <>
      {Cabecera}
      <div style={{ background: surface, borderRadius: 16, overflow: "hidden", border: `1px solid ${border}`, boxShadow: "0 1px 4px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {/* Columna hora */}
                <th style={{ width: 72, padding: "14px 16px", textAlign: "left", background: surfaceAlt, borderBottom: `2px solid ${border}`, color: textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, position: "sticky", left: 0, zIndex: 2 }}>
                  Hora
                </th>
                {fechas.map(f => {
                  const esHoy    = f === hoy();
                  const dia      = new Date(f + "T12:00:00");
                  const tieneMia = misF.has(f);
                  return (
                    <th key={f} style={{ minWidth: 96, padding: "10px 8px 8px", textAlign: "center", background: esHoy ? "#f0fdf4" : surfaceAlt, borderBottom: `2px solid ${esHoy ? "#86efac" : border}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: esHoy ? "#16a34a" : textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {f.split("-")[2]} {MESES[parseInt(f.split("-")[1]) - 1]}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: esHoy ? "#14532d" : textMain, marginTop: 1 }}>
                        {DIAS[dia.getDay()]}
                      </div>
                      <div style={{ height: 10, display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 3 }}>
                        {esHoy    && <Dot color="#22c55e" size={6} />}
                        {tieneMia && <Dot color="#f59e0b" size={6} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map((hora, hi) => (
                <tr key={hora} style={{ borderBottom: `1px solid ${borderL}` }}>
                  <td style={{ padding: "4px 16px", background: hi % 2 === 0 ? surfaceAlt : surface, position: "sticky", left: 0, zIndex: 1, borderRight: `1px solid ${borderL}` }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: textMain }}>{hora}</span>
                  </td>
                  {fechas.map(fecha => {
                    const { estado, sublabel, onClick } = calcEstado(fecha, hora);
                    const esHoy = fecha === hoy();
                    return (
                      <td key={fecha} style={{ padding: "4px 5px", background: hi % 2 === 0 ? surfaceAlt : surface, verticalAlign: "middle" }}>
                        <Celda estado={estado} sublabel={sublabel} onClick={onClick} esHoy={esHoy} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {Leyenda}
      {PartitsOberts}
    </>
  );
}
