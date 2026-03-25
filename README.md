# Event Wheel Pro

MVP scaffold for the gamified competition wheel platform described in the supplied PRD.

## Included

- Next.js App Router project structure
- Public pages for live competition, leaderboard, winners, rules, and claim flow
- Admin pages for dashboard, competitions, participant moderation, live control, winners, payouts, settings, logs, and templates
- Shared typed mock data aligned to the PRD entities
- API route stubs for the core public and admin contract
- Visual system tuned for a branded neon/gaming feel without copying any reference assets

## Run

```bash
npm install
npm run dev
```

## Admin auth (phase 2 baseline)

- Admin sessions are now DB-backed using SQLite (`data/event-wheel.db`) and secure HTTP-only cookies.
- Default local logins:
  - `super_admin`: `admin@eventwheelpro.local` / `admin123`
  - `moderator`: `moderator@eventwheelpro.local` / `moderator123`
  - `finance`: `finance@eventwheelpro.local` / `finance123`
- Override defaults with env vars:
  - `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`
  - `DEMO_MODERATOR_EMAIL`, `DEMO_MODERATOR_PASSWORD`
  - `DEMO_FINANCE_EMAIL`, `DEMO_FINANCE_PASSWORD`

## Data persistence (phase 3 baseline)

- Competition, participant, winner, spin, and event-log data is now persisted in SQLite tables.
- Store implementation remains exposed through `lib/server/in-memory-store.ts` for API compatibility, but it is now DB-backed.
- Seed data from `lib/mock-data.ts` is inserted once when the database has no competition rows.

## RBAC (phase 4 baseline)

- Admin APIs now enforce role guards:
  - Competition create/update: `super_admin`
  - Participant moderation + spin actions: `super_admin`, `moderator`
  - Payout status updates: `super_admin`, `finance`
- Admin pages for live-control/participants/payouts/new-competition are also role-gated.

## Fairness engine (phase 5 baseline)

- Spin resolution now uses deterministic fairness logic:
  - `commitHash = sha256(serverSeed)`
  - `revealHash = sha256(serverSeed:clientSeed:nonce)`
  - `resolvedIndex = revealHash mod poolSize`
- Immutable fairness audit rows are written to `spin_fairness_records` in SQLite.
  - Updates/deletes are blocked by DB triggers.
- Fairness proof retrieval endpoints:
  - `GET /api/admin/competitions/:id/fairness`
  - `GET /api/admin/spins/:id/fairness`

## Recommended next steps

1. Migrate SQLite persistence to PostgreSQL with a migration tool (Prisma/Drizzle).
2. Add role-based permissions (`super_admin`, `moderator`, `finance`) and policy checks.
3. Implement server-side registration validation and stronger duplicate detection.
4. Add a fairness module with deterministic seed commit/reveal and immutable spin records.
5. Introduce realtime updates with Socket.IO or server-sent events.
