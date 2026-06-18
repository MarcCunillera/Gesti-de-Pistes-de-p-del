import { useMemo, useState } from "react";
import { generarHorarios, hoy } from "../../utils/helpers";

const SECCIONES = [
  { key: "calendario", label: "Calendari" },
  { key: "reservas", label: "Reserves" },
  { key: "bloqueos", label: "Bloquejos" },
];

const DIAS_SEMANA = [
  { key: 1, label: "Dilluns", short: "L" },
  { key: 2, label: "Dimarts", short: "M" },
  { key: 3, label: "Dimecres", short: "X" },
  { key: 4, label: "Dijous", short: "J" },
  { key: 5, label: "Divendres", short: "V" },
  { key: 6, label: "Dissabte", short: "S" },
  { key: 0, label: "Diumenge", short: "D" },
];

const TODOS_LOS_DIAS = DIAS_SEMANA.map((d) => d.key);

const Field = ({ label, desc, children, textColor, descColor }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontWeight: 700, color: textColor || "#111827", fontSize: 14, display: "block", marginBottom: 2 }}>{label}</label>
      {desc ? <span style={{ fontSize: 12, color: descColor || "#9ca3af" }}>{desc}</span> : null}
    </div>
    {children}
  </div>
);

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
  const surface = t?.surface || "#fff";
  const border = t?.border || "#e5e7eb";
  const textMain = t?.text || "#111827";
  const textMuted = t?.textSecondary || "#6b7280";
  const primary = t?.primary || "#1a2e1a";
  const surfaceAlt = t?.surfaceAlt || "#f9fafb";
  const isDark = !["#fff", "#ffffff"].includes((surface || "").toLowerCase());
  const linkColor = isDark ? "#93c5fd" : "#1a73e8";
  const infoPanel = { background: isDark ? surfaceAlt : "#f8faf8", border: isDark ? border : "#e5e7eb", color: isDark ? textMuted : "#555" };
  const warnPanel = { background: isDark ? "rgba(245,158,11,.14)" : "#fffbeb", border: isDark ? "rgba(251,191,36,.32)" : "#fde68a", color: isDark ? "#fcd34d" : "#92400e" };
  const dangerPanel = { background: isDark ? "rgba(239,68,68,.12)" : "#fef2f2", border: isDark ? "rgba(248,113,113,.32)" : "#fecaca", color: isDark ? "#fca5a5" : "#c0392b", sub: isDark ? "#fda4af" : "#f87171" };
  const okPanel = { background: isDark ? "rgba(34,197,94,.14)" : "#f0fdf4", border: isDark ? "rgba(74,222,128,.32)" : "#86efac", color: isDark ? "#86efac" : "#16a34a" };
  const cardShadow = t?.cardShadow || "0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06)";
  const inputBase = {
    width: "100%", boxSizing: "border-box", padding: "10px 14px",
    border: `1.5px solid ${border}`, borderRadius: 10, fontSize: 14,
    color: textMain, background: t?.inputBg || "#fafafa", outline: "none",
  };
  const selectBase = { ...inputBase, cursor: "pointer" };

  const emptyRango = () => ({ inicio: hoy(), fin: hoy(), diasSemana: [], horas: [], label: "" });
  const [seccion, setSeccion] = useState("calendario");
  const [rango, setRango] = useState(emptyRango);
  const [editGroupId, setEditGroupId] = useState(null);
  const [rangoMsg, setRangoMsg] = useState(null);
  const [guardado, setGuardado] = useState(false);

  const gruposBloqueo = useMemo(() => buildBloqueoGroups(bloqueados), [bloqueados]);

  const hasChanges =
    configEdit.horaInicio !== config.horaInicio ||
    configEdit.horaFin !== config.horaFin ||
    configEdit.duracion !== config.duracion ||
    configEdit.diasVista !== config.diasVista ||
    (configEdit.maxReservas ?? 3) !== (config.maxReservas ?? 3);

  const toggleHora = (h) =>
    setRango((r) => ({ ...r, horas: r.horas.includes(h) ? r.horas.filter((x) => x !== h) : [...r.horas, h] }));

  const toggleDiaSemana = (dia) =>
    setRango((r) => ({ ...r, diasSemana: r.diasSemana.includes(dia) ? r.diasSemana.filter((x) => x !== dia) : [...r.diasSemana, dia] }));

  const resetBloqueoForm = () => {
    setRango(emptyRango());
    setEditGroupId(null);
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
      setRangoMsg({ tipo: "error", txt: "Aquest bloqueig antic s'actualitzara quan s'apliquin les migracions." });
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

  const handleGuardar = () => {
    guardarConfig();
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const franjas = generarHorarios(configEdit.horaInicio, configEdit.horaFin, configEdit.duracion);

  const renderSaveBar = () => (
    <>
      {hasChanges && (
        <div style={{ background: warnPanel.background, border: `1px solid ${warnPanel.border}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: warnPanel.color }}>
          Tens canvis sense desar
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleGuardar}
          style={{ flex: 1, background: guardado ? "#16a34a" : primary, color: guardado ? "#fff" : (isDark ? "#0f172a" : "#fff"), border: "none", borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "background 0.2s" }}
        >
          {guardado ? "✓ Desat" : "Desar configuració"}
        </button>
        <button
          onClick={() => setConfigEdit(config)}
          disabled={!hasChanges}
          style={{ padding: "11px 18px", background: hasChanges ? surfaceAlt : (isDark ? "#0f172a" : "#f3f4f6"), color: hasChanges ? textMain : textMuted, border: `1.5px solid ${border}`, borderRadius: 10, cursor: hasChanges ? "pointer" : "default", fontWeight: 600, fontSize: 14 }}
        >
          Descartar
        </button>
      </div>
    </>
  );

  return (
    <div style={{ maxWidth: seccion === "bloqueos" ? 1080 : 660, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: textMain, margin: "0 0 4px", fontSize: 22, fontWeight: 800 }}>Configuració</h2>
        <p style={{ margin: 0, color: textMuted, fontSize: 13 }}>Configura el funcionament de la pista</p>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <nav style={{ width: 170, flexShrink: 0 }}>
          {SECCIONES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSeccion(s.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: seccion === s.key ? primary : "transparent",
                color: seccion === s.key ? (isDark ? "#0f172a" : "#fff") : textMain,
                border: "none", borderRadius: 10, padding: "10px 14px",
                cursor: "pointer", fontWeight: seccion === s.key ? 700 : 500,
                fontSize: 14, marginBottom: 4, textAlign: "left", transition: "all 0.15s",
              }}
            >
              {s.label}
              {s.key === "bloqueos" && bloqueados?.length > 0 && (
                <span style={{ marginLeft: "auto", background: seccion === s.key ? (isDark ? "rgba(15,23,42,.16)" : "rgba(255,255,255,.25)") : dangerPanel.background, color: seccion === s.key ? (isDark ? "#0f172a" : "#fff") : dangerPanel.color, border: `1px solid ${seccion === s.key ? "transparent" : dangerPanel.border}`, borderRadius: 20, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>
                  {gruposBloqueo.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, minWidth: 280, background: surface, borderRadius: 16, padding: "24px 28px", boxShadow: isDark ? cardShadow : "0 2px 12px rgba(0,0,0,.07)", border: `1px solid ${border}` }}>
          {seccion === "calendario" && (
            <>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: primary }}>Configuració del calendari</h3>
              <Field textColor={textMain} descColor={textMuted} label="Hora d'inici" desc="Primera franja disponible del dia">
                <input type="time" value={configEdit.horaInicio} onChange={(e) => setConfigEdit((c) => ({ ...c, horaInicio: e.target.value }))} style={inputBase} />
              </Field>
              <Field textColor={textMain} descColor={textMuted} label="Hora de fi" desc="Última franja disponible del dia">
                <input type="time" value={configEdit.horaFin} onChange={(e) => setConfigEdit((c) => ({ ...c, horaFin: e.target.value }))} style={inputBase} />
              </Field>
              <Field textColor={textMain} descColor={textMuted} label="Durada de cada franja" desc="Temps per reserva en minuts">
                <select value={configEdit.duracion} onChange={(e) => setConfigEdit((c) => ({ ...c, duracion: Number(e.target.value) }))} style={selectBase}>
                  {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minuts</option>)}
                </select>
              </Field>
              <Field textColor={textMain} descColor={textMuted} label="Dies visibles al calendari" desc="Rang de dies mostrats alhora">
                <select value={configEdit.diasVista} onChange={(e) => setConfigEdit((c) => ({ ...c, diasVista: Number(e.target.value) }))} style={selectBase}>
                  {[3, 5, 7].map((d) => <option key={d} value={d}>{d} dies</option>)}
                </select>
              </Field>

              <div style={{ background: infoPanel.background, border: `1px solid ${infoPanel.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: infoPanel.color, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>{configEdit.horaInicio} – {configEdit.horaFin}</span>
                <span>{configEdit.duracion} min/franja</span>
                <span>{franjas.length} franges · {configEdit.diasVista} dies</span>
              </div>
              {renderSaveBar()}
            </>
          )}

          {seccion === "reservas" && (
            <>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: primary }}>Política de reserves</h3>
              <Field textColor={textMain} descColor={textMuted} label="Límit de reserves per usuari" desc="Màxim de reserves actives simultànies permeses">
                <select value={configEdit.maxReservas ?? 3} onChange={(e) => setConfigEdit((c) => ({ ...c, maxReservas: Number(e.target.value) }))} style={selectBase}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} reserva{n !== 1 ? "s" : ""} màxim</option>)}
                </select>
              </Field>

              <div style={{ background: infoPanel.background, border: `1px solid ${infoPanel.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: infoPanel.color }}>
                <div style={{ fontWeight: 700, color: primary, marginBottom: 6 }}>Resum actual</div>
                <div>· Cada usuari pot tenir fins a <strong>{configEdit.maxReservas ?? 3}</strong> reserves actives simultànies</div>
                <div style={{ marginTop: 4 }}>· Les reserves passades no compten per al límit</div>
              </div>
              {renderSaveBar()}
            </>
          )}

          {seccion === "bloqueos" && (
            <>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: primary }}>
                {editGroupId ? "Modificar bloqueig" : "Bloqueig per rang de dates"}
              </h3>
              <p style={{ margin: "0 0 20px", color: textMuted, fontSize: 13 }}>Crea bloquejos amb etiqueta i gestiona'ls des de la llista del costat.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22, alignItems: "start" }}>
                <div>
                  <Field textColor={textMain} descColor={textMuted} label="Etiqueta" desc="Per exemple: classes de pàdel, manteniment o torneig">
                    <input type="text" value={rango.label} maxLength={60} placeholder="Classes de pàdel" onChange={(e) => setRango((r) => ({ ...r, label: e.target.value }))} style={inputBase} />
                  </Field>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <Field textColor={textMain} descColor={textMuted} label="Data d'inici" desc="">
                        <input type="date" value={rango.inicio} min={hoy()} onChange={(e) => setRango((r) => ({ ...r, inicio: e.target.value }))} style={inputBase} />
                      </Field>
                    </div>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <Field textColor={textMain} descColor={textMuted} label="Data de fi" desc="">
                        <input type="date" value={rango.fin} min={rango.inicio} onChange={(e) => setRango((r) => ({ ...r, fin: e.target.value }))} style={inputBase} />
                      </Field>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ fontWeight: 700, color: textMain, fontSize: 14 }}>Dies de la setmana</label>
                      <button onClick={() => setRango((r) => ({ ...r, diasSemana: r.diasSemana.length === TODOS_LOS_DIAS.length ? [] : TODOS_LOS_DIAS }))} style={{ background: "none", border: "none", color: linkColor, fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}>
                        {rango.diasSemana.length === TODOS_LOS_DIAS.length ? "Treure'ls tots" : "Seleccionar-los tots"}
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(64px, 1fr))", gap: 6 }}>
                      {DIAS_SEMANA.map((dia) => {
                        const sel = rango.diasSemana.includes(dia.key);
                        return (
                          <button
                            key={dia.key}
                            onClick={() => toggleDiaSemana(dia.key)}
                            title={dia.label}
                            style={{ padding: "8px 8px", borderRadius: 8, border: `1.5px solid ${sel ? primary : border}`, background: sel ? primary : surfaceAlt, color: sel ? (isDark ? "#0f172a" : "#fff") : textMain, fontSize: 12, cursor: "pointer", fontWeight: sel ? 700 : 500 }}
                          >
                            <span style={{ display: "block", fontSize: 13 }}>{dia.short}</span>
                            <span style={{ display: "block", fontSize: 11, marginTop: 2 }}>{dia.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <label style={{ fontWeight: 700, color: textMain, fontSize: 14 }}>Franges horàries</label>
                      <button onClick={() => setRango((r) => ({ ...r, horas: r.horas.length === HORARIOS.length ? [] : [...HORARIOS] }))} style={{ background: "none", border: "none", color: linkColor, fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}>
                        {rango.horas.length === HORARIOS.length ? "Treure-les totes" : "Seleccionar-les totes"}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {HORARIOS.map((h) => {
                        const sel = rango.horas.includes(h);
                        return (
                          <button key={h} onClick={() => toggleHora(h)} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${sel ? primary : border}`, background: sel ? primary : surfaceAlt, color: sel ? (isDark ? "#0f172a" : "#fff") : textMain, fontSize: 12, cursor: "pointer", fontWeight: sel ? 700 : 400 }}>
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {rangoMsg && (
                    <div style={{ background: rangoMsg.tipo === "ok" ? okPanel.background : dangerPanel.background, color: rangoMsg.tipo === "ok" ? okPanel.color : dangerPanel.color, border: `1px solid ${rangoMsg.tipo === "ok" ? okPanel.border : dangerPanel.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                      {rangoMsg.txt}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={aplicarRango} style={{ flex: 1, background: primary, color: isDark ? "#0f172a" : "#fff", border: "none", borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                      {editGroupId ? "Desar canvis" : "Bloquejar rang"}
                    </button>
                    {editGroupId && (
                      <button onClick={resetBloqueoForm} style={{ padding: "11px 14px", background: surfaceAlt, color: textMain, border: `1.5px solid ${border}`, borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                        Cancel·lar
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: textMain }}>Bloquejos actius</div>
                      <div style={{ fontSize: 12, color: textMuted }}>{gruposBloqueo.length} bloqueig{gruposBloqueo.length !== 1 ? "s" : ""} · {bloqueados?.length || 0} franja{(bloqueados?.length || 0) !== 1 ? "s" : ""}</div>
                    </div>
                    {bloqueados?.length > 0 && (
                      <button onClick={desbloquearTodo} style={{ background: isDark ? "rgba(239,68,68,.2)" : "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                        Eliminar tots
                      </button>
                    )}
                  </div>

                  {gruposBloqueo.length === 0 ? (
                    <div style={{ background: infoPanel.background, border: `1px solid ${infoPanel.border}`, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: infoPanel.color }}>
                      No hi ha bloquejos actius.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10, maxHeight: 560, overflow: "auto", paddingRight: 2 }}>
                      {gruposBloqueo.map((grupo) => {
                        const diasTxt = grupo.diasSemana.length === TODOS_LOS_DIAS.length
                          ? "Tots els dies"
                          : DIAS_SEMANA.filter((d) => grupo.diasSemana.includes(d.key)).map((d) => d.label).join(", ");
                        return (
                          <div key={grupo.groupId} style={{ border: `1px solid ${editGroupId === grupo.groupId ? primary : border}`, borderRadius: 10, padding: 12, background: editGroupId === grupo.groupId ? infoPanel.background : surfaceAlt }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: textMain, fontWeight: 800, fontSize: 14, overflowWrap: "anywhere" }}>{grupo.label || "Sense etiqueta"}</div>
                                <div style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>Del {formatDate(grupo.fechaInicio)} al {formatDate(grupo.fechaFin)}</div>
                              </div>
                              <span style={{ flexShrink: 0, border: `1px solid ${dangerPanel.border}`, background: dangerPanel.background, color: dangerPanel.color, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                                {grupo.items.length}
                              </span>
                            </div>
                            <div style={{ color: textMuted, fontSize: 12, lineHeight: 1.45 }}>
                              <div>{diasTxt}</div>
                              <div>{grupo.horas.join(", ")}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                              <button onClick={() => editarGrupo(grupo)} style={{ flex: 1, background: surface, color: textMain, border: `1.5px solid ${border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                                Modificar
                              </button>
                              <button onClick={() => eliminarGrupo(grupo)} style={{ flex: 1, background: dangerPanel.background, color: dangerPanel.color, border: `1.5px solid ${dangerPanel.border}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
