# Project Status - Dungeons.WTF Character Generator

**Last Updated:** November 1, 2025
**Version:** Alpha 0.6.2
**Branch:** feature/discord-oauth

---

## 📊 Current State

### What's Working ✅

#### Core Application
- **Full-Stack D&D 2024 Character Sheet** - Complete character creation, editing, and viewing
- **Character Generator Wizard** - 5-step wizard for creating characters with full D&D 2024 rules
- **Authentication** - JWT-based auth + Discord OAuth integration (just added!)
- **Character Management** - CRUD operations for characters with version history
- **Real-time Data** - Socket.IO scaffolded (frontend hooks ready but not connected yet)
- **PWA Support** - Progressive web app capabilities for mobile/offline use

#### Database & Content
- **PostgreSQL + Prisma** - Two-layer schema (`raw` + `canon`) for D&D 2024 content
- **Complete D&D 2024 Content Imported**:
  - 391 Spells (XPHB)
  - 705 Items (XPHB: 140, XDMG: 565)
  - 12 Classes with subclasses
  - 10 Species (races)
  - 16 Backgrounds
  - 77 Feats
  - Class feature choices (fighting styles, invocations, etc.)

#### Content Quality
- **D&D Template Tag Parsing** - Automatic parsing of `{@spell Fireball|XPHB}` style tags
- **ESLint Enforcement** - Custom rule prevents unparsed template tags from shipping
- **Runtime Validation** - Development mode warnings for unparsed content
- **Visual Debugging** - Optional red borders for unparsed tags in dev mode

#### Frontend Features
- **Character Sheet View** - Complete interactive character sheet
- **Spell Management** - Prepare/cast tracking, filtering, spell slots
- **Inventory System** - Equipment, weapons, armor management
- **Actions & Combat** - Attack rolls, damage, saving throws calculated
- **Proficiencies** - Skills, saves, tools, languages tracking
- **Traits & Features** - Class features, feats, species traits display

#### API Endpoints
All routes under `/api`:
- `/auth` - Register, login, profile, password, logout, Discord OAuth
- `/characters` - Full CRUD + version history
- `/spells`, `/classes`, `/species`, `/backgrounds`, `/feats`, `/items` - Content browsing
- `/class-choices` - Fighting styles, divine orders, invocations, etc.
- `/generator/random` - Random character generation
- `/health` - Health check

### What's Not Working / In Progress ⚠️

#### High Priority Issues
1. **PHB (2014) Data Contamination** 🔴 **PARTIALLY FIXED TODAY**
   - **Status**: Import scripts and API fallbacks fixed
   - **Remaining**: Database still contains PHB data in JSONB `raw` field
   - **Risk**: Old data sitting in DB but APIs now prevent it from being used
   - **Next**: Need cleanup script to strip PHB from existing database records

2. **Spells System Incomplete** 🟡
   - Basic spell tracking works
   - Spell actions not fully integrated into character actions
   - Spell scaling (cantrips, higher levels) needs validation
   - Some spell mechanics (concentration, ritual) not surfaced in UI

3. **Character Sheet UI Issues** 🟡
   - Feature modals only show summary info instead of full detailed descriptions
   - Item modals lack sufficient detail
   - Currency/coin tracking not visible on character sheet
   - Multi-class support not implemented
   - Some class features don't auto-apply (e.g., weapon proficiencies from feats)
   - Background skill choices may not save correctly
   - Origin feats selection incomplete

4. **Character Generator Wizard Critical Bugs** 🔴
   - **Class Details Modal Crashes**: Clicking "Details" in class selection causes white screen with React rendering errors
     - Error: "Objects are not valid as a React child" in `ClassDetailsContent.tsx`
     - Issue: Component trying to render objects directly instead of parsing them
     - Files: `FeatureDetailModal.tsx`, `ClassDetailsContent.tsx`
   - **Styled Components Warning**: `isOpen` prop being passed to DOM element (should be `$isOpen` transient prop)
   - Feat details show "undefined" instead of actual feat information
   - Background details display information twice (unformatted + formatted)
   - Species details display information twice (unformatted + formatted)
   - Magic Initiate feat not implemented (complex selection logic)

5. **Character Generator Wizard UX Issues** 🟡
   - Class selection button lacks 1-2 sentence summary and level 1 features preview
   - Background selection button lacks descriptive preview
   - Species selection button lacks descriptive preview
   - Feat selection should show description inline instead of requiring details modal
   - No "Unselect" button or toggle-to-deselect functionality for selections
   - Granted spells not greyed out in spell selector (can be double-selected)
   - Primary ability scores not prominently displayed after class selection
   - Review step doesn't generate complete feature/trait data matching final character sheet
   - No validation to warn when duplicate benefits are selected
   - No per-step validation before allowing progression

6. **Starting Equipment System Missing** 🔴
   - Equipment selection step not implemented in wizard
   - Should show recommended starting gear based on class + background
   - Should include dropdowns for gear choices (e.g., "simple weapon" → specific weapon)
   - Should offer "No starting equipment" option for custom builds
   - Starting coin/wealth should be shown with recommended amount pre-filled
   - Should appear before Review step

#### Medium Priority
7. **Socket.IO Not Connected**
   - Server is running Socket.IO
   - Frontend has hooks scaffolded
   - Need to wire up real-time character updates

5. **Campaign System Not Implemented**
   - Database schema exists
   - API returns 501 Not Implemented
   - UI not built

6. **Discord Bot Empty**
   - Framework configured
   - No commands implemented
   - Database integration pending

#### Low Priority / Polish
7. **Mobile Responsiveness**
   - Character sheet works on mobile but needs polish
   - Some modals don't scroll properly on small screens
   - Touch targets could be bigger

8. **Performance Optimization**
   - No lazy loading on character list
   - Some re-renders could be optimized
   - Database queries not indexed optimally

9. **Testing Coverage**
   - No unit tests
   - No integration tests
   - No E2E tests

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Styled Components, Zustand, Axios
- **Backend**: Node.js 18+, Express, TypeScript, Prisma, PostgreSQL
- **Real-time**: Socket.IO (scaffolded)
- **Auth**: JWT + Discord OAuth
- **Deployment**: Docker + Docker Compose (Postgres service)

### Database Schema (Two-Layer)

#### `raw` Schema - Source of Truth
- `RawContent` - Stores 5etools JSON data with metadata
  - Fields: id, kind, slug, source, title, raw (JSONB), importedAt, isHomebrew
  - Unique constraint: (kind, slug, source)

#### `canon` Schema - Normalized Views
- `CanonSpell`, `CanonClass`, `CanonItem`, `CanonSpecies`, `CanonBackground`, `CanonFeat`
- Flatten specific fields from `RawContent.raw` for faster querying
- Reference back to `RawContent` for full mechanics

#### `public` Schema - Application Data
- `User` - User accounts (email + Discord OAuth)
- `Character` - Character data (JSONB storage)
- `CharacterVersionHistory` - Audit trail
- `Campaign` - Shared campaigns (not implemented)

### Data Flow
1. **Import**: 5etools JSON → `RawContent` table (`raw.content`)
2. **Flatten**: Prisma triggers/scripts → `Canon*` tables (`canon.*`)
3. **API**: Routes query `Canon*` tables, attach `mechanics` from `RawContent.raw`
4. **Frontend**: Receives full D&D mechanics for parsing and display

---

## 🎯 What Needs to Be Done

### Critical Path (Alpha → Beta)

#### 1. Database Cleanup 🔴 **HIGH PRIORITY**
- **Remove PHB Data from Database**
  - Today's fix: Import scripts now reject PHB at source
  - Today's fix: API routes won't fall back to PHB data
  - **Remaining**: Create cleanup script to strip PHB from existing `RawContent.raw` JSONB
  - **Script needed**: Loop through all classes, filter `raw.class` array to only XPHB
  - See: [docs/DATABASE_CLEANUP_PROJECT.md](docs/DATABASE_CLEANUP_PROJECT.md)

- **Consolidate Import Scripts**
  - Currently: 39 scripts in `backend/scripts/`, many are "fix" scripts
  - Goal: 8 clean idempotent scripts (one per content type + reference data + class-spells)
  - Remove all "fix-*.js", "add-*.js", "clean-*.js" scripts
  - Document import process clearly

#### 2. Fix Character Generator Wizard Critical Bugs 🔴 **HIGH PRIORITY**
- **Fix Class Details Modal Crash**
  - Component: `ClassDetailsContent.tsx` and `FeatureDetailModal.tsx`
  - Issue: Attempting to render objects directly instead of parsing D&D template data
  - Solution: Use `parseComplexDnDEntry()` on all feature entries before rendering
  - Fix `isOpen` prop warning (use `$isOpen` transient prop in styled components)

- **Fix Duplicate Content Display**
  - Background details showing content twice (remove unformatted version)
  - Species details showing content twice (remove unformatted version)
  - Keep only the formatted parsed version

- **Fix Feat Details**
  - Currently showing "undefined" when Details button clicked
  - Implement inline feat descriptions instead of modal
  - Show description directly under feat name with Select button

- **Implement Magic Initiate Feat**
  - Currently does nothing due to complexity
  - Need spell selection UI for cantrips and 1st level spell
  - Store selections in character feat data

#### 3. Character Generator Wizard UX Improvements 🟡
- **Enhanced Selection Previews**
  - Class selection: Add 1-2 sentence summary + level 1 features preview
  - Background selection: Add descriptive preview with benefits
  - Species selection: Add descriptive preview with traits
  - Display primary ability scores prominently after class selection (format: "Primary: [DAMAGE STAT] | CON | [SECONDARY STAT]")

- **Selection Management**
  - Add "Unselect" button to all selection modals OR
  - Implement toggle behavior (click selected item to deselect)

- **Spell Selection Improvements**
  - Grey out granted spells in spell selector to prevent double-selection
  - Add visual indicator showing why spell is unavailable

- **Validation & Warnings**
  - Implement per-step validation before allowing progression
  - Detect and warn when duplicate benefits are selected (e.g., same skill proficiency from multiple sources)
  - Show warning with suggestion to change selection

- **Review Step Completeness**
  - Generate complete feature/trait data matching final character sheet
  - Don't just show summaries - show exactly what will be on character sheet

#### 4. Starting Equipment System 🔴 **HIGH PRIORITY**
- **Add Equipment Selection Step** (before Review)
  - Display recommended starting equipment for selected class + background
  - Group by category (weapons, armor, tools, gear)
  - For items with choices (e.g., "simple weapon"), provide dropdown selection
  - Include "No starting equipment" checkbox for custom builds

- **Starting Wealth Management**
  - Show recommended starting coin based on class
  - Provide editable input field with recommended amount pre-filled
  - Store final wealth value with character

#### 5. Character Sheet UI Enhancements 🟡
- **Modal Detail Improvements**
  - Feature modals: Show complete detailed descriptions instead of just summary
  - Item modals: Add full item details including properties, weight, value
  - Both should use `parseComplexDnDEntry()` for D&D template tags

- **Currency Display**
  - Add coin tracking section to character sheet
  - Show GP, SP, CP, EP, PP
  - Editable fields for manual updates

#### 6. Complete Spells System 🟡
- **Integrate Spell Actions**
  - `spellActionBuilder.ts` exists but not fully integrated
  - Need to auto-generate character actions from prepared spells
  - Handle cantrip scaling (level-based damage)
  - Handle spell slot scaling (higher level casting)

- **Spell UI Polish**
  - Show concentration duration
  - Show ritual casting option
  - Better filtering/sorting
  - Spell slot tracking improvements

#### 7. Fix Character Creation Edge Cases 🟡
- **Background Skill Choices**
  - Validate background skill selection saves correctly
  - Handle "choose 2 from list" mechanics

- **Origin Feats**
  - Ensure origin feat selection works in wizard
  - Validate feat prerequisites

- **Class Features Auto-Apply**
  - Weapon proficiencies from feats
  - Tool proficiencies from backgrounds
  - Languages from species

#### 8. Multi-Class Support 🟢
- **Database Schema**
  - Character already supports JSONB, can store multiple classes
  - Need UI for adding/removing classes

- **Level Allocation**
  - Distribute levels across classes
  - Calculate proficiency bonus correctly
  - Handle multi-class spell slots

- **Prerequisites**
  - Enforce ability score requirements
  - Show which classes are available

### Secondary Priorities

#### 5. Socket.IO Real-Time Updates
- Wire frontend hooks to Socket.IO server
- Character updates broadcast to other viewers
- Show "someone else is editing" indicator
- Real-time spell slot/HP updates in combat

#### 6. Campaign System
- Implement `/api/campaigns` routes
- UI for creating/joining campaigns
- Character sharing within campaigns
- DM tools (view all characters, notes, etc.)

#### 7. Discord Bot
- Implement slash commands:
  - `/character [name]` - Look up character
  - `/spell [name]` - Look up spell
  - `/roll [dice]` - Dice roller
  - `/class [name]` - Class info
- Database integration for user linking

#### 8. Performance & Polish
- Add loading skeletons
- Lazy load character list
- Optimize re-renders
- Add error boundaries
- Better mobile UX

#### 9. Testing
- Unit tests for utilities
- Integration tests for APIs
- E2E tests for character creation flow
- Spell parsing validation suite

---

## 📁 Project Structure

```
theasdm-charactersheet/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Two-layer schema (raw + canon + public)
│   │   ├── seed.ts                # Reference data seed
│   │   └── migrations/            # 20+ migrations
│   ├── scripts/                   # ⚠️ 39 scripts (needs cleanup)
│   │   ├── import-*.js            # Import scripts (some outdated)
│   │   ├── fix-*.js               # Band-aid scripts (should be removed)
│   │   └── generate-*.js          # Utility scripts
│   └── src/
│       ├── routes/                # API endpoints
│       ├── middleware/            # Auth, CORS, etc.
│       └── server.ts              # Express + Socket.IO server
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page-level components
│   │   ├── contexts/              # React contexts (AuthContext)
│   │   ├── store/                 # Zustand stores
│   │   ├── services/              # API clients
│   │   ├── utils/                 # Utilities (template parser, etc.)
│   │   └── styles/                # Styled components
│   └── public/                    # Static assets
├── docs/                          # ✅ Cleaned up today!
│   ├── DND_TEMPLATE_TAG_ENFORCEMENT.md
│   ├── CODEX_REFERENCE.md
│   ├── DATABASE_CLEANUP_PROJECT.md
│   ├── DEPLOYMENT.md
│   └── SERVER_OPTIMIZATION.md
├── CLAUDE.md                      # AI assistant instructions
├── README.md                      # Project overview
├── CHANGELOG.md                   # Version history
└── docker-compose.yml             # Postgres service
```

---

## 🚀 Quick Start

### Backend Development
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev                        # Starts on :3001
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev                        # Starts on :5173, proxies /api to :3001
```

### Database Operations
```bash
cd backend

# View database in GUI
npx prisma studio

# Reset database (⚠️ DESTRUCTIVE)
npx prisma migrate reset

# Import D&D content (⚠️ Old scripts, needs cleanup)
node scripts/import-spells.js ../5etools/data/spells/spells-xphb.json
# ... etc
```

### Docker Deployment
```bash
# PostgreSQL only
docker-compose up -d

# Full app (uses SQLite in container)
docker build -t dungeons-wtf:latest .
docker run -p 8080:8080 --env-file .env.production dungeons-wtf:latest
```

---

## 🐛 Known Issues & Workarounds

### Issue: PHB Data in Database
- **Symptom**: Database contains both PHB (2014) and XPHB (2024) data in `RawContent.raw` JSONB
- **Fixed Today**: Import scripts now reject PHB at source
- **Fixed Today**: API routes won't fall back to PHB data
- **Remaining**: Existing database needs cleanup
- **Workaround**: APIs are safe, but DB is cluttered
- **Solution**: Run cleanup script (to be written)

### Issue: Template Tag Parsing
- **Symptom**: `{@spell Fireball|XPHB}` appearing in UI instead of "Fireball"
- **Solution**: Always use `parseComplexDnDEntry()` before displaying D&D content
- **Enforcement**: ESLint rule + runtime warnings + optional visual debugging
- **Docs**: [docs/DND_TEMPLATE_TAG_ENFORCEMENT.md](docs/DND_TEMPLATE_TAG_ENFORCEMENT.md)

### Issue: Import Scripts Chaos
- **Symptom**: 39 scripts in `backend/scripts/`, unclear which to use
- **Root Cause**: Multiple import runs + manual fixes
- **Workaround**: Use the main `import-*.js` scripts, ignore `fix-*.js`
- **Solution**: Database cleanup project (see docs)

---

## 📈 Recent Updates

### November 1, 2025 - PHB Data Removal (Partial)
- ✅ Updated `import-classes.js` to reject PHB at source
- ✅ Updated `import-spells.js` to reject PHB at source
- ✅ Fixed `classes.ts` API fallback (removed dangerous `|| rawData.class[0]`)
- ⚠️ Database still contains PHB data (cleanup script needed)
- ✅ Cleaned up documentation (removed 20+ outdated files)
- ✅ Created this comprehensive PROJECT_STATUS.md

### October 27, 2025 - Discord OAuth
- ✅ Integrated Discord OAuth login
- ✅ Updated User schema with Discord fields
- ✅ JWT auth working alongside Discord

### October 2025 - Alpha 0.6.0 Release
- ✅ Functional character sheet
- ✅ Character generator wizard
- ✅ Spell management
- ✅ Inventory system
- ✅ Actions & combat calculations
- ✅ Template tag parsing enforcement

---

## 🎯 Version Roadmap

### Alpha 0.7.0 (Next Release)
- [ ] Database PHB cleanup script
- [ ] Spell actions fully integrated
- [ ] Multi-class support
- [ ] Character creation edge cases fixed
- [ ] Import scripts consolidated

### Alpha 0.8.0
- [ ] Socket.IO real-time updates
- [ ] Campaign system MVP
- [ ] Discord bot basic commands
- [ ] Mobile UX polish

### Beta 1.0.0
- [ ] Complete test coverage
- [ ] Performance optimization
- [ ] Full mobile responsiveness
- [ ] Production deployment guide
- [ ] User documentation

### 1.0.0 (Production Release)
- [ ] All features complete
- [ ] No critical bugs
- [ ] Deployment automated
- [ ] Monitoring & logging
- [ ] User support plan

---

## 📞 Support & Contribution

- **Issues**: Use GitHub Issues
- **Questions**: See [README.md](README.md) or [CLAUDE.md](CLAUDE.md)
- **Contributing**: Open an issue first to discuss
- **AI Development**: This project uses Claude Code - see [CLAUDE.md](CLAUDE.md)

---

## 🔗 Key Documentation

- [README.md](README.md) - Project overview and setup
- [CLAUDE.md](CLAUDE.md) - AI assistant development instructions
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [docs/DND_TEMPLATE_TAG_ENFORCEMENT.md](docs/DND_TEMPLATE_TAG_ENFORCEMENT.md) - Template tag parsing
- [docs/DATABASE_CLEANUP_PROJECT.md](docs/DATABASE_CLEANUP_PROJECT.md) - Database cleanup plan
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment guide
- [CHOICE_SYSTEM_README.md](CHOICE_SYSTEM_README.md) - Class feature choice system
- [REPO_MAP.md](REPO_MAP.md) - Codebase navigation guide
