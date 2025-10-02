# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a D&D 2024 Character Sheet Generator featuring complete D&D 2024 rules compliance with integrated Nimble TTRPG homebrew mechanics. The project uses a monorepo structure with separate backend, frontend, and Discord bot applications.

## Project Structure

- `backend/` - Node.js/TypeScript Express API with Prisma ORM and PostgreSQL
- `frontend/` - React/TypeScript frontend with Vite build system
- `discord-bot/` - Discord.js bot for character lookup and dice rolling (planned)
- `database/` - Database import data and scripts
- `docs/` - Project documentation
- `docker/` - Docker configuration files

## Common Development Commands

### Backend Development
```bash
cd backend
npm run dev              # Start development server with hot reload
npm run build           # Build TypeScript to dist/
npm run start           # Start production server
npm test                # Run Jest tests
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
```

### Frontend Development
```bash
cd frontend
npm run dev             # Start Vite development server
npm run build           # Build for production (includes type checking)
npm run preview         # Preview production build
npm test                # Run Vitest tests
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # TypeScript type checking only
```

### Discord Bot Development
```bash
cd discord-bot
npm run dev             # Start development server
npm run build           # Build TypeScript
npm run start           # Start production bot
npm run deploy-commands # Deploy Discord slash commands
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
```

### Database Operations
```bash
cd backend
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Create and apply new migration
npx prisma migrate deploy # Apply migrations (production)
npx prisma studio       # Open Prisma Studio GUI
npx prisma db seed      # Run database seed script
npx prisma migrate reset # Reset database (development only)
```

### Docker Operations
```bash
docker-compose up -d            # Start all services
docker-compose down             # Stop all services
docker-compose logs backend     # View backend logs
docker-compose exec backend sh  # Shell into backend container
```

## Architecture Details

### Database Schema
The project uses PostgreSQL with Prisma ORM. The schema includes:
- **Content tables**: spells (391), items (705), species (10), classes (12), backgrounds (16), feats (77)
- **User management**: users, characters with JSONB data storage
- **Campaign system**: campaigns and character relationships (planned)

### Import System
D&D 2024 content is imported via automated scripts in `backend/scripts/`:
- `import-spells.js` - Import spell data from 5etools format
- `import-species.js` - Import species/race data
- `import-classes.js` - Import class and subclass data
- `import-backgrounds.js` - Import background data
- `import-feats.js` - Import feat data
- `import-items.js` - Import items from XPHB and XDMG
- `generate-random-character.js` - Generate random characters for testing

### API Structure
Backend follows RESTful conventions with planned endpoints:
- `/api/auth` - Authentication (JWT-based)
- `/api/characters` - Character CRUD operations
- `/api/content` - D&D content (spells, classes, etc.)
- `/api/campaigns` - Campaign management (planned)

### Frontend Architecture
- React 18 with TypeScript and Vite
- Styled Components for CSS-in-JS styling
- React Router for navigation
- React Query for server state management
- Zustand for client state management
- PWA capabilities with Workbox

## Development Workflow

1. **Database First**: Schema changes require Prisma migrations
2. **Type Safety**: All code uses TypeScript with strict mode
3. **Testing**: Jest for backend, Vitest for frontend
4. **Code Quality**: ESLint configuration enforced across all packages
5. **Import Scripts**: Use provided scripts to populate database with D&D 2024 content

## Key Files

- `backend/prisma/schema.prisma` - Database schema definition
- `backend/src/server.ts` - Express server entry point
- `frontend/src/main.tsx` - React application entry point
- `docker-compose.yml` - Complete containerized deployment setup
- `.env.example` - Environment variables template

## Important Development Notes

### D&D Template Tag Parsing

**CRITICAL**: When displaying D&D content that comes from the database (feats, spells, class features, etc.), you MUST always parse it through the template tag parser to handle markup like `{@condition Incapacitated|XPHB}`, `{@spell Fireball|XPHB}`, etc.

**The parser location**: `frontend/src/utils/dndTemplateParser.ts`

**Key functions**:
- `parseDnDTemplateTag(text: string)` - Parses a single string with template tags
- `parseComplexDnDEntry(entry: any)` - Handles nested structures (objects, arrays) and recursively parses all strings

**Common mistake**: When processing stored data (especially from `character.featFeatures`, `character.classFeatures`, etc.), developers often forget to parse strings through the template parser. This results in raw markup like `{@condition Incapacitated|XPHB}` being displayed to users instead of just "Incapacitated".

**Solution pattern**:
```typescript
// BAD - displays raw template tags
if (typeof feature === 'string') {
  description = feature;  // ❌ No parsing!
}

// GOOD - parses template tags
if (typeof feature === 'string') {
  description = parseComplexDnDEntry(feature);  // ✅ Parses tags
}
```

**Where this commonly occurs**:
- `frontend/src/utils/simpleFeatureGenerator.ts` - When extracting feat/class/species features
- Any component that displays character features, traits, or abilities
- Modal components showing feat/spell/item details
- **CRITICAL**: When processing `feature.entries` arrays from the API - these MUST be passed to `parseComplexDnDEntry()` as arrays, NOT joined first

**Testing tip**: Search for unparsed content by looking for `{@` or `|XPHB` in the rendered UI, or for `[object Object]` which indicates objects weren't parsed.

**CRITICAL BUG FIX (2025-01-10)**: The parser NOW properly handles when the input is an array (like `feature.entries`). Previously, passing an array would cause `[object Object]` to appear because arrays weren't explicitly handled. The parser now recursively processes array elements and filters out empty results from `type: "options"` and `type: "refClassFeature"` entries.

## Testing the System

After setting up, test the database imports:
```bash
cd backend
node scripts/test-database.js          # Verify database connectivity
node scripts/generate-random-character.js  # Test character generation
```

The project includes a comprehensive D&D 2024 dataset with 97.4% import success rate from 5etools format.