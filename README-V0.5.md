# NHL Coaching Insights v0.5

Version 0.5 is the production-ready continuation of v0.4 in an isolated project folder. It preserves the Figma-directed iPad layout and adds a resilient live-data layer for the existing backend at `Proto/backend/nhl-insights-backend`.

## What changed

- Fixed the expanded Shots on Goal, Time on Ice, and Faceoff surfaces so light mode never inherits the late dark table background.
- Connected the score band and dashboard widgets to `/api/v1/game4/sim-state` and `/api/v1/game4/widgets`.
- Bound TOI/rest, faceoffs, shots, shot attempts, hits, blocks, giveaways, takeaways, PIM, power play, shot sectors/xG, goalies, game pulse, video moments, and lineup/workload state to backend payloads.
- Added Goaltending, Shooting by Sector, Head-to-Head Faceoffs, Shot Attempts, Giveaways, Video Moments, Game Pulse, Lineup Analyzer, and Shift Workload widgets to the Dashboard catalog.
- Made onboarding selections create the user's first Dashboard layout in priority order and persist both the layout and focus labels under v0.5-specific storage keys.
- Kept replay widgets time-consistent: shot sectors wait for tracked events and goalie saves/save percentage follow the current replay cursor.
- Added a visible `Live API`, `Connecting`, `API fallback`, or `Bundled demo` status so data provenance is never ambiguous.
- Updated the Pages workflow to inject the repository Actions variable `VITE_NHL_API_BASE_URL` during the production build.

## Local development with the backend

Start `Proto/backend/nhl-insights-backend` on port 8000, then run the frontend with:

```powershell
$env:VITE_NHL_API_BASE_URL='http://127.0.0.1:8000'
pnpm --filter @workspace/mockup-sandbox dev
```

The dashboard remains fully usable from its verified bundled Game 4 data if the variable is missing or the API becomes unavailable.

## GitHub Pages

GitHub Pages hosts only the static frontend. Add an Actions repository variable named `VITE_NHL_API_BASE_URL` containing the backend's public HTTPS URL before deploying. The backend must run on a separate HTTPS host or tunnel and allow the Pages origin through CORS.

## Validation

```powershell
pnpm build:frontend
node scripts/validate-v0.5.mjs
```

See `docs/V0.5_VALIDATION.md` and `docs/V0.5_CHANGELOG.md` for the final evidence and scope.
