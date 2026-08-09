# PostgreSQL backend setup — NHL Coaching Insights v0.3

The demonstration remains fully usable without PostgreSQL. When the database is connected, the frontend can replace its bundled Game 4 fallback with timestamped events, shifts, player totals, coaching insights, videos, and per-user widget preferences from the API.

## 1. Start PostgreSQL on the PC

From the project root:

```powershell
Copy-Item .env.example .env
# Change the database password in both .env and docker-compose.postgres.yml.
docker compose -f docker-compose.postgres.yml up -d
```

Confirm that the container is healthy:

```powershell
docker ps
```

## 2. Create the NHL schema and seed Game 4

Run the migration and bundled Game 4 seed inside the container:

```powershell
Get-Content .\lib\db\migrations\0001_nhl_dashboard.sql |
  docker exec -i nhl-coaching-postgres psql -U nhl_app -d nhl_coaching

Get-Content .\lib\db\seeds\game4-2025030414.sql |
  docker exec -i nhl-coaching-postgres psql -U nhl_app -d nhl_coaching
```

The seed is idempotent for teams, game, player totals, insights, and preferences. Events, shifts, and bundled video records are replaced for the seeded game to avoid duplicates.

## 3. Install and launch the workspace

The repository uses pnpm. With Node.js installed:

```powershell
corepack enable
pnpm install
pnpm --filter @workspace/api-server build
$env:PORT="3001"
$env:DATABASE_URL="postgresql://nhl_app:YOUR_PASSWORD@localhost:5432/nhl_coaching"
pnpm --filter @workspace/api-server start
```

In another terminal:

```powershell
$env:VITE_NHL_API_BASE_URL="http://localhost:3001/api"
pnpm --filter @workspace/mockup-sandbox dev
```

The static UI falls back to `game4Data.ts` whenever the API is unavailable. This makes the package demonstrable before the PC database is started.

## 4. Available API endpoints

All endpoints use the `/api` prefix.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/healthz` | API health |
| GET | `/v1/games/2025030414/dashboard?at=2792` | Widget-ready snapshot at elapsed game second |
| GET | `/v1/games/2025030414/events?until=2792&types=goal,shot` | Ordered event timeline |
| GET | `/v1/games/2025030414/players` | Official player-game totals |
| GET | `/v1/games/2025030414/videos?category=faceoff` | Bundled clip metadata |
| GET | `/v1/widget-preferences/demo-head-coach?page=Player%20Insights` | Saved widget layout |
| PUT | `/v1/widget-preferences/demo-head-coach` | Save visibility, order, priority, and size variants |

The `at` cursor is elapsed game time from `0` to `3600`. The dashboard endpoint recomputes score, shots, current on-ice state, live TOI, rest time, recent events, and eligible AI insights for that exact destination. It is therefore suitable for the `skip 30 sec` and `skip 5 min` demo controls.

## 5. Database model

The schema is split so official source data remains independent of UI layouts:

- `nhl_teams`, `nhl_players`, `nhl_games`
- `nhl_game_events` for goals, shots, penalties, and future event types
- `nhl_team_game_stats`, `nhl_player_game_stats`
- `nhl_player_shifts` for exact TOI/on-ice/rest recomputation
- `nhl_video_clips` for Faceoffs, Goals, and Shots media
- `nhl_coaching_insights` for timestamped AI/coach recommendations
- `nhl_widget_preferences` for role/page-specific layouts

New PostgreSQL rows can carry arbitrary provider-specific fields in the JSONB `metadata`, `advanced`, `payload`, or `configuration` columns without a migration for every new statistic.

## 6. Connecting a GitHub Pages frontend

GitHub Pages is static and cannot host PostgreSQL or the Express API. The browser must reach the API running on the PC through an HTTPS URL.

For private/local use, open the site and API from the same LAN and configure the API URL accordingly. For external access, expose only the API through an authenticated HTTPS reverse proxy or tunnel, keep PostgreSQL itself private, and set:

```text
VITE_NHL_API_BASE_URL=https://your-api-host.example/api
```

Do not forward TCP port 5432 to the public internet. Restrict CORS to the production frontend origin before public deployment.

## 7. Importing later seasons and games

1. Upsert teams and players.
2. Insert the game row.
3. Insert official events in chronological order with `game_time_elapsed_seconds`.
4. Insert player/team totals and shift intervals.
5. Generate coaching insight rows with `available_at_game_seconds` and related widget keys.
6. Add video clip metadata associated with the game/event.

The frontend client is in:

`artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard/data/nhlDataClient.ts`
