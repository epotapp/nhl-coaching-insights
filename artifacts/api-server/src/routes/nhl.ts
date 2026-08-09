import { Router, type IRouter, type Request, type Response } from "express";
import { getPool, isDatabaseConfigured } from "@workspace/db";

const router: IRouter = Router();

const GAME_SECONDS = 60 * 60;

function parseGameSecond(value: unknown, fallback = GAME_SECONDS): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(GAME_SECONDS, Math.floor(parsed)));
}

function databaseUnavailable(res: Response): boolean {
  if (isDatabaseConfigured()) return false;
  res.status(503).json({
    error: "database_unavailable",
    message: "PostgreSQL is not configured. Set DATABASE_URL and apply lib/db/migrations/0001_nhl_dashboard.sql.",
  });
  return true;
}

function handleDatabaseError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown database error";
  res.status(503).json({ error: "database_unavailable", message });
}

router.get("/v1/games/:gameId/dashboard", async (req: Request, res: Response) => {
  if (databaseUnavailable(res)) return;
  const at = parseGameSecond(req.query.at);

  try {
    const pool = getPool();
    const [gameResult, eventTotalsResult, teamStatsResult, playersResult, recentEventsResult, insightsResult] = await Promise.all([
      pool.query(
        `SELECT g.*,
                at.name AS away_team_name,
                at.logo_url AS away_team_logo_url,
                ht.name AS home_team_name,
                ht.logo_url AS home_team_logo_url
           FROM nhl_games g
           JOIN nhl_teams at ON at.code = g.away_team_code
           JOIN nhl_teams ht ON ht.code = g.home_team_code
          WHERE g.id = $1`,
        [req.params.gameId],
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE event_type = 'goal' AND team_code = g.away_team_code)::int AS away_goals,
           COUNT(*) FILTER (WHERE event_type = 'goal' AND team_code = g.home_team_code)::int AS home_goals,
           COUNT(*) FILTER (WHERE event_type IN ('shot', 'goal') AND team_code = g.away_team_code)::int AS away_shots,
           COUNT(*) FILTER (WHERE event_type IN ('shot', 'goal') AND team_code = g.home_team_code)::int AS home_shots,
           COUNT(*) FILTER (WHERE event_type = 'penalty' AND team_code = g.away_team_code)::int AS away_penalties,
           COUNT(*) FILTER (WHERE event_type = 'penalty' AND team_code = g.home_team_code)::int AS home_penalties
         FROM nhl_games g
         LEFT JOIN nhl_game_events e
           ON e.game_id = g.id AND e.game_time_elapsed_seconds <= $2
        WHERE g.id = $1
        GROUP BY g.id`,
        [req.params.gameId, at],
      ),
      pool.query(
        `SELECT team_code, goals, shots_on_goal, shot_attempts, hits, blocks, takeaways,
                giveaways, penalty_minutes, faceoff_wins, faceoff_losses, power_play_goals,
                power_play_opportunities, advanced
           FROM nhl_team_game_stats
          WHERE game_id = $1
          ORDER BY team_code`,
        [req.params.gameId],
      ),
      pool.query(
        `SELECT p.id, p.nhl_id, p.team_code, p.jersey_number, p.first_name, p.last_name,
                p.position, p.shoots_catches, p.headshot_url,
                s.toi_seconds AS final_toi_seconds, s.shifts AS final_shifts,
                s.goals, s.assists, s.points, s.shots_on_goal, s.hits, s.blocks,
                s.takeaways, s.giveaways, s.penalty_minutes, s.faceoff_wins, s.faceoff_losses,
                COALESCE(SUM(
                  CASE
                    WHEN sh.start_game_seconds < $2
                    THEN GREATEST(0, LEAST(sh.end_game_seconds, $2) - sh.start_game_seconds)
                    ELSE 0
                  END
                ), 0)::int AS live_toi_seconds,
                COALESCE(BOOL_OR(sh.start_game_seconds <= $2 AND sh.end_game_seconds > $2), false) AS on_ice,
                COALESCE(MAX(sh.end_game_seconds) FILTER (WHERE sh.end_game_seconds <= $2), 0)::int AS last_shift_end_seconds
           FROM nhl_player_game_stats s
           JOIN nhl_players p ON p.id = s.player_id
           LEFT JOIN nhl_player_shifts sh ON sh.game_id = s.game_id AND sh.player_id = s.player_id
          WHERE s.game_id = $1
          GROUP BY p.id, s.game_id, s.player_id, s.toi_seconds, s.shifts, s.goals, s.assists,
                   s.points, s.shots_on_goal, s.hits, s.blocks, s.takeaways, s.giveaways,
                   s.penalty_minutes, s.faceoff_wins, s.faceoff_losses
          ORDER BY p.team_code, s.toi_seconds DESC, p.jersey_number`,
        [req.params.gameId, at],
      ),
      pool.query(
        `SELECT e.id, e.event_index, e.period, e.period_time_elapsed_seconds,
                e.game_time_elapsed_seconds, e.clock_remaining, e.event_type, e.team_code,
                e.strength, e.zone, e.description, e.metadata,
                p.jersey_number AS player_number,
                CONCAT_WS(' ', p.first_name, p.last_name) AS player_name
           FROM nhl_game_events e
           LEFT JOIN nhl_players p ON p.id = e.primary_player_id
          WHERE e.game_id = $1 AND e.game_time_elapsed_seconds <= $2
          ORDER BY e.game_time_elapsed_seconds DESC, e.event_index DESC
          LIMIT 12`,
        [req.params.gameId, at],
      ),
      pool.query(
        `SELECT id, insight_key, available_at_game_seconds, expires_at_game_seconds,
                priority, category, severity, title, summary, related_widget_keys, payload
           FROM nhl_coaching_insights
          WHERE game_id = $1
            AND available_at_game_seconds <= $2
            AND (expires_at_game_seconds IS NULL OR expires_at_game_seconds > $2)
          ORDER BY priority DESC, available_at_game_seconds DESC, id DESC
          LIMIT 10`,
        [req.params.gameId, at],
      ),
    ]);

    if (!gameResult.rowCount) {
      res.status(404).json({ error: "game_not_found", gameId: req.params.gameId });
      return;
    }

    const game = gameResult.rows[0];
    const totals = eventTotalsResult.rows[0] ?? {
      away_goals: 0,
      home_goals: 0,
      away_shots: 0,
      home_shots: 0,
      away_penalties: 0,
      home_penalties: 0,
    };

    const period = at >= 3600 ? 3 : Math.floor(at / 1200) + 1;
    const elapsedInPeriod = at >= 3600 ? 1200 : at % 1200;
    const clockRemainingSeconds = Math.max(0, 1200 - elapsedInPeriod);

    res.json({
      game,
      cursor: {
        atGameSeconds: at,
        period,
        clockRemainingSeconds,
      },
      live: {
        score: {
          away: totals.away_goals,
          home: totals.home_goals,
        },
        shotsOnGoal: {
          away: totals.away_shots,
          home: totals.home_shots,
        },
        penalties: {
          away: totals.away_penalties,
          home: totals.home_penalties,
        },
      },
      officialTeamTotals: teamStatsResult.rows,
      players: playersResult.rows.map(player => ({
        ...player,
        restSeconds: player.on_ice ? 0 : Math.max(0, at - Number(player.last_shift_end_seconds ?? 0)),
      })),
      recentEvents: recentEventsResult.rows,
      insights: insightsResult.rows,
    });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

router.get("/v1/games/:gameId/events", async (req: Request, res: Response) => {
  if (databaseUnavailable(res)) return;
  const until = parseGameSecond(req.query.until);
  const requestedTypes = typeof req.query.types === "string"
    ? req.query.types.split(",").map(value => value.trim().toLowerCase()).filter(Boolean)
    : [];

  try {
    const result = await getPool().query(
      `SELECT e.id, e.event_index, e.period, e.period_time_elapsed_seconds,
              e.game_time_elapsed_seconds, e.clock_remaining, e.event_type, e.team_code,
              e.strength, e.zone, e.description, e.x, e.y, e.metadata,
              p.jersey_number AS player_number,
              CONCAT_WS(' ', p.first_name, p.last_name) AS player_name
         FROM nhl_game_events e
         LEFT JOIN nhl_players p ON p.id = e.primary_player_id
        WHERE e.game_id = $1
          AND e.game_time_elapsed_seconds <= $2
          AND (cardinality($3::text[]) = 0 OR e.event_type = ANY($3::text[]))
        ORDER BY e.game_time_elapsed_seconds, e.event_index`,
      [req.params.gameId, until, requestedTypes],
    );
    res.json({ gameId: req.params.gameId, until, events: result.rows });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

router.get("/v1/games/:gameId/players", async (req: Request, res: Response) => {
  if (databaseUnavailable(res)) return;
  try {
    const result = await getPool().query(
      `SELECT p.id, p.nhl_id, p.team_code, p.jersey_number, p.first_name, p.last_name,
              p.position, p.shoots_catches, p.headshot_url,
              s.toi_seconds, s.shifts, s.goals, s.assists, s.points, s.shots_on_goal,
              s.shot_attempts, s.hits, s.blocks, s.takeaways, s.giveaways,
              s.penalty_minutes, s.faceoff_wins, s.faceoff_losses, s.saves,
              s.shots_against, s.advanced
         FROM nhl_player_game_stats s
         JOIN nhl_players p ON p.id = s.player_id
        WHERE s.game_id = $1
        ORDER BY p.team_code, s.toi_seconds DESC, p.jersey_number`,
      [req.params.gameId],
    );
    res.json({ gameId: req.params.gameId, players: result.rows });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

router.get("/v1/games/:gameId/videos", async (req: Request, res: Response) => {
  if (databaseUnavailable(res)) return;
  const category = typeof req.query.category === "string" ? req.query.category.toLowerCase() : null;
  try {
    const result = await getPool().query(
      `SELECT id, event_id, category, title, clip_url, thumbnail_url,
              start_game_seconds, end_game_seconds, player_ids, tags, metadata
         FROM nhl_video_clips
        WHERE game_id = $1 AND ($2::text IS NULL OR category = $2)
        ORDER BY start_game_seconds NULLS LAST, id`,
      [req.params.gameId, category],
    );
    res.json({ gameId: req.params.gameId, category, clips: result.rows });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

router.get("/v1/widget-preferences/:userKey", async (req: Request, res: Response) => {
  if (databaseUnavailable(res)) return;
  const page = typeof req.query.page === "string" ? req.query.page : null;
  try {
    const result = await getPool().query(
      `SELECT id, user_key, role, page, widget_key, visible, order_index,
              size_variant, priority, configuration, updated_at
         FROM nhl_widget_preferences
        WHERE user_key = $1 AND ($2::text IS NULL OR page = $2)
        ORDER BY page, order_index, priority DESC, widget_key`,
      [req.params.userKey, page],
    );
    res.json({ userKey: req.params.userKey, preferences: result.rows });
  } catch (error) {
    handleDatabaseError(res, error);
  }
});

interface PreferenceInput {
  page?: unknown;
  widgetKey?: unknown;
  role?: unknown;
  visible?: unknown;
  orderIndex?: unknown;
  sizeVariant?: unknown;
  priority?: unknown;
  configuration?: unknown;
}

router.put("/v1/widget-preferences/:userKey", async (req: Request, res: Response) => {
  if (databaseUnavailable(res)) return;
  const raw = Array.isArray(req.body?.widgets) ? req.body.widgets as PreferenceInput[] : [];
  if (!raw.length) {
    res.status(400).json({ error: "invalid_request", message: "Body must contain a non-empty widgets array." });
    return;
  }

  const widgets = raw.map((item, index) => ({
    page: typeof item.page === "string" ? item.page.slice(0, 64) : "Dashboard",
    widgetKey: typeof item.widgetKey === "string" ? item.widgetKey.slice(0, 96) : "",
    role: typeof item.role === "string" ? item.role.slice(0, 48) : "head-coach",
    visible: typeof item.visible === "boolean" ? item.visible : true,
    orderIndex: Number.isFinite(Number(item.orderIndex)) ? Math.max(0, Math.floor(Number(item.orderIndex))) : index,
    sizeVariant: typeof item.sizeVariant === "string" ? item.sizeVariant.slice(0, 24) : "adaptive",
    priority: Number.isFinite(Number(item.priority)) ? Math.max(0, Math.min(100, Math.floor(Number(item.priority)))) : 50,
    configuration: item.configuration && typeof item.configuration === "object" && !Array.isArray(item.configuration)
      ? item.configuration
      : {},
  }));

  if (widgets.some(widget => !widget.widgetKey)) {
    res.status(400).json({ error: "invalid_request", message: "Every widget must have widgetKey." });
    return;
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    for (const widget of widgets) {
      await client.query(
        `INSERT INTO nhl_widget_preferences
           (user_key, role, page, widget_key, visible, order_index, size_variant, priority, configuration, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now())
         ON CONFLICT (user_key, page, widget_key)
         DO UPDATE SET role = EXCLUDED.role,
                       visible = EXCLUDED.visible,
                       order_index = EXCLUDED.order_index,
                       size_variant = EXCLUDED.size_variant,
                       priority = EXCLUDED.priority,
                       configuration = EXCLUDED.configuration,
                       updated_at = now()`,
        [
          req.params.userKey,
          widget.role,
          widget.page,
          widget.widgetKey,
          widget.visible,
          widget.orderIndex,
          widget.sizeVariant,
          widget.priority,
          JSON.stringify(widget.configuration),
        ],
      );
    }
    await client.query("COMMIT");
    res.json({ userKey: req.params.userKey, saved: widgets.length, widgets });
  } catch (error) {
    await client.query("ROLLBACK");
    handleDatabaseError(res, error);
  } finally {
    client.release();
  }
});

export default router;
