const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export function getToken() {
  return localStorage.getItem("padel_token");
}
export function setToken(t) {
  if (t) localStorage.setItem("padel_token", t);
  else localStorage.removeItem("padel_token");
}

function notifyUnauthorizedIfNeeded(status) {
  if (status === 401) {
    window.dispatchEvent(new CustomEvent("padel:unauthorized"));
  }
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
  notifyUnauthorizedIfNeeded(res.status);
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

const AVATAR_MAX_BYTES = 900 * 1024;
const AVATAR_MAX_SIDE = 1024;

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No s'ha pogut preparar la imatge"));
    }, "image/jpeg", quality);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No s'ha pogut llegir la imatge. Si es una foto HEIC, prova de fer-la en format JPG."));
    };
    img.src = url;
  });
}

async function prepareAvatarFile(file) {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    throw new Error("Selecciona una imatge valida");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, AVATAR_MAX_SIDE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.86;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > AVATAR_MAX_BYTES && quality > 0.58) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

export const api = {
  // Autenticació
  login: (email, password) =>
    req("POST", "/auth/login", { email, password }),

  register: (nombre, email, password) =>
    req("POST", "/auth/register", { nombre, email, password }),

  loginGoogle: (credential) =>
    req("POST", "/auth/google", { credential }),

  forgotPassword: (email) =>
    req("POST", "/auth/forgot-password", { email }),

  resetPassword: (token, password) =>
    req("POST", "/auth/reset-password", { token, password }),

  verifyEmail: (token) =>
    req("POST", "/auth/verify-email", { token }),

  resendVerification: (email) =>
    req("POST", "/auth/resend-verification", { email }),

  // Usuaris
  getUsers: () => req("GET", "/users"),
  getMe: () => req("GET", "/users/me"),
  updateMe: (data) => req("PATCH", "/users/me", data),
  completeOnboarding: (data) => req("PATCH", "/users/me/onboarding", data),
  toggleActivo: (id, activo) => req("PATCH", `/users/${id}`, { activo }),
  uploadAvatar: async (file) => {
    const avatarFile = await prepareAvatarFile(file);
    const form = new FormData();
    form.append("avatar", avatarFile);
    const res = await fetch(BASE + "/users/me/avatar", {
      method: "POST",
      headers: { Authorization: "Bearer " + getToken() },
      body: form,
    });
    const data = await res.json();
    notifyUnauthorizedIfNeeded(res.status);
    if (!res.ok) throw new Error(data.error || "Error pujant avatar");
    return data;
  },
  deleteAvatar: () => req("DELETE", "/users/me/avatar"),

  // Reserves
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
  updateUserRole: (id, rol) => req("PATCH", `/users/${id}`, { rol }),

  // Bloquejats
  getBloqueados: () => req("GET", "/reservas/bloqueados"),
  addBloqueado: (fecha, hora) => req("POST", "/reservas/bloqueados", { fecha, hora }),
  addBloqueadoBatch: (fechaInicio, fechaFin, horas, diasSemana) => req("POST", "/reservas/bloqueados/batch", { fechaInicio, fechaFin, horas, diasSemana }),
  delBloqueado: (id) => req("DELETE", `/reservas/bloqueados/${id}`),

  // Configuració
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
