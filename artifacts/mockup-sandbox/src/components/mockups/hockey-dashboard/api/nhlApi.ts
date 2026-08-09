const configuredBaseUrl = (import.meta.env.VITE_NHL_FASTAPI_BASE_URL as string | undefined)?.trim();

export const NHL_FASTAPI_BASE_URL = configuredBaseUrl?.replace(/\/+$/, "") ?? "";
export const isNhlFastApiConfigured = NHL_FASTAPI_BASE_URL.length > 0;

export interface NhlFaceoffLine {
  wins: number;
  losses: number;
  attempts: number;
  pct: number;
}

export interface NhlReplayPlayer {
  sweaterNumber: number | null;
  onIce: boolean;
}

export interface NhlLastEvent {
  type?: string;
  period?: number;
  timeInPeriod?: string;
  elapsedSeconds?: number;
  details?: Record<string, unknown>;
}

export interface NhlGame4SimState {
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
  rest: Record<string, number>;
  foHistory: Record<string, Array<boolean | string>>;
  playerSog: Record<string, number>;
  team: {
    fo: Record<string, NhlFaceoffLine>;
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
  players: NhlReplayPlayer[];
  lastEvent: NhlLastEvent | null;
  dataStatus: "synced" | "seed-only";
}

export async function fetchGame4SimState(
  elapsedSeconds: number,
  signal?: AbortSignal,
): Promise<NhlGame4SimState> {
  if (!isNhlFastApiConfigured) {
    throw new Error("VITE_NHL_FASTAPI_BASE_URL is not configured");
  }

  const elapsed = Math.max(0, Math.floor(elapsedSeconds));
  const response = await fetch(
    `${NHL_FASTAPI_BASE_URL}/api/v1/game4/sim-state?elapsed_seconds=${elapsed}`,
    { headers: { Accept: "application/json" }, signal },
  );

  if (!response.ok) {
    throw new Error(`NHL API request failed (${response.status})`);
  }

  return response.json() as Promise<NhlGame4SimState>;
}
