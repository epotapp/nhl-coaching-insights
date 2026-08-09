# NHL Coaching Insights v0.4

An iPad-first hockey coaching dashboard demonstration built around Carolina–Vegas Game 4 data. Version 0.4 completes the calendar redesign, verifies Carolina player portrait mapping, adds Apple-style dashboard widget customization, makes player rails horizontally swipeable, corrects the Stats report treatment, and completes light-theme rendering across onboarding, widgets, drawers, and the slide-out menu.

## Run locally

1. Install Node.js 20 or later and pnpm 10.
2. From the project root run:

```bash
pnpm install --frozen-lockfile
pnpm build:frontend
```

For development:

```bash
pnpm --filter @workspace/mockup-sandbox dev
```

The static production output is generated in `artifacts/mockup-sandbox/dist` and includes the GitHub Pages SPA fallback.

## v0.4 interaction highlights

- Long-press an unused part of the Dashboard to enter widget edit mode.
- Use the approved blue minus controls to remove widgets; widgets do not shake. Dark mode uses `#4186FF`; light mode uses `#2155FC`, with `#0925AB` for interaction states.
- Select **Add Widgets** to open the scrollable catalog.
- The top workspace strip exits the catalog without changing the layout.
- Select a widget, choose Small/Medium/Large, then choose an available placement slot.
- Edit mode remains active until **Done** or a simple tap on unused workspace.
- Layout is stored locally under `nhl-dashboard-layout-v0.4`.
- The demo toolbar provides icon-only reset, **back 10 sec**, **skip 30 sec**, **skip 5 min**, and Pause/Resume.

## v0.4 visual and data changes

- Carolina portraits are keyed by sweater number to official roster headshots; Nikolaj Ehlers uses a contained full-portrait crop.
- Calendar and the top-right Calendar drawer share the same approved three-day schedule, mini-month, agenda, and Add Task system.
- Player Insights and Video roster cards use a single horizontal swipe row with hidden scrollbars.
- Stats selected reports use the approved neutral inverse state instead of a blue side strip.
- Selecting Light during onboarding immediately restyles the overlay, modal, cards, previews, controls, and every subsequent application surface.
- The light slide-out menu is no longer forced to a black surface.

## Included systems

- Dashboard, AI Insights, Featured Insights, Player Insights, Video, Stats, Notes, Calendar, and Preferences.
- Timestamp-aware Game 4 demo controls and bundled video clips.
- PostgreSQL schema, migration, seed, API routes, typed frontend client, Docker configuration, and setup documentation.
- GitHub Pages deployment workflow.

## Validation

```bash
node scripts/validate-v0.4.mjs
```

See `docs/V0.4_VALIDATION.md` for the package checklist and `docs/V0.4_CHANGELOG.md` for the complete iteration summary.
