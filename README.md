# NHL Coaching Insights v0.3

An iPad-first coaching dashboard demonstration based on Carolina Hurricanes–Vegas Golden Knights, 2026 Stanley Cup Final Game 4. Version 0.3 applies the supplied Figma icon set, the approved SF Pro system type hierarchy, a compact slide-out menu, base-path-safe assets, and one-command static deployment while preserving the data-rich v0.2 dashboard, onboarding, AI Insights, Featured Insights, Player Insights, Video, Stats, Notes, Calendar, Preferences, dark/light themes, demo timeline, and PostgreSQL-ready API.

## Run locally

Install Node.js 20 or newer. From the project root:

```powershell
corepack enable
pnpm install
pnpm --filter @workspace/mockup-sandbox dev
```

The frontend opens as the application itself rather than a component gallery. It works with the bundled Game 4 data when PostgreSQL is offline.

## Build the deployable frontend

```powershell
pnpm build:frontend
```

Output is written to:

```text
artifacts/mockup-sandbox/dist
```

The build also creates `404.html` so client-side routes work on GitHub Pages.

## Deploy

The included GitHub Actions workflow automatically builds and deploys the frontend from `main`, `master`, or the current release branch `nhl-v0.3`:

```text
.github/workflows/deploy-pages.yml
```

Full instructions for GitHub Pages and conventional static hosts are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Optional PostgreSQL backend

The static demonstration does not require a database. To run the timestamp-aware PostgreSQL/Express backend on a personal PC, follow [`docs/POSTGRESQL_SETUP.md`](docs/POSTGRESQL_SETUP.md).

Important paths:

- Frontend: `artifacts/mockup-sandbox`
- Dashboard source: `artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard`
- Supplied Figma icons: `artifacts/mockup-sandbox/public/images/hockey-dashboard/icons`
- API server: `artifacts/api-server`
- Database schema: `lib/db/src/schema/nhl.ts`
- Migration: `lib/db/migrations/0001_nhl_dashboard.sql`
- Game 4 seed: `lib/db/seeds/game4-2025030414.sql`
- Validation: `node scripts/validate-v0.3.mjs`

## v0.3 highlights

- All supplied icons are packaged and rendered through a theme-aware `HdIcon` component, preserving the approved icon geometry in dark and light themes.
- Navigation, top-bar actions, AI/Featured/Player widgets, video controls, Notes, Calendar, Preferences, and expansion controls use the supplied icons where semantically applicable.
- The slide-out menu is reduced to the approved compact hierarchy instead of the previous oversized text treatment.
- Typography follows an SF Pro system stack with 18 pt body, 20 pt header, and 24 pt title targets, with a controlled iPad-landscape reduction for dense data tables.
- Dark/light geometry remains identical; light mode uses `#E9EFF6`, `#E3EBF4`, `#F1F5F9`, `#F9FBFD`, `#FFFFFF`, and `#02060F` from the approved guide.
- Asset URLs now respect the Vite base path, so GitHub Pages project URLs work without internal preview paths.
- The app is the default root route and includes a GitHub Pages deployment workflow and SPA fallback.

See [`docs/V0.3_CHANGELOG.md`](docs/V0.3_CHANGELOG.md), [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), and [`DATA-SOURCES.md`](DATA-SOURCES.md).
