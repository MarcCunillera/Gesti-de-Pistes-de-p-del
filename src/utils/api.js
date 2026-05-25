const BASE = "http://localhost:4000/api";

export function getToken() {
  return localStorage.getItem("padel_token");
}
export function setToken(t) {
  if (t) localStorage.setItem("padel_token", t);
  else localStorage.removeItem("padel_token");
}

async function req(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => req("POST", "/auth/login", { email, password }),
  register: (nombre, email, password) => req("POST", "/auth/register", { nombre, email, password }),

  // Users
  getUsers: () => req("GET", "/users"),
  getMe: () => req("GET", "/users/me"),
  updateMe: (data) => req("PATCH", "/users/me", data),
  toggleActivo: (id, activo) => req("PATCH", `/users/${id}`, { activo }),
  uploadAvatar: async (file) => {
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch(BASE + "/users/me/avatar", {
      method: "POST",
      headers: { Authorization: "Bearer " + getToken() },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error pujant avatar");
    return data;
  },
  deleteAvatar: () => req("DELETE", "/users/me/avatar"),

  // Reservas
  getReservas: () => req("GET", "/reservas/all"),
  crearReserva: (fecha, hora, abierto) => req("POST", "/reservas", { fecha, hora, abierto }),
  cancelarReserva: (id) => req("DELETE", `/reservas/${id}`),
  unirse: (id) => req("POST", `/reservas/${id}/unirse`),
  sortir: (id) => req("POST", `/reservas/${id}/sortir`),
  expulsarJugador: (reservaId, userId) => req("DELETE", `/reservas/${reservaId}/jugadors/${userId}`),
  invitarJugador: (reservaId, userId) => req("POST", `/reservas/${reservaId}/invitar`, { user_id: userId }),
  getSolicitudsPartidaMeues: () => req("GET", "/reservas/solicituds/meues"),
  getSolicitudsPartidaPendent: () => req("GET", "/reservas/solicituds/pendent"),
  getSolicitudsPartidaInvitades: () => req("GET", "/reservas/solicituds/invitades"),
  respondSolicitudPartida: (id, estat) => req("PATCH", `/reservas/solicituds/${id}`, { estat }),
  toggleAbierto: (id, abierto) => req("PATCH", `/reservas/${id}/abierto`, { abierto }),

  // Bloqueados
  getBloqueados: () => req("GET", "/reservas/bloqueados"),
  addBloqueado: (fecha, hora) => req("POST", "/reservas/bloqueados", { fecha, hora }),
  delBloqueado: (id) => req("DELETE", `/reservas/bloqueados/${id}`),

  // Config
  getConfig: () => req("GET", "/reservas/config"),
  saveConfig: (data) => req("PUT", "/reservas/config", data),

  // Amics
  getAmics: () => req("GET", "/amics"),
  getSolicituds: () => req("GET", "/amics/solicituds"),
  getEnviades: () => req("GET", "/amics/solicituds/enviades"),
  enviarSolicitud: (a_user_id) => req("POST", "/amics/solicituds", { a_user_id }),
  respondSolicitud: (id, estat) => req("PATCH", `/amics/solicituds/${id}`, { estat }),
  eliminarAmic: (amicId) => req("DELETE", `/amics/${amicId}`),
};
