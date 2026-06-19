import { useMemo, useState } from "react";
import { generarHorarios, hoy } from "../../utils/helpers";

const SECCIONES = [
  { key: "calendario", label: "Calendari" },
  { key: "reservas", label: "Reserves" },
  { key: "bloqueos", label: "Bloquejos" },
];

const DIAS_SEMANA = [
  { key: 1, label: "Dilluns", short: "Dl" },
  { key: 2, label: "Dimarts", short: "Dt" },
  { key: 3, label: "Dimecres", short: "Dc" },
  { key: 4, label: "Dijous", short: "Dj" },
  { key: 5, label: "Divendres", short: "Dv" },
  { key: 6, label: "Dissabte", short: "Ds" },
  { key: 0, label: "Diumenge", short: "Dg" },
];

const TODOS_LOS_DIAS = DIAS_SEMANA.map((d) => d.key);

function splitList(value) {
  if (!value) return [];
  return String(value).split(",").map((x) => x.trim()).filter(Boolean);
}

function weekdayFromDate(fecha) {
  const [y, m, d] = String(fecha).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

function formatDate(fecha) {
  if (!fecha) return "";
  const [y, m, d] = String(fecha).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function buildBloqueoGroups(bloqueados) {
  const map = new Map();
  (bloqueados || []).forEach((b) => {
    const key = b.group_id || `legacy-${b.id}`;
    if (!map.has(key)) {
      map.set(key, {
        groupId: key,
        isLegacy: !b.group_id,
        label: b.label || "",
        fechaInicio: b.fecha_inicio || b.fecha,
        fechaFin: b.fecha_fin || b.fecha,
        diasSemana: splitList(b.dias_semana).map(Number).filter((n) => Number.isInteger(n)),
        horas: splitList(b.horas),
        items: [],
      });
    }
    const group = map.get(key);
    group.items.push(b);
    if (!group.label && b.label) group.label = b.label;
    if (!group.fechaInicio || b.fecha < group.fechaInicio) group.fechaInicio = b.fecha;
    if (!group.fechaFin || b.fecha > group.fechaFin) group.fechaFin = b.fecha;
    if (!group.horas.includes(b.hora)) group.horas.push(b.hora);
    const dia = weekdayFromDate(b.fecha);
    if (!group.diasSemana.includes(dia)) group.diasSemana.push(dia);
  });

  return Array.from(map.values())
    .map((g) => ({
      ...g,
      diasSemana: g.diasSemana.sort((a, b) => TODOS_LOS_DIAS.indexOf(a) - TODOS_LOS_DIAS.indexOf(b)),
      horas: g.horas.sort(),
    }))
    .sort((a, b) => `${a.fechaInicio}-${a.horas[0] || ""}`.localeCompare(`${b.fechaInicio}-${b.horas[0] || ""}`));
}

function Field({ label, desc, children, C }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", color: C.text, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{label}</label>
      {desc ? <div style={{ color: C.muted, fontSize: 12, marginBottom: 7 }}>{desc}</div> : null}
      {children}
    </div>
  );
}

function Button({ C, children, onClick, variant = "secondary", disabled, style }) {
  const styles = {
    primary: { bg: C.primary, color: C.primaryText, border: C.primary },
    secondary: { bg: C.surface, color: C.text, border: C.border },
    subtle: { bg: C.surfaceAlt, color: C.text, border: C.border },
    danger: { bg: C.dangerBg, color: C.danger, border: C.dangerBorder },
  };
  const s = styles[variant] || styles.secondary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? C.disabledBg : s.bg,
        color: disabled ? C.disabledText : s.color,
        border: `1px solid ${disabled ? C.border : s.border}`,
        borderRadius: 8,
        padding: "9px 13px",
        minHeight: 38,
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, C, style }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export default function Settings({
  config,
  configEdit,
  setConfigEdit,
  guardarConfig,
  HORARIOS,
  bloquearRango,
  bloqueados,
  desbloquearTodo: propDesbloquear,
  actualizarBloqueoGrupo,
  eliminarBloqueoGrupo,
  t,
}) {
  const isDark = !["#fff", "#ffffff"].includes((t?.surface || "#fff").toLowerCase());
  const C = {
    surface: t?.surface || "#fff",
    surfaceAlt: t?.surfaceAlt || "#f9fafb",
    input: t?.inputBg || "#fff",
    border: t?.border || "#e5e7eb",
    borderSoft: t?.borderLight || "#f3f4f6",
    text: t?.text || "#111827",
    muted: t?.textSecondary || "#6b7280",
    faint: t?.textMuted || "#9ca3af",
    primary: t?.primary || "#1a472a",
    primaryText: isDark ? "#0f172a" : "#fff",
    link: isDark ? "#93c5fd" : "#1a73e8",
    shadow: isDark ? (t?.cardShadow || "0 1px 3px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.2)") : "0 1px 3px rgba(0,0,0,.04)",
    danger: isDark ? "#fca5a5" : "#dc2626",
    dangerBg: isDark ? "rgba(239,68,68,.12)" : "#fff",
    dangerSoft: isDark ? "rgba(239,68,68,.12)" : "#fef2f2",
    dangerBorder: isDark ? "rgba(248,113,113,.32)" : "#fca5a5",
    ok: isDark ? "#86efac" : "#15803d",
    okBg: isDark ? "rgba(34,197,94,.14)" : "#f0fdf4",
    okBorder: isDark ? "rgba(74,222,128,.32)" : "#bbf7d0",
    warn: isDark ? "#fcd34d" : "#92400e",
    warnBg: isDark ? "rgba(245,158,11,.14)" : "#fffbeb",
    warnBorder: isDark ? "rgba(251,191,36,.32)" : "#fde68a",
    disabledBg: isDark ? "#0f172a" : "#f3f4f6",
    disabledText: t?.textMuted || "#9ca3af",
  };

  const inputBase = {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 40,
    padding: "9px 12px",
    borderRadius: 8,
    border: `1.5px solid ${C.border}`,
    background: C.input,
    color: C.text,
    outline: "none",
    fontSize: 14,
  };

  const emptyRango = () => ({ inicio: hoy(), fin: hoy(), diasSemana: [], horas: [], label: "" });
  const [seccion, setSeccion] = useState("calendario");
  const [rango, setRango] = useState(emptyRango);
  const [editGroupId, setEditGroupId] = useState(null);
  const [rangoMsg, setRangoMsg] = useState(null);
  const [guardado, setGuardado] = useState(false);

  const franjas = generarHorarios(configEdit.horaInicio, configEdit.horaFin, configEdit.duracion);
  const gruposBloqueo = useMemo(() => buildBloqueoGroups(bloqueados), [bloqueados]);
  const totalFranjasBloqueadas = bloqueados?.length || 0;

  const hasChanges =
    configEdit.horaInicio !== config.horaInicio ||
    configEdit.horaFin !== config.horaFin ||
    configEdit.duracion !== config.duracion ||
    configEdit.diasVista !== config.diasVista ||
    (configEdit.maxReservas ?? 3) !== (config.maxReservas ?? 3);

  const toggleHora = (h) => {
    setRango((r) => ({ ...r, horas: r.horas.includes(h) ? r.horas.filter((x) => x !== h) : [...r.horas, h] }));
  };

  const toggleDiaSemana = (dia) => {
    setRango((r) => ({ ...r, diasSemana: r.diasSemana.includes(dia) ? r.diasSemana.filter((x) => x !== dia) : [...r.diasSemana, dia] }));
  };

  const resetBloqueoForm = () => {
    setRango(emptyRango());
    setEditGroupId(null);
  };

  const handleGuardar = () => {
    guardarConfig();
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const aplicarRango = () => {
    if (!rango.inicio || !rango.fin || rango.diasSemana.length === 0 || rango.horas.length === 0) {
      setRangoMsg({ tipo: "error", txt: "Selecciona un rang de dates, dies de la setmana i almenys una franja." });
      return;
    }
    if (rango.fin < rango.inicio) {
      setRangoMsg({ tipo: "error", txt: "La data de fi no pot ser anterior a la d'inici." });
      return;
    }

    const payload = {
      fechaInicio: rango.inicio,
      fechaFin: rango.fin,
      horas: rango.horas,
      diasSemana: rango.diasSemana,
      label: rango.label,
    };

    const action = editGroupId && actualizarBloqueoGrupo
      ? actualizarBloqueoGrupo(editGroupId, payload)
      : bloquearRango(rango.inicio, rango.fin, rango.horas, rango.diasSemana, rango.label);

    Promise.resolve(action).then(() => {
      const diasTxt = rango.diasSemana.length === TODOS_LOS_DIAS.length
        ? "tots els dies"
        : DIAS_SEMANA.filter((d) => rango.diasSemana.includes(d.key)).map((d) => d.label).join(", ");
      setRangoMsg({ tipo: "ok", txt: `${editGroupId ? "Bloqueig actualitzat" : "Franges bloquejades"} del ${rango.inicio} al ${rango.fin} (${diasTxt}).` });
      resetBloqueoForm();
      setTimeout(() => setRangoMsg(null), 3000);
    }).catch(() => {});
  };

  const editarGrupo = (grupo) => {
    setEditGroupId(grupo.groupId);
    setRango({
      inicio: grupo.fechaInicio || hoy(),
      fin: grupo.fechaFin || grupo.fechaInicio || hoy(),
      diasSemana: grupo.diasSemana || [],
      horas: grupo.horas || [],
      label: grupo.label || "",
    });
    setRangoMsg(null);
  };

  const eliminarGrupo = (grupo) => {
    if (!window.confirm("Vols eliminar aquest bloqueig?")) return;
    if (grupo.isLegacy || !eliminarBloqueoGrupo) {
      setRangoMsg({ tipo: "error", txt: "Aquest bloqueig antic s'actualitzarà quan s'apliquin les migracions." });
      return;
    }
    eliminarBloqueoGrupo(grupo.groupId);
    if (editGroupId === grupo.groupId) resetBloqueoForm();
  };

  const desbloquearTodo = () => {
    if (!window.confirm("Vols desbloquejar totes les franges bloquejades?")) return;
    if (propDesbloquear) propDesbloquear();
    resetBloqueoForm();
  };

  const pageMaxWidth = seccion === "bloqueos" ? 980 : 760;

  const renderHeader = (title, desc, right) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
      <div>
        <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{title}</h3>
        {desc ? <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 13, lineHeight: 1.4 }}>{desc}</p> : null}
      </div>
      {right}
    </div>
  );

  const renderSaveBar = () => (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.borderSoft}` }}>
      {hasChanges ? (
        <div style={{ marginBottom: 12, background: C.warnBg, color: C.warn, border: `1px solid ${C.warnBorder}`, borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 700 }}>
          Tens canvis sense desar
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button C={C} variant="primary" onClick={handleGuardar} style={{ flex: "1 1 180px" }}>
          {guardado ? "Desat" : "Desar configuració"}
        </Button>
        <Button C={C} variant="subtle" disabled={!hasChanges} onClick={() => setConfigEdit(config)}>
          Descartar
        </Button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: pageMaxWidth, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ color: C.text, margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Configuració</h2>
        <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>Gestiona els horaris, els límits i els bloquejos de la pista.</p>
      </div>

      <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 10, padding: 3, gap: 2, border: `1px solid ${C.border}`, marginBottom: 16, overflowX: "auto" }}>
        {SECCIONES.map((s) => {
          const active = seccion === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSeccion(s.key)}
              style={{
                flex: 1,
                minWidth: 115,
                background: active ? C.surface : "transparent",
                color: active ? C.primary : C.muted,
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                boxShadow: active ? (isDark ? "0 1px 4px rgba(0,0,0,.28)" : "0 1px 4px rgba(0,0,0,.1)") : "none",
              }}
            >
              {s.label}
              {s.key === "bloqueos" && gruposBloqueo.length > 0 ? (
                <span style={{ marginLeft: 7, background: C.dangerSoft, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: 999, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>
                  {gruposBloqueo.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {seccion === "calendario" && (
        <Card C={C}>
          {renderHeader("Calendari", "Defineix les franges disponibles i la vista del calendari.")}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            <Field C={C} label="Hora d'inici" desc="Primera franja disponible">
              <input type="time" value={configEdit.horaInicio} onChange={(e) => setConfigEdit((c) => ({ ...c, horaInicio: e.target.value }))} style={inputBase} />
            </Field>
            <Field C={C} label="Hora de fi" desc="Última franja disponible">
              <input type="time" value={configEdit.horaFin} onChange={(e) => setConfigEdit((c) => ({ ...c, horaFin: e.target.value }))} style={inputBase} />
            </Field>
            <Field C={C} label="Durada" desc="Temps per reserva">
              <select value={configEdit.duracion} onChange={(e) => setConfigEdit((c) => ({ ...c, duracion: Number(e.target.value) }))} style={{ ...inputBase, cursor: "pointer" }}>
                {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minuts</option>)}
              </select>
            </Field>
            <Field C={C} label="Dies visibles" desc="Vista del calendari">
              <select value={configEdit.diasVista} onChange={(e) => setConfigEdit((c) => ({ ...c, diasVista: Number(e.target.value) }))} style={{ ...inputBase, cursor: "pointer" }}>
                {[3, 5, 7].map((d) => <option key={d} value={d}>{d} dies</option>)}
              </select>
            </Field>
          </div>

          <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.muted, fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span><strong style={{ color: C.text }}>{configEdit.horaInicio} - {configEdit.horaFin}</strong></span>
            <span>{configEdit.duracion} min/franja</span>
            <span>{franjas.length} franges · {configEdit.diasVista} dies</span>
          </div>

          {renderSaveBar()}
        </Card>
      )}

      {seccion === "reservas" && (
        <Card C={C}>
          {renderHeader("Política de reserves", "Controla quantes reserves actives pot tenir cada usuari.")}

          <div style={{ maxWidth: 360 }}>
            <Field C={C} label="Límit de reserves per usuari" desc="Màxim de reserves actives simultànies">
              <select value={configEdit.maxReservas ?? 3} onChange={(e) => setConfigEdit((c) => ({ ...c, maxReservas: Number(e.target.value) }))} style={{ ...inputBase, cursor: "pointer" }}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} reserva{n !== 1 ? "s" : ""} màxim</option>)}
              </select>
            </Field>
          </div>

          <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", color: C.muted, fontSize: 13, lineHeight: 1.55 }}>
            <div style={{ color: C.text, fontWeight: 700, marginBottom: 4 }}>Resum actual</div>
            <div>Cada usuari pot tenir fins a <strong style={{ color: C.text }}>{configEdit.maxReservas ?? 3}</strong> reserves actives simultànies.</div>
            <div>Les reserves passades no compten per al límit.</div>
          </div>

          {renderSaveBar()}
        </Card>
      )}

      {seccion === "bloqueos" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, alignItems: "start" }}>
          <Card C={C}>
            {renderHeader(
              editGroupId ? "Modificar bloqueig" : "Nou bloqueig",
              "Selecciona rang, dies, franges i etiqueta.",
              editGroupId ? <Button C={C} variant="subtle" onClick={resetBloqueoForm}>Cancel·lar</Button> : null
            )}

            <Field C={C} label="Etiqueta" desc="Per exemple: classes de pàdel, manteniment o torneig">
              <input type="text" value={rango.label} maxLength={60} placeholder="Classes de pàdel" onChange={(e) => setRango((r) => ({ ...r, label: e.target.value }))} style={inputBase} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <Field C={C} label="Data d'inici">
                <input type="date" value={rango.inicio} min={hoy()} onChange={(e) => setRango((r) => ({ ...r, inicio: e.target.value }))} style={inputBase} />
              </Field>
              <Field C={C} label="Data de fi">
                <input type="date" value={rango.fin} min={rango.inicio} onChange={(e) => setRango((r) => ({ ...r, fin: e.target.value }))} style={inputBase} />
              </Field>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Dies de la setmana</div>
                <button onClick={() => setRango((r) => ({ ...r, diasSemana: r.diasSemana.length === TODOS_LOS_DIAS.length ? [] : TODOS_LOS_DIAS }))} style={{ background: "none", border: "none", color: C.link, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                  {rango.diasSemana.length === TODOS_LOS_DIAS.length ? "Treure'ls tots" : "Seleccionar-los tots"}
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(50px, 1fr))", gap: 6 }}>
                {DIAS_SEMANA.map((dia) => {
                  const selected = rango.diasSemana.includes(dia.key);
                  return (
                    <button
                      key={dia.key}
                      onClick={() => toggleDiaSemana(dia.key)}
                      title={dia.label}
                      style={{
                        minHeight: 38,
                        borderRadius: 8,
                        border: `1.5px solid ${selected ? C.primary : C.border}`,
                        background: selected ? C.primary : C.surfaceAlt,
                        color: selected ? C.primaryText : C.text,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {dia.short}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>Franges horàries</div>
                <button onClick={() => setRango((r) => ({ ...r, horas: r.horas.length === HORARIOS.length ? [] : [...HORARIOS] }))} style={{ background: "none", border: "none", color: C.link, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}>
                  {rango.horas.length === HORARIOS.length ? "Treure-les totes" : "Seleccionar-les totes"}
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {HORARIOS.map((h) => {
                  const selected = rango.horas.includes(h);
                  return (
                    <button
                      key={h}
                      onClick={() => toggleHora(h)}
                      style={{
                        borderRadius: 999,
                        border: `1.5px solid ${selected ? C.primary : C.border}`,
                        background: selected ? C.primary : C.surfaceAlt,
                        color: selected ? C.primaryText : C.text,
                        padding: "7px 11px",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {rangoMsg ? (
              <div style={{ background: rangoMsg.tipo === "ok" ? C.okBg : C.dangerSoft, color: rangoMsg.tipo === "ok" ? C.ok : C.danger, border: `1px solid ${rangoMsg.tipo === "ok" ? C.okBorder : C.dangerBorder}`, borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 13, fontWeight: 700 }}>
                {rangoMsg.txt}
              </div>
            ) : null}

            <Button C={C} variant="primary" onClick={aplicarRango} style={{ width: "100%" }}>
              {editGroupId ? "Desar canvis" : "Crear bloqueig"}
            </Button>
          </Card>

          <Card C={C}>
            {renderHeader(
              "Bloquejos actius",
              `${gruposBloqueo.length} bloqueig${gruposBloqueo.length !== 1 ? "s" : ""} · ${totalFranjasBloqueadas} franja${totalFranjasBloqueadas !== 1 ? "s" : ""}`,
              totalFranjasBloqueadas > 0 ? <Button C={C} variant="danger" onClick={desbloquearTodo}>Eliminar tots</Button> : null
            )}

            {gruposBloqueo.length === 0 ? (
              <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, color: C.muted, fontSize: 13, textAlign: "center" }}>
                No hi ha bloquejos actius.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 9, maxHeight: 560, overflow: "auto", paddingRight: 2 }}>
                {gruposBloqueo.map((grupo) => {
                  const active = editGroupId === grupo.groupId;
                  const diasTxt = grupo.diasSemana.length === TODOS_LOS_DIAS.length
                    ? "Tots els dies"
                    : DIAS_SEMANA.filter((d) => grupo.diasSemana.includes(d.key)).map((d) => d.label).join(", ");
                  return (
                    <div
                      key={grupo.groupId}
                      style={{
                        background: active ? (isDark ? "rgba(74,222,128,.10)" : "#f8faf8") : C.surfaceAlt,
                        border: `1.5px solid ${active ? C.primary : C.border}`,
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 14, overflowWrap: "anywhere" }}>{grupo.label || "Sense etiqueta"}</div>
                          <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Del {formatDate(grupo.fechaInicio)} al {formatDate(grupo.fechaFin)}</div>
                        </div>
                        <span style={{ background: C.dangerSoft, color: C.danger, border: `1px solid ${C.dangerBorder}`, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {grupo.items.length}
                        </span>
                      </div>

                      <div style={{ marginTop: 9, color: C.muted, fontSize: 12, lineHeight: 1.45 }}>
                        <div><strong style={{ color: C.text }}>Dies:</strong> {diasTxt}</div>
                        <div><strong style={{ color: C.text }}>Hores:</strong> {grupo.horas.join(", ")}</div>
                      </div>

                      <div style={{ display: "flex", gap: 8, marginTop: 11 }}>
                        <Button C={C} variant="secondary" onClick={() => editarGrupo(grupo)} style={{ flex: 1 }}>
                          Modificar
                        </Button>
                        <Button C={C} variant="danger" onClick={() => eliminarGrupo(grupo)} style={{ flex: 1 }}>
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
