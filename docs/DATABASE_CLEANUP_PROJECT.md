# Database Cleanup & Refactor Project

**Started:** 2025-10-14
**Updated:** 2025-11-01
**Status:** 🚧 In Progress
**Vibe:** Let's make this database less hacky!

---

## 🆕 Recent Progress (Nov 1, 2025)

### ✅ PHB Data Removal - Phase 1 Complete

**What Was Fixed:**
1. **Import Scripts Updated** ([backend/scripts/](../backend/scripts/))
   - ✅ `import-classes.js` - Now rejects PHB at source (line 61-64)
   - ✅ `import-spells.js` - Added XPHB/XDMG filtering (line 88-91)
   - ✅ `import-species.js`, `import-backgrounds.js`, `import-feats.js`, `import-items.js` - Already correct

2. **API Fallback Fixed** ([backend/src/routes/classes.ts](../backend/src/routes/classes.ts))
   - ✅ Line 125 (GET / route) - Removed dangerous `|| rawData.class?.[0]` fallback
   - ✅ Line 207 (GET /:nameOrId route) - Removed dangerous fallback, returns 404 if no XPHB data

**What's Remaining:**
- ❌ **Database Cleanup Script Needed** - Existing database still contains PHB data in `RawContent.raw` JSONB field
- ❌ **Import Scripts Consolidation** - Still have 39 scripts, many are "fix" scripts that should be removed

---

## 🎯 Project Goal

Clean up and properly structure the database system that's been "vibing" its way through development. Time to make it production-ready and maintainable.

---

## 📊 Current State Assessment

### What We've Got

#### ✅ **The Good Stuff**

1. **Solid Schema Foundation** ([schema.prisma](../backend/prisma/schema.prisma))
   - Comprehensive D&D 2024 data model
   - Proper use of JSONB for flexible D&D content
   - Good normalization for core tables
   - Discord OAuth integration in User model
   - Proper relations and cascade deletes

2. **Working Import Pipeline**
   - 391 spells imported
   - 705 items imported
   - 10 species imported
   - 12 classes imported
   - 16 backgrounds imported
   - 77 feats imported
   - 97.4% import success rate from 5etools format

3. **Modern Stack**
   - Prisma ORM with TypeScript
   - PostgreSQL 15
   - Docker containerized
   - Migration system in place

#### 🤔 **The "Hacky Shit" (What Needs Fixing)**

1. **Import Script Chaos** (39 scripts in `/backend/scripts/`)
   - ❌ `import-2014-items.js` - Why are we importing 2014 content for a 2024 app?
   - ❌ `import-all-missing-items.js` - "Missing" suggests gaps in main import
   - ❌ `import-missing-core-items.js` - More missing things
   - ❌ `fix-2014-terminology.js` - Cleaning up old terminology after import
   - ❌ `fix-armor-descriptions.js` - Post-import fixes
   - ❌ `fix-sorcerer-double.js` - Duplicate sorcerer issue
   - ❌ `fix-warlock-choices.js` - Warlock data needed special handling
   - ❌ `fix-vanyas-haversack-*.js` (5 different scripts!) - One item needed FIVE fix scripts
   - ❌ `add-species-descriptions.js` - Descriptions imported separately
   - ❌ `clean-class-spells.js` - Cleaning up spell relationships
   - ❌ `class-spells-data.js` - Hardcoded spell data
   - ❌ Multiple "generate" and "reimport" scripts

   **Problem:** Import process is fragmented. Should be ONE reliable import per content type.

2. **Seed File is Fake Data** ([prisma/seed.ts](../backend/prisma/seed.ts))
   - Creates sample data (Fighter, Wizard, Human, Elf, 2 spells)
   - NOT the real D&D 2024 content
   - Doesn't match what's actually in production
   - **Problem:** Seed should import REAL content, not samples

3. **Schema vs Reality Mismatch**
   - Schema has fields like `castingTime`, `rangeText`, `school` in Spell model
   - But these don't match actual Prisma schema (which uses Json fields)
   - **Problem:** Seed file schema doesn't match actual schema.prisma

4. **Reference Tables Not Populated**
   - `SpellSchool` - defined but probably empty
   - `DamageType` - defined but probably empty
   - `Condition` - defined but probably empty
   - `CreatureType` - defined but probably empty
   - `FightingStyle` - defined but probably empty
   - `EldritchInvocation` - defined but probably empty
   - `DivineOrder` - defined but probably empty
   - **Problem:** Defined normalized tables but not using them

5. **Subclass System Incomplete**
   - `Subclass` and `SubclassFeature` tables exist
   - But subclass data likely stored in Class.subclassFeatures JSONB instead
   - **Problem:** Schema suggests normalization but using JSONB blob

6. **ClassFeatureChoice System Incomplete**
   - `ClassFeatureChoice` and `ClassFeatureOption` tables for complex choices
   - Probably not populated or used
   - Class features likely all in Class.classFeatures JSONB
   - **Problem:** Built a normalized system but still using JSONB

7. **Database Environment Confusion**
   - Docker Compose uses: `wtforge` user/db on port 5433
   - .env.example uses: `dnd_user`/`dnd_character_sheet` (generic)
   - Import scripts use: `DATABASE_URL` env var
   - **Problem:** Inconsistent naming, unclear which DB is production

8. **Content Versioning Not Used**
   - `ContentVersion` table exists
   - `contentVersion` field on every content table
   - But no actual version management happening
   - **Problem:** Built versioning system but not using it

9. **Multiple Import Runs = Dirty Data**
   - All those "fix" scripts suggest multiple import attempts
   - Some scripts do `upsert`, some do `create`, some do `update`
   - No clear "reset and reimport cleanly" process
   - **Problem:** Data quality uncertain, likely has duplicates/inconsistencies

#### 📁 **File Structure Issues**

```
backend/
├── prisma/
│   ├── schema.prisma          # ✅ Good
│   ├── seed.ts                # ❌ Fake data
│   └── migrations/            # ✅ Good (7 migrations)
├── scripts/                   # ❌ 39 scripts of chaos
│   ├── import-*.js (11)       # Should be ~6
│   ├── fix-*.js (8)           # Shouldn't exist
│   ├── add-*.js (2)           # Band-aids
│   ├── clean-*.js (2)         # More band-aids
│   ├── update-*.js (2)        # Even more band-aids
│   ├── generate-*.js (2)      # Utility scripts
│   ├── check-*.js (2)         # Debug scripts
│   └── ... (10 more misc)     # Misc chaos
└── src/scripts/               # ❌ Duplicate location?
    └── seed-reference.ts      # What's this?

database/
├── init.sql                   # ❌ Legacy (documented)
├── LEGACY_MIGRATIONS.md       # ✅ Good documentation
└── seeds/                     # ❓ Not sure what's in here
```

---

## 🎬 Current Database State

### Production Database
- **Location:** Docker container `wtforge-postgres`
- **Port:** 5433 (mapped from container 5432)
- **Database:** `wtforge`
- **User:** `wtforge`
- **Password:** `wtforge` (⚠️ needs changing for production)

### What's Actually In There?
Unknown. Need to audit:
- [ ] What content is actually loaded?
- [ ] Are there duplicates?
- [ ] Are reference tables populated?
- [ ] Is content version tracking used?
- [ ] Check data quality/consistency

---

## 🚩 Specific Problems to Fix

### Problem 1: Import Script Hell
**Current:** 39 scripts, many are fixes for previous imports
**Should Be:**
- `import-spells.js` - Import all spells (391)
- `import-items.js` - Import all items (705)
- `import-species.js` - Import all species (10)
- `import-classes.js` - Import all classes + subclasses (12)
- `import-backgrounds.js` - Import all backgrounds (16)
- `import-feats.js` - Import all feats (77)
- `import-reference-data.js` - Populate reference tables
- `import-class-spells.js` - Link classes to spells

**Each should be:**
- ✅ Idempotent (can run multiple times safely)
- ✅ Atomic (all or nothing)
- ✅ Validated (check data before inserting)
- ✅ Logged (clear success/failure reporting)
- ✅ Single source of truth (one file per content type)

### Problem 2: Schema Design Decisions
**Need to decide:**
- Do we want normalized class features or JSONB?
  - **Normalized:** `ClassFeatureChoice`, `SubclassFeature` tables
  - **JSONB:** Flexible, easier to import 5etools data
  - **Hybrid?** Keep JSONB but also populate normalized for querying?

- Do we want normalized reference tables?
  - `SpellSchool`, `DamageType`, `Condition`, etc.
  - Or just store strings and handle in application?

- Do we actually need content versioning?
  - If yes, need to implement migration system
  - If no, remove those fields

### Problem 3: Seed File vs Import Scripts
**Current state:**
- `seed.ts` creates fake sample data
- Real data imported via separate scripts
- Unclear what runs when

**Need to decide:**
- Should `seed.ts` import real D&D content?
- Or should it create test data for development?
- Where should "first time setup" live?

### Problem 4: Data Source Management
**Current:** 5etools JSON files somewhere
**Questions:**
- Where are the source JSON files?
- Are they versioned/tracked?
- How do we know if data is outdated?
- What's our update process for new D&D content?

### Problem 5: Environment Configuration
**Current:**
- Docker uses `wtforge` database
- Docs reference `dnd_character_sheet`
- Scripts use `DATABASE_URL` env var
- No clear dev vs prod distinction

**Need:**
- Consistent naming
- Clear dev/staging/prod separation
- Environment variable documentation

---

## 🎯 Goals for Clean Database

### Phase 0: PHB Data Removal 🔴 **IN PROGRESS**
- [x] Update import scripts to reject PHB at source (Nov 1, 2025)
- [x] Fix API fallbacks that could use PHB data (Nov 1, 2025)
- [ ] **Create database cleanup script** to remove PHB from existing records
  - Target: `RawContent.raw` JSONB field
  - For classes: Filter `raw.class` array to only `source === 'XPHB'`
  - For class features: Filter `raw.classFeature` array to only `source === 'XPHB'`
  - For subclasses: Filter `raw.subclass` array to only `source === 'XPHB'`
  - Script location: `backend/scripts/clean-phb-data.ts`
  - See implementation notes below

### Phase 1: Audit & Document
- [x] Document current state
- [x] Identify PHB data contamination issue (Nov 1, 2025)
- [ ] Audit actual database contents
- [ ] Map data flow from source → database
- [ ] Identify remaining data quality issues
- [ ] List all environment configurations

### Phase 2: Clean Import Pipeline
- [ ] Create clean import scripts (one per content type)
- [ ] Validate source data files
- [ ] Create master import script that runs all in order
- [ ] Add proper error handling and rollback
- [ ] Document import process

### Phase 3: Schema Refinement
- [ ] Decide: normalized vs JSONB for class features
- [ ] Decide: populate reference tables or not
- [ ] Decide: use content versioning or not
- [ ] Update schema based on decisions
- [ ] Create migration for schema changes

### Phase 4: Seed & Setup
- [ ] Rewrite seed.ts to import real content OR
- [ ] Create separate setup script for production data
- [ ] Create test data seed for development
- [ ] Document first-time setup process

### Phase 5: Cleanup & Documentation
- [ ] Archive/delete old import scripts
- [ ] Clean up database/ directory
- [ ] Update CLAUDE.md with new process
- [ ] Create DATABASE.md with architecture
- [ ] Add troubleshooting guide

### Phase 6: Validation & Testing
- [ ] Test complete database reset and reimport
- [ ] Verify data integrity
- [ ] Check application still works
- [ ] Performance test queries
- [ ] Test development workflow

---

## 📋 Questions to Answer

### Architecture Decisions
1. **How normalized should class features be?**
   - Keep flexible JSONB?
   - Or normalize into tables for better querying?
   - Impact on import complexity vs query performance

2. **Do we need content versioning?**
   - Planning to update with new D&D releases?
   - Need character migration when content changes?
   - Or is content relatively stable?

3. **Reference tables: populate or skip?**
   - `SpellSchool`, `DamageType`, `Condition`, `CreatureType`
   - Do we need these for relationships/constraints?
   - Or just use strings and handle in app?

4. **What goes in seed.ts?**
   - Real D&D content?
   - Sample test data?
   - Reference data only?
   - Nothing (use separate import)?

### Process Questions
5. **Where are the source data files?**
   - 5etools JSON files location?
   - How do we update them?
   - Version control for source data?

6. **Development database workflow?**
   - How do developers get a working DB?
   - Docker compose up → automatic import?
   - Or manual setup steps?

7. **Production database workflow?**
   - How does production DB get populated?
   - Migration on deploy?
   - One-time manual import?

8. **What's the update process?**
   - When new D&D content releases
   - When we find data errors
   - When we add homebrew content

---

## 🛠️ Technical Debt Items

### High Priority
- [ ] Import script consolidation
- [ ] Fix seed.ts to match actual schema
- [ ] Database environment naming consistency
- [ ] Document actual data import process

### Medium Priority
- [ ] Populate reference tables or remove them
- [ ] Implement or remove content versioning
- [ ] Decide on class feature normalization
- [ ] Clean up old fix/update scripts

### Low Priority
- [ ] Archive database/init.sql
- [ ] Remove unused import scripts
- [ ] Add data validation scripts
- [ ] Performance optimization

---

## 📚 Resources & References

### Current Documentation
- [CLAUDE.md](../CLAUDE.md) - Project overview and commands
- [schema.prisma](../backend/prisma/schema.prisma) - Current schema
- [LEGACY_MIGRATIONS.md](../database/LEGACY_MIGRATIONS.md) - Legacy migration history

### External Resources
- [Prisma Docs](https://www.prisma.io/docs) - Prisma ORM documentation
- [5etools](https://5e.tools) - D&D 2024 data source
- [D&D 2024 Rules](https://www.dndbeyond.com) - Official rules reference

---

## 🎬 Next Steps

### Immediate Actions
1. **Audit current database** - See what's actually in there
   ```bash
   docker exec -it wtforge-postgres psql -U wtforge -d wtforge -c "\dt"
   docker exec -it wtforge-postgres psql -U wtforge -d wtforge -c "SELECT COUNT(*) FROM spells;"
   docker exec -it wtforge-postgres psql -U wtforge -d wtforge -c "SELECT COUNT(*) FROM items;"
   # etc...
   ```

2. **Find source data files**
   - Where are the 5etools JSON files?
   - Are they in the repo or external?

3. **Map current import flow**
   - Which scripts were actually used in production?
   - What order were they run?
   - What's the source of truth for import?

4. **Test clean import**
   - Create test database
   - Try fresh import with existing scripts
   - Document issues encountered

### Before Making Changes
- [ ] Backup current production database
- [ ] Document current import process that's working
- [ ] Get list of what scripts to keep vs delete
- [ ] Decide on architecture questions above

---

## 💭 Notes

### Why This Matters
- **Maintainability:** Can't fix bugs if we don't understand the data
- **Reliability:** Multiple "fix" scripts = fragile system
- **Onboarding:** New developers need clear setup process
- **Production:** Current state is "it works but I don't know why"
- **Scalability:** Need clean foundation to add features

### What "Clean" Looks Like
- One import script per content type
- Clear documentation of data flow
- Idempotent operations (can run safely multiple times)
- No manual "fix" scripts needed
- Single source of truth for each content type
- Fast developer onboarding (`npm run setup` → working DB)

---

## 📝 Progress Log

### 2025-10-14
- Created this document
- Audited current state
- Identified 39 scripts in chaos
- Documented "hacky shit" that needs fixing
- Next: Actually look at what's in the database

---

## 📝 Implementation Notes: PHB Cleanup Script

### Script Specification: `clean-phb-data.ts`

**Purpose**: Remove PHB (2014) data from existing database records

**Target**: `raw.content` table, `raw` JSONB field

**Algorithm**:
```typescript
// For each record in raw.content where kind='class'
for (const record of classRecords) {
  const rawData = record.raw;

  // Filter arrays to only XPHB/XDMG sources
  if (rawData.class) {
    rawData.class = rawData.class.filter(c => c.source === 'XPHB' || c.source === 'XDMG');
  }

  if (rawData.classFeature) {
    rawData.classFeature = rawData.classFeature.filter(f => f.source === 'XPHB' || f.source === 'XDMG');
  }

  if (rawData.subclass) {
    rawData.subclass = rawData.subclass.filter(s => s.source === 'XPHB' || s.source === 'XDMG');
  }

  // Update record
  await prisma.rawContent.update({
    where: { id: record.id },
    data: { raw: rawData }
  });
}
```

**Safety Features**:
- [ ] Dry-run mode (--dry-run flag)
- [ ] Progress reporting (log every 10 records)
- [ ] Error handling (rollback on failure)
- [ ] Backup recommendation (warn user before running)
- [ ] Verification step (count PHB records before/after)

**Testing**:
1. Run in dry-run mode first
2. Backup production database
3. Run on staging environment
4. Verify no PHB data remains
5. Test character generation still works
6. Run on production

**Related Files**:
- [backend/scripts/import-classes.js](../backend/scripts/import-classes.js) - Now rejects PHB
- [backend/src/routes/classes.ts](../backend/src/routes/classes.ts) - Won't fall back to PHB

---

**Remember:** We're not rewriting everything, just cleaning up the vibe! 🎨✨
