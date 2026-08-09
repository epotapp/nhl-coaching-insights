import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameSim, type GameSim, type SimMode } from "../gameSim";
import {
  fetchGame4SimState,
  isNhlFastApiConfigured,
  type NhlGame4SimState,
  type NhlLastEvent,
} from "./nhlApi";

export interface NhlGame4Sim extends GameSim {
  configured: boolean;
  loading: boolean;
  error: string | null;
  dataStatus: "bundled" | "synced" | "seed-only";
}

function numberRecord(source: Record<string, number>): Record<number, number> {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [Number(key), value]));
}

function eventInsight(event: NhlLastEvent | null): GameSim["insights"] {
  if (!event?.type) return [];
  const title = event.type
    .split("-")
    .filter(Boolean)
    .map(word => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
  const detail = Object.entries(event.details ?? {})
    .find(([, value]) => typeof value === "string" && value.length > 0)?.[1];

  return [{
    title,
    sub: typeof detail === "string" ? detail : "Latest official NHL play-by-play event",
    time: event.timeInPeriod ?? "00:00",
    period: event.period ?? 1,
  }];
}

function mapState(payload: NhlGame4SimState, fallback: GameSim): Omit<NhlGame4Sim, keyof Pick<GameSim, "start" | "pause" | "resume" | "restart" | "reset" | "skip"> | "configured" | "loading" | "error"> {
  const fo = Object.fromEntries(
    Object.entries(payload.team.fo).map(([key, value]) => [Number(key), { w: value.wins, l: value.losses }]),
  );
  const foW = Object.values(fo).reduce((sum, item) => sum + item.w, 0);
  const foL = Object.values(fo).reduce((sum, item) => sum + item.l, 0);

  return {
    mode: payload.mode === "finished" ? "ended" : "running",
    elapsed: payload.elapsedSeconds,
    period: Math.min(3, Math.max(1, payload.period)) as 1 | 2 | 3,
    clock: payload.clock,
    periodLabel: payload.periodLabel,
    score: payload.score,
    strength: payload.strength,
    iceStatus: payload.iceStatus,
    reviewing: payload.reviewing,
    team: {
      sogCar: payload.team.sogCar,
      sogVgk: payload.team.sogVgk,
      hitCar: payload.team.hitCar,
      hitVgk: payload.team.hitVgk,
      blockCar: payload.team.blkCar,
      blockVgk: payload.team.blkVgk,
      giveCar: payload.team.gvCar,
      giveVgk: payload.team.gvVgk,
      takeCar: payload.team.tkCar,
      takeVgk: payload.team.tkVgk,
      pimCar: payload.team.pimCar,
      pimVgk: payload.team.pimVgk,
      fo,
      foW,
      foL,
      foCarPct: foW + foL ? Math.round((foW / (foW + foL)) * 100) : 50,
    },
    toi: numberRecord(payload.toi),
    playerSog: numberRecord(payload.playerSog),
    foHistory: Object.fromEntries(
      Object.entries(payload.foHistory).map(([key, values]) => [
        Number(key),
        values.map(value => value === true || String(value).toUpperCase() === "W"),
      ]),
    ),
    onIce: new Set(
      payload.players
        .filter(player => player.onIce && player.sweaterNumber !== null)
        .map(player => player.sweaterNumber as number),
    ),
    insights: eventInsight(payload.lastEvent),
    dataStatus: payload.dataStatus,
  };
}

export function useNhlGame4(): NhlGame4Sim {
  const fallback = useGameSim();
  const [mode, setMode] = useState<SimMode>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [payload, setPayload] = useState<NhlGame4SimState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elapsedRef = useRef(0);
  const maxElapsedRef = useRef(3600);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async (requestedElapsed: number) => {
    setLoading(true);
    try {
      const next = await fetchGame4SimState(requestedElapsed);
      if (!mountedRef.current) return null;
      maxElapsedRef.current = next.maxElapsedSeconds;
      if (Math.floor(elapsedRef.current) === Math.floor(requestedElapsed)) {
        setPayload(next);
        setError(null);
        if (next.mode === "finished") setMode("ended");
      }
      return next;
    } catch (reason) {
      if (!mountedRef.current) return null;
      setError(reason instanceof Error ? reason.message : "NHL API request failed");
      setMode(current => current === "idle" ? current : "paused");
      return null;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isNhlFastApiConfigured || mode !== "running") return;
    let cancelled = false;
    let timer: number | undefined;

    const cycle = async () => {
      const requested = Math.floor(elapsedRef.current);
      const next = await load(requested);
      if (cancelled || !next || next.mode === "finished") return;
      timer = window.setTimeout(() => {
        const advanced = Math.min(maxElapsedRef.current, elapsedRef.current + 1);
        elapsedRef.current = advanced;
        setElapsed(advanced);
        void cycle();
      }, 1000);
    };

    void cycle();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [load, mode]);

  const start = useCallback(() => {
    elapsedRef.current = 0;
    setElapsed(0);
    setPayload(null);
    setError(null);
    setMode("running");
  }, []);
  const pause = useCallback(() => setMode("paused"), []);
  const resume = useCallback(() => setMode(current => current === "ended" ? current : "running"), []);
  const restart = useCallback(() => {
    elapsedRef.current = 0;
    setElapsed(0);
    setPayload(null);
    setError(null);
    setMode("running");
    void load(0);
  }, [load]);
  const reset = useCallback(() => {
    elapsedRef.current = 0;
    setElapsed(0);
    setPayload(null);
    setError(null);
    setMode("idle");
  }, []);
  const skip = useCallback((seconds: number) => {
    const next = Math.min(maxElapsedRef.current, Math.max(0, elapsedRef.current + seconds));
    elapsedRef.current = next;
    setElapsed(next);
    void load(next);
  }, [load]);

  const apiState = useMemo(() => payload ? mapState(payload, fallback) : null, [fallback, payload]);

  if (!isNhlFastApiConfigured) {
    return {
      ...fallback,
      configured: false,
      loading: false,
      error: null,
      dataStatus: "bundled",
    };
  }

  return {
    ...(apiState ?? fallback),
    mode,
    elapsed,
    start,
    pause,
    resume,
    restart,
    reset,
    skip,
    configured: true,
    loading,
    error,
    dataStatus: apiState?.dataStatus ?? "seed-only",
  };
}
