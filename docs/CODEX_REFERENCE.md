# Codex Reference Notes

These are quick pointers for future AI work in this repository. Keep this file up to date when workflows shift.

## Project Snapshot
- Monorepo with `backend` (Express + Prisma), `frontend` (React + Vite), plus planned `discord-bot`.
- Relies on D&D 2024 data imports; never surface raw template tags—always route text through `frontend/src/utils/dndTemplateParser.ts`.
- Recent cleanup summary lives in `CLEANUP_PR_SUMMARY.md`; check before refactoring or reorganizing files.

## Essential Commands
```bash
# Backend
(cd backend && npm run dev)        # hot-reload API
(cd backend && npm run test)       # Jest tests
(cd backend && npm run lint)       # ESLint
(cd backend && npx prisma migrate dev)  # apply local migrations

# Frontend
(cd frontend && npm run dev)       # Vite dev server
(cd frontend && npm run test)      # Vitest suite
(cd frontend && npm run lint)      # ESLint
(cd frontend && npm run type-check)
```

Docker compose path: `docker-compose.yml` spins up Postgres + app bundle; image build flow described in `README.md`.

## Key Touchpoints
- **Backend schema**: `backend/prisma/schema.prisma` (source of truth for data model).
- **API entry**: `backend/src/server.ts`; routes under `backend/src/routes/`.
- **Frontend entry**: `frontend/src/main.tsx`; main flow in `frontend/src/App.tsx`.
- **Character wizard**: `frontend/src/components/CharacterGeneratorWizard.tsx` with steps under `frontend/src/components/wizard-steps/`.
- **Static data**: documented in `frontend/public/processed-data/README.md`; keep structure intact when adding data files.

## Guardrails & Gotchas
- Template tag enforcement uses ESLint + runtime guard (`frontend/src/utils/dndTemplateGuard.ts`). Violations fail CI; parse early.
- Data loaders (e.g., `frontend/src/utils/classDataLoader.ts`) expect processed JSON shape; confirm against existing files before extending.
- Prisma migrations must accompany schema tweaks; ensure `backend/prisma/migrations/` stays in sync and update seed scripts when adding required fields.
- When manipulating complex entries, prefer `parseComplexDnDEntry` to preserve nested structures.

## Investigation Priorities
1. Review `docs/DND_TEMPLATE_TAG_ENFORCEMENT.md` before touching rich-text rendering or adding content pages.
2. Check `backend/src/scripts/` if import or seed behaviour needs adjustment; some scripts tie directly to Nimble mechanics.
3. Validate new frontend wizard logic against `frontend/src/types/characterSheet.ts` to maintain type compatibility.

Update this note after significant architectural changes or when discovering new quirks.
