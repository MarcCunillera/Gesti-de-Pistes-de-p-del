import { useState, useMemo, useEffect, useCallback } from "react";
import { generarHorarios, hoy, fechasDesde, googleCalendarUrl } from "./utils/helpers";
import { DEFAULT_CONFIG } from "./data/initialData";
import { useTheme } from "./theme/ThemeContext";
import { api, getToken, setToken } from "./utils/api";

import AuthScreen from "./components/auth/AuthScreen";
import Header from "./components/layout/Header";
import Nav from "./components/layout/Nav";
import Calendar from "./components/views/Calendar";
import MyReservations from "./components/views/MyReservations";
import Profile from "./components/views/Profile";
import AdminReservations from "./components/views/AdminReservations";
import AdminUsers from "./components/views/AdminUsers";
import Settings from "./components/views/Settings";
import ReservationModal from "./components/modals/ReservationModal";
import MatchModal from "./components/modals/MatchModal";
import AdminModal from "./components/modals/AdminModal";
import ConfirmModal from "./components/modals/ConfirmModal";
import ReservaConfirmModal from "./components/modals/ReservaConfirmModal";
import Friends from "./components/views/Friends";
import Skeleton from "./components/Skeleton";
import Toast from "./components/Toast";

export default function App() {
  const { t, dark, toggle } = useTheme();

  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configEdit, setConfigEdit] = useState(DEFAULT_CONFIG);

  const [vista, setVista] = useState("calendario");
  const [baseDate, setBaseDate] = useState(hoy());
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ nombre: "", email: "", password: "" });
  const [authTab, setAuthTab] = useState("login");
  const [authError, setAuthError] = useState("");
  const [reservaModal, setReservaModal] = useState(null);
  const [adminModal, setAdminModal] = useState(null);
  const [partidoModal, setPartidoModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmReserva, setConfirmReserva] = useState(null);
  const [toast, setToast] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [perfilEdit, setPerfilEdit] = useState(null);
  const [pwdForm, setPwdForm] = useState({ actual: "", nueva: "", repetir: "" });
  const [pwdError, setPwdError] = useState("");
  const [solicitudsAmicCount, setSolicitudsAmicCount] = useState(0);
  const [solicitudsPartidaMeues, setSolicitudsPartidaMeues] = useState([]);
  const [solicitudsPartidaPendent, setSolicitudsPartidaPendent] = useState([]);
  const [solicitudsPartidaInvitades, setSolicitudsPartidaInvitades] = useState([]);
  const [amics, setAmics] = useState([]);

  const showToast = (msg, tipo, duracio) => {
    setToast({ msg, tipo: tipo || "ok" });
    setTimeout(() => setToast(null), duracio || 3000);
  };

  const normalizeReserva = (r) => ({
    ...r,
    userId: r.user_id !== undefined ? r.user_id : r.userId,
    jugadores: (r.jugadors || r.jugadores || []).map((j) => (typeof j === "object" ? j.id : j)),
    jugadorsData: r.jugadors || [],
  });

  const cargarDades = useCallback(function () {
    return Promise.all([
      api.getReservas(),
      api.getUsers(),
      api.getBloqueados(),
      api.getConfig(),
    ]).then(function (results) {
      var rs = results[0], us = results[1], bl = results[2], cfg = results[3];
      setReservas(rs.map(normalizeReserva));
      setUsers(us);
      setBloqueados(bl);
      var cfgObj = {
        horaInicio: cfg.horaInicio || "09:00",
        horaFin: cfg.horaFin || "22:00",
        duracion: parseInt(cfg.duracion) || 90,
        diasVista: parseInt(cfg.diasVista) || 7,
        maxReservas: parseInt(cfg.maxReservas) || 3,
      };
      setConfig(cfgObj);
      setConfigEdit(cfgObj);
      return api.getSolicituds();
    }).then(function (sols) {
      setSolicitudsAmicCount(sols.length);
      return Promise.all([
        api.getSolicitudsPartidaMeues(),
        api.getSolicitudsPartidaPendent(),
        api.getSolicitudsPartidaInvitades(),
      ]);
    }).then(function (sp) {
      setSolicitudsPartidaMeues(sp[0]);
      setSolicitudsPartidaPendent(sp[1]);
      setSolicitudsPartidaInvitades(sp[2]);
      return api.getAmics();
    }).then(function (am) {
      setAmics(am);
    }).catch(function (e) { console.error("Error carregant dades:", e); });
  }, []);

  useEffect(function () {
    var token = getToken();
    if (!token) { setCargando(false); return; }
    api.getMe()
      .then(function (me) { setSession(me); return cargarDades(); })
      .catch(function () { setToken(null); })
      .finally(function () { setCargando(false); });
  }, []);

  // Auto-logout si el token expira mentre s'usa l'app
  useEffect(function () {
    function handleUnauthorized() {
      setToken(null);
      setSession(null);
      setUsers([]);
      setReservas([]);
      setBloqueados([]);
    }
    window.addEventListener("padel:unauthorized", handleUnauthorized);
    return function () { window.removeEventListener("padel:unauthorized", handleUnauthorized); };
  }, []);

  // Notificació quan el service worker té una nova versió llesta
  useEffect(function () {
    function handleSwUpdate() {
      showToast("Nova versió disponible — recarrega per actualitzar 🔄", "info", 8000);
    }
    window.addEventListener("padel:sw-update", handleSwUpdate);
    return function () { window.removeEventListener("padel:sw-update", handleSwUpdate); };
  }, []);

  // Polling lleuger: actualitza sol·licituds cada 30s sense recarregar tot
  const pollSolicituds = useCallback(function () {
    if (!getToken()) return;
    Promise.all([
      api.getSolicituds(),
      api.getSolicitudsPartidaMeues(),
      api.getSolicitudsPartidaPendent(),
      api.getSolicitudsPartidaInvitades(),
      api.getReservas(),
    ]).then(function (results) {
      var amicSols = results[0], meues = results[1], pendent = results[2], inv = results[3], rs = results[4];
      setSolicitudsAmicCount(amicSols.length);
      setSolicitudsPartidaMeues(meues);
      setSolicitudsPartidaPendent(pendent);
      setSolicitudsPartidaInvitades(inv);
      setReservas(rs.map(normalizeReserva));
    }).catch(function () { /* silenciós — no interrompre l'usuari */ });
  }, []);

  useEffect(function () {
    if (!session) return;
    var interval = setInterval(pollSolicituds, 30000);
    return function () { clearInterval(interval); };
  }, [session, pollSolicituds]);

  // Badge al títol del navegador amb el total de sol·licituds pendents
  useEffect(function () {
    var total = solicitudsAmicCount
      + solicitudsPartidaPendent.length
      + solicitudsPartidaInvitades.length
      + solicitudsPartidaMeues.filter(function (s) { return s.estat === 'pendent'; }).length;
    document.title = total > 0 ? "(" + total + ") Pàdel" : "Pàdel";
  }, [solicitudsAmicCount, solicitudsPartidaPendent, solicitudsPartidaInvitades, solicitudsPartidaMeues]);

  const login = function () {
    api.login(loginForm.email, loginForm.password)
      .then(function (data) {
        setToken(data.token);
        setSession(data.user);
        setAuthError("");
        setVista("calendario");
        return cargarDades();
      })
      .catch(function (e) { setAuthError(e.message); });
  };

  const registro = function () {
    if (!regForm.nombre || !regForm.email || !regForm.password) {
      setAuthError("Rellena todos los campos."); return;
    }
    api.register(regForm.nombre, regForm.email, regForm.password)
      .then(function (data) {
        setToken(data.token);
        setSession(data.user);
        setAuthError("");
        setVista("calendario");
        return cargarDades();
      })
      .catch(function (e) { setAuthError(e.message); });
  };

  const loginGoogle = function (credential) {
    if (!credential) {
      setAuthError("No s'ha rebut la credencial de Google.");
      return;
    }

    api.loginGoogle(credential)
      .then(function (data) {
        setToken(data.token);
        setSession(data.user);
        setAuthError("");
        setVista("calendario");
        return cargarDades();
      })
      .catch(function (e) {
        setAuthError(e.message || "Error iniciant sessió amb Google");
      });
  };

  const logout = function () {
    setToken(null);
    setSession(null);
    setUsers([]);
    setReservas([]);
    setBloqueados([]);
    document.title = "Pàdel";
  };

  const hacerReserva = function (fecha, hora, abierto) {
    api.crearReserva(fecha, hora, abierto)
      .then(function (r) {
        setReservas(function (rs) { return rs.concat([normalizeReserva(r)]); });
        setReservaModal(null); setAdminModal(null);
        if (abierto) {
          showToast("Partido abierto creado");
        } else {
          setConfirmReserva({ fecha, hora, abierto });
        }
      })
      .catch(function (e) { showToast(e.message, "error"); setReservaModal(null); setAdminModal(null); });
  };

  const cancelarReserva = function (id) {
    api.cancelarReserva(id)
      .then(function () {
        setReservas(function (rs) { return rs.map(function (r) { return r.id === id ? Object.assign({}, r, { estado: "cancelada" }) : r; }); });
        setAdminModal(null); setPartidoModal(null);
        showToast("Reserva cancelada", "warn");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const pedirCancelar = function (id, nom) {
    setConfirmModal({
      titulo: "Cancelar reserva",
      mensaje: "¿Seguro que quieres cancelar la reserva del " + nom + "? Esta acción no se puede deshacer.",
      accion: "Sí, cancelar",
      onConfirm: function () { cancelarReserva(id); },
    });
  };

  const unirsePartido = function (rid) {
    api.unirse(rid)
      .then(function (result) {
        showToast("Sol·licitud enviada — l'organitzador ha de confirmar", "info");
        return api.getSolicitudsPartidaMeues();
      })
      .then(function (meues) { setSolicitudsPartidaMeues(meues); })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const pedirUnirse = function (rid, fecha, hora) {
    setConfirmModal({
      titulo: "Unirse al partido",
      mensaje: "¿Confirmas que quieres unirte al partido del " + fecha + " a las " + hora + "?",
      accion: "Sí, unirme",
      onConfirm: function () { unirsePartido(rid); },
    });
  };

  const respondSolicitudPartida = function (solId, estat) {
    api.respondSolicitudPartida(solId, estat)
      .then(function () {
        showToast(estat === "acceptada" ? "Jugador acceptat al partit ✓" : "Sol·licitud rebutjada", estat === "acceptada" ? "ok" : "info");
        return cargarDades();
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const expulsarJugador = function (reservaId, userId, nomJugador) {
    setConfirmModal({
      titulo: "Expulsar jugador",
      mensaje: "¿Seguro que quieres quitar a " + nomJugador + " del partido?",
      accion: "Sí, quitar",
      onConfirm: function () {
        api.expulsarJugador(reservaId, userId)
          .then(function (r) {
            var rn = normalizeReserva(r);
            setReservas(function (rs) { return rs.map(function (x) { return x.id === reservaId ? rn : x; }); });
            showToast(nomJugador + " ha estat eliminat del partit", "info");
            return api.getSolicitudsPartidaPendent();
          })
          .then(function (sp) { setSolicitudsPartidaPendent(sp); })
          .catch(function (e) { showToast(e.message, "error"); });
      },
    });
  };

  const invitarJugador = function (reservaId, userId) {
    api.invitarJugador(reservaId, userId)
      .then(function () {
        var u = users.find(function (x) { return x.id === userId; });
        showToast("Invitació enviada a " + (u ? u.nombre : "l'amic") + " — ha d'acceptar", "info");
        return api.getSolicitudsPartidaInvitades();
      })
      .then(function (inv) { setSolicitudsPartidaInvitades(inv); })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const respondreInvitacioPartida = function (solId, estat) {
    api.respondSolicitudPartida(solId, estat)
      .then(function () {
        showToast(estat === "acceptada" ? "T'has unit al partit ✓" : "Invitació rebutjada", estat === "acceptada" ? "ok" : "info");
        return cargarDades();
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const toggleAbierto = function (rid) {
    var r = reservas.find(function (x) { return x.id === rid; });
    if (!r) return;
    var nuevoAbierto = !r.abierto;
    api.toggleAbierto(rid, nuevoAbierto)
      .then(function () {
        setReservas(function (rs) { return rs.map(function (x) { return x.id === rid ? Object.assign({}, x, { abierto: nuevoAbierto }) : x; }); });
        if (!nuevoAbierto) {
          showToast("Reserva cerrada", "info");
        } else {
          showToast("Partido abierto — otros jugadores pueden unirse", "info");
        }
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const salirPartido = function (rid) {
    api.sortir(rid)
      .then(function (r) {
        var rn = normalizeReserva(r);
        setReservas(function (rs) { return rs.map(function (x) { return x.id === rid ? rn : x; }); });
        setPartidoModal(null);
        showToast("Saliste del partido", "info");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const pedirSalir = function (rid, fecha, hora) {
    setConfirmModal({
      titulo: "Salir del partido",
      mensaje: "¿Seguro que quieres salir del partido del " + fecha + " a las " + hora + "?",
      accion: "Sí, salir",
      onConfirm: function () { salirPartido(rid); },
    });
  };

  const toggleBloqueo = function (fecha, hora) {
    var bl = bloqueados.find(function (b) { return b.fecha === fecha && b.hora === hora; });
    if (bl) {
      api.delBloqueado(bl.id)
        .then(function () {
          setBloqueados(function (bs) { return bs.filter(function (b) { return b.id !== bl.id; }); });
          showToast("Horario desbloqueado");
        })
        .catch(function (e) { showToast(e.message, "error"); });
    } else {
      api.addBloqueado(fecha, hora)
        .then(function (nou) {
          setBloqueados(function (bs) { return bs.concat([nou]); });
          showToast("Horario bloqueado");
        })
        .catch(function (e) { showToast(e.message, "error"); });
    }
    setAdminModal(null);
  };

  const bloquearRango = function (fechaInicio, fechaFin, horas) {
    var d = new Date(fechaInicio);
    var fin = new Date(fechaFin);
    var promises = [];
    while (d <= fin) {
      var f = d.toISOString().split("T")[0];
      horas.forEach(function (h) {
        if (!bloqueados.some(function (b) { return b.fecha === f && b.hora === h; })) {
          promises.push(api.addBloqueado(f, h));
        }
      });
      d.setDate(d.getDate() + 1);
    }
    Promise.all(promises).then(function (nous) {
      setBloqueados(function (bs) { return bs.concat(nous); });
      showToast(nous.length + " franjas bloqueadas");
    }).catch(function (e) { showToast(e.message, "error"); });
  };

  const guardarConfig = function () {
    var h = generarHorarios(configEdit.horaInicio, configEdit.horaFin, configEdit.duracion);
    if (!h.length) { showToast("Configuración inválida", "error"); return; }
    api.saveConfig(configEdit)
      .then(function () { setConfig(configEdit); showToast("Ajustes guardados"); })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const guardarPerfil = function () {
    if (!perfilEdit.nombre.trim()) return;
    api.updateMe({ nombre: perfilEdit.nombre, email: perfilEdit.email, avatar_color: perfilEdit.avatar_color, lado: perfilEdit.lado, mano: perfilEdit.mano, telefono: perfilEdit.telefono })
      .then(function (updated) {
        setSession(function (s) { return Object.assign({}, s, { nombre: updated.nombre, email: updated.email, avatar_color: updated.avatar_color, lado: updated.lado, mano: updated.mano, telefono: updated.telefono }); });
        setPerfilEdit(null);
        showToast("Perfil actualizado");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const subirAvatarFoto = function (file) {
    api.uploadAvatar(file)
      .then(function (data) {
        setSession(function (s) { return Object.assign({}, s, { avatar: data.avatar }); });
        showToast("Foto actualizada");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const eliminarAvatarFoto = function () {
    api.deleteAvatar()
      .then(function (updated) {
        setSession(function (s) { return Object.assign({}, s, { avatar: null }); });
        showToast("Foto eliminada");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const cambiarPassword = function () {
    if (pwdForm.nueva.length < 6) { setPwdError("Mínimo 6 caracteres."); return; }
    if (pwdForm.nueva !== pwdForm.repetir) { setPwdError("Las contraseñas no coinciden."); return; }
    api.updateMe({ currentPassword: pwdForm.actual, newPassword: pwdForm.nueva })
      .then(function () {
        setPwdForm({ actual: "", nueva: "", repetir: "" });
        setPwdError("");
        showToast("Contraseña actualizada");
      })
      .catch(function (e) { setPwdError(e.message); });
  };

  const desbloquearTodo = function () {
    Promise.all(bloqueados.map(function (b) { return api.delBloqueado(b.id); }))
      .then(function () { setBloqueados([]); showToast("Todas las franjas desbloqueadas"); })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const toggleActivoUser = function (id, activo) {
    api.toggleActivo(id, activo)
      .then(function (updated) {
        setUsers(function (us) { return us.map(function (u) { return u.id === id ? Object.assign({}, u, { activo: updated.activo }) : u; }); });
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const HORARIOS = useMemo(function () { return generarHorarios(config.horaInicio, config.horaFin, config.duracion); }, [config]);
  const fechas = useMemo(function () { return fechasDesde(baseDate, config.diasVista); }, [baseDate, config.diasVista]);
  const esBloqueado = function (f, h) { return bloqueados.some(function (b) { return b.fecha === f && b.hora === h; }); };
  const getReserva = function (f, h) { return reservas.find(function (r) { return r.fecha === f && r.hora === h && r.estado === "confirmada"; }); };

  var now = new Date();
  var sid = session ? session.id : null;
  var misReservas = reservas.filter(function (r) { return r.userId === sid && r.estado === "confirmada" && new Date(r.fecha + "T" + r.hora) >= now; });
  var misPartidos = reservas.filter(function (r) { return r.jugadores && r.jugadores.indexOf(sid) !== -1 && r.userId !== sid && r.estado === "confirmada" && new Date(r.fecha + "T" + r.hora) >= now; });
  var historialReservas = reservas.filter(function (r) { return r.userId === sid && (r.estado === "cancelada" || new Date(r.fecha + "T" + r.hora) < now); });

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Skeleton vista="calendario" />
      </div>
    );
  }

  if (!session) {
    return (
      <AuthScreen
        authTab={authTab} setAuthTab={setAuthTab}
        loginForm={loginForm} setLoginForm={setLoginForm}
        regForm={regForm} setRegForm={setRegForm}
        authError={authError} login={login} registro={registro}
        loginGoogle={loginGoogle}
        dark={dark}
      />
    );
  }

  var navItems = [
    { id: "calendario", label: "Calendario" },
    { id: "misreservas", label: "Mis Reservas", badge: (solicitudsPartidaPendent.length + solicitudsPartidaMeues.length) > 0 ? (solicitudsPartidaPendent.length + solicitudsPartidaMeues.length) : null },
    { id: "amics", label: "Amics", badge: solicitudsAmicCount || null },
    { id: "perfil", label: "Perfil" },
  ];
  if (session.rol === "admin") {
    navItems = navItems.concat([
      { id: "admin_reservas", label: "Reservas" },
      { id: "admin_usuarios", label: "Usuarios" },
      { id: "ajustes", label: "Ajustes" },
    ]);
  }

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "sans-serif" }}>
      <Header session={session} setVista={setVista} setSession={logout} dark={dark} toggleDark={toggle} t={t} />
      <Nav navItems={navItems} vista={vista} setVista={setVista} t={t} />

      <div className="main-content" style={{ padding: "28px 40px", maxWidth: 1100, margin: "0 auto" }}>
        {vista === "calendario" && (
          <Calendar
            session={session} fechas={fechas} HORARIOS={HORARIOS} config={config}
            baseDate={baseDate} setBaseDate={setBaseDate}
            esBloqueado={esBloqueado} getReserva={getReserva}
            setAdminModal={setAdminModal} setReservaModal={setReservaModal} setPartidoModal={setPartidoModal}
            reservas={reservas} users={users} amics={amics}
            pedirUnirse={pedirUnirse} t={t}
          />
        )}
        {vista === "misreservas" && (
          <MyReservations
            session={session} misReservas={misReservas} misPartidos={misPartidos}
            historialReservas={historialReservas}
            users={users} cancelarReserva={pedirCancelar} salirPartido={pedirSalir}
            toggleAbierto={toggleAbierto} setVista={setVista}
            config={config} t={t}
            solicitudsPartidaPendent={solicitudsPartidaPendent}
            respondSolicitudPartida={respondSolicitudPartida}
            expulsarJugador={expulsarJugador}
            invitarJugador={invitarJugador}
            amics={amics}
            solicitudsPartidaInvitades={solicitudsPartidaInvitades}
            solicitudsPartidaMeues={solicitudsPartidaMeues}
            respondreInvitacioPartida={respondreInvitacioPartida}
          />
        )}
        {vista === "perfil" && (
          <Profile
            session={session} misReservas={misReservas} misPartidos={misPartidos} amics={amics}
            perfilEdit={perfilEdit} setPerfilEdit={setPerfilEdit} guardarPerfil={guardarPerfil}
            pwdForm={pwdForm} setPwdForm={setPwdForm} pwdError={pwdError} cambiarPassword={cambiarPassword}
            subirAvatarFoto={subirAvatarFoto} eliminarAvatarFoto={eliminarAvatarFoto}
            t={t}
          />
        )}
        {vista === "amics" && (
          <Friends session={session} users={users} showToast={showToast} onSolicitudsChange={setSolicitudsAmicCount} t={t} />
        )}
        {vista === "admin_reservas" && session.rol === "admin" && (
          <AdminReservations reservas={reservas} users={users} cancelarReserva={function (id, r) { pedirCancelar(id, (r ? r.fecha : "") + " " + (r ? r.hora : "")); }} t={t} />
        )}
        {vista === "admin_usuarios" && session.rol === "admin" && (
          <AdminUsers users={users} toggleActivo={toggleActivoUser} reservas={reservas} t={t} />
        )}
        {vista === "ajustes" && session.rol === "admin" && (
          <Settings
            config={config} configEdit={configEdit} setConfigEdit={setConfigEdit}
            guardarConfig={guardarConfig} HORARIOS={HORARIOS}
            bloquearRango={bloquearRango} bloqueados={bloqueados} desbloquearTodo={desbloquearTodo} t={t}
          />
        )}
      </div>

      <ReservationModal reservaModal={reservaModal} setReservaModal={setReservaModal} config={config} session={session} hacerReserva={hacerReserva} t={t} />
      <MatchModal partidoModal={partidoModal} setPartidoModal={setPartidoModal} users={users} session={session} unirsePartido={pedirUnirse} salirPartido={pedirSalir} solicitudsPartidaMeues={solicitudsPartidaMeues} respondreInvitacio={respondreInvitacioPartida} t={t} />
      <AdminModal adminModal={adminModal} setAdminModal={setAdminModal} users={users} hacerReserva={hacerReserva} cancelarReserva={function (id) { setAdminModal(null); pedirCancelar(id, (adminModal ? adminModal.fecha : "") + " " + (adminModal ? adminModal.hora : "")); }} toggleBloqueo={toggleBloqueo} config={config} session={session} t={t} />
      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} t={t} />
      <ReservaConfirmModal data={confirmReserva} onClose={() => setConfirmReserva(null)} config={config} t={t} />
      <Toast toast={toast} />
    </div>
  );
}
