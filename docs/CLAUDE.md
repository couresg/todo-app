# Project notes

Goal -> weekly plan -> todo manager with a kanban board. Spec: `docs/PRD.md`, `docs/PLAN.md` (source of truth).

## Commands
- `npm run db` - persistent local MongoDB on 127.0.0.1:27017 (data in `.data/db`); keep running while developing
- `npm run dev` - Next.js dev server (http://localhost:3000); reads `MONGODB_URI` (+ optional `MONGODB_DB`) from `.env` (Atlas); `.env.local` would override it — use it only to point at the local `npm run db`
- `npm test` - Vitest unit + integration (in-memory MongoDB, no `npm run db` needed)
- `npm run test:e2e` - Playwright (self-contained, see E2E notes below)
- `npm run typecheck`, `npm run lint`, `npm run build`

## Stack
Next.js App Router + TypeScript, Route Handlers, MongoDB + Mongoose, Zod, TanStack Query, dnd-kit, Tailwind.

## Layout
- `src/app/api/**/route.ts` - thin handlers; logic in `src/server/services/*`
- `src/models/` - Mongoose models (Goal, WeeklyPlan, Todo)
- `src/lib/` - db (cached connection), progress, week, validation (Zod)
- `src/types/api.ts` - DTOs and request body types shared by server and client
- `src/test/mongo.ts` - `startTestDb/stopTestDb/clearTestDb` for integration tests
- `e2e/` - Playwright specs

## Conventions (PLAN section 2)
- Progress is computed at read time (aggregate), never stored.
- No FK: on delete, unlink children in app code (`weeklyPlanId`/`goalId` -> null); dangling refs count as unlinked.
- Validate references on write (400 if missing or bad ObjectId).
- Dates are `YYYY-MM-DD` strings; weeks start Monday; `weekEnd = weekStart + 6`.
- API returns DTOs with string `id` (not `_id`).

## E2E notes
- `npm run test:e2e` is self-contained: `scripts/e2e-server.mjs` starts an in-memory MongoDB (random port, db `todo-app-e2e`), runs `next build`, then `next start -p 3300`. No `npm run db` needed; first run builds (slow), needs `npx playwright install chromium` once.
- Port 3300 must be free (`reuseExistingServer` is off). Data is wiped per test via public DELETE calls (`e2e/helpers.ts: resetData`); there is no reset endpoint.
- Drags use manual `page.mouse` steps (`drag()` helper); wait ~600ms between two consecutive drags (dnd-kit drop animation).
