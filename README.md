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

## Recommended next steps

1. Replace mock data with PostgreSQL models and migrations.
2. Add real auth and RBAC for admin routes.
3. Implement server-side registration validation and duplicate detection.
4. Add a real wheel resolution engine with fairness logging and immutable spin records.
5. Introduce realtime updates with Socket.IO or server-sent events.
