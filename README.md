# 🎾 Reserva Pàdel

Aplicación web **full-stack** para la gestión y reserva de pistas de pàdel. Los usuarios pueden registrarse, consultar el calendario de disponibilidad, hacer reservas y gestionar amigos. Los administradores disponen de un panel dedicado para controlar usuarios y reservas.

![React](https://img.shields.io/badge/React-17-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
  - [Con Docker (recomendado)](#con-docker-recomendado)
  - [En local sin Docker](#en-local-sin-docker)
- [Variables de entorno](#variables-de-entorno)
- [API Endpoints](#api-endpoints)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Características

- **Autenticación** — Registro e inicio de sesión con JWT. Contraseñas cifradas con bcrypt.
- **Calendario de reservas** — Vista mensual/semanal para consultar la disponibilidad de las pistas.
- **Gestión de reservas** — Crear, visualizar y cancelar reservas propias.
- **Sistema de amigos** — Añadir amigos y organizarlos en partidos.
- **Panel de administración** — Gestión completa de usuarios y reservas por parte de los administradores.
- **Perfil de usuario** — Foto de perfil, cambio de contraseña y ajustes personales.
- **Tema claro / oscuro** — Soporte nativo de tema con contexto de React.
- **Diseño responsive** — Interfaz adaptada a móvil, tableta y escritorio.

---

## Stack tecnológico

| Capa              | Tecnología                        |
|-------------------|-----------------------------------|
| Frontend          | React 17, Vite, CSS Modules       |
| Backend           | Node.js, Express 4                |
| Base de datos     | SQLite (better-sqlite3)           |
| Auth              | JSON Web Tokens (JWT), bcryptjs   |
| Subida de archivos| Multer                            |
| Contenedores      | Docker, Docker Compose            |

---

## Arquitectura del proyecto

```
Reserva-padel/
├── backend/                  # API REST con Express
│   ├── db.js                 # Inicialización de SQLite
│   ├── server.js             # Punto de entrada del servidor
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticación JWT
│   └── routes/
│       ├── auth.js           # /api/auth
│       ├── users.js          # /api/users
│       ├── reservas.js       # /api/reservas
│       └── amics.js          # /api/amics
├── src/                      # Aplicación React (Vite)
│   ├── components/           # Componentes reutilizables
│   ├── views/                # Páginas principales
│   ├── theme/                # Contexto de tema claro/oscuro
│   └── utils/                # Helpers y cliente de la API
├── docker-compose.yml
└── vite.config.js
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) >= 9
- [Docker](https://www.docker.com/) y Docker Compose *(opcional pero recomendado)*

---

## Instalación y puesta en marcha

### Con Docker (recomendado)

```bash
# 1. Clona el repositorio
git clone https://github.com/tu-usuario/reserva-padel.git
cd reserva-padel

# 2. Levanta los servicios
docker compose up --build -d
```

- **Frontend** → [http://localhost:3000](http://localhost:3000)
- **Backend** → [http://localhost:4000](http://localhost:4000)

Para detener los contenedores:

```bash
docker compose down
```

---

### En local sin Docker

**Backend**

```bash
cd backend
npm install
npm run dev        # Inicia con nodemon en el puerto 4000
```

**Frontend** *(en otra terminal)*

```bash
# Desde la raíz del proyecto
npm install
npm run dev        # Inicia Vite en el puerto 5173
```

---

## Variables de entorno

Crea un archivo `.env` dentro de `backend/` con las siguientes variables:

| Variable     | Descripción                               | Valor por defecto |
|--------------|-------------------------------------------|-------------------|
| `PORT`       | Puerto en el que escucha el servidor      | `4000`            |
| `DB_DIR`     | Directorio donde se almacena la BD SQLite | `./data`          |
| `JWT_SECRET` | Clave secreta para firmar los tokens      | *(requerido)*     |

---

## API Endpoints

| Método | Ruta                  | Descripción                       | Auth |
|--------|-----------------------|-----------------------------------|------|
| POST   | `/api/auth/register`  | Registro de usuario               | ✗    |
| POST   | `/api/auth/login`     | Inicio de sesión                  | ✗    |
| GET    | `/api/users`          | Listado de usuarios               | ✓    |
| GET    | `/api/reservas`       | Reservas del usuario autenticado  | ✓    |
| POST   | `/api/reservas`       | Crear una reserva                 | ✓    |
| DELETE | `/api/reservas/:id`   | Cancelar una reserva              | ✓    |
| GET    | `/api/amics`          | Lista de amigos                   | ✓    |
| POST   | `/api/amics`          | Añadir un amigo                   | ✓    |
| GET    | `/api/health`         | Estado del servidor               | ✗    |

---

## Contribuir

1. Haz un fork del proyecto.
2. Crea una rama con tu feature: `git checkout -b feature/nueva-funcionalidad`
3. Commitea tus cambios: `git commit -m 'feat: añadir nueva funcionalidad'`
4. Sube la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request.

---

## Licencia

Distribuido bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más información.
