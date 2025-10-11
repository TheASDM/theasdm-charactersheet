# PR: Remove Duplicates & Dead Files - Cleanup

## Summary

This PR removes duplicate files, marks legacy files with documentation, and establishes a single source of truth for various data files in the codebase.

## Changes Made

### 1. ✅ Removed Duplicate: check-table.js

**Deleted:** `check-table.js` (root level)
**Kept:** `backend/check-table.js`

**Reason:** The root-level file was an outdated copy. The backend version has more detailed logging and is the actively maintained version.

**Diff:**
- Backend version has additional `console.log` statements for debugging
- Backend version handles nested entries better
- Root version was never updated after initial creation

### 2. 📝 Deprecated: scripts/transform-class-data.js

**Action:** Marked as deprecated with documentation
**File:** `scripts/DEPRECATED_SCRIPTS.md`

**Reason:** Superseded by `transform-class-data-revised.js` which includes:
- Better handling of complex D&D 2024 class structures
- Improved choice detection (Divine Order, Fighting Styles, etc.)
- Support for external references (Eldritch Invocations)
- More robust table parsing
- Better scaling progression handling

**No deletion:** File kept for historical reference

**Migration Path:**
```bash
# Old (deprecated)
node scripts/transform-class-data.js

# New (use this)
node scripts/transform-class-data-revised.js
```

### 3. 📝 Legacy: Manual SQL Migrations

**Affected Files:**
- `database/init.sql`
- `backend/migration_add_auth.sql`

**Action:** Marked as legacy with comprehensive documentation
**File:** `database/LEGACY_MIGRATIONS.md`

**Reason:** Project now uses **Prisma Migrations** exclusively. Manual SQL files could conflict with Prisma's migration system.

**Current Migration System:**
- Schema: `backend/prisma/schema.prisma`
- Migrations: `backend/prisma/migrations/`
- Command: `npx prisma migrate dev`

**Why Keep Files:**
- Historical reference
- Documentation of original schema decisions
- Audit trail

**No Action Needed:** Data already incorporated into Prisma schema

### 4. 📊 Analysis: frontend/public/processed-data/

**Action:** Comprehensive documentation of usage and recommendation
**File:** `frontend/public/processed-data/README.md`

**Analysis Summary:**

#### Current Implementation
- Frontend loads class data via static file fetch
- Files served by Express in production
- Total size: ~1.8 MB (18 JSON files)

#### Alternative Exists
- API endpoint: `GET /api/class-choices/class-data/:className`
- Could fetch from database instead of files

#### **Recommendation: KEEP STATIC FILES**

**Rationale:**
1. ✅ **Performance:** Faster than API calls
2. ✅ **Caching:** Browser can cache effectively
3. ✅ **Offline Support:** PWA can work offline
4. ✅ **Load Reduction:** Less strain on backend/database
5. ✅ **CDN Ready:** Can serve from CDN for global speed

**Trade-offs:**
- ⚠️ Requires manual regeneration when class data changes
- ⚠️ Duplicate data (also in database)
- ✅ Class data rarely changes (D&D 2024 is stable)

#### Single Source of Truth

**Database** is the source of truth, **static files** are generated artifacts:

```bash
# When database changes:
cd scripts
node transform-class-data-revised.js  # Regenerates static files
git add frontend/public/processed-data/
git commit -m "Update processed class data"
```

## File Structure After Changes

```
.
├── check-table.js                    ❌ DELETED
├── backend/
│   ├── check-table.js               ✅ KEPT (canonical version)
│   └── migration_add_auth.sql       📝 LEGACY (documented)
├── database/
│   ├── init.sql                     📝 LEGACY (documented)
│   └── LEGACY_MIGRATIONS.md         ✅ NEW (documentation)
├── scripts/
│   ├── transform-class-data.js      📝 DEPRECATED (documented)
│   ├── transform-class-data-revised.js  ✅ ACTIVE
│   └── DEPRECATED_SCRIPTS.md        ✅ NEW (documentation)
└── frontend/public/processed-data/
    ├── *.json                       ✅ KEPT (static files)
    └── README.md                    ✅ NEW (analysis & recommendation)
```

## Testing

### Verified

1. ✅ **Build succeeds** without root-level check-table.js
2. ✅ **Backend check-table.js** still works independently
3. ✅ **Prisma migrations** work normally
4. ✅ **Frontend** still loads class data from processed-data/
5. ✅ **Docker build** includes processed-data files correctly

### No Breaking Changes

- ❌ No code references root-level check-table.js
- ❌ No code uses manual SQL migrations
- ❌ No code uses deprecated transform-class-data.js
- ✅ All functionality remains intact

## Documentation Added

| File | Purpose |
|------|---------|
| `scripts/DEPRECATED_SCRIPTS.md` | Explains deprecated transform script |
| `database/LEGACY_MIGRATIONS.md` | Explains why manual migrations are legacy |
| `frontend/public/processed-data/README.md` | Analysis and recommendation for static files |

## Benefits

### For Developers
- 📖 Clear documentation of what's deprecated/legacy
- 🎯 Single source of truth identified
- 🧹 Less confusion about which files to use
- 📚 Historical context preserved

### For Codebase
- 🗑️ One duplicate removed
- 📝 Three areas documented
- ✅ Best practices established
- 🔒 Prevents future confusion

## Migration Guide

### For Anyone Using Old Scripts

**If you were using:**
```bash
node check-table.js  # Root level
```

**Now use:**
```bash
cd backend
node check-table.js  # Backend version
```

---

**If you were using:**
```bash
node scripts/transform-class-data.js
```

**Now use:**
```bash
node scripts/transform-class-data-revised.js
```

---

**If you were running manual SQL:**
```bash
psql < database/init.sql  # Don't do this!
```

**Now use:**
```bash
cd backend
npx prisma migrate dev  # Proper way
```

## Future Cleanup Candidates

Files to potentially remove in future PRs (after validation):

1. `scripts/transform-class-data.js` - After confirming no one uses it
2. `database/init.sql` - After all environments migrated to Prisma
3. `backend/migration_add_auth.sql` - After all environments migrated
4. `frontend/public/processed-data/all-classes*.json` - Appears unused

**Not in this PR:** Being conservative, only documenting for now

## Checklist

- [x] Duplicate file removed
- [x] Legacy files documented
- [x] Deprecation documented
- [x] Static file usage analyzed
- [x] Recommendation provided
- [x] All changes tested
- [x] No breaking changes
- [x] Documentation complete

## Related Issues

None - this is a proactive cleanup

## Reviewers

Please verify:
1. ✅ Documentation is clear
2. ✅ No breaking changes
3. ✅ Recommendation for processed-data makes sense
4. ✅ Ready to merge

---

**Type:** Cleanup / Documentation
**Impact:** Low (documentation only, one file deletion)
**Breaking Changes:** None
**Migration Required:** No
