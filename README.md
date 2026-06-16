# Reserva Pádel Torrelameu

Aplicación web full-stack para gestionar reservas de una pista municipal de pádel. Permite registro, verificación de correo, inicio de sesión con JWT o Google, calendario de disponibilidad, reservas privadas, partidos abiertos, solicitudes de amistad, invitaciones a partidos y administración de usuarios, reservas, bloqueos y configuración.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

## Características

- Autenticación con JWT, bcrypt y verificación de correo.
- Login opcional con Google OAuth.
- Calendario responsive de disponibilidad.
- Reservas privadas y partidos abiertos de hasta 4 jugadores.
- Solicitudes de amistad e invitaciones a partidos.
- Panel de administración para usuarios, reservas, bloqueos y configuración.
- Perfil de usuario con avatar, preferencias y cambio de contraseña.
- Tema claro/oscuro y soporte PWA básico.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18, Vite, CSS global + estilos inline |
| Backend | Node.js, Express 4 |
| Base de datos | PostgreSQL 16 |
| Auth | JWT, bcryptjs, Google OAuth |
| Email | Nodemailer |
| Contenedores | Docker, Docker Compose, nginx |

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

## Puesta en marcha con Docker

```bash
docker compose up --build -d
```

- Frontend: http://localhost:3003
- Backend directo: http://localhost:4000
- API vía frontend/nginx: http://localhost:3003/api
- PostgreSQL: localhost:5432

Para parar:

```bash
docker compose down
```

## Puesta en marcha local

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

En desarrollo, Vite sirve el frontend en `http://localhost:3003` y proxyea `/api` y `/uploads` a `http://localhost:4000`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `PORT` | Puerto del backend | `4000` |
| `DATABASE_URL` | Conexión PostgreSQL | `postgres://padel:padel_password@postgres:5432/padel` |
| `POSTGRES_DB` | Base de datos Docker | `padel` |
| `POSTGRES_USER` | Usuario PostgreSQL Docker | `padel` |
| `POSTGRES_PASSWORD` | Contraseña PostgreSQL Docker | `padel_password` |
| `JWT_SECRET` | Secreto para firmar JWT | requerido |
| `FRONTEND_URL` | Orígenes CORS permitidos | `http://localhost:3003` |
| `APP_URL` | URL pública usada en emails | `http://localhost:3003` |
| `INITIAL_ADMIN_EMAIL` | Email del admin inicial | opcional |
| `INITIAL_ADMIN_PASSWORD` | Password del admin inicial | opcional |
| `INITIAL_ADMIN_NAME` | Nombre del admin inicial | opcional |
| `GOOGLE_CLIENT_ID` | Client ID de Google para backend | opcional |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google para frontend | opcional |
| `VITE_API_BASE_URL` | Base API compilada en frontend | `/api` en Docker |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | SMTP para verificación y recuperación | requerido para registro local |

## Migraciones

El backend mantiene un bootstrap de tablas en `backend/db.js` y aplica migraciones versionadas desde `backend/migrations/` mediante la tabla `schema_migrations`.

Para aplicar migraciones sin arrancar el servidor:

```bash
cd backend
npm run migrate
```

Al arrancar el backend también se ejecuta `db.init()`, por lo que las migraciones pendientes se aplican automáticamente.

## Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registro con verificación de email |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/google` | Login con Google |
| `GET` | `/api/users/me` | Perfil propio |
| `PATCH` | `/api/users/me` | Actualizar perfil propio |
| `GET` | `/api/users` | Usuarios visibles |
| `GET` | `/api/reservas/all` | Reservas confirmadas; admin ve historial completo |
| `POST` | `/api/reservas` | Crear reserva |
| `DELETE` | `/api/reservas/:id` | Cancelar reserva |
| `GET` | `/api/amics` | Amigos |
| `POST` | `/api/amics/solicituds` | Enviar solicitud de amistad |
| `GET` | `/api/health` | Healthcheck |

## Notas de seguridad

- `JWT_SECRET` es obligatorio; el backend no arranca sin él.
- El frontend usa `/api` en Docker para evitar URLs internas en el bundle.
- El service worker no cachea respuestas de API para no mostrar disponibilidad obsoleta.
- Los usuarios no administradores no reciben teléfonos ni campos internos de otros usuarios.

