BEGIN;

CREATE TABLE IF NOT EXISTS nhl_teams (
  code varchar(3) PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  abbreviation varchar(3) NOT NULL,
  logo_url text,
  primary_color varchar(7),
  secondary_color varchar(7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nhl_players (
  id serial PRIMARY KEY,
  nhl_id integer,
  team_code varchar(3) NOT NULL REFERENCES nhl_teams(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  jersey_number smallint NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  position varchar(2) NOT NULL,
  shoots_catches varchar(1),
  headshot_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS nhl_players_nhl_id_uq ON nhl_players(nhl_id) WHERE nhl_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS nhl_players_team_number_uq ON nhl_players(team_code, jersey_number);
CREATE INDEX IF NOT EXISTS nhl_players_team_idx ON nhl_players(team_code);

CREATE TABLE IF NOT EXISTS nhl_games (
  id varchar(12) PRIMARY KEY,
  season varchar(9) NOT NULL,
  game_type smallint NOT NULL,
  game_number smallint,
  game_date timestamptz NOT NULL,
  venue text,
  away_team_code varchar(3) NOT NULL REFERENCES nhl_teams(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  home_team_code varchar(3) NOT NULL REFERENCES nhl_teams(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  away_score smallint NOT NULL DEFAULT 0,
  home_score smallint NOT NULL DEFAULT 0,
  status varchar(24) NOT NULL DEFAULT 'scheduled',
  period smallint NOT NULL DEFAULT 0,
  clock_remaining_seconds integer NOT NULL DEFAULT 1200,
  source text NOT NULL DEFAULT 'NHL official reports',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nhl_games_date_idx ON nhl_games(game_date);
CREATE INDEX IF NOT EXISTS nhl_games_teams_idx ON nhl_games(away_team_code, home_team_code);

CREATE TABLE IF NOT EXISTS nhl_game_events (
  id serial PRIMARY KEY,
  game_id varchar(12) NOT NULL REFERENCES nhl_games(id) ON DELETE CASCADE ON UPDATE CASCADE,
  event_index integer NOT NULL,
  period smallint NOT NULL,
  period_time_elapsed_seconds integer NOT NULL,
  game_time_elapsed_seconds integer NOT NULL,
  clock_remaining varchar(5) NOT NULL,
  event_type varchar(32) NOT NULL,
  team_code varchar(3) REFERENCES nhl_teams(code) ON DELETE SET NULL ON UPDATE CASCADE,
  strength varchar(12),
  zone varchar(24),
  description text NOT NULL,
  primary_player_id integer REFERENCES nhl_players(id) ON DELETE SET NULL,
  secondary_player_id integer REFERENCES nhl_players(id) ON DELETE SET NULL,
  x numeric(7,3),
  y numeric(7,3),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS nhl_game_events_game_event_uq ON nhl_game_events(game_id, event_index);
CREATE INDEX IF NOT EXISTS nhl_game_events_timeline_idx ON nhl_game_events(game_id, game_time_elapsed_seconds);
CREATE INDEX IF NOT EXISTS nhl_game_events_type_idx ON nhl_game_events(game_id, event_type);
CREATE INDEX IF NOT EXISTS nhl_game_events_team_idx ON nhl_game_events(game_id, team_code);

CREATE TABLE IF NOT EXISTS nhl_team_game_stats (
  game_id varchar(12) NOT NULL REFERENCES nhl_games(id) ON DELETE CASCADE ON UPDATE CASCADE,
  team_code varchar(3) NOT NULL REFERENCES nhl_teams(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  goals smallint NOT NULL DEFAULT 0,
  shots_on_goal smallint NOT NULL DEFAULT 0,
  shot_attempts smallint NOT NULL DEFAULT 0,
  hits smallint NOT NULL DEFAULT 0,
  blocks smallint NOT NULL DEFAULT 0,
  takeaways smallint NOT NULL DEFAULT 0,
  giveaways smallint NOT NULL DEFAULT 0,
  penalty_minutes smallint NOT NULL DEFAULT 0,
  faceoff_wins smallint NOT NULL DEFAULT 0,
  faceoff_losses smallint NOT NULL DEFAULT 0,
  power_play_goals smallint NOT NULL DEFAULT 0,
  power_play_opportunities smallint NOT NULL DEFAULT 0,
  advanced jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nhl_team_game_stats_pk PRIMARY KEY (game_id, team_code)
);
CREATE INDEX IF NOT EXISTS nhl_team_game_stats_game_idx ON nhl_team_game_stats(game_id);

CREATE TABLE IF NOT EXISTS nhl_video_clips (
  id serial PRIMARY KEY,
  game_id varchar(12) NOT NULL REFERENCES nhl_games(id) ON DELETE CASCADE ON UPDATE CASCADE,
  event_id integer REFERENCES nhl_game_events(id) ON DELETE SET NULL,
  category varchar(32) NOT NULL,
  title text NOT NULL,
  clip_url text NOT NULL,
  thumbnail_url text,
  start_game_seconds integer,
  end_game_seconds integer,
  player_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nhl_video_clips_game_category_idx ON nhl_video_clips(game_id, category);
CREATE INDEX IF NOT EXISTS nhl_video_clips_timeline_idx ON nhl_video_clips(game_id, start_game_seconds);

CREATE TABLE IF NOT EXISTS nhl_player_game_stats (
  game_id varchar(12) NOT NULL REFERENCES nhl_games(id) ON DELETE CASCADE ON UPDATE CASCADE,
  player_id integer NOT NULL REFERENCES nhl_players(id) ON DELETE CASCADE,
  team_code varchar(3) NOT NULL REFERENCES nhl_teams(code) ON DELETE RESTRICT ON UPDATE CASCADE,
  toi_seconds integer NOT NULL DEFAULT 0,
  shifts smallint NOT NULL DEFAULT 0,
  goals smallint NOT NULL DEFAULT 0,
  assists smallint NOT NULL DEFAULT 0,
  points smallint NOT NULL DEFAULT 0,
  shots_on_goal smallint NOT NULL DEFAULT 0,
  shot_attempts smallint NOT NULL DEFAULT 0,
  hits smallint NOT NULL DEFAULT 0,
  blocks smallint NOT NULL DEFAULT 0,
  takeaways smallint NOT NULL DEFAULT 0,
  giveaways smallint NOT NULL DEFAULT 0,
  penalty_minutes smallint NOT NULL DEFAULT 0,
  faceoff_wins smallint NOT NULL DEFAULT 0,
  faceoff_losses smallint NOT NULL DEFAULT 0,
  saves smallint NOT NULL DEFAULT 0,
  shots_against smallint NOT NULL DEFAULT 0,
  advanced jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nhl_player_game_stats_pk PRIMARY KEY (game_id, player_id)
);
CREATE INDEX IF NOT EXISTS nhl_player_game_stats_team_idx ON nhl_player_game_stats(game_id, team_code);

CREATE TABLE IF NOT EXISTS nhl_player_shifts (
  id serial PRIMARY KEY,
  game_id varchar(12) NOT NULL REFERENCES nhl_games(id) ON DELETE CASCADE ON UPDATE CASCADE,
  player_id integer NOT NULL REFERENCES nhl_players(id) ON DELETE CASCADE,
  shift_number smallint NOT NULL,
  period smallint NOT NULL,
  start_game_seconds integer NOT NULL,
  end_game_seconds integer NOT NULL,
  duration_seconds integer NOT NULL,
  start_clock varchar(5),
  end_clock varchar(5),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT nhl_player_shifts_positive CHECK (end_game_seconds >= start_game_seconds AND duration_seconds >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS nhl_player_shifts_game_player_shift_uq ON nhl_player_shifts(game_id, player_id, shift_number);
CREATE INDEX IF NOT EXISTS nhl_player_shifts_timeline_idx ON nhl_player_shifts(game_id, start_game_seconds, end_game_seconds);
CREATE INDEX IF NOT EXISTS nhl_player_shifts_player_idx ON nhl_player_shifts(game_id, player_id);

CREATE TABLE IF NOT EXISTS nhl_coaching_insights (
  id serial PRIMARY KEY,
  game_id varchar(12) NOT NULL REFERENCES nhl_games(id) ON DELETE CASCADE ON UPDATE CASCADE,
  insight_key varchar(96) NOT NULL,
  available_at_game_seconds integer NOT NULL DEFAULT 0,
  expires_at_game_seconds integer,
  priority smallint NOT NULL DEFAULT 50,
  category varchar(48) NOT NULL,
  severity varchar(16) NOT NULL DEFAULT 'info',
  title text NOT NULL,
  summary text NOT NULL,
  related_widget_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS nhl_coaching_insights_game_key_uq ON nhl_coaching_insights(game_id, insight_key);
CREATE INDEX IF NOT EXISTS nhl_coaching_insights_available_idx ON nhl_coaching_insights(game_id, available_at_game_seconds, priority);

CREATE TABLE IF NOT EXISTS nhl_widget_preferences (
  id serial PRIMARY KEY,
  user_key varchar(128) NOT NULL,
  role varchar(48) NOT NULL DEFAULT 'head-coach',
  page varchar(64) NOT NULL,
  widget_key varchar(96) NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  order_index smallint NOT NULL DEFAULT 0,
  size_variant varchar(24) NOT NULL DEFAULT 'adaptive',
  priority smallint NOT NULL DEFAULT 50,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS nhl_widget_preferences_user_page_widget_uq ON nhl_widget_preferences(user_key, page, widget_key);
CREATE INDEX IF NOT EXISTS nhl_widget_preferences_user_page_idx ON nhl_widget_preferences(user_key, page, order_index);

COMMIT;
