# Repository Map: D&D 2024 Character Sheet Generator

**Generated:** 2025-10-10  
**Total Files Analyzed:** 221  
**Total Lines of Code:** ~76,810

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [File Index](#file-index)
4. [Key Entrypoints](#key-entrypoints)
5. [Data Flow](#data-flow)
6. [Critical Dependencies](#critical-dependencies)

---

## Architecture Overview

### System Design

This is a **full-stack monorepo** for a D&D 2024 Character Sheet Generator with Nimble TTRPG homebrew integration.

**Architecture Pattern:** Microservices-ready monorepo with separate backend API, frontend PWA, and Discord bot.

```
┌─────────────────┐
│   Frontend PWA  │  React 18 + TypeScript + Vite
│  (Port 3000)    │  Character Wizard, Sheet, Content Browser
└────────┬────────┘
         │ HTTP REST
         ↓
┌─────────────────┐
│  Backend API    │  Express + TypeScript + Prisma
│  (Port 8080)    │  Auth, Characters, D&D Content
└────────┬────────┘
         │ SQL
         ↓
┌─────────────────┐
│  PostgreSQL 15  │  23 Tables, JSONB for flexibility
│  (Port 5433)    │  705 items, 391 spells, 77 feats, etc.
└─────────────────┘

┌─────────────────┐
│  Discord Bot    │  discord.js v14 (planned)
│  (future)       │  Character lookup, dice rolling
└─────────────────┘
```

### Technology Stack

**Backend:**
- Runtime: Node.js 20+
- Framework: Express 4.18
- ORM: Prisma 6.16 + PostgreSQL 15
- Auth: JWT (jsonwebtoken) + bcrypt
- Security: Helmet, express-rate-limit, sanitization
- Logging: Winston
- Real-time: Socket.io 4.7

**Frontend:**
- Framework: React 18 with TypeScript
- Build Tool: Vite 5
- Styling: Styled Components + Tailwind CSS
- Routing: React Router 6
- State: Zustand (global) + React Query (server)
- PWA: vite-plugin-pwa with Workbox

**Infrastructure:**
- Containerization: Docker + Docker Compose
- Reverse Proxy: Nginx
- Database: PostgreSQL 15 with optimized config
- Deployment: Self-hosted on Debian server

### Database Schema (23 Models)

**User Management:**
- `User` - Authentication and profile
- `Character` - Player characters with JSONB data
- `CharacterVersionHistory` - Version control
- `Campaign` - Campaign management (planned)

**D&D 2024 Content (391 spells, 705 items, 77 feats, 16 backgrounds, 12 classes, 10 species):**
- `Spell` - Full spell database with components, duration, range
- `Class` - Classes with features, proficiencies, spellcasting
- `Subclass` - Subclass variants
- `Species` - Playable races/species with traits
- `Background` - Character backgrounds
- `Item` - Equipment, weapons, armor, magic items
- `Feat` - Feats with prerequisites and ASIs

**Choice System:**
- `ClassFeatureChoice` - Class choices (fighting styles, etc.)
- `ClassFeatureOption` - Available options for choices
- `FightingStyle` - Fighter/Paladin/Ranger fighting styles
- `EldritchInvocation` - Warlock invocations
- `DivineOrder` - Cleric divine orders
- `ClassSpell` - Class spell list associations

**Reference Data:**
- `SpellSchool`, `DamageType`, `Condition`, `CreatureType`, `ContentVersion`

### Key Features

1. **Character Creation Wizard** (6 steps):
   - Basic info and portrait
   - Ability scores (standard array, point buy, roll)
   - Class selection with subclass and choices
   - Origin (background, species, feats)
   - Equipment selection
   - Review and create

2. **Character Sheet**:
   - Full D&D 2024 compliant sheet
   - Tabs: Stats, Spells, Inventory, Proficiencies, Combat
   - Live updates with autosave
   - Resource tracking (HP, spell slots, class features)

3. **Content Browser**:
   - Searchable spell database with filters
   - Class details with progression tables
   - Item catalog with rarity/type filters
   - Feat browser with prerequisite checking

4. **Authentication**:
   - JWT-based auth with refresh tokens
   - Password-protected characters
   - Public character sharing

---

## Directory Structure

### Backend (`backend/` - 55 files)

**Purpose:** RESTful API server for character management and D&D content delivery

```
backend/
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma         # 23 models, JSONB fields (561 lines)
│   ├── migrations/           # 6 migrations from Sept-Oct 2025
│   └── seed.ts               # Reference data seeding
├── src/
│   ├── server.ts             # Express entrypoint (211 lines)
│   ├── db.ts                 # Prisma client singleton
│   ├── routes/               # API endpoints (10 route files)
│   │   ├── auth.ts           # Login, register, JWT (464 lines)
│   │   ├── characters.ts     # Character CRUD (430 lines)
│   │   ├── generator.ts      # Random character gen (518 lines)
│   │   ├── spells.ts         # Spell API (248 lines)
│   │   ├── classes.ts        # Class API (237 lines)
│   │   └── ...               # feats, items, backgrounds, races
│   ├── middleware/           # Auth, sanitize, rate limit, error handler
│   ├── types/                # TypeScript types
│   ├── utils/                # Logger
│   └── validators/           # express-validator rules
└── scripts/                  # Import and utility scripts (25 files)
    ├── import-*.js           # Import D&D content from 5etools JSON
    ├── generate-random-character.js
    ├── test-database.js      # Database validation (586 lines)
    └── export-to-seed.ts     # Generate seed file for Docker
```

**Key Dependencies:** Express, Prisma, bcryptjs, jsonwebtoken, helmet, winston, socket.io

### Frontend (`frontend/` - 115 files)

**Purpose:** React PWA for character creation, management, and D&D content browsing

```
frontend/
├── src/
│   ├── main.tsx              # App entrypoint with providers
│   ├── App.tsx               # Routing (238 lines)
│   ├── components/           # React components (81 files)
│   │   ├── CharacterGeneratorWizard.tsx  # Wizard orchestrator (2114 lines)
│   │   ├── CharacterSheet.tsx            # Full character sheet (1002 lines)
│   │   ├── wizard-steps/     # 6 wizard steps (Step0-Step5)
│   │   │   ├── Step1_AbilityScores.tsx   # Ability score assignment
│   │   │   ├── Step2_ClassSelection.tsx  # Class + choices (1512 lines)
│   │   │   └── Step5_ReviewCreate.tsx    # Final review (941 lines)
│   │   ├── spells/           # Spell components (7 files)
│   │   └── wizard/           # Reusable wizard UI components
│   ├── services/             # API clients (14 files)
│   │   ├── api.ts            # Axios base client
│   │   ├── characterService.ts, spellService.ts, classService.ts, etc.
│   │   └── characterCalculations.ts  # AC, HP, saves, initiative
│   ├── hooks/                # Custom hooks (20 files)
│   │   ├── characterSheet/   # Character sheet hooks (7 files)
│   │   ├── useCharacterAutosave.ts
│   │   └── useBodyScrollLock.ts  # Modal scroll fix
│   ├── utils/                # Utilities (23 files)
│   │   ├── dndTemplateParser.ts  # CRITICAL: Parses {@spell}, {@condition} tags (304 lines)
│   │   ├── simpleFeatureGenerator.ts  # Generate features (1850 lines)
│   │   ├── characterDataMapper.ts     # API ↔ Sheet mapping (731 lines)
│   │   ├── builderDataMapper.ts       # Wizard ↔ API mapping (192 lines)
│   │   └── featureParser.ts, weaponCalculator.ts, equipmentValidator.ts, etc.
│   ├── helpers/              # Business logic (4 files)
│   │   ├── spellRules.ts     # D&D 2024 spell rules (357 lines)
│   │   ├── manaRules.ts      # Nimble TTRPG mana system
│   │   └── deriveGrantedSpells.ts
│   ├── pages/                # Route pages (18 files)
│   │   ├── CharactersPage.tsx, CharacterViewPage.tsx
│   │   ├── CharacterGeneratorPage.tsx
│   │   ├── SpellsPage.tsx, ClassesPage.tsx, FeatsPage.tsx, etc.
│   │   └── LoginPage.tsx, RegisterPage.tsx
│   ├── styles/               # Styled Components (10 files)
│   │   ├── GlobalStyles.tsx
│   │   └── components/       # Component-specific styles
│   ├── types/                # TypeScript types (5 files)
│   │   ├── api.ts            # API response types (414 lines)
│   │   ├── characterSheet.ts # Character sheet types (371 lines)
│   │   └── classFeatures.ts, features.ts, spells.ts
│   ├── contexts/             # React contexts (3 files)
│   │   ├── AuthContext.tsx, ToastContext.tsx
│   │   └── SpellWizardContext.tsx
│   ├── store/                # Zustand state (1 file)
│   │   └── characterBuilderStore.ts  # Wizard state (812 lines)
│   ├── constants/            # Constants and config
│   └── data/                 # Static data (names.json, lookups)
└── public/
    ├── processed-data/       # Class JSON files for frontend (14 files)
    └── images/               # Favicon, logos
```

**Key Dependencies:** React, Vite, styled-components, react-router-dom, @tanstack/react-query, zustand

### Discord Bot (`discord-bot/` - 5 files)

**Purpose:** Discord integration for character lookup and dice rolling (scaffold only)

```
discord-bot/
├── src/
│   ├── index.ts              # Bot entrypoint (87 lines)
│   ├── commands/ping.ts      # Example command
│   └── events/ready.ts       # Ready event
└── package.json
```

**Status:** Framework set up, features not yet implemented

### Scripts (`scripts/` - 14 files)

**Purpose:** Data transformation, fixes, and production maintenance

- `transform-class-data-revised.js` (1402 lines) - Transform 5etools JSON
- `fix-*.js` - Data fix scripts
- `optimize-server.sh`, `fix-postgres.sh` - Production maintenance

### Infrastructure

- `Dockerfile` - Multi-stage build (71 lines)
- `docker-compose.yml` - PostgreSQL + app containers (55 lines)
- `nginx/dnd.raptornet.dev.conf` - Reverse proxy config (68 lines)

### Documentation

- Root: `README.md`, `PROJECT_STATUS.md`, `CLAUDE.md`, `CHANGELOG.md`
- `docs/` - API docs, deployment, implementation summaries
- `backend/`, `frontend/` - Component-specific READMEs

---

## File Index

### Configuration Files

| Path | Lines | Purpose |
|------|-------|---------|
| `.dockerignore` | 8 | Docker build exclusions |
| `.env.example` | 24 | Environment variables template |
| `docker-compose.yml` | 55 | PostgreSQL + app orchestration |
| `Dockerfile` | 71 | Multi-stage production build |
| `backend/package.json` | 75 | Backend dependencies |
| `backend/tsconfig.json` | 41 | Backend TypeScript config |
| `frontend/package.json` | 89 | Frontend dependencies |
| `frontend/tsconfig.json` | 26 | Frontend TypeScript config |
| `frontend/vite.config.ts` | 34 | Vite build + PWA config |
| `frontend/tailwind.config.js` | 18 | Tailwind custom theme |

### Database Schema & Migrations

| Path | Lines | Purpose |
|------|-------|---------|
| `backend/prisma/schema.prisma` | 561 | **23 models:** User, Character, Spell, Class, Species, Item, Feat, Subclass, ClassFeatureChoice, etc. |
| `backend/prisma/migrations/20250923011316_init_dnd_database/migration.sql` | 269 | Initial database creation |
| `backend/prisma/migrations/20251001060000_add_class_spell_relationship/migration.sql` | 18 | Class spell lists |
| `backend/prisma/migrations/20251001120000_add_user_authentication/migration.sql` | 30 | Auth system |
| `backend/prisma/migrations/20251006000001_add_missing_tables/migration.sql` | 140 | Class choice system tables |

### Backend API Routes

| Path | Lines | Key Exports | Purpose |
|------|-------|-------------|---------|
| `backend/src/server.ts` | 211 | app, server, io | Express + Socket.IO server |
| `backend/src/routes/auth.ts` | 464 | router | JWT auth: login, register, refresh |
| `backend/src/routes/characters.ts` | 430 | router | Character CRUD operations |
| `backend/src/routes/generator.ts` | 518 | router | Random character generator |
| `backend/src/routes/spells.ts` | 248 | router | Spell search and filtering |
| `backend/src/routes/classes.ts` | 237 | router | Class details and features |
| `backend/src/routes/classChoices.ts` | 190 | router | Fighting styles, invocations |
| `backend/src/routes/feats.ts` | 140 | router | Feat database |
| `backend/src/routes/items.ts` | 148 | router | Item catalog |

### Frontend Components (Selected Key Files)

| Path | Lines | Purpose |
|------|-------|---------|
| `frontend/src/App.tsx` | 238 | Main routing and navigation |
| `frontend/src/components/CharacterGeneratorWizard.tsx` | 2114 | **Character wizard orchestrator** |
| `frontend/src/components/CharacterSheet.tsx` | 1002 | Full character sheet display |
| `frontend/src/components/wizard-steps/Step2_ClassSelection.tsx` | 1512 | Class + subclass + choices |
| `frontend/src/components/wizard-steps/Step5_ReviewCreate.tsx` | 941 | Final review and creation |
| `frontend/src/components/wizard-steps/SpellSelectionWizard.tsx` | 641 | Spell selection (2-step) |

### Frontend Utilities & Helpers

| Path | Lines | Purpose | Critical? |
|------|-------|---------|-----------|
| `frontend/src/utils/dndTemplateParser.ts` | 304 | **Parses {@spell}, {@condition} tags** | ⚠️ **YES** |
| `frontend/src/utils/simpleFeatureGenerator.ts` | 1850 | Generate feat/class/species features | ⚠️ **YES** |
| `frontend/src/utils/characterDataMapper.ts` | 731 | API → character sheet mapping | **YES** |
| `frontend/src/utils/featureParser.ts` | 580 | Parse feature entries (lists, tables) | **YES** |
| `frontend/src/helpers/spellRules.ts` | 357 | D&D 2024 spell slot rules | **YES** |
| `frontend/src/store/characterBuilderStore.ts` | 812 | Zustand wizard state | **YES** |

### Import Scripts

| Path | Lines | Purpose |
|------|-------|---------|
| `backend/scripts/import-spells.js` | 289 | Import 391 spells from 5etools |
| `backend/scripts/import-classes.js` | 408 | Import 12 classes |
| `backend/scripts/import-species.js` | 315 | Import 10 species |
| `backend/scripts/import-items.js` | 493 | Import 705 items (97.4% success) |
| `backend/scripts/import-feats.js` | 401 | Import 77 feats |
| `backend/scripts/import-class-choices.js` | 357 | Import choice system data |

---

## Key Entrypoints

### Development

**Backend:**
```bash
cd backend
npm run dev              # ts-node-dev on src/server.ts
# Starts on port 8080
```

**Frontend:**
```bash
cd frontend
npm run dev              # Vite dev server
# Starts on port 3000, proxies /api to backend:8080
```

**Database:**
```bash
cd backend
npx prisma studio        # GUI on port 5555
npx prisma migrate dev   # Run migrations
node scripts/import-spells.js  # Import data
```

### Production

**Docker:**
```bash
docker-compose up -d
# Backend + PostgreSQL on ports 8080, 5433
# Frontend bundled into backend/dist/public
```

**Entrypoint Flow (Docker):**
1. Build: `Dockerfile` builds backend + frontend
2. Runtime: `/app/entrypoint.sh` runs migrations, seeds, starts server
3. Server: `backend/dist/src/server.js` serves API + static frontend

### Code Entrypoints

**Backend:** `backend/src/server.ts`  
- Initializes Express, Socket.IO  
- Loads middleware (helmet, cors, auth)  
- Mounts API routes under `/api/*`  
- Serves frontend static files from `/public`  

**Frontend:** `frontend/src/main.tsx`  
- Wraps app in providers (Router, QueryClient, Auth, Toast)  
- Renders `<App />` with routing  

**App Routes:** `frontend/src/App.tsx`  
- `/` - Home page  
- `/generator` - Character wizard  
- `/characters` - Character list (protected)  
- `/characters/:id` - Character sheet (protected)  
- `/spells`, `/classes`, `/items`, `/feats` - Content browser  
- `/login`, `/register` - Authentication  

---

## Data Flow

### Character Creation Flow

```
User Input (Wizard Steps 0-5)
    ↓
characterBuilderStore (Zustand)
    ↓
builderDataMapper.ts (transforms to API format)
    ↓
POST /api/characters (characterService.create)
    ↓
Backend validates, saves to DB (Prisma)
    ↓
Returns ApiCharacter
    ↓
characterDataMapper.ts (transforms to sheet format)
    ↓
CharacterSheet component displays
```

### Content Loading Flow

```
User navigates to /spells
    ↓
SpellsPage.tsx loads
    ↓
useQuery → spellService.getSpells()
    ↓
GET /api/spells?level=0&class=Wizard
    ↓
Backend queries Prisma (spells table)
    ↓
Returns JSON with template tags: {@condition Charmed|XPHB}
    ↓
Frontend: dndTemplateParser.ts parses tags
    ↓
Renders plain text or links
```

**CRITICAL:** All D&D content from the database contains template tags like `{@spell Fireball|XPHB}`. These **MUST** be parsed through `dndTemplateParser.ts` before display, or users see raw markup.

### Authentication Flow

```
Login Form
    ↓
POST /api/auth/login (username, password)
    ↓
Backend validates with bcrypt
    ↓
Returns JWT access + refresh tokens
    ↓
Frontend stores in localStorage
    ↓
api.ts interceptor adds Authorization header
    ↓
Protected routes verify JWT in auth.ts middleware
```

---

## Critical Dependencies

### Must-Use Utilities

1. **`dndTemplateParser.ts`** - Parse all D&D template tags  
   - Functions: `parseDnDTemplateTag()`, `parseComplexDnDEntry()`  
   - Used in: feature display, spell modals, class details, feat modals  
   - **Risk:** Forgetting to parse causes `{@spell Fireball|XPHB}` to display as-is  

2. **`simpleFeatureGenerator.ts`** - Generate character features  
   - Extracts feat features, class features, species traits  
   - **Must** use `parseComplexDnDEntry()` internally  
   - Used in: character creation, character sheet  

3. **`characterDataMapper.ts`** - API ↔ Sheet transformation  
   - Maps DB format to frontend character sheet  
   - Calculates derived stats (AC, HP, saves)  
   - Used in: CharacterViewPage, CharacterSheet  

4. **`builderDataMapper.ts`** - Wizard ↔ API transformation  
   - Maps wizard state to API create/update format  
   - Used in: Step5_ReviewCreate  

5. **`spellRules.ts`** - D&D 2024 spell slot rules  
   - Calculates max prepared spells, known spells, cantrips  
   - Used in: SpellSelectionWizard, PreparedSpellsSection  

### External Dependencies

**Backend:**
- `@prisma/client` - Database ORM
- `express` - Web framework
- `jsonwebtoken` - JWT auth
- `bcryptjs` - Password hashing
- `helmet` - Security headers

**Frontend:**
- `react` + `react-dom` - UI framework
- `vite` - Build tool
- `styled-components` - CSS-in-JS
- `react-router-dom` - Routing
- `@tanstack/react-query` - Server state
- `zustand` - Client state

---

## Notable Risks & TODOs

### Security

- JWT_SECRET must be changed in production (.env.example has default)
- Rate limiting requires trust proxy setting for correct IP detection
- CSP allows `unsafe-inline` for styled-components (acceptable tradeoff)

### Data Quality

- 19 items failed import (2.6% failure rate) - mostly complex magic items
- Template tag parsing is critical but often forgotten
- JSONB fields require careful validation

### Code Quality

- `CharacterGeneratorWizard.tsx` is 2114 lines (needs refactoring)
- `simpleFeatureGenerator.ts` is 1850 lines (complex logic)
- Several components over 1000 lines (refactor candidates)

### Testing

- Backend: Jest configured but tests not written
- Frontend: Vitest configured but tests not written
- Only manual testing performed

### Discord Bot

- Framework scaffolded but no features implemented
- Planned: character lookup, dice rolling, spell reference

---

## Statistics

**Language Breakdown:**
- TypeScript: ~70,000 lines (backend + frontend)
- SQL: ~500 lines (migrations)
- JavaScript: ~6,000 lines (import scripts)
- Shell: ~500 lines (maintenance scripts)

**File Type Distribution:**
- Code: 132 files (60%)
- Scripts: 35 files (16%)
- Documentation: 24 files (11%)
- Config: 13 files (6%)
- Migrations: 7 files (3%)
- Data: 4 files (2%)
- Schema: 3 files (1%)
- Infrastructure: 3 files (1%)

**Largest Files:**
1. `CharacterGeneratorWizard.tsx` - 2114 lines
2. `simpleFeatureGenerator.ts` - 1850 lines
3. `ClassDetailsPage.tsx` - 1772 lines
4. `SpellSelectionWizard_OLD_BACKUP.tsx` - 1589 lines
5. `Step2_ClassSelection.tsx` - 1512 lines

---

**For detailed file listing with all exports and dependencies, see REPO_MAP.csv**

