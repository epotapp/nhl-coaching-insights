import { useEffect, useState } from "react";
import {
  isNhlApiConfigured,
  loadDashboardSnapshot,
  type DashboardSnapshot,
} from "./nhlDataClient";

export type DashboardDataStatus = "bundled" | "loading" | "database" | "fallback";

/**
 * Optional live bridge to the PostgreSQL-backed API.
 *
 * The demonstration remains fully functional from game4Data.ts. A database
 * request is made only when VITE_NHL_API_BASE_URL is configured, which keeps
 * GitHub Pages/static previews quiet and lets a PC-hosted API take over the
 * same timestamp cursor without changing widget code.
 */
export function useNhlDashboardSnapshot(gameId: string, atGameSeconds: number) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [status, setStatus] = useState<DashboardDataStatus>(
    isNhlApiConfigured ? "loading" : "bundled",
  );
  const cursorSecond = Math.max(0, Math.min(3600, Math.floor(atGameSeconds)));

  useEffect(() => {
    if (!isNhlApiConfigured) {
      setSnapshot(null);
      setStatus("bundled");
      return;
    }

    const controller = new AbortController();
    setStatus(current => current === "database" ? "database" : "loading");
    loadDashboardSnapshot(gameId, cursorSecond, controller.signal)
      .then(data => {
        setSnapshot(data);
        setStatus("database");
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        console.warn("NHL PostgreSQL API unavailable; using bundled Game 4 data.", error);
        setSnapshot(null);
        setStatus("fallback");
      });

    return () => controller.abort();
  }, [gameId, cursorSecond]);

  return { snapshot, status } as const;
}
