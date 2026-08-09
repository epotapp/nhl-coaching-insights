import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * NHL application schema.
 *
 * The tables deliberately keep official source values (events, shifts and
 * game totals) separate from derived coaching insight payloads. This lets the
 * dashboard recompute any timestamp in the demo and later ingest live feeds
 * without rewriting the UI-specific insight records.
 */

export const nhlTeams = pgTable("nhl_teams", {
  code: varchar("code", { length: 3 }).primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  abbreviation: varchar("abbreviation", { length: 3 }).notNull(),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }),
  secondaryColor: varchar("secondary_color", { length: 7 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nhlPlayers = pgTable("nhl_players", {
  id: serial("id").primaryKey(),
  nhlId: integer("nhl_id"),
  teamCode: varchar("team_code", { length: 3 })
    .notNull()
    .references(() => nhlTeams.code, { onDelete: "restrict", onUpdate: "cascade" }),
  jerseyNumber: smallint("jersey_number").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: varchar("position", { length: 2 }).notNull(),
  shootsCatches: varchar("shoots_catches", { length: 1 }),
  headshotUrl: text("headshot_url"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  nhlIdUnique: uniqueIndex("nhl_players_nhl_id_uq").on(table.nhlId),
  teamNumberUnique: uniqueIndex("nhl_players_team_number_uq").on(table.teamCode, table.jerseyNumber),
  teamIndex: index("nhl_players_team_idx").on(table.teamCode),
}));

export const nhlGames = pgTable("nhl_games", {
  id: varchar("id", { length: 12 }).primaryKey(),
  season: varchar("season", { length: 9 }).notNull(),
  gameType: smallint("game_type").notNull(),
  gameNumber: smallint("game_number"),
  gameDate: timestamp("game_date", { withTimezone: true }).notNull(),
  venue: text("venue"),
  awayTeamCode: varchar("away_team_code", { length: 3 })
    .notNull()
    .references(() => nhlTeams.code, { onDelete: "restrict", onUpdate: "cascade" }),
  homeTeamCode: varchar("home_team_code", { length: 3 })
    .notNull()
    .references(() => nhlTeams.code, { onDelete: "restrict", onUpdate: "cascade" }),
  awayScore: smallint("away_score").default(0).notNull(),
  homeScore: smallint("home_score").default(0).notNull(),
  status: varchar("status", { length: 24 }).default("scheduled").notNull(),
  period: smallint("period").default(0).notNull(),
  clockRemainingSeconds: integer("clock_remaining_seconds").default(1200).notNull(),
  source: text("source").default("NHL official reports").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  dateIndex: index("nhl_games_date_idx").on(table.gameDate),
  teamsIndex: index("nhl_games_teams_idx").on(table.awayTeamCode, table.homeTeamCode),
}));

export const nhlGameEvents = pgTable("nhl_game_events", {
  id: serial("id").primaryKey(),
  gameId: varchar("game_id", { length: 12 })
    .notNull()
    .references(() => nhlGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
  eventIndex: integer("event_index").notNull(),
  period: smallint("period").notNull(),
  periodTimeElapsedSeconds: integer("period_time_elapsed_seconds").notNull(),
  gameTimeElapsedSeconds: integer("game_time_elapsed_seconds").notNull(),
  clockRemaining: varchar("clock_remaining", { length: 5 }).notNull(),
  eventType: varchar("event_type", { length: 32 }).notNull(),
  teamCode: varchar("team_code", { length: 3 }).references(() => nhlTeams.code, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  strength: varchar("strength", { length: 12 }),
  zone: varchar("zone", { length: 24 }),
  description: text("description").notNull(),
  primaryPlayerId: integer("primary_player_id").references(() => nhlPlayers.id, { onDelete: "set null" }),
  secondaryPlayerId: integer("secondary_player_id").references(() => nhlPlayers.id, { onDelete: "set null" }),
  x: numeric("x", { precision: 7, scale: 3 }),
  y: numeric("y", { precision: 7, scale: 3 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  eventUnique: uniqueIndex("nhl_game_events_game_event_uq").on(table.gameId, table.eventIndex),
  timelineIndex: index("nhl_game_events_timeline_idx").on(table.gameId, table.gameTimeElapsedSeconds),
  typeIndex: index("nhl_game_events_type_idx").on(table.gameId, table.eventType),
  teamIndex: index("nhl_game_events_team_idx").on(table.gameId, table.teamCode),
}));

export const nhlTeamGameStats = pgTable("nhl_team_game_stats", {
  gameId: varchar("game_id", { length: 12 })
    .notNull()
    .references(() => nhlGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
  teamCode: varchar("team_code", { length: 3 })
    .notNull()
    .references(() => nhlTeams.code, { onDelete: "restrict", onUpdate: "cascade" }),
  goals: smallint("goals").default(0).notNull(),
  shotsOnGoal: smallint("shots_on_goal").default(0).notNull(),
  shotAttempts: smallint("shot_attempts").default(0).notNull(),
  hits: smallint("hits").default(0).notNull(),
  blocks: smallint("blocks").default(0).notNull(),
  takeaways: smallint("takeaways").default(0).notNull(),
  giveaways: smallint("giveaways").default(0).notNull(),
  penaltyMinutes: smallint("penalty_minutes").default(0).notNull(),
  faceoffWins: smallint("faceoff_wins").default(0).notNull(),
  faceoffLosses: smallint("faceoff_losses").default(0).notNull(),
  powerPlayGoals: smallint("power_play_goals").default(0).notNull(),
  powerPlayOpportunities: smallint("power_play_opportunities").default(0).notNull(),
  advanced: jsonb("advanced").$type<Record<string, number | string | boolean | null>>().default({}).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  pk: primaryKey({ name: "nhl_team_game_stats_pk", columns: [table.gameId, table.teamCode] }),
  gameIndex: index("nhl_team_game_stats_game_idx").on(table.gameId),
}));

export const nhlVideoClips = pgTable("nhl_video_clips", {
  id: serial("id").primaryKey(),
  gameId: varchar("game_id", { length: 12 })
    .notNull()
    .references(() => nhlGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
  eventId: integer("event_id").references(() => nhlGameEvents.id, { onDelete: "set null" }),
  category: varchar("category", { length: 32 }).notNull(),
  title: text("title").notNull(),
  clipUrl: text("clip_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  startGameSeconds: integer("start_game_seconds"),
  endGameSeconds: integer("end_game_seconds"),
  playerIds: jsonb("player_ids").$type<number[]>().default([]).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  gameCategoryIndex: index("nhl_video_clips_game_category_idx").on(table.gameId, table.category),
  timelineIndex: index("nhl_video_clips_timeline_idx").on(table.gameId, table.startGameSeconds),
}));

export const nhlPlayerGameStats = pgTable("nhl_player_game_stats", {
  gameId: varchar("game_id", { length: 12 })
    .notNull()
    .references(() => nhlGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
  playerId: integer("player_id")
    .notNull()
    .references(() => nhlPlayers.id, { onDelete: "cascade" }),
  teamCode: varchar("team_code", { length: 3 })
    .notNull()
    .references(() => nhlTeams.code, { onDelete: "restrict", onUpdate: "cascade" }),
  toiSeconds: integer("toi_seconds").default(0).notNull(),
  shifts: smallint("shifts").default(0).notNull(),
  goals: smallint("goals").default(0).notNull(),
  assists: smallint("assists").default(0).notNull(),
  points: smallint("points").default(0).notNull(),
  shotsOnGoal: smallint("shots_on_goal").default(0).notNull(),
  shotAttempts: smallint("shot_attempts").default(0).notNull(),
  hits: smallint("hits").default(0).notNull(),
  blocks: smallint("blocks").default(0).notNull(),
  takeaways: smallint("takeaways").default(0).notNull(),
  giveaways: smallint("giveaways").default(0).notNull(),
  penaltyMinutes: smallint("penalty_minutes").default(0).notNull(),
  faceoffWins: smallint("faceoff_wins").default(0).notNull(),
  faceoffLosses: smallint("faceoff_losses").default(0).notNull(),
  saves: smallint("saves").default(0).notNull(),
  shotsAgainst: smallint("shots_against").default(0).notNull(),
  advanced: jsonb("advanced").$type<Record<string, number | string | boolean | null>>().default({}).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  pk: primaryKey({ name: "nhl_player_game_stats_pk", columns: [table.gameId, table.playerId] }),
  teamIndex: index("nhl_player_game_stats_team_idx").on(table.gameId, table.teamCode),
}));

export const nhlPlayerShifts = pgTable("nhl_player_shifts", {
  id: serial("id").primaryKey(),
  gameId: varchar("game_id", { length: 12 })
    .notNull()
    .references(() => nhlGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
  playerId: integer("player_id")
    .notNull()
    .references(() => nhlPlayers.id, { onDelete: "cascade" }),
  shiftNumber: smallint("shift_number").notNull(),
  period: smallint("period").notNull(),
  startGameSeconds: integer("start_game_seconds").notNull(),
  endGameSeconds: integer("end_game_seconds").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  startClock: varchar("start_clock", { length: 5 }),
  endClock: varchar("end_clock", { length: 5 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
}, table => ({
  shiftUnique: uniqueIndex("nhl_player_shifts_game_player_shift_uq").on(table.gameId, table.playerId, table.shiftNumber),
  timelineIndex: index("nhl_player_shifts_timeline_idx").on(table.gameId, table.startGameSeconds, table.endGameSeconds),
  playerIndex: index("nhl_player_shifts_player_idx").on(table.gameId, table.playerId),
}));

export const nhlCoachingInsights = pgTable("nhl_coaching_insights", {
  id: serial("id").primaryKey(),
  gameId: varchar("game_id", { length: 12 })
    .notNull()
    .references(() => nhlGames.id, { onDelete: "cascade", onUpdate: "cascade" }),
  insightKey: varchar("insight_key", { length: 96 }).notNull(),
  availableAtGameSeconds: integer("available_at_game_seconds").default(0).notNull(),
  expiresAtGameSeconds: integer("expires_at_game_seconds"),
  priority: smallint("priority").default(50).notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  severity: varchar("severity", { length: 16 }).default("info").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  relatedWidgetKeys: jsonb("related_widget_keys").$type<string[]>().default([]).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  insightUnique: uniqueIndex("nhl_coaching_insights_game_key_uq").on(table.gameId, table.insightKey),
  availableIndex: index("nhl_coaching_insights_available_idx").on(table.gameId, table.availableAtGameSeconds, table.priority),
}));

export const nhlWidgetPreferences = pgTable("nhl_widget_preferences", {
  id: serial("id").primaryKey(),
  userKey: varchar("user_key", { length: 128 }).notNull(),
  role: varchar("role", { length: 48 }).default("head-coach").notNull(),
  page: varchar("page", { length: 64 }).notNull(),
  widgetKey: varchar("widget_key", { length: 96 }).notNull(),
  visible: boolean("visible").default(true).notNull(),
  orderIndex: smallint("order_index").default(0).notNull(),
  sizeVariant: varchar("size_variant", { length: 24 }).default("adaptive").notNull(),
  priority: smallint("priority").default(50).notNull(),
  configuration: jsonb("configuration").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({
  preferenceUnique: uniqueIndex("nhl_widget_preferences_user_page_widget_uq").on(table.userKey, table.page, table.widgetKey),
  userPageIndex: index("nhl_widget_preferences_user_page_idx").on(table.userKey, table.page, table.orderIndex),
}));

export type NhlTeam = typeof nhlTeams.$inferSelect;
export type NewNhlTeam = typeof nhlTeams.$inferInsert;
export type NhlPlayer = typeof nhlPlayers.$inferSelect;
export type NewNhlPlayer = typeof nhlPlayers.$inferInsert;
export type NhlGame = typeof nhlGames.$inferSelect;
export type NewNhlGame = typeof nhlGames.$inferInsert;
export type NhlGameEvent = typeof nhlGameEvents.$inferSelect;
export type NewNhlGameEvent = typeof nhlGameEvents.$inferInsert;
export type NhlTeamGameStat = typeof nhlTeamGameStats.$inferSelect;
export type NewNhlTeamGameStat = typeof nhlTeamGameStats.$inferInsert;
export type NhlVideoClip = typeof nhlVideoClips.$inferSelect;
export type NewNhlVideoClip = typeof nhlVideoClips.$inferInsert;
export type NhlPlayerGameStat = typeof nhlPlayerGameStats.$inferSelect;
export type NewNhlPlayerGameStat = typeof nhlPlayerGameStats.$inferInsert;
export type NhlPlayerShift = typeof nhlPlayerShifts.$inferSelect;
export type NewNhlPlayerShift = typeof nhlPlayerShifts.$inferInsert;
export type NhlCoachingInsight = typeof nhlCoachingInsights.$inferSelect;
export type NewNhlCoachingInsight = typeof nhlCoachingInsights.$inferInsert;
export type NhlWidgetPreference = typeof nhlWidgetPreferences.$inferSelect;
export type NewNhlWidgetPreference = typeof nhlWidgetPreferences.$inferInsert;
