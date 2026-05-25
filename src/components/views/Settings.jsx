import { useState } from "react";
import { generarHorarios, hoy } from "../../utils/helpers";

const SECCIONES = [
  { key: "calendario", label: "Calendario" },
  { key: "reservas", label: "Reservas" },
  { key: "bloqueos", label: "Bloqueos" },
];

const Field = ({ label, desc, children, textColor }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ marginBottom: 6 }}>
      <label style={{ fontWeight: 700, color: textColor || "#111827", fontSize: 14, display: 'block', marginBottom: 2 }}>{label}</label>
      <span style={{ fontSize: 12, color: "#9ca3af" }}>{desc}</span>
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
  var inputBase = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px',
    border: `1.5px solid ${border}`, borderRadius: 10, fontSize: 14,
    color: textMain, background: t?.inputBg || '#fafafa', outline: 'none',
  };
  var selectBase = { ...inputBase, cursor: 'pointer' };
  const [seccion, setSeccion] = useState("calendario");
  const [rango, setRango] = useState({ inicio: hoy(), fin: hoy(), horas: [] });
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

  const aplicarRango = () => {
    if (!rango.inicio || !rango.fin || rango.horas.length === 0) {
      setRangoMsg({ tipo: "error", txt: "Selecciona rango de fechas y al menos una franja." });
      return;
    }
    if (rango.fin < rango.inicio) {
      setRangoMsg({ tipo: "error", txt: "La fecha de fin no puede ser anterior al inicio." });
      return;
    }
    bloquearRango(rango.inicio, rango.fin, rango.horas);
    setRangoMsg({ tipo: "ok", txt: `Franjas bloqueadas del ${rango.inicio} al ${rango.fin}.` });
    setRango({ inicio: hoy(), fin: hoy(), horas: [] });
    setTimeout(() => setRangoMsg(null), 3000);
  };

  const desbloquearTodo = () => {
    if (!window.confirm("¿Desbloquear todas las franjas bloqueadas?")) return;
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
        <h2 style={{ color: textMain, margin: '0 0 4px', fontSize: 22, fontWeight: 800 }}>Ajustes</h2>
        <p style={{ margin: 0, color: textMuted, fontSize: 13 }}>Configura el funcionamiento de la pista</p>
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
                color: seccion === s.key ? '#fff' : textMain,
                border: "none", borderRadius: 10, padding: "10px 14px",
                cursor: "pointer", fontWeight: seccion === s.key ? 700 : 500,
                fontSize: 14, marginBottom: 4, textAlign: "left", transition: "all 0.15s",
              }}
            >
              {s.label}
              {s.key === "bloqueos" && bloqueados?.length > 0 && (
                <span style={{ marginLeft: "auto", background: seccion === s.key ? "rgba(255,255,255,.25)" : "#fef2f2", color: seccion === s.key ? "#fff" : "#c0392b", borderRadius: 20, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>
                  {bloqueados.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div style={{ flex: 1, minWidth: 280, background: surface, borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,.07)', border: `1px solid ${border}` }}>

          {/* ── CALENDARIO ── */}
          {seccion === "calendario" && (
            <>
              <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: primary, display: "flex", alignItems: "center", gap: 8 }}>
                Configuración del calendario
              </h3>
              <Field textColor={textMain} label="Hora de inicio" desc="Primera franja disponible del día">
                <input type="time" value={configEdit.horaInicio} onChange={(e) => setConfigEdit((c) => ({ ...c, horaInicio: e.target.value }))} style={inputBase} />
              </Field>
              <Field textColor={textMain} label="Hora de fin" desc="Última franja disponible del día">
                <input type="time" value={configEdit.horaFin} onChange={(e) => setConfigEdit((c) => ({ ...c, horaFin: e.target.value }))} style={inputBase} />
              </Field>
              <Field textColor={textMain} label="Duración de cada franja" desc="Tiempo por reserva en minutos">
                <select value={configEdit.duracion} onChange={(e) => setConfigEdit((c) => ({ ...c, duracion: Number(e.target.value) }))} style={selectBase}>
                  {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} minutos</option>)}
                </select>
              </Field>
              <Field textColor={textMain} label="Días visibles en el calendario" desc="Rango de días mostrados a la vez">
                <select value={configEdit.diasVista} onChange={(e) => setConfigEdit((c) => ({ ...c, diasVista: Number(e.target.value) }))} style={selectBase}>
                  {[3, 5, 7].map((d) => <option key={d} value={d}>{d} días</option>)}
                </select>
              </Field>

              {/* Preview */}
              <div style={{ background: "#f8faf8", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#555", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>{configEdit.horaInicio} – {configEdit.horaFin}</span>
                <span>{configEdit.duracion} min/franja</span>
                <span>{franjas.length} franjas · {configEdit.diasVista} días</span>
              </div>

              {hasChanges && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
                  Tienes cambios sin guardar
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleGuardar}
                  style={{ flex: 1, background: guardado ? '#16a34a' : primary, color: "#fff", border: "none", borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "background 0.2s" }}
                >
                  {guardado ? "✓ Guardado" : "Guardar ajustes"}
                </button>
                <button
                  onClick={() => setConfigEdit(config)}
                  disabled={!hasChanges}
                  style={{ padding: "11px 18px", background: hasChanges ? "#f9fafb" : "#f3f4f6", color: hasChanges ? textMain : textMuted, border: `1.5px solid ${border}`, borderRadius: 10, cursor: hasChanges ? "pointer" : "default", fontWeight: 600, fontSize: 14 }}
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
                Política de reservas
              </h3>
              <Field textColor={textMain} label="Límite de reservas por usuario" desc="Máximo de reservas activas simultáneas permitidas">
                <select value={configEdit.maxReservas ?? 3} onChange={(e) => setConfigEdit((c) => ({ ...c, maxReservas: Number(e.target.value) }))} style={selectBase}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} reserva{n !== 1 ? "s" : ""} máximo</option>)}
                </select>
              </Field>

              <div style={{ background: "#f8faf8", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#555" }}>
                <div style={{ fontWeight: 700, color: primary, marginBottom: 6 }}>Resumen actual</div>
                <div>· Cada usuario puede tener hasta <strong>{configEdit.maxReservas ?? 3}</strong> reservas activas simultáneas</div>
                <div style={{ marginTop: 4 }}>· Las reservas pasadas no cuentan para el límite</div>
              </div>

              {hasChanges && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 14px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
                  Tienes cambios sin guardar
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleGuardar}
                  style={{ flex: 1, background: guardado ? '#16a34a' : primary, color: "#fff", border: "none", borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14, transition: "background 0.2s" }}
                >
                  {guardado ? "✓ Guardado" : "Guardar ajustes"}
                </button>
                <button
                  onClick={() => setConfigEdit(config)}
                  disabled={!hasChanges}
                  style={{ padding: "11px 18px", background: hasChanges ? "#f9fafb" : "#f3f4f6", color: hasChanges ? textMain : textMuted, border: `1.5px solid ${border}`, borderRadius: 10, cursor: hasChanges ? "pointer" : "default", fontWeight: 600, fontSize: 14 }}
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
                Bloqueo por rango de fechas
              </h3>
              <p style={{ margin: "0 0 20px", color: "#9ca3af", fontSize: 13 }}>Bloquea franjas horarias en varios días de una vez.</p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Field textColor={textMain} label="Fecha inicio" desc="">
                    <input type="date" value={rango.inicio} min={hoy()} onChange={(e) => setRango((r) => ({ ...r, inicio: e.target.value }))} style={inputBase} />
                  </Field>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Field textColor={textMain} label="Fecha fin" desc="">
                    <input type="date" value={rango.fin} min={rango.inicio} onChange={(e) => setRango((r) => ({ ...r, fin: e.target.value }))} style={inputBase} />
                  </Field>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontWeight: 700, color: textMain, fontSize: 14 }}>Franjas horarias</label>
                  <button
                    onClick={() => setRango((r) => ({ ...r, horas: r.horas.length === HORARIOS.length ? [] : [...HORARIOS] }))}
                    style={{ background: 'none', border: 'none', color: '#1a73e8', fontSize: 12, cursor: "pointer", fontWeight: 600, padding: 0 }}
                  >
                    {rango.horas.length === HORARIOS.length ? "Quitar todas" : "Seleccionar todas"}
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {HORARIOS.map((h) => {
                    const sel = rango.horas.includes(h);
                    return (
                      <button
                        key={h}
                        onClick={() => toggleHora(h)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${sel ? primary : border}`, background: sel ? primary : surfaceAlt, color: sel ? "#fff" : textMain, fontSize: 12, cursor: "pointer", fontWeight: sel ? 700 : 400, transition: "all 0.1s" }}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
                {rango.horas.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#9ca3af" }}>{rango.horas.length} franja{rango.horas.length !== 1 ? "s" : ""} seleccionada{rango.horas.length !== 1 ? "s" : ""}</div>
                )}
              </div>

              {rangoMsg && (
                <div style={{ background: rangoMsg.tipo === "ok" ? "#f0fdf4" : "#fef2f2", color: rangoMsg.tipo === "ok" ? "#16a34a" : "#dc2626", border: `1px solid ${rangoMsg.tipo === "ok" ? "#86efac" : "#fca5a5"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
                  {rangoMsg.txt}
                </div>
              )}

              <button onClick={aplicarRango} style={{ width: '100%', background: primary, color: '#fff', border: 'none', borderRadius: 10, padding: "11px", cursor: "pointer", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                Bloquear rango
              </button>

              {bloqueados?.length > 0 && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#c0392b", fontSize: 13 }}>{bloqueados.length} franja{bloqueados.length !== 1 ? "s" : ""} bloqueada{bloqueados.length !== 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 12, color: "#f87171", marginTop: 2 }}>Estas franjas no están disponibles para reservar</div>
                  </div>
                  <button onClick={desbloquearTodo} style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                    Desbloquear todo
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
