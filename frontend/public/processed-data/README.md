# Processed Class Data Directory

## Overview

This directory contains pre-processed class data files used by the frontend for the character creation wizard. These files contain detailed information about D&D 2024 classes, including features, choices, scaling, and subclasses.

## Current Status: STATIC FILES (Client-Side Fetch)

**Current Implementation:** The frontend loads these JSON files directly via static fetch:

```typescript
// frontend/src/utils/classDataLoader.ts
const response = await fetch(`/processed-data/${className}.json`);
```

## Files in This Directory

- `Barbarian.json` - Barbarian class data
- `Bard.json` - Bard class data
- `Cleric.json` - Cleric class data
- `Druid.json` - Druid class data
- `Fighter.json` - Fighter class data
- `Monk.json` - Monk class data
- `Paladin.json` - Paladin class data
- `Ranger.json` - Ranger class data
- `Rogue.json` - Rogue class data
- `Sorcerer.json` - Sorcerer class data
- `Warlock.json` - Warlock class data
- `Wizard.json` - Wizard class data
- `EldritchInvocations.json` - Warlock invocations
- `FightingStyles.json` - Fighting style feats
- `all-classes.json` - Combined class data (legacy)
- `all-classes-merged.json` - Merged class data (legacy)

**Total Size:** ~1.8 MB

## Why Static Files (Current Approach)

### Advantages ✅
1. **Fast Loading:** Files are served directly by the web server (no database query)
2. **Cacheable:** Browser can cache files, reducing repeated loads
3. **Offline Support:** PWA can cache these files for offline character creation
4. **No API Call:** Reduces load on the backend API
5. **Simple Deployment:** Just copy files to Docker image
6. **CDN Friendly:** Can be served from CDN for faster global access

### Disadvantages ❌
1. **Duplicate Data:** Same data exists in both files and database
2. **Manual Sync:** Requires running transform script when database changes
3. **Stale Risk:** Files could become out of sync with database
4. **No Dynamic Updates:** Can't update class data without redeploying frontend
5. **Bundle Size:** Adds ~1.8 MB to Docker image (though compressed)

## Alternative: API Endpoint

An API endpoint exists: `GET /api/class-choices/class-data/:className`

### If We Switched to API

**Advantages:**
1. ✅ Single source of truth (database)
2. ✅ Always up-to-date
3. ✅ Can update without frontend deploy
4. ✅ Smaller Docker image

**Disadvantages:**
1. ❌ Requires API call (slower initial load)
2. ❌ Harder to cache effectively
3. ❌ Requires backend to be running
4. ❌ No offline support without service worker complexity
5. ❌ More load on database

## Recommendation: KEEP STATIC FILES

### Rationale

For a character creation wizard, **performance and offline capability** are more important than real-time updates.

**Reasons:**
1. **Class data rarely changes** - D&D 2024 rules are stable
2. **Character creation is interactive** - needs to be fast and responsive
3. **PWA use case** - Users might want to create characters offline
4. **Load time matters** - First load experience is critical
5. **Caching works well** - Files don't change often

### When to Regenerate Files

Regenerate the processed-data files when:
- ✅ D&D 2024 rules are updated
- ✅ Database schema changes affect class structure
- ✅ New classes or subclasses are added
- ✅ Bug fixes in choice detection or scaling

**Command:**
```bash
cd scripts
node transform-class-data-revised.js
```

This will:
1. Read class data from database
2. Transform into optimized format
3. Write to `frontend/public/processed-data/`
4. Ready for commit and deploy

## Hybrid Approach (Future Enhancement)

If we want both benefits, consider:

### Strategy: Static with API Fallback

```typescript
// Try static file first (fast, cached)
try {
  return await fetch(`/processed-data/${className}.json`);
} catch {
  // Fallback to API if static file missing
  return await fetch(`/api/class-choices/class-data/${className}`);
}
```

### Strategy: Version Check

```typescript
// Check if static file is current version
const localVersion = await fetch('/processed-data/version.json');
const apiVersion = await fetch('/api/class-choices/version');

if (localVersion !== apiVersion) {
  // Fetch fresh from API and cache
  const freshData = await fetch('/api/class-choices/class-data/${className}');
  // Cache in IndexedDB for future use
  await cacheClassData(className, freshData);
}
```

## File Format

Each class file has this structure:

```json
{
  "className": "Cleric",
  "features": [
    {
      "level": 1,
      "name": "Divine Order",
      "description": "...",
      "isChoice": true,
      "choiceType": "subfeature",
      "options": [...],
      "scales": false
    }
  ],
  "subclasses": [...],
  "proficiencies": {...}
}
```

## Deployment

### Docker Build

The Dockerfile copies these files to the image:

```dockerfile
# Build frontend
RUN npm run build:client

# Copy frontend dist (includes public/processed-data)
COPY --from=build /app/frontend/dist backend/dist/public
```

### Served By

- **Development:** Vite dev server (`npm run dev`)
- **Production:** Express static middleware (`backend/src/server.ts`)

```typescript
app.use(express.static(frontendDistPath));
```

## Maintenance

### Regenerating Files

When class data in the database changes:

```bash
# 1. Update database (via Prisma migration or import script)
cd backend
npx prisma migrate dev

# 2. Regenerate processed files
cd ../scripts
node transform-class-data-revised.js

# 3. Commit changes
git add frontend/public/processed-data/
git commit -m "Update processed class data"

# 4. Deploy
# Docker build will include updated files
```

### Size Optimization (Future)

If file size becomes an issue:

1. **Gzip Compression:** Enable in Express (already done)
2. **Split by Level:** Separate files per level (e.g., `Cleric-1.json`)
3. **Lazy Load:** Only load subclass data when selected
4. **Remove Unused:** Strip out data not needed by wizard

## Related Files

- **Loader:** `frontend/src/utils/classDataLoader.ts`
- **External Choices:** `frontend/src/utils/externalChoiceLoader.ts`
- **Generator Script:** `scripts/transform-class-data-revised.js`
- **API Endpoint:** `backend/src/routes/classChoices.ts`

## Questions?

See the main documentation:
- [CLAUDE.md](../../../CLAUDE.md)
- [docs/](../../../docs/)

---

**Recommendation:** **KEEP STATIC FILES** for performance and offline support
**Last Updated:** 2025-10-10
