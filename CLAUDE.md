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
- `.env.example` - Environment variables template

## Important Development Notes

### D&D Template Tag Parsing - ENFORCED WITH AUTOMATED TOOLS

**CRITICAL**: When displaying D&D content that comes from the database (feats, spells, class features, etc.), you MUST always parse it through the template tag parser to handle markup like `{@condition Incapacitated|XPHB}`, `{@spell Fireball|XPHB}`, etc.

**📚 Full Documentation**: See [docs/DND_TEMPLATE_TAG_ENFORCEMENT.md](docs/DND_TEMPLATE_TAG_ENFORCEMENT.md) for complete details.

#### Enforcement Tools

This project has **three layers of enforcement** to prevent unparsed template tags:

1. **ESLint Rule** (Static Analysis)
   - Location: `frontend/eslint-local-rules.cjs`
   - Detects unparsed content at compile time
   - Run: `npm run lint` (auto-fix: `npm run lint:fix`)

2. **Runtime Guards** (Development Mode)
   - Location: `frontend/src/utils/dndTemplateGuard.ts`
   - Console warnings when unparsed content is detected
   - Enable strict mode: `VITE_STRICT_TEMPLATE_PARSING=true` in `.env.development`

3. **Visual Warnings** (Development Mode)
   - Automatically highlights unparsed content with red borders
   - Enabled in `frontend/src/main.tsx`

#### The Parser

**Location**: `frontend/src/utils/dndTemplateParser.ts`

**Key functions**:
- `parseDnDTemplateTag(text: string)` - Parses a single string with template tags
- `parseComplexDnDEntry(entry: any)` - Handles nested structures (objects, arrays) and recursively parses all strings

#### Critical Rules

1. **ALWAYS parse before display:**
   ```typescript
   // ❌ BAD - displays raw template tags
   const description = feature.description;

   // ✅ GOOD - parses template tags
   const description = parseComplexDnDEntry(feature.description);
   ```

2. **NEVER join arrays before parsing:**
   ```typescript
   // ❌ BAD - joins first, loses object structure
   const description = feature.entries.join(' ');

   // ✅ GOOD - parse the array directly
   const description = parseComplexDnDEntry(feature.entries);
   ```

3. **Import the parser** at the top of any file displaying D&D content:
   ```typescript
   import { parseComplexDnDEntry } from '@/utils/dndTemplateParser';
   ```

#### High-Risk Locations

These areas commonly have unparsed content issues:
- `frontend/src/utils/simpleFeatureGenerator.ts` - Feature extraction
- Modal components (ClassModal, SpellModal, FeatModal)
- Wizard step components (Step3D_OriginFeats, Step5_ReviewCreate)
- Any component displaying `character.classFeatures`, `character.featFeatures`, etc.

#### Testing for Unparsed Content

**In the UI**: Look for:
- `{@` or `|XPHB` in rendered text
- `[object Object]` (indicates objects weren't parsed)
- Red borders (in development mode)

**In the console**: Look for warnings like:
```
⚠️ UNPARSED D&D TEMPLATE TAGS DETECTED
{
  source: 'feature.description',
  sample: 'You gain {@condition Invisible|XPHB}...',
  fix: 'Use parseComplexDnDEntry() before displaying'
}
```

**Programmatically**:
```typescript
import { validateCharacterContent } from '@/utils/dndTemplateGuard';

const validation = validateCharacterContent(character);
if (validation.hasUnparsedContent) {
  console.error('Issues found:', validation.violations);
}
```

#### Before Committing

1. Run `npm run lint` to catch static issues
2. Test in development mode with visual warnings enabled
3. Check console for runtime warnings
4. Verify no raw `{@` tags in the UI

**See [docs/DND_TEMPLATE_TAG_ENFORCEMENT.md](docs/DND_TEMPLATE_TAG_ENFORCEMENT.md) for troubleshooting and advanced usage.**

## Testing the System

After setting up, test the database imports:
```bash
cd backend
node scripts/test-database.js          # Verify database connectivity
node scripts/generate-random-character.js  # Test character generation
```

The project includes a comprehensive D&D 2024 dataset with 97.4% import success rate from 5etools format.