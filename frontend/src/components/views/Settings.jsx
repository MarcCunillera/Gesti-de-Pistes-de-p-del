import { useState } from "react";
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
  <div style={{ marginBottom: 24 }}>
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontWeight: 700, color: textColor || "#111827", fontSize: 14, display: 'block', marginBottom: 2 }}>{label}</label>
      <span style={{ fontSize: 12, color: descColor || "#9ca3af" }}>{desc}</span>
    </div>
    {children}
  </div>
);

export default function Settings({ config, configEdit, setConfigEdit, guardarConfig, HORARIOS, bloquearRango, bloqueados, desbloquearTodo: propDesbloquear, t }) {
  var surface = t?.surface || '#fff';
  var border = t?.border || '#e5e7eb';
  var textMain = t?.text || '#111827';
  var textMuted = t?.textSecondary || '#6b7280';
  var primary = t?.primary || '#1a2e1a';
  var surfaceAlt = t?.surfaceAlt || '#f9fafb';
  var isDark = !['#fff', '#ffffff'].includes((surface || '').toLowerCase());
  var linkColor = isDark ? '#93c5fd' : '#1a73e8';
  var infoPanel = { background: isDark ? surfaceAlt : '#f8faf8', border: isDark ? border : '#e5e7eb', color: isDark ? textMuted : '#555' };
  var warnPanel = { background: isDark ? 'rgba(245,158,11,.14)' : '#fffbeb', border: isDark ? 'rgba(251,191,36,.32)' : '#fde68a', color: isDark ? '#fcd34d' : '#92400e' };
  var dangerPanel = { background: isDark ? 'rgba(239,68,68,.12)' : '#fef2f2', border: isDark ? 'rgba(248,113,113,.32)' : '#fecaca', color: isDark ? '#fca5a5' : '#c0392b', sub: isDark ? '#fda4af' : '#f87171' };
  var okPanel = { background: isDark ? 'rgba(34,197,94,.14)' : '#f0fdf4', border: isDark ? 'rgba(74,222,128,.32)' : '#86efac', color: isDark ? '#86efac' : '#16a34a' };
  var cardShadow = t?.cardShadow || '0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06)';
  var inputBase = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px',
    border: `1.5px solid ${border}`, borderRadius: 10, fontSize: 14,
    color: textMain, background: t?.inputBg || '#fafafa', outline: 'none',
  };
  var selectBase = { ...inputBase, cursor: 'pointer' };
  const [seccion, setSeccion] = useState("calendario");
  const [rango, setRango] = useState({ inicio: hoy(), fin: hoy(), diasSemana: [], horas: [] });
  const [rangoMsg, setRangoMsg] = useState(null);
  const [guardado, setGuardado] = useState(false);

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

  const aplicarRango = () => {
    if (!rango.inicio || !rango.fin || rango.diasSemana.length === 0 || rango.horas.length === 0) {
      setRangoMsg({ tipo: "error", txt: "Selecciona un rang de dates, dies de la setmana i almenys una franja." });
      return;
    }
    if (rango.fin < rango.inicio) {
      setRangoMsg({ tipo: "error", txt: "La data de fi no pot ser anterior a la d'inici." });
      return;
    }
    bloquearRango(rango.inicio, rango.fin, rango.horas, rango.diasSemana);
    const diasTxt = rango.diasSemana.length === TODOS_LOS_DIAS.length
      ? "tots els dies"
      : DIAS_SEMANA.filter((d) => rango.diasSemana.includes(d.key)).map((d) => d.label).join(", ");
    setRangoMsg({ tipo: "ok", txt: `Franges bloquejades del ${rango.inicio} al ${rango.fin} (${diasTxt}).` });
    setRango({ inicio: hoy(), fin: hoy(), diasSemana: [], horas: [] });
    setTimeout(() => setRangoMsg(null), 3000);
  };

  const desbloquearTodo = () => {
    if (!window.confirm("Vols desbloquejar totes les franges bloquejades?")) return;
    if (propDesbloquear) propDesbloquear();
  };

  const handleGuardar = () => {
    guardarConfig();
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const franjas = generarHorarios(configEdit.horaInicio, configEdit.horaFin, configEdit.duracion);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      {/* Cabecera */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: textMain, margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Configuració</h2>
        <p style={{ margin: 0, color: textMuted, fontSize: 13 }}>Configura el funcionament de la pista</p>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Menú lateral */}
        <nav style={{ width: 170, flexShrink: 0 }}>
          {SECCIONES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSeccion(s.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: seccion === s.key ? primary : 'transparent',
                color: seccion === s.key ? (isDark ? '#0f172a' : '#fff') : textMain,
                border: "none", borderRadius: 10, padding: "10px 14px",
                cursor: "pointer", fontWeight: seccion === s.key ? 700 : 500,
                fontSize: 14, marginBottom: 4, textAlign: "left", transition: "all 0.15s",
              }}
            >
              {s.label}
              {s.key === "bloqueos" && bloqueados?.length > 0 && (
                <span style={{ marginLeft: "auto", background: seccion === s.key ? (isDark ? 'rgba(15,23,42,.16)' : 'rgba(255,255,255,.25)') : dangerPanel.background, color: seccion === s.key ? (isDark ? '#0f172a' : '#fff') : dangerPanel.color, border: `1px solid ${seccion === s.key ? 'transparent' : dangerPanel.border}`, borderRadius: 20, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>
                  {bloqueados.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div style={{ flex: 1, minWidth: 280, background: surface, borderRadius: 16, padding: '24px 28px', boxShadow: isDark ? cardShadow : '0 2px 12px rgba(0,0,0,.07)', border: `1px solid ${border}` }}>

          {/* ── CALENDARIO ── */}
          {seccion === "calendario" && (
            <>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: primary, display: "flex", alignItems: "center", gap: 8 }}>
                Configuració del calendari
              </h3>
              <Field textColor={textMain} descColor={textMuted} label="Hora d'inici" desc="Primera franja disponible del dia">
                <input type="time" value={configEdit.horaInicio} onChange={(e) => setConfigEdit((c) => ({ ...c, horaInicio: e.target.value }))} style={inputBase} />
              </Field>
              <Field textColor={textMain} descColor={textMuted} label="Hora de fi" desc="Última franja disponible del dia">
                <input type="time" value={configEdit.horaFin} onChange={(e) => setConfigEdit((c) => ({ ...c, horaFin: e.target.value }))} style={inputBase} />
              </Field>
              <Field textColor={textMain} descColor={textMuted} label="Durada de cada franja" desc="Temps per reserva en minuts">
                <select value={configEdit.duracion} onChange={(e) => setConfigEdit((c) => ({ ...c, duracion: Number(e.target.value) }))} style={selectBase}>
                  {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutos</option>)}
                </select>
              </Field>
              <Field textColor={textMain} descColor={textMuted} label="Dies visibles al calendari" desc="Rang de dies mostrats alhora">
                <select value={configEdit.diasVista} onChange={(e) => setConfigEdit((c) => ({ ...c, diasVista: Number(e.target.value) }))} style={selectBase}>
                  {[3, 5, 7].map((d) => <option key={d} value={d}>{d} dies</option>)}
                </select>
              </Field>

              {/* Preview */}
              <div style={{ background: infoPanel.background, border: `1px solid ${infoPanel.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: infoPanel.color, display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>{configEdit.horaInicio} – {configEdit.horaFin}</span>
                <span>{configEdit.duracion} min/franja</span>
                <span>{franjas.length} franges · {configEdit.diasVista} dies</span>
              </div>

              {hasChanges && (
                <div style={{ background: warnPanel.background, border: `1px solid ${warnPanel.border}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: warnPanel.color }}>
                  Tens canvis sense desar
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleGuardar}
                  style={{ flex: 1, background: guardado ? '#16a34a' : primary, color: guardado ? '#fff' : (isDark ? '#0f172a' : '#fff'), border: "none", borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "background 0.2s" }}
                >
                  {guardado ? "✓ Desat" : "Desar configuració"}
                </button>
                <button
                  onClick={() => setConfigEdit(config)}
                  disabled={!hasChanges}
                  style={{ padding: "11px 18px", background: hasChanges ? surfaceAlt : (isDark ? '#0f172a' : '#f3f4f6'), color: hasChanges ? textMain : textMuted, border: `1.5px solid ${border}`, borderRadius: 10, cursor: hasChanges ? "pointer" : "default", fontWeight: 600, fontSize: 14 }}
                >
                  Descartar
                </button>
              </div>
            </>
          )}

          {/* ── RESERVAS ── */}
          {seccion === "reservas" && (
            <>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: primary, display: "flex", alignItems: "center", gap: 8 }}>
                Política de reserves
              </h3>
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

              {hasChanges && (
                <div style={{ background: warnPanel.background, border: `1px solid ${warnPanel.border}`, borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: warnPanel.color }}>
                  Tens canvis sense desar
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleGuardar}
                  style={{ flex: 1, background: guardado ? '#16a34a' : primary, color: guardado ? '#fff' : (isDark ? '#0f172a' : '#fff'), border: "none", borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "background 0.2s" }}
                >
                  {guardado ? "✓ Desat" : "Desar configuració"}
                </button>
                <button
                  onClick={() => setConfigEdit(config)}
                  disabled={!hasChanges}
                  style={{ padding: "11px 18px", background: hasChanges ? surfaceAlt : (isDark ? '#0f172a' : '#f3f4f6'), color: hasChanges ? textMain : textMuted, border: `1.5px solid ${border}`, borderRadius: 10, cursor: hasChanges ? "pointer" : "default", fontWeight: 600, fontSize: 14 }}
                >
                  Descartar
                </button>
              </div>
            </>
          )}

          {/* ── BLOQUEOS ── */}
          {seccion === "bloqueos" && (
            <>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: primary, display: "flex", alignItems: "center", gap: 8 }}>
                Bloqueig per rang de dates
              </h3>
              <p style={{ margin: "0 0 20px", color: textMuted, fontSize: 13 }}>Bloqueja franges horàries en diversos dies d'una sola vegada.</p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
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
                  <button
                    onClick={() => setRango((r) => ({ ...r, diasSemana: r.diasSemana.length === TODOS_LOS_DIAS.length ? [] : TODOS_LOS_DIAS }))}
                    style={{ background: 'none', border: 'none', color: linkColor, fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}
                  >
                    {rango.diasSemana.length === TODOS_LOS_DIAS.length ? "Treure'ls tots" : "Seleccionar-los tots"}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))", gap: 6 }}>
                  {DIAS_SEMANA.map((dia) => {
                    const sel = rango.diasSemana.includes(dia.key);
                    return (
                      <button
                        key={dia.key}
                        onClick={() => toggleDiaSemana(dia.key)}
                        title={dia.label}
                        style={{ padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${sel ? primary : border}`, background: sel ? primary : surfaceAlt, color: sel ? (isDark ? '#0f172a' : '#fff') : textMain, fontSize: 12, cursor: "pointer", fontWeight: sel ? 700 : 500, transition: "all 0.1s" }}
                      >
                        <span style={{ display: "block", fontSize: 13 }}>{dia.short}</span>
                        <span style={{ display: "block", fontSize: 11, marginTop: 2 }}>{dia.label}</span>
                      </button>
                    );
                  })}
                </div>
                {rango.diasSemana.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: textMuted }}>
                    {rango.diasSemana.length === TODOS_LOS_DIAS.length
                      ? "Es bloquejaran tots els dies del rang."
                      : `Només es bloquejaran els ${DIAS_SEMANA.filter((d) => rango.diasSemana.includes(d.key)).map((d) => d.label.toLowerCase()).join(", ")} marcats.`}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontWeight: 700, color: textMain, fontSize: 14 }}>Franges horàries</label>
                  <button
                    onClick={() => setRango((r) => ({ ...r, horas: r.horas.length === HORARIOS.length ? [] : [...HORARIOS] }))}
                    style={{ background: 'none', border: 'none', color: linkColor, fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}
                  >
                    {rango.horas.length === HORARIOS.length ? "Treure-les totes" : "Seleccionar-les totes"}
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {HORARIOS.map((h) => {
                    const sel = rango.horas.includes(h);
                    return (
                      <button
                        key={h}
                        onClick={() => toggleHora(h)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${sel ? primary : border}`, background: sel ? primary : surfaceAlt, color: sel ? (isDark ? '#0f172a' : '#fff') : textMain, fontSize: 12, cursor: "pointer", fontWeight: sel ? 700 : 400, transition: "all 0.1s" }}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
                {rango.horas.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: textMuted }}>{rango.horas.length} franja{rango.horas.length !== 1 ? "es" : ""} seleccionada{rango.horas.length !== 1 ? "es" : ""}</div>
                )}
              </div>

              {rangoMsg && (
                <div style={{ background: rangoMsg.tipo === "ok" ? okPanel.background : dangerPanel.background, color: rangoMsg.tipo === "ok" ? okPanel.color : dangerPanel.color, border: `1px solid ${rangoMsg.tipo === "ok" ? okPanel.border : dangerPanel.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                  {rangoMsg.txt}
                </div>
              )}

              <button onClick={aplicarRango} style={{ width: '100%', background: primary, color: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                Bloquejar rang
              </button>

              {bloqueados?.length > 0 && (
                <div style={{ background: dangerPanel.background, border: `1px solid ${dangerPanel.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: dangerPanel.color, fontSize: 13 }}>{bloqueados.length} franja{bloqueados.length !== 1 ? "s" : ""} bloqueada{bloqueados.length !== 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 12, color: dangerPanel.sub, marginTop: 2 }}>Aquestes franges no estan disponibles per reservar</div>
                  </div>
                  <button onClick={desbloquearTodo} style={{ background: isDark ? 'rgba(239,68,68,.2)' : '#c0392b', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                    Desbloquejar-ho tot
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
