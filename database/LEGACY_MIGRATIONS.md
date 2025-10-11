# Legacy Manual Migrations

## ⚠️ Important: These Files Are Legacy

**Status:** LEGACY (Do Not Use)

The manual SQL migration files in this directory are **no longer used** and are kept only for historical reference.

## Legacy Files

### ❌ database/init.sql

**Purpose (Historical):** Initial database schema setup

**Why Legacy:** This project now uses **Prisma Migrations** for all schema management. The schema is defined in `backend/prisma/schema.prisma` and migrations are generated automatically.

**Do Not Use:** Running this file manually could conflict with Prisma's migration system.

### ❌ backend/migration_add_auth.sql

**Purpose (Historical):** Added authentication tables (users, sessions, etc.)

**Why Legacy:** Authentication tables are now part of the Prisma schema and are created through Prisma migrations.

**Do Not Use:** This migration has been incorporated into the Prisma schema and will be applied automatically.

## Current Migration System

### ✅ Using Prisma Migrations

The project uses **Prisma Migrate** for all database schema changes:

```bash
# Development: Create and apply a migration
cd backend
npx prisma migrate dev --name descriptive_name

# Production: Apply pending migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Migration Location

- **Schema Definition:** `backend/prisma/schema.prisma`
- **Migration Files:** `backend/prisma/migrations/`
- **Migration History:** Tracked in `_prisma_migrations` table

### How It Works

1. **Define schema** in `backend/prisma/schema.prisma`
2. **Generate migration:** `npx prisma migrate dev --name my_change`
3. **Prisma creates** SQL file in `backend/prisma/migrations/`
4. **Migration applied** automatically
5. **History tracked** in database

### Benefits Over Manual Migrations

- ✅ **Type Safety:** TypeScript types generated from schema
- ✅ **Rollback Support:** Each migration can be reverted
- ✅ **Version Control:** All migrations tracked in git
- ✅ **Automatic:** Migrations run on deploy/startup
- ✅ **Conflict Detection:** Prisma detects schema drift
- ✅ **Team Sync:** Everyone uses same schema version

## Why Keep These Files?

These legacy files are preserved for:
1. **Historical Reference:** Understanding original schema decisions
2. **Documentation:** What was included in initial setup
3. **Audit Trail:** Complete history of database evolution

## Migration Path (Already Complete)

The data and structure from these legacy files have been:
1. ✅ Incorporated into `backend/prisma/schema.prisma`
2. ✅ Applied through Prisma migrations
3. ✅ Verified in production

No action needed - just reference if curious about history!

## What If I Need to Change the Schema?

**Never** manually edit SQL files. Instead:

1. **Edit** `backend/prisma/schema.prisma`
2. **Run** `npx prisma migrate dev --name your_change`
3. **Commit** both the schema and the generated migration
4. **Deploy** and Prisma will apply it automatically

Example:

```bash
cd backend

# 1. Edit schema.prisma (add a field, table, etc.)
vim prisma/schema.prisma

# 2. Generate migration
npx prisma migrate dev --name add_user_avatar

# 3. Commit changes
git add prisma/
git commit -m "Add user avatar field"

# 4. Deploy (Dockerfile handles this automatically)
```

## Related Documentation

- **Prisma Schema:** [backend/prisma/schema.prisma](../backend/prisma/schema.prisma)
- **Prisma Docs:** https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Project Docs:** [../CLAUDE.md](../CLAUDE.md)

---

**Last Updated:** 2025-10-10
**Prisma Version:** 5.x
