# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de controle de documentação médica pessoal — a containerized full-stack web application for organizing personal medical records. Single-user, password-protected SPA backed by a REST API.

## Architecture

Three-tier Docker Compose setup:

- **NGINX** (port 80/443) — reverse proxy, rate limiting, static assets
- **Node.js/Express** (port 3000 internally, 3001 externally) — REST API, session auth, file handling
- **MongoDB** (port 27017) — document storage with Mongoose ODM

Request flow: Browser → NGINX → Express → MongoDB

The frontend is a vanilla JS SPA served from `app/public/`. All API routes are under `/api/`, auth routes under `/auth/`, and `/health` is a direct health check.

## Commands

### Docker (primary workflow)

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f app_nodejs

# Stop services
docker-compose down

# Restart a single service
docker-compose restart app_nodejs
```

### Deploy script shortcuts

```bash
./deploy.sh start     # Start all services with health verification
./deploy.sh stop      # Stop all services
./deploy.sh restart   # Restart services
./deploy.sh status    # View service status
./deploy.sh logs      # Show logs
./deploy.sh health    # Check health endpoints
./deploy.sh backup    # Backup MongoDB
./deploy.sh cleanup   # Remove all containers and volumes (destructive)
```

### Local Node.js development

```bash
cd app
npm install
npm run dev        # nodemon with hot reload
npm start          # production mode
npm test           # Jest test suite
```

### Utility scripts

```bash
node scripts/criar-usuario.js      # Create a user
node scripts/resetar-senha.js      # Reset user password
```

### Health check

```bash
curl http://localhost/health
```

## Key Files

| File | Purpose |
|------|---------|
| `app/app.js` | Main Express application (1400+ lines) — all middleware, routes, and startup logic |
| `app/models/Documento.js` | Mongoose schema for medical documents |
| `app/models/Profissional.js` | Mongoose schema for healthcare professionals |
| `app/models/Usuario.js` | Mongoose schema for users |
| `app/middlewares/auth.middleware.js` | Session-based auth guard (`requireAuth()`) |
| `app/middlewares/duplication.middleware.js` | 30-second submission cache to prevent duplicate POSTs |
| `app/middlewares/validation.middleware.js` | express-validator integration |
| `app/public/index.html` | Main SPA entry point |
| `nginx/conf.d/saude.conf` | NGINX upstream and location config |
| `docker-compose.yml` | Service definitions, networks, volumes |
| `app/.env` | Runtime environment (not committed) — see `app/.env.example` |

## Data Models

**Documento** — core entity stored in the `documentacao` collection:
- `tipoDocumento`: enum (Relatório, Exame, Receita, Laudo, Atestado, Cartão de Vacina, Resultado, Outro)
- `arquivos[]`: embedded array of uploaded file metadata (path, type, description)
- `profissionalSolicitante`: ObjectId ref to `Profissional`
- `tags[]`: free-form string tags

**Profissional** — healthcare professional registry:
- `numeroRegistro`: unique identifier (CRM, etc.)
- `especialidade`, `instituicoesPrincipais[]`

**Usuario** — single user with bcrypt-hashed password (12 rounds).

Sessions are stored in MongoDB via `connect-mongo` with 24-hour TTL.

## Authentication

Session-based (not JWT, despite JWT being installed). Login via `POST /auth/login` with `{ senha }`. The default password is `senha123` — must be changed in production via `ADMIN_PASSWORD` env var. All `/api/*` routes require `requireAuth()` middleware.

## Environment Variables

Key vars in `app/.env` (see `app/.env.example` for template):

```
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/controle_doc_medica
PORT=3000
SESSION_SECRET=<32+ char secret>
BCRYPT_ROUNDS=12
```

## Docker Network

All services share the `rede_doc_medica` bridge network (172.21.0.0/16). Service hostnames (`mongodb`, `app_nodejs`) are used for inter-service communication.

## Volumes

- `./data/mongodb` → MongoDB data persistence
- `./app` → App source (development bind mount)
- `./uploads` → User-uploaded medical files
- `./data/logs` → NGINX logs
