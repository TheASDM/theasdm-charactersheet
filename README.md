# Dungeons.WTF Character Generator

Dungeons.WTF Character Generator is a full-stack web application for managing Dungeons & Dragons 2024 characters with curated data imports and optional Nimble 2.0-inspired homebrew hooks. The project delivers a modern React interface backed by a TypeScript/Express API and Prisma/PostgreSQL schema that tracks characters, rule content, and supporting metadata.

## Current Feature Set

- D&D 2024 content browser covering spells, classes, subclasses, backgrounds, feats, species, equipment, and class feature choices
- JWT-secured character management API with create/read/update/delete operations and validation for ownership and visibility
- Random character generator that assembles characters from the database (manual or fully random draws)
- React 18 + Vite frontend with character sheet layouts, modal editor, generator workflow, and data exploration pages
- Socket.IO server scaffolded for real-time character rooms (frontend subscription hooks are planned but not yet wired up)
- Prisma schema for 2024 rules data, user accounts, campaigns, class feature options, and version history tables with seed scripts

## Homebrew & Rules Coverage

- Character sheet data models include fields for heroic actions, mana-style spell resources, wound tracking, and other Nimble-inspired mechanics
- Database content and UI copy use 2024 terminology (species, origin feats, standardized subclass level progression)
- Import scripts and seed data target 2024 Player's Handbook and Dungeon Master's Guide sources while leaving extension points for custom material

## Tech Stack

- Backend: Node.js 18+, Express 4, TypeScript 5, Prisma 6, PostgreSQL 15+
- Frontend: React 18, Vite 4, TypeScript 5, Zustand, Styled Components, Vite PWA plugin
- Tooling: ESLint, Vitest, Jest, ts-node-dev, Socket.IO, Axios

## Prerequisites

- Node.js 18 or later and npm 9+
- PostgreSQL 15 (or compatible)
- A `.env` file for both `backend` and `frontend` apps (see environment variables below)

## Installation & Setup

1. Clone the repository and install dependencies in each workspace:
   ```bash
   git clone <repository-url>
   cd theasdm-charactersheet
   (cd backend && npm install)
   (cd frontend && npm install)
   ```
2. Configure PostgreSQL and create a database:
   ```bash
   createdb dnd_character_sheet
   ```
3. Copy environment templates and update values:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
4. Apply Prisma migrations and generate the client:
   ```bash
   cd backend
   npx prisma migrate dev
   npm run prisma:generate
   ```
5. Seed content if needed (review scripts in `database/` and `backend/prisma/seed.ts`).

## Environment Variables

### Backend (`backend/.env`)

- `DATABASE_URL` – PostgreSQL connection string (include database name and schema)
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` – optional convenience values for local scripts
- `JWT_SECRET`, `JWT_EXPIRES_IN` – authentication token settings
- `PORT`, `HOST` – API server binding (defaults to `3001` / `0.0.0.0`)
- `FRONTEND_URL` – allowed origin for CORS/socket connections
- `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID` – optional Discord integration hooks (not required for local dev)
- `MAX_FILE_SIZE`, `UPLOAD_PATH`, `RATE_LIMIT_*`, `LOG_LEVEL`, `LOG_FILE` – operational tuning knobs

### Frontend (`frontend/.env`)

- `VITE_API_URL` – explicit API base URL; omit in development to use the Vite proxy (`/api` → `http://localhost:3001`)
- `VITE_SOCKET_URL` – socket endpoint if different from API host
- `VITE_APP_NAME`, `VITE_VERSION` – display metadata
- `VITE_ENABLE_PWA`, `VITE_ENABLE_SOCKET`, `VITE_ENABLE_ANALYTICS`, `VITE_DEBUG` – feature flags

## Running the Project

### Development

In separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

The frontend dev server proxies `/api` requests to `http://localhost:3001` and hot-reloads React components.

### Production Preview

1. Build the backend and frontend bundles:
   ```bash
   (cd backend && npm run build)
   (cd frontend && npm run build)
   ```
2. Serve the backend (`npm start`) and host the frontend build via a static file server of your choice.

## Docker Image (SQLite bundle)

The repository now includes a single-image packaging flow that compiles the API and frontend together and persists data in an on-disk SQLite file. The image is defined by the root `Dockerfile`.

### 1. Prepare an env file

Copy `.env.image` and adjust secrets before building:

```bash
cp .env.image .env.production
```

Key defaults:

- `DATABASE_URL="file:./data/wtforge.sqlite"` stores the Prisma database inside the container (mount `/app/data` to persist).
- `VITE_API_URL=/api` points the built frontend at the colocated API.
- `SEED_REFERENCE` / `SEED_REFERENCE_SKIP_SPELLS` control the reference-only seed script.

### 2. Build & run

```bash
docker build -t dungeons-wtf-character-generator:latest .

docker run -d \
  --name dungeons-wtf \
  -p 8080:8080 \
  --env-file .env.production \
  -v dungeons_wtf_data:/app/data \
  dungeons-wtf-character-generator:latest
```

On boot, the container will:

1. run Prisma migrations (`prisma migrate deploy`),
2. execute `backend/dist/src/scripts/seed-reference.js` to load reference content when the target tables are empty,
3. start the Express server (`http://localhost:8080`) which serves both the API (`/api`) and the built frontend.

For local development or self-hosting via Docker Compose you can start both the app and a Postgres instance together:

```bash
docker compose up -d --build
```

This uses the `postgres` service defined in `docker-compose.yml` (credentials `wtforge` / `wtforge`) and the `.env.image` file for app configuration. The Postgres data folder is persisted in the `postgres_data` volume.

## Database Schema Overview

Key Prisma models live in `backend/prisma/schema.prisma`:

- `User`, `Campaign`, `Character`, and `CharacterVersionHistory` manage accounts, shared tables, and audit history
- `Spell`, `Class`, `Subclass`, `ClassFeatureChoice`, `Species`, `Background`, `Feat`, and `Item` capture 2024 content with JSONB fields for complex metadata
- Reference tables (`SpellSchool`, `DamageType`, `Condition`, `CreatureType`) normalize tagging for advanced filtering

Use `npx prisma studio` to explore live data during development.

## API Surface Area

All routes are mounted under `/api`:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/profile`, `PATCH /api/auth/password`, `POST /api/auth/logout`
- `GET /api/characters`, `GET /api/characters/:id`, `POST /api/characters`, `PUT /api/characters/:id`, `DELETE /api/characters/:id`
- `GET /api/spells`, `GET /api/spells/:id` and similar list/detail endpoints for classes, subclasses, backgrounds, feats, items, and species (see `backend/src/routes/*.ts`)
- `GET /api/class-choices/...` provides fighting styles, divine orders, eldritch invocations, full class data, and level-filtered feature options
- `POST /api/generator/random` builds a character from curated random selections
- `GET /api/campaigns` currently returns `501 Not Implemented` as a placeholder for future campaign management routes
- Health check available at `GET /health`

Refer to the route files for validation rules, rate limits, and response shapes.

## Frontend Directory Highlights

- `frontend/src/pages/` – top-level screens (character generator, sheet view, spell browser, login/register)
- `frontend/src/components/` – reusable UI elements including `CharacterSheet`, `CharacterSheetModal`, and supporting inputs
- `frontend/src/store/` – Zustand stores for UI and session state
- `frontend/src/services/` – API client and data-fetching utilities
- `frontend/src/utils/` – formatting helpers, derived calculations, and generators

## Project Structure

```
backend/          Express API, Prisma schema, auth, content routes
frontend/         React application and UI assets
database/         SQL seeds, import utilities
scripts/          Guardrails and maintenance scripts
docs/             Supplemental documentation and guides
```

## Contributing

- Open an issue or discussion describing the improvement you want to make
- Create a feature branch (`git checkout -b feature/<short-description>`)
- Add or update tests where possible (`npm test` in each workspace)
- Submit a pull request describing the change and any schema or migration impact

## Status & Support

The project is actively evolving. See `PROJECT_STATUS.md` for roadmap details. For questions, open a GitHub issue or reach out through the project Discord once published.
