# NHL Coaching Insights v0.2

An iPad-first interactive NHL coaching dashboard demonstration built around Carolina Hurricanes–Vegas Golden Knights, 2026 Stanley Cup Final Game 4. The package includes onboarding, dark and light themes, dashboard and AI insight workspaces, Featured Insights, Player Insights, Video, Stats, Notes, Calendar, Preferences, timestamp-aware demo controls, 17 bundled clips, and an optional PostgreSQL/Express data layer.

## Run the frontend

Install Node.js 20 or newer, then run from the project root:

```powershell
corepack enable
pnpm install
pnpm --filter @workspace/mockup-sandbox dev
```

The frontend works immediately with bundled Game 4 data. It does not require PostgreSQL for the demonstration.

## Start the optional PostgreSQL backend

Detailed Windows/Docker instructions are in [`docs/POSTGRESQL_SETUP.md`](docs/POSTGRESQL_SETUP.md). The backend can replace the bundled snapshot with timestamped database responses while preserving the static fallback.

Important paths:

- Frontend: `artifacts/mockup-sandbox`
- API server: `artifacts/api-server`
- NHL schema: `lib/db/src/schema/nhl.ts`
- Migration: `lib/db/migrations/0001_nhl_dashboard.sql`
- Game 4 seed: `lib/db/seeds/game4-2025030414.sql`
- Frontend API client: `artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard/data/nhlDataClient.ts`
- Validation command: `pnpm validate:v0.2`

## Version 0.2 highlights

- AI Insights expands from the concise right rail into a large workspace with related stat/video miniatures; every miniature opens a dedicated full-screen view.
- Complete approved dark/light theme system using the supplied palettes and SF-system typography.
- Player Insights repacks visible widgets into full-width balanced rows after expand, collapse, hide, or show; no empty half-columns remain.
- Every metric widget has compact, medium, wide, and expanded information treatments with purpose-specific rankings, comparisons, splits, timelines, or context.
- Featured Insights retains the approved video, faceoff, shooting-sector, lineup, and lower-card composition.
- Demo controls include Restart, skip 30 sec, skip 5 min, and Pause/Resume, with immediate timestamp recomputation.
- PostgreSQL-ready models, migration, seed, API routes, widget preferences, and lazy database fallback are included.

See [`docs/V0.2_CHANGELOG.md`](docs/V0.2_CHANGELOG.md), [`docs/VISUAL_QA.md`](docs/VISUAL_QA.md), and [`DATA-SOURCES.md`](DATA-SOURCES.md) for details.
