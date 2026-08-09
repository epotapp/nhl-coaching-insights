/**
 * Typed boundary between the demonstration UI and the optional PostgreSQL API.
 *
 * The current packaged demo continues to work from game4Data.ts when the API
 * is offline. Set VITE_NHL_API_BASE_URL (for example http://192.168.1.20:3001/api)
 * to retrieve the same widget-ready data from PostgreSQL on the user's PC.
 */

export interface DashboardGame {
  id: string;
  season: string;
  game_date: string;
  venue: string | null;
  away_team_code: string;
  home_team_code: string;
  away_team_name: string;
  home_team_name: string;
  away_team_logo_url: string | null;
  home_team_logo_url: string | null;
  status: string;
}

export interface DashboardPlayer {
  id: number;
  team_code: string;
  jersey_number: number;
  first_name: string;
  last_name: string;
  position: string;
  headshot_url: string | null;
  final_toi_seconds: number;
  final_shifts: number;
  live_toi_seconds: number;
  restSeconds: number;
  on_ice: boolean;
  goals: number;
  assists: number;
  points: number;
  shots_on_goal: number;
  faceoff_wins: number;
  faceoff_losses: number;
}

export interface DashboardInsight {
  id: number;
  insight_key: string;
  priority: number;
  category: string;
  severity: string;
  title: string;
  summary: string;
  related_widget_keys: string[];
  payload: Record<string, unknown>;
}

export interface DashboardSnapshot {
  game: DashboardGame;
  cursor: {
    atGameSeconds: number;
    period: number;
    clockRemainingSeconds: number;
  };
  live: {
    score: { away: number; home: number };
    shotsOnGoal: { away: number; home: number };
    penalties: { away: number; home: number };
  };
  officialTeamTotals: Array<Record<string, unknown>>;
  players: DashboardPlayer[];
  recentEvents: Array<Record<string, unknown>>;
  insights: DashboardInsight[];
}

export interface WidgetPreferenceInput {
  page: string;
  widgetKey: string;
  role?: string;
  visible: boolean;
  orderIndex: number;
  sizeVariant?: "compact" | "medium" | "wide" | "rail" | "adaptive" | string;
  priority?: number;
  configuration?: Record<string, unknown>;
}

const configuredBase = (import.meta.env.VITE_NHL_API_BASE_URL as string | undefined)?.replace(/\/$/, "");
export const isNhlApiConfigured = Boolean(configuredBase);
export const NHL_API_BASE_URL = configuredBase || "/api";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${NHL_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(errorBody?.message || `NHL API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function loadDashboardSnapshot(gameId: string, atGameSeconds: number, signal?: AbortSignal): Promise<DashboardSnapshot> {
  return apiRequest(`/v1/games/${encodeURIComponent(gameId)}/dashboard?at=${Math.max(0, Math.floor(atGameSeconds))}`, { signal });
}

export function loadGamePlayers(gameId: string, signal?: AbortSignal): Promise<{ gameId: string; players: DashboardPlayer[] }> {
  return apiRequest(`/v1/games/${encodeURIComponent(gameId)}/players`, { signal });
}

export function loadGameEvents(gameId: string, until: number, types: string[] = [], signal?: AbortSignal) {
  const params = new URLSearchParams({ until: String(Math.max(0, Math.floor(until))) });
  if (types.length) params.set("types", types.join(","));
  return apiRequest<{ gameId: string; until: number; events: Array<Record<string, unknown>> }>(
    `/v1/games/${encodeURIComponent(gameId)}/events?${params}`,
    { signal },
  );
}

export function loadGameVideos(gameId: string, category?: string, signal?: AbortSignal) {
  const suffix = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiRequest<{ gameId: string; category: string | null; clips: Array<Record<string, unknown>> }>(
    `/v1/games/${encodeURIComponent(gameId)}/videos${suffix}`,
    { signal },
  );
}

export function loadWidgetPreferences(userKey: string, page?: string, signal?: AbortSignal) {
  const suffix = page ? `?page=${encodeURIComponent(page)}` : "";
  return apiRequest<{ userKey: string; preferences: Array<Record<string, unknown>> }>(
    `/v1/widget-preferences/${encodeURIComponent(userKey)}${suffix}`,
    { signal },
  );
}

export function saveWidgetPreferences(userKey: string, widgets: WidgetPreferenceInput[]) {
  return apiRequest<{ userKey: string; saved: number; widgets: WidgetPreferenceInput[] }>(
    `/v1/widget-preferences/${encodeURIComponent(userKey)}`,
    { method: "PUT", body: JSON.stringify({ widgets }) },
  );
}
