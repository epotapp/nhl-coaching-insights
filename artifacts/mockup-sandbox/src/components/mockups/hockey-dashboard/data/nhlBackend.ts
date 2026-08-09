import { useEffect, useState } from "react";

export const NHL_GAME4_ID = 2025030414;
export const CAR_TEAM_ID = 12;
export const VGK_TEAM_ID = 54;

export interface FaceoffRecord {
  wins: number;
  losses: number;
  attempts: number;
  pct: number | null;
}

export interface BackendPlayer {
  playerId: number;
  name: string;
  teamId: number | null;
  position: string | null;
  sweaterNumber: number | null;
  headshot: string | null;
  toiSeconds: number;
  toi: string;
  restSeconds: number | null;
  rest: string | null;
  onIce: boolean;
  shotsOnGoal: number;
  faceoffs: FaceoffRecord;
  faceoffHistory: string[];
}

export interface BackendSimState {
  gameId: number;
  mode: "playing" | "finished";
  elapsedSeconds: number;
  maxElapsedSeconds: number;
  clock: string;
  period: number;
  periodLabel: string;
  score: { car: number; vgk: number };
  reviewing: boolean;
  strength: string;
  iceStatus: string;
  toi: Record<string, number>;
  rest: Record<string, number | null>;
  foHistory: Record<string, string[]>;
  playerSog: Record<string, number>;
  team: {
    fo: Record<string, FaceoffRecord>;
    sogCar: number;
    sogVgk: number;
    satCar: number;
    satVgk: number;
    hitCar: number;
    hitVgk: number;
    pimCar: number;
    pimVgk: number;
    blkCar: number;
    blkVgk: number;
    gvCar: number;
    gvVgk: number;
    tkCar: number;
    tkVgk: number;
  };
  players: BackendPlayer[];
  lastEvent: Record<string, unknown> | null;
  dataStatus: "synced" | "seed-only";
}

export interface TeamWidgetRow {
  teamId: number;
  abbrev: string;
  name: string;
  side: "away" | "home";
  score: number;
  shotsOnGoal: number;
  shotAttempts: number;
  hits: number;
  penaltyMinutes: number;
  blockedShots: number;
  giveaways: number;
  takeaways: number;
  faceoffWins: number;
  shootingPct?: number;
}

export interface WorkloadRow {
  playerId: number;
  name: string;
  teamId: number | null;
  toi: string;
  toiSeconds: number;
  rest: string | null;
  restSeconds: number | null;
  onIce: boolean;
  risk: "high" | "normal";
}

export interface FaceoffMatchupRow {
  playerA: { playerId: number; wins: number; name: string; teamId: number; pct: number | null };
  playerB: { playerId: number; wins: number; name: string; teamId: number; pct: number | null };
  total: number;
  draws: Array<{ period: number; timeInPeriod: string; zone: string | null }>;
}

export interface ShootingSectorRow {
  teamId: number;
  sector: string;
  attempts: number;
  shotsOnGoal: number;
  goals: number;
  estimatedXg: number;
  shootingPct: number;
}

export interface PowerPlayRow {
  teamId: number;
  goals: number;
  sog: number;
  attempts: number;
  conversionPct: number | null;
}

export interface GoalieRow {
  playerId: number;
  name: string;
  teamId: number;
  teamAbbrev: string;
  starter: boolean;
  decision: string | null;
  timeOnIce: string;
  shotsAgainst: number;
  saves: number;
  goalsAgainst: number;
  savePct: number | null;
  headshot: string | null;
}

export interface GamePulseRow {
  teamId: number;
  attempts: number;
  sog: number;
  goals: number;
  xg: number;
  hits: number;
  takeaways: number;
  windowSeconds: number;
}

export interface VideoMomentRow {
  eventId: number;
  type: string;
  period: number;
  timeInPeriod: string;
  elapsedSeconds: number;
  teamId: number | null;
  playerId: number | null;
  playerName: string | null;
  estimatedXg: number | null;
  sector: string | null;
  hasReplayMetadata: boolean;
  details: Record<string, unknown>;
}

interface WidgetEnvelope<T> {
  rows?: T[];
  teams?: TeamWidgetRow[];
  players?: BackendPlayer[];
  onIcePlayerIds?: number[];
  source: string;
  note?: string;
}

export interface BackendWidgets {
  timeOnIce: WidgetEnvelope<BackendPlayer>;
  restAndWorkload: WidgetEnvelope<WorkloadRow>;
  faceoffs: WidgetEnvelope<BackendPlayer>;
  headToHeadFaceoffs: WidgetEnvelope<FaceoffMatchupRow>;
  shotsOnGoal: WidgetEnvelope<BackendPlayer>;
  shootingPercentage: WidgetEnvelope<never>;
  shootingBySector: WidgetEnvelope<ShootingSectorRow>;
  powerPlay: WidgetEnvelope<PowerPlayRow>;
  goaltending: WidgetEnvelope<GoalieRow>;
  gamePulse: WidgetEnvelope<GamePulseRow>;
  videoMoments: WidgetEnvelope<VideoMomentRow>;
  lineupAnalyzer: WidgetEnvelope<BackendPlayer>;
}

export interface BackendWidgetResponse {
  game: Record<string, unknown>;
  replay: BackendSimState;
  widgets: BackendWidgets;
}

export type BackendFrameStatus = "bundled" | "loading" | "connected" | "fallback";

const configuredBase = (import.meta.env.VITE_NHL_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "");
export const isNhlBackendConfigured = Boolean(configuredBase);
export const NHL_API_BASE_URL = configuredBase ?? "";

async function request<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${NHL_API_BASE_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`NHL Insights API ${response.status}: ${message || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function useNhlBackendFrame(elapsedSeconds: number) {
  const [sim, setSim] = useState<BackendSimState | null>(null);
  const [widgets, setWidgets] = useState<BackendWidgets | null>(null);
  const [status, setStatus] = useState<BackendFrameStatus>(isNhlBackendConfigured ? "loading" : "bundled");
  const [error, setError] = useState<string | null>(null);
  const cursor = Math.max(0, Math.min(3600, Math.floor(elapsedSeconds)));

  useEffect(() => {
    if (!isNhlBackendConfigured) {
      setStatus("bundled");
      return;
    }

    const controller = new AbortController();
    setStatus(current => current === "connected" ? "connected" : "loading");
    Promise.all([
      request<BackendSimState>(`/api/v1/game4/sim-state?elapsed_seconds=${cursor}`, controller.signal),
      request<BackendWidgetResponse>(`/api/v1/game4/widgets?elapsed_seconds=${cursor}`, controller.signal),
    ]).then(([nextSim, nextWidgets]) => {
      setSim(nextSim);
      setWidgets(nextWidgets.widgets);
      setStatus("connected");
      setError(null);
    }).catch(cause => {
      if (controller.signal.aborted) return;
      setStatus("fallback");
      setError(cause instanceof Error ? cause.message : String(cause));
    });

    return () => controller.abort();
  }, [cursor]);

  return { sim, widgets, status, error, configured: isNhlBackendConfigured } as const;
}
