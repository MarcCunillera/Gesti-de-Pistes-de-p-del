import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { generarHorarios, hoy, fechasDesde } from "./utils/helpers";
import { DEFAULT_CONFIG } from "./data/initialData";
import { useTheme } from "./theme/ThemeContext";
import { api, getToken, setToken } from "./utils/api";

import AuthScreen from "./components/auth/AuthScreen";
import Header from "./components/layout/Header";
import Nav from "./components/layout/Nav";
import Calendar from "./components/views/Calendar";
import MyReservations from "./components/views/MyReservations";
import Profile from "./components/views/Profile";
import UserProfile from "./components/views/UserProfile";
import AdminReservations from "./components/views/AdminReservations";
import AdminUsers from "./components/views/AdminUsers";
import Settings from "./components/views/Settings";
import ReservationModal from "./components/modals/ReservationModal";
import MatchModal from "./components/modals/MatchModal";
import MatchCreatedModal from "./components/modals/MatchCreatedModal";
import AdminModal from "./components/modals/AdminModal";
import ConfirmModal from "./components/modals/ConfirmModal";
import ReservaConfirmModal from "./components/modals/ReservaConfirmModal";
import WelcomeOnboardingModal from "./components/modals/WelcomeOnboardingModal";
import Friends from "./components/views/Friends";
import Skeleton from "./components/Skeleton";
import Toast from "./components/Toast";
import ResetPasswordScreen from "./components/auth/ResetPasswordScreen";
import VerifyEmailScreen from "./components/auth/VerifyEmailScreen";

export default function App() {
  const { t, dark, toggle } = useTheme();

  const [session, setSession] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [users, setUsers] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [configEdit, setConfigEdit] = useState(DEFAULT_CONFIG);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileBackView, setProfileBackView] = useState("calendario");

  const [vista, setVista] = useState("calendario");
  const [baseDate, setBaseDate] = useState(hoy());
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ nombre: "", email: "", password: "" });
  const [authTab, setAuthTab] = useState("login");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [reservaModal, setReservaModal] = useState(null);
  const [adminModal, setAdminModal] = useState(null);
  const [partidoModal, setPartidoModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmReserva, setConfirmReserva] = useState(null);
  const [newMatchModalId, setNewMatchModalId] = useState(null);
  const [toast, setToast] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [perfilEdit, setPerfilEdit] = useState(null);
  const [pwdForm, setPwdForm] = useState({ actual: "", nueva: "", repetir: "" });
  const [pwdError, setPwdError] = useState("");
  const [solicitudsAmicCount, setSolicitudsAmicCount] = useState(0);
  const [solicitudsAmicRebudes, setSolicitudsAmicRebudes] = useState([]);
  const [solicitudsAmicEnviades, setSolicitudsAmicEnviades] = useState([]);
  const [solicitudsPartidaMeues, setSolicitudsPartidaMeues] = useState([]);
  const [solicitudsPartidaPendent, setSolicitudsPartidaPendent] = useState([]);
  const [solicitudsPartidaInvitades, setSolicitudsPartidaInvitades] = useState([]);
  const [amics, setAmics] = useState([]);
  const [friendsRefreshKey, setFriendsRefreshKey] = useState(0);
  const syncInFlightRef = useRef(false);

  const showToast = (msg, tipo, duracio) => {
    setToast({ msg, tipo: tipo || "ok" });
    setTimeout(() => setToast(null), duracio || 3000);
  };

  const normalizeReserva = useCallback((r) => ({
    ...r,
    fecha: typeof r.fecha === "string" ? r.fecha.slice(0, 10) : r.fecha,
    hora: typeof r.hora === "string" ? r.hora.slice(0, 5) : r.hora,
    userId: r.user_id !== undefined ? r.user_id : r.userId,
    jugadores: (r.jugadors || r.jugadores || []).map((j) => (typeof j === "object" ? j.id : j)),
    jugadorsData: r.jugadors || [],
  }), []);

  const normalizeBloqueado = useCallback((b) => ({
    ...b,
    fecha: typeof b.fecha === "string" ? b.fecha.slice(0, 10) : b.fecha,
    hora: typeof b.hora === "string" ? b.hora.slice(0, 5) : b.hora,
  }), []);

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
      setBloqueados(bl.map(normalizeBloqueado));
      var cfgObj = {
        horaInicio: cfg.horaInicio || "09:00",
        horaFin: cfg.horaFin || "22:00",
        duracion: parseInt(cfg.duracion) || 90,
        diasVista: parseInt(cfg.diasVista) || 7,
        maxReservas: parseInt(cfg.maxReservas) || 3,
      };
      setConfig(cfgObj);
      setConfigEdit(cfgObj);
      return Promise.all([api.getSolicituds(), api.getEnviades()]);
    }).then(function (solsAmic) {
      var rebudes = solsAmic[0], enviades = solsAmic[1];
      setSolicitudsAmicRebudes(rebudes);
      setSolicitudsAmicEnviades(enviades);
      setSolicitudsAmicCount(rebudes.length);
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
  }, [normalizeBloqueado, normalizeReserva]);

  useEffect(function () {
    var token = getToken();
    if (!token) { setCargando(false); return; }
    api.getMe()
      .then(function (me) {
        setSession(me);
        setShowOnboarding(Number(me.onboarding_done) === 0);
        return cargarDades();
      })
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

  const syncLiveData = useCallback(function () {
    if (!getToken() || syncInFlightRef.current) return Promise.resolve();
    syncInFlightRef.current = true;

    return Promise.all([
      api.getMe(),
      api.getReservas(),
      api.getUsers(),
      api.getBloqueados(),
      api.getConfig(),
      api.getSolicituds(),
      api.getEnviades(),
      api.getSolicitudsPartidaMeues(),
      api.getSolicitudsPartidaPendent(),
      api.getSolicitudsPartidaInvitades(),
      api.getAmics(),
    ]).then(function (results) {
      var me = results[0], rs = results[1], us = results[2], bl = results[3], cfg = results[4];
      var amicSols = results[5], amicEnviades = results[6], meues = results[7], pendent = results[8], inv = results[9], am = results[10];

      setSession(function (prev) {
        if (
          prev &&
          prev.id === me.id &&
          prev.nombre === me.nombre &&
          prev.email === me.email &&
          prev.rol === me.rol &&
          prev.avatar === me.avatar &&
          prev.avatar_color === me.avatar_color &&
          prev.telefono === me.telefono &&
          prev.lado === me.lado &&
          prev.mano === me.mano &&
          prev.onboarding_done === me.onboarding_done
        ) {
          return prev;
        }
        return me;
      });
      setReservas(rs.map(normalizeReserva));
      setUsers(us);
      setBloqueados(bl.map(normalizeBloqueado));
      setConfig({
        horaInicio: cfg.horaInicio || "09:00",
        horaFin: cfg.horaFin || "22:00",
        duracion: parseInt(cfg.duracion) || 90,
        diasVista: parseInt(cfg.diasVista) || 7,
        maxReservas: parseInt(cfg.maxReservas) || 3,
      });
      setSolicitudsAmicCount(amicSols.length);
      setSolicitudsAmicRebudes(amicSols);
      setSolicitudsAmicEnviades(amicEnviades);
      setSolicitudsPartidaMeues(meues);
      setSolicitudsPartidaPendent(pendent);
      setSolicitudsPartidaInvitades(inv);
      setAmics(am);
      setFriendsRefreshKey(function (k) { return k + 1; });
    }).catch(function () { /* silenciós — no interrompre l'usuari */ })
      .finally(function () { syncInFlightRef.current = false; });
  }, [normalizeBloqueado, normalizeReserva]);

  useEffect(function () {
    if (!session?.id) return;

    syncLiveData();

    var interval = setInterval(function () {
      if (document.visibilityState === "visible") syncLiveData();
    }, 15000);

    function handleFocus() {
      syncLiveData();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") syncLiveData();
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return function () {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [session?.id, syncLiveData]);

  // Badge al títol del navegador amb el total de sol·licituds pendents
  useEffect(function () {
    var total = solicitudsAmicCount
      + solicitudsPartidaPendent.length
      + solicitudsPartidaInvitades.length
      + solicitudsPartidaMeues.filter(function (s) { return s.estat === 'pendent'; }).length;
    document.title = total > 0 ? "(" + total + ") Pàdel" : "Pàdel";
  }, [solicitudsAmicCount, solicitudsPartidaPendent, solicitudsPartidaInvitades, solicitudsPartidaMeues]);

  const login = function () {
    setAuthError("");
    setAuthSuccess("");

    api.login(loginForm.email, loginForm.password)
      .then(function (data) {
        setToken(data.token);
        setSession(data.user);
        setShowOnboarding(Boolean(data.isNewUser || Number(data.user?.onboarding_done) === 0));
        setAuthError("");
        setVista("calendario");
        return cargarDades();
      })
      .catch(function (e) { setAuthError(e.message); });
  };

  const registro = function () {
    setAuthError("");
    setAuthSuccess("");

    if (!regForm.nombre || !regForm.email || !regForm.password) {
      setAuthError("Omple tots els camps."); return;
    }
    api.register(regForm.nombre, regForm.email, regForm.password)
      .then(function (data) {
        if (data.pendingVerification) {
          setAuthSuccess(data.message || "Correu de verificació enviat. Revisa el teu correu abans d'iniciar sessió.");
          setRegForm(function (f) { return Object.assign({}, f, { password: "" }); });
          setLoginForm(function (f) { return Object.assign({}, f, { email: regForm.email, password: "" }); });
          setAuthTab("registered");
          return null;
        }

        setToken(data.token);
        setSession(data.user);
        setShowOnboarding(Boolean(data.isNewUser || Number(data.user?.onboarding_done) === 0));
        setAuthError("");
        setVista("calendario");
        return cargarDades();
      })
      .catch(function (e) { setAuthError(e.message); });
  };

  const loginGoogle = function (credential) {
    setAuthError("");
    setAuthSuccess("");

    if (!credential) {
      setAuthError("No s'ha rebut la credencial de Google.");
      return;
    }

    api.loginGoogle(credential)
      .then(function (data) {
        setToken(data.token);
        setSession(data.user);
        setShowOnboarding(Boolean(data.isNewUser || Number(data.user?.onboarding_done) === 0));
        setAuthError("");
        setVista("calendario");
        return cargarDades();
      })
      .catch(function (e) {
        setAuthError(e.message || "Error iniciant sessió amb Google");
      });
  };

  const allowGoogleLogin = Boolean((import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim());

  const changeAuthTab = function (tab) {
    setAuthError("");
    setAuthSuccess("");
    setAuthTab(tab);
  };

  const logout = function () {
    setToken(null);
    setSession(null);
    setShowOnboarding(false);
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
          showToast("Partit obert creat");
          setNewMatchModalId(normalizeReserva(r).id);
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
        showToast("Reserva cancel·lada", "warn");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const pedirCancelar = function (id, nom) {
    setConfirmModal({
      titulo: "Cancel·lar reserva",
      mensaje: "Segur que vols cancel·lar la reserva del " + nom + "? Aquesta acció no es pot desfer.",
      accion: "Sí, cancel·lar",
      onConfirm: function () { cancelarReserva(id); },
    });
  };

  const unirsePartido = function (rid) {
    api.unirse(rid)
      .then(function (result) {
        showToast("Sol·licitud enviada: l'organitzador l'ha de confirmar", "info");
        return api.getSolicitudsPartidaMeues();
      })
      .then(function (meues) { setSolicitudsPartidaMeues(meues); })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const pedirUnirse = function (rid, fecha, hora) {
    setConfirmModal({
      variant: "join",
      titulo: "Unir-se al partit",
      mensaje: "Confirmes que vols unir-te al partit del " + fecha + " a les " + hora + "?",
      accion: "Sí, unir-m'hi",
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
      mensaje: "Segur que vols treure " + nomJugador + " del partit?",
      accion: "Sí, treure",
      onConfirm: function () {
        api.expulsarJugador(reservaId, userId)
          .then(function (r) {
            var rn = normalizeReserva(r);
            setReservas(function (rs) { return rs.map(function (x) { return x.id === reservaId ? rn : x; }); });
            showToast(nomJugador + " ha estat expulsat del partit", "info");
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
        showToast("Invitació enviada a " + (u ? u.nombre : "l'amic") + ": l'ha d'acceptar", "info");
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
          showToast("Reserva tancada", "info");
        } else {
          showToast("Partit obert: altres jugadors s'hi poden unir", "info");
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
        showToast("Has sortit del partit", "info");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const pedirSalir = function (rid, fecha, hora) {
    setConfirmModal({
      variant: "warning",
      danger: false,
      titulo: "Sortir del partit",
      mensaje: "Segur que vols sortir del partit del " + fecha + " a les " + hora + "?",
      accion: "Sí, sortir",
      onConfirm: function () { salirPartido(rid); },
    });
  };

  const toggleBloqueo = function (fecha, hora) {
    var bl = bloqueados.find(function (b) { return b.fecha === fecha && b.hora === hora; });
    if (bl) {
      api.delBloqueado(bl.id)
        .then(function () {
          setBloqueados(function (bs) { return bs.filter(function (b) { return b.id !== bl.id; }); });
          showToast("Horari desbloquejat");
        })
        .catch(function (e) { showToast(e.message, "error"); });
    } else {
      api.addBloqueado(fecha, hora)
        .then(function (nou) {
          setBloqueados(function (bs) { return bs.concat([normalizeBloqueado(nou)]); });
          showToast("Horari bloquejat");
        })
        .catch(function (e) { showToast(e.message, "error"); });
    }
    setAdminModal(null);
  };

  const bloquearRango = function (fechaInicio, fechaFin, horas, diasSemana) {
    api.addBloqueadoBatch(fechaInicio, fechaFin, horas, diasSemana)
      .then(function (result) {
        var nous = (result?.created || []).map(normalizeBloqueado);
        if (nous.length > 0) {
          setBloqueados(function (bs) { return bs.concat(nous); });
        }
        showToast(nous.length + " franges bloquejades");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const guardarConfig = function () {
    var h = generarHorarios(configEdit.horaInicio, configEdit.horaFin, configEdit.duracion);
    if (!h.length) { showToast("Configuració no vàlida", "error"); return; }
    api.saveConfig(configEdit)
      .then(function () { setConfig(configEdit); showToast("Configuració desada"); })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const guardarPerfil = function () {
    if (!perfilEdit.nombre.trim()) return;
    api.updateMe({ nombre: perfilEdit.nombre, email: perfilEdit.email, avatar_color: perfilEdit.avatar_color, lado: perfilEdit.lado, mano: perfilEdit.mano, telefono: perfilEdit.telefono })
      .then(function (updated) {
        if (Number(updated.email_verified) === 0) {
          setPerfilEdit(null);
          setToken(null);
          setSession(null);
          setUsers([]);
          setReservas([]);
          setBloqueados([]);
          setLoginForm(function (f) { return Object.assign({}, f, { email: updated.email, password: "" }); });
          setAuthTab("login");
          setAuthError("");
          setAuthSuccess("Correu actualitzat. Revisa el correu de verificació abans de tornar a iniciar sessió.");
          return;
        }

        setSession(function (s) { return Object.assign({}, s, { nombre: updated.nombre, email: updated.email, avatar_color: updated.avatar_color, lado: updated.lado, mano: updated.mano, telefono: updated.telefono }); });
        setPerfilEdit(null);
        showToast("Perfil actualitzat");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const completarOnboarding = function (data) {
    return api.completeOnboarding(data || {})
      .then(function (updated) {
        setSession(function (s) { return Object.assign({}, s, updated); });
        setShowOnboarding(false);
        showToast("Perfil preparat. Ja pots començar.");
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const subirAvatarFoto = function (file) {
    api.uploadAvatar(file)
      .then(function (data) {
        setSession(function (s) { return Object.assign({}, s, { avatar: data.avatar }); });
        showToast("Foto actualitzada");
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
    if (pwdForm.nueva.length < 6) { setPwdError("Mínim 6 caràcters."); return; }
    if (pwdForm.nueva !== pwdForm.repetir) { setPwdError("Les contrasenyes no coincideixen."); return; }
    api.updateMe({ currentPassword: pwdForm.actual, newPassword: pwdForm.nueva })
      .then(function () {
        setPwdForm({ actual: "", nueva: "", repetir: "" });
        setPwdError("");
        showToast("Contrasenya actualitzada");
      })
      .catch(function (e) { setPwdError(e.message); });
  };

  const desbloquearTodo = function () {
    Promise.all(bloqueados.map(function (b) { return api.delBloqueado(b.id); }))
      .then(function () { setBloqueados([]); showToast("Totes les franges desbloquejades"); })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const toggleActivoUser = function (id, activo) {
    api.toggleActivo(id, activo)
      .then(function (updated) {
        setUsers(function (us) { return us.map(function (u) { return u.id === id ? Object.assign({}, u, { activo: updated.activo }) : u; }); });
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const enviarSolicitudAmicPerfil = function (user) {
    if (!user || !user.id) return Promise.resolve();
    return api.enviarSolicitud(user.id)
      .then(function () {
        showToast("Sol·licitud enviada a " + (user.nombre || "l'usuari"), "info");
        setFriendsRefreshKey(function (k) { return k + 1; });
        return cargarDades();
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const respondreSolicitudAmicPerfil = function (solId, estat, user) {
    return api.respondSolicitud(solId, estat)
      .then(function () {
        showToast(estat === "acceptada" ? "Amic afegit" : "Sol·licitud rebutjada", estat === "acceptada" ? "ok" : "info");
        setFriendsRefreshKey(function (k) { return k + 1; });
        return cargarDades();
      })
      .catch(function (e) { showToast(e.message, "error"); });
  };

  const eliminarAmicPerfil = function (user) {
    if (!user || !user.id) return;
    setConfirmModal({
      titulo: "Eliminar amic",
      mensaje: "Segur que vols eliminar " + (user.nombre || "aquest usuari") + " dels teus amics?",
      accion: "Sí, eliminar",
      onConfirm: function () {
        api.eliminarAmic(user.id)
          .then(function () {
            showToast("Amic eliminat", "info");
            setFriendsRefreshKey(function (k) { return k + 1; });
            return cargarDades();
          })
          .catch(function (e) { showToast(e.message, "error"); });
      },
    });
  };

  const abrirPerfilUsuario = function (user) {
    if (!user || !user.id) return;
    setProfileBackView(function (prev) { return vista === "perfil_usuario" ? prev : vista; });
    setReservaModal(null);
    setAdminModal(null);
    setPartidoModal(null);
    setNewMatchModalId(null);
    if (user.id === session?.id) {
      setSelectedUser(null);
      setVista("perfil");
      return;
    }
    setSelectedUser(Object.assign(
      {},
      users.find(function (u) { return u.id === user.id; }) || {},
      amics.find(function (a) { return a.id === user.id; }) || {},
      user
    ));
    setVista("perfil_usuario");
  };

  const cambiarRolUsuario = function (user, nuevoRol) {
    if (!user || !user.id) return;

    const esHacerAdmin = nuevoRol === "admin";

    setConfirmModal({
      titulo: esHacerAdmin ? "Fer administrador" : "Treure administrador",
      mensaje: esHacerAdmin
        ? "Segur que vols fer administrador a " + user.nombre + "?"
        : "Segur que vols treure el rol d'administrador a " + user.nombre + "?",
      accion: esHacerAdmin ? "Sí, fer admin" : "Sí, treure admin",
      onConfirm: function () {
        api.updateUserRole(user.id, nuevoRol)
          .then(function () {
            showToast(
              esHacerAdmin
                ? "Usuari convertit en administrador"
                : "Administrador retirat"
            );
            return cargarDades();
          })
          .catch(function (e) {
            showToast(e.message, "error");
          });
      },
    });
  };

  const HORARIOS = useMemo(function () { return generarHorarios(config.horaInicio, config.horaFin, config.duracion); }, [config]);
  const fechas = useMemo(function () { return fechasDesde(baseDate, config.diasVista); }, [baseDate, config.diasVista]);
  const esBloqueado = useCallback(function (f, h) {
    return bloqueados.some(function (b) { return b.fecha === f && b.hora === h; });
  }, [bloqueados]);
  const getReserva = useCallback(function (f, h) {
    return reservas.find(function (r) { return r.fecha === f && r.hora === h && r.estado === "confirmada"; });
  }, [reservas]);

  var now = new Date();
  var sid = session ? session.id : null;
  var misReservas = reservas.filter(function (r) { return r.userId === sid && r.estado === "confirmada" && new Date(r.fecha + "T" + r.hora) >= now; });
  var misPartidos = reservas.filter(function (r) { return r.jugadores && r.jugadores.indexOf(sid) !== -1 && r.userId !== sid && r.estado === "confirmada" && new Date(r.fecha + "T" + r.hora) >= now; });
  var selectedUserProfile = selectedUser
    ? Object.assign(
      {},
      users.find(function (u) { return u.id === selectedUser.id; }) || {},
      amics.find(function (a) { return a.id === selectedUser.id; }) || {},
      selectedUser
    )
    : null;
  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Skeleton vista="calendario" />
      </div>
    );
  }

  const resetToken = new URLSearchParams(window.location.search).get("token");
  const isResetPassword = window.location.pathname === "/reset-password" && resetToken;
  const isVerifyEmail = window.location.pathname === "/verify-email" && resetToken;

  if (isResetPassword) {
    return (
      <ResetPasswordScreen
        token={resetToken}
        api={api}
        onDone={() => {
          window.history.replaceState({}, "", "/");
          setAuthTab("login");
        }}
        dark={dark}
      />
    );
  }

  if (isVerifyEmail) {
    return (
      <VerifyEmailScreen
        token={resetToken}
        api={api}
        onDone={() => {
          window.history.replaceState({}, "", "/");
          setAuthTab("login");
        }}
      />
    );
  }

  if (!session) {
    return (
      <AuthScreen
        authTab={authTab}
        setAuthTab={changeAuthTab}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        regForm={regForm}
        setRegForm={setRegForm}
        authError={authError}
        authSuccess={authSuccess}
        login={login}
        registro={registro}
        loginGoogle={allowGoogleLogin ? loginGoogle : null}
        api={api}
        dark={dark}
      />
    );
  }

  var navItems = [
    { id: "calendario", label: "Calendari" },
    { id: "misreservas", label: "Reserves", badge: (solicitudsPartidaPendent.length + solicitudsPartidaMeues.length) > 0 ? (solicitudsPartidaPendent.length + solicitudsPartidaMeues.length) : null },
    { id: "amics", label: "Amics", badge: solicitudsAmicCount || null },
    { id: "perfil", label: "Perfil" },
  ];
  if (session.rol === "admin") {
    navItems = navItems.concat([
      { id: "admin_reservas", label: "Historial de reserves" },
      { id: "admin_usuarios", label: "Usuaris" },
      { id: "ajustes", label: "Configuració" },
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
            pedirUnirse={pedirUnirse} onOpenUserProfile={abrirPerfilUsuario} t={t}
          />
        )}
        {vista === "misreservas" && (
          <MyReservations
            session={session} misReservas={misReservas} misPartidos={misPartidos}
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
            onOpenUserProfile={abrirPerfilUsuario}
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
        {vista === "perfil_usuario" && (
          <UserProfile
            user={selectedUserProfile}
            session={session}
            amics={amics}
            solicitudsAmicRebudes={solicitudsAmicRebudes}
            solicitudsAmicEnviades={solicitudsAmicEnviades}
            reservas={reservas}
            users={users}
            onBack={function () { setVista(profileBackView || "calendario"); }}
            onOpenUserProfile={abrirPerfilUsuario}
            onEnviarSolicitud={enviarSolicitudAmicPerfil}
            onRespondSolicitud={respondreSolicitudAmicPerfil}
            onEliminarAmic={eliminarAmicPerfil}
            t={t}
          />
        )}
        {vista === "amics" && (
          <Friends
            session={session}
            users={users}
            showToast={showToast}
            onSolicitudsChange={setSolicitudsAmicCount}
            refreshKey={friendsRefreshKey}
            onOpenUserProfile={abrirPerfilUsuario}
            t={t}
          />
        )}
        {vista === "admin_reservas" && session.rol === "admin" && (
          <AdminReservations reservas={reservas} users={users} cancelarReserva={function (id, r) { pedirCancelar(id, (r ? r.fecha : "") + " " + (r ? r.hora : "")); }} onOpenUserProfile={abrirPerfilUsuario} t={t} />
        )}
        {vista === "admin_usuarios" && session.rol === "admin" && (
          <AdminUsers
            users={users}
            toggleActivo={toggleActivoUser}
            reservas={reservas}
            session={session}
            cambiarRolUsuario={cambiarRolUsuario}
            onOpenUserProfile={abrirPerfilUsuario}
            t={t}
          />
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
      <MatchModal partidoModal={partidoModal} setPartidoModal={setPartidoModal} users={users} session={session} unirsePartido={pedirUnirse} salirPartido={pedirSalir} solicitudsPartidaMeues={solicitudsPartidaMeues} respondreInvitacio={respondreInvitacioPartida} onOpenUserProfile={abrirPerfilUsuario} t={t} />
      <AdminModal adminModal={adminModal} setAdminModal={setAdminModal} users={users} hacerReserva={hacerReserva} cancelarReserva={function (id) { setAdminModal(null); pedirCancelar(id, (adminModal ? adminModal.fecha : "") + " " + (adminModal ? adminModal.hora : "")); }} toggleBloqueo={toggleBloqueo} config={config} session={session} t={t} />
      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} t={t} />
      <ReservaConfirmModal data={confirmReserva} onClose={() => setConfirmReserva(null)} config={config} t={t} />
      <MatchCreatedModal
        reserva={reservas.find(r => r.id === newMatchModalId) || null}
        onClose={() => setNewMatchModalId(null)}
        users={users}
        session={session}
        amics={amics}
        solicitudsPartidaInvitades={solicitudsPartidaInvitades}
        invitarJugador={invitarJugador}
        onOpenUserProfile={abrirPerfilUsuario}
        t={t}
      />
      {showOnboarding && (
        <WelcomeOnboardingModal
          session={session}
          t={t}
          onFinish={completarOnboarding}
          onSkip={completarOnboarding}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
