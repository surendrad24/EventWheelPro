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
- Default local login:
  - Email: `admin@eventwheelpro.local`
  - Password: `admin123`
- Override defaults with env vars:
  - `DEMO_ADMIN_EMAIL`
  - `DEMO_ADMIN_PASSWORD`

## Data persistence (phase 3 baseline)

- Competition, participant, winner, spin, and event-log data is now persisted in SQLite tables.
- Store implementation remains exposed through `lib/server/in-memory-store.ts` for API compatibility, but it is now DB-backed.
- Seed data from `lib/mock-data.ts` is inserted once when the database has no competition rows.

## Recommended next steps

1. Migrate SQLite persistence to PostgreSQL with a migration tool (Prisma/Drizzle).
2. Add role-based permissions (`super_admin`, `moderator`, `finance`) and policy checks.
3. Implement server-side registration validation and stronger duplicate detection.
4. Add a fairness module with deterministic seed commit/reveal and immutable spin records.
5. Introduce realtime updates with Socket.IO or server-sent events.
