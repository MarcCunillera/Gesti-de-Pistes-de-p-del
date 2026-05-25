import { hoy } from "../utils/helpers";

const manana = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

export const DEFAULT_CONFIG = {
  horaInicio: "09:00",
  horaFin: "22:00",
  duracion: 90,
  diasVista: 7,
  maxReservas: 3,
};

export const initUsers = [
  { id: 1, nombre: "Admin", email: "admin@padel.com", password: "Admin123", rol: "admin", activo: true },
  { id: 2, nombre: "Juan Garcia", email: "juan@pueblo.com", password: "Padel1", rol: "usuario", activo: true },
  { id: 3, nombre: "Maria Lopez", email: "maria@pueblo.com", password: "Padel1", rol: "usuario", activo: true },
  { id: 4, nombre: "Carlos Roca", email: "carlos@pueblo.com", password: "Padel1", rol: "usuario", activo: true },
  { id: 5, nombre: "Ana Ferrer", email: "ana@pueblo.com", password: "Padel1", rol: "usuario", activo: true },
  { id: 6, nombre: "Pere Mas", email: "pere@pueblo.com", password: "Padel1", rol: "usuario", activo: true },
  { id: 7, nombre: "Laura Vila", email: "laura@pueblo.com", password: "Padel1", rol: "usuario", activo: true },
  { id: 8, nombre: "Toni Camps", email: "toni@pueblo.com", password: "Padel1", rol: "usuario", activo: true },
];

export const initReservas = [
  { id: 1, userId: 2, fecha: manana(), hora: "09:00", estado: "confirmada", abierto: false, jugadores: [2] },
  { id: 2, userId: 3, fecha: manana(), hora: "10:30", estado: "confirmada", abierto: true, jugadores: [3] },
  { id: 3, userId: 4, fecha: manana(), hora: "13:00", estado: "confirmada", abierto: true, jugadores: [4, 5] },
];
