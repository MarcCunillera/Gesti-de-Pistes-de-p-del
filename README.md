# Reserva Pàdel Torrelameu

Aplicació web full-stack per gestionar les reserves d'una pista municipal de pàdel. Permet registre, verificació de correu, inici de sessió amb JWT o Google, calendari de disponibilitat, reserves privades, partits oberts, sol·licituds d'amistat, invitacions a partits i administració d'usuaris, reserves, bloquejos i configuració.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

## Característiques

- Autenticació amb JWT, bcrypt i verificació de correu.
- Inici de sessió opcional amb Google OAuth.
- Calendari responsive de disponibilitat.
- Reserves privades i partits oberts de fins a 4 jugadors.
- Sol·licituds d'amistat i invitacions a partits.
- Panell d'administració per a usuaris, reserves, bloquejos i configuració.
- Perfil d'usuari amb avatar, preferències i canvi de contrasenya.
- Tema clar/fosc i suport PWA bàsic.

## Stack

| Capa | Tecnologia |
| --- | --- |
| Frontend | React 18, Vite, CSS global + estils inline |
| Backend | Node.js, Express 4 |
| Base de dades | PostgreSQL 16 |
| Auth | JWT, bcryptjs, Google OAuth |
| Email | Nodemailer |
| Contenidors | Docker, Docker Compose, nginx |

## Estructura

```text
backend/
  db.js
  migrations/
  middleware/
  routes/
  services/
frontend/
  public/
  src/
    components/
    data/
    styles/
    theme/
    utils/
docker-compose.yml
```

## Posada en marxa amb Docker

```bash
docker compose up --build -d
```

- Frontend: http://localhost:3003
- Backend directe: http://localhost:4000
- API via frontend/nginx: http://localhost:3003/api
- PostgreSQL: localhost:5432

Per aturar-ho:

```bash
docker compose down
```

## Posada en marxa local

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

En desenvolupament, Vite serveix el frontend a `http://localhost:3003` i proxya `/api` i `/uploads` cap a `http://localhost:4000`.

## Variables d'entorn

| Variable | Descripció | Exemple |
| --- | --- | --- |
| `PORT` | Port del backend | `4000` |
| `DATABASE_URL` | Connexió PostgreSQL | `postgres://padel:padel_password@postgres:5432/padel` |
| `POSTGRES_DB` | Base de dades Docker | `padel` |
| `POSTGRES_USER` | Usuari PostgreSQL Docker | `padel` |
| `POSTGRES_PASSWORD` | Contrasenya PostgreSQL Docker | `padel_password` |
| `JWT_SECRET` | Secret per signar JWT | obligatori |
| `FRONTEND_URL` | Orígens CORS permesos | `http://localhost:3003` |
| `APP_URL` | URL pública usada als correus | `http://localhost:3003` |
| `INITIAL_ADMIN_EMAIL` | Correu de l'admin inicial | opcional |
| `INITIAL_ADMIN_PASSWORD` | Contrasenya de l'admin inicial | opcional |
| `INITIAL_ADMIN_NAME` | Nom de l'admin inicial | opcional |
| `GOOGLE_CLIENT_ID` | Client ID de Google per al backend | opcional |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google per al frontend | opcional |
| `VITE_API_BASE_URL` | Base API compilada al frontend | `/api` a Docker |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | SMTP per a verificació i recuperació | obligatori per a registre local |

## Migracions

El backend manté un bootstrap de taules a `backend/db.js` i aplica migracions versionades des de `backend/migrations/` mitjançant la taula `schema_migrations`.

Per aplicar migracions sense arrencar el servidor:

```bash
cd backend
npm run migrate
```

Quan arrenca el backend també s'executa `db.init()`, de manera que les migracions pendents s'apliquen automàticament.

## Endpoints principals

| Mètode | Ruta | Descripció |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registre amb verificació de correu |
| `POST` | `/api/auth/login` | Inici de sessió |
| `POST` | `/api/auth/google` | Inici de sessió amb Google |
| `GET` | `/api/users/me` | Perfil propi |
| `PATCH` | `/api/users/me` | Actualitzar perfil propi |
| `GET` | `/api/users` | Usuaris visibles |
| `GET` | `/api/reservas/all` | Reserves confirmades; l'admin veu l'historial complet |
| `POST` | `/api/reservas` | Crear reserva |
| `DELETE` | `/api/reservas/:id` | Cancel·lar reserva |
| `GET` | `/api/amics` | Amics |
| `POST` | `/api/amics/solicituds` | Enviar sol·licitud d'amistat |
| `GET` | `/api/health` | Healthcheck |

## Notes de seguretat

- `JWT_SECRET` és obligatori; el backend no arrenca sense ell.
- El frontend usa `/api` a Docker per evitar URLs internes al bundle.
- El service worker no desa en memòria cau les respostes de l'API per no mostrar disponibilitat obsoleta.
- Els usuaris no administradors no reben telèfons ni camps interns d'altres usuaris.

