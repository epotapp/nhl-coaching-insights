import { useEffect, useMemo, useState } from "react";
import {
  CAR_FACEOFFS,
  CAR_PLAYERS,
  CAR_PRIMARY_SHIFTS,
  CAR_SHOTS,
  GAME4_GOALS,
  GAME4_PENALTIES,
  GAME4_TEAM_TOTALS,
  VGK_SHOTS,
  formatClock,
  periodAt,
  periodClockAt,
} from "./game4Data";

export const TOTAL_GAME_SECONDS = 3600;
export const VIDEO_LEN = TOTAL_GAME_SECONDS; // legacy export retained for dependent views
export const toGame = (seconds: number) => Math.min(TOTAL_GAME_SECONDS, Math.max(0, seconds));
export const mmss = formatClock;

export type Pos = "C" | "W" | "D" | "G";
export interface SimPlayer { name: string; num: number; pos: Pos }

export const CAR_ROSTER: SimPlayer[] = [
  { name: "Sebastian Aho", num: 20, pos: "C" },
  { name: "Jackson Blake", num: 53, pos: "W" },
  { name: "Brandon Bussi", num: 32, pos: "G" },
  { name: "William Carrier", num: 28, pos: "W" },
  { name: "Jalen Chatfield", num: 5, pos: "D" },
  { name: "Nikolaj Ehlers", num: 27, pos: "W" },
  { name: "Shayne Gostisbehere", num: 4, pos: "D" },
  { name: "Taylor Hall", num: 71, pos: "W" },
  { name: "Seth Jarvis", num: 24, pos: "W" },
  { name: "Mark Jankowski", num: 77, pos: "C" },
  { name: "Jordan Martinook", num: 48, pos: "W" },
  { name: "K'Andre Miller", num: 19, pos: "D" },
  { name: "Alexander Nikishin", num: 21, pos: "D" },
  { name: "Eric Robinson", num: 50, pos: "W" },
  { name: "Jaccob Slavin", num: 74, pos: "D" },
  { name: "Jordan Staal", num: 11, pos: "C" },
  { name: "Logan Stankoven", num: 22, pos: "C" },
  { name: "Andrei Svechnikov", num: 37, pos: "W" },
  { name: "Sean Walker", num: 26, pos: "D" },
];

export type Strength = "even" | "pp" | "pk" | "four";

const progressCount = (target: number, elapsed: number) =>
  Math.min(target, Math.floor((target * Math.max(0, elapsed)) / TOTAL_GAME_SECONDS));

const FACEOFF_RESULT_PATTERN: Record<number, boolean[]> = Object.fromEntries(
  CAR_FACEOFFS.map(player => {
    const losses = player.fo - player.wins;
    const result: boolean[] = [];
    let w = 0;
    let l = 0;
    for (let i = 0; i < player.fo; i += 1) {
      const wantWin = w < player.wins && (l >= losses || (w + 1) / player.wins <= (l + 1) / Math.max(1, losses));
      if (wantWin) { result.push(true); w += 1; }
      else { result.push(false); l += 1; }
    }
    return [player.num, result];
  }),
);

export function scoreAt(elapsed: number): { car: number; vgk: number; last?: string } {
  let car = 0;
  let vgk = 0;
  let last: string | undefined;
  for (const event of GAME4_GOALS) {
    if (event.elapsed > elapsed) break;
    if (event.team === "CAR") car += 1;
    else vgk += 1;
    last = event.player;
  }
  return { car, vgk, last };
}

export function strengthAt(elapsed: number): { strength: Strength; label: string; ice: string } {
  const windows = [
    { from: 84, to: 204, strength: "pp" as const, label: "5v4 CAR Power Play", ice: "Theodore — tripping" },
    { from: 747, to: 768, strength: "pp" as const, label: "5v4 CAR Power Play", ice: "VGK bench minor" },
    { from: 1052, to: 1172, strength: "pk" as const, label: "4v5 CAR Penalty Kill", ice: "Hall — slashing" },
    { from: 1890, to: 2010, strength: "pp" as const, label: "5v4 CAR Power Play", ice: "Dowd — cross-checking" },
    { from: 2060, to: 2180, strength: "pk" as const, label: "4v5 CAR Penalty Kill", ice: "Martinook — interference" },
    { from: 2310, to: 2430, strength: "four" as const, label: "4v4 Even Strength", ice: "Blake / McNabb offsetting minors" },
    { from: 2502, to: 2622, strength: "pk" as const, label: "4v5 CAR Penalty Kill", ice: "Miller — tripping" },
  ];
  const active = windows.find(window => elapsed >= window.from && elapsed < window.to);
  return active ?? { strength: "even", label: "5v5 Even Strength", ice: "Even Strength" };
}

export function foHistoryAt(elapsed: number): Record<number, boolean[]> {
  const out: Record<number, boolean[]> = {};
  for (const player of CAR_FACEOFFS) {
    const completed = progressCount(player.fo, elapsed);
    out[player.num] = FACEOFF_RESULT_PATTERN[player.num].slice(0, completed);
  }
  return out;
}

export function playerSogAt(elapsed: number): Record<number, number> {
  const out: Record<number, number> = {};
  for (const event of CAR_SHOTS) {
    if (event.elapsed > elapsed) break;
    if (event.playerNum) out[event.playerNum] = (out[event.playerNum] ?? 0) + 1;
  }
  return out;
}

export function teamStatsAt(elapsed: number) {
  const sogCar = CAR_SHOTS.filter(event => event.elapsed <= elapsed).length;
  const sogVgk = VGK_SHOTS.filter(event => event.elapsed <= elapsed).length;
  const pimCar = GAME4_PENALTIES.filter(event => event.team === "CAR" && event.elapsed <= elapsed).length * 2;
  const pimVgk = GAME4_PENALTIES.filter(event => event.team === "VGK" && event.elapsed <= elapsed).length * 2;
  const foHistory = foHistoryAt(elapsed);
  const fo: Record<number, { w: number; l: number }> = {};
  for (const [num, history] of Object.entries(foHistory)) {
    fo[Number(num)] = { w: history.filter(Boolean).length, l: history.filter(value => !value).length };
  }
  const foW = Object.values(fo).reduce((sum, item) => sum + item.w, 0);
  const foL = Object.values(fo).reduce((sum, item) => sum + item.l, 0);
  const foCarPct = foW + foL ? Math.round((foW / (foW + foL)) * 100) : 50;

  return {
    sogCar,
    sogVgk,
    hitCar: progressCount(GAME4_TEAM_TOTALS.CAR.hits, elapsed),
    hitVgk: progressCount(GAME4_TEAM_TOTALS.VGK.hits, elapsed),
    blockCar: progressCount(GAME4_TEAM_TOTALS.CAR.blocks, elapsed),
    blockVgk: progressCount(GAME4_TEAM_TOTALS.VGK.blocks, elapsed),
    giveCar: progressCount(GAME4_TEAM_TOTALS.CAR.giveaways, elapsed),
    giveVgk: progressCount(GAME4_TEAM_TOTALS.VGK.giveaways, elapsed),
    takeCar: progressCount(GAME4_TEAM_TOTALS.CAR.takeaways, elapsed),
    takeVgk: progressCount(GAME4_TEAM_TOTALS.VGK.takeaways, elapsed),
    pimCar,
    pimVgk,
    fo,
    foW,
    foL,
    foCarPct,
  };
}

function shiftToiAt(shifts: readonly (readonly [number, number])[], elapsed: number): number {
  let total = 0;
  for (const [start, end] of shifts) {
    if (elapsed <= start) break;
    total += Math.max(0, Math.min(elapsed, end) - start);
  }
  return Math.floor(total);
}

function onIceAt(elapsed: number): Set<number> {
  if (elapsed >= TOTAL_GAME_SECONDS) return new Set();
  const out = new Set<number>([32]);
  for (const [playerNum, shifts] of Object.entries(CAR_PRIMARY_SHIFTS)) {
    if (shifts.some(([start, end]) => elapsed >= start && elapsed < end)) out.add(Number(playerNum));
  }
  return out;
}

function toiAt(elapsed: number): Record<number, number> {
  const out: Record<number, number> = { 32: Math.floor(elapsed) };
  for (const player of CAR_PLAYERS) {
    const shifts = CAR_PRIMARY_SHIFTS[player.num];
    out[player.num] = shifts
      ? shiftToiAt(shifts, elapsed)
      : Math.min(player.toi, Math.floor((player.toi * elapsed) / TOTAL_GAME_SECONDS));
  }
  return out;
}

export const INSIGHTS = [
  { at: 66, title: "Stankoven opens the scoring", sub: "Chatfield's point play turns into a net-front finish." },
  { at: 208, title: "Second line creates a 2–0 lead", sub: "Blake converts after Hall and Ehlers extend the possession." },
  { at: 442, title: "Neutral-zone gap exposed", sub: "Stone cuts the lead to one off the transition rush." },
  { at: 768, title: "Power-play net-front execution", sub: "Staal redirects Gostisbehere's point shot for Carolina's third." },
  { at: 1462, title: "Vegas closes within one", sub: "Karlsson finishes a controlled entry sequence at 15:38 remaining." },
  { at: 2228, title: "Game tied late in the second", sub: "Howden's goal makes the next five minutes a matchup priority." },
  { at: 2792, title: "Staal restores the lead", sub: "Ehlers creates the entry; Staal scores his second of the game." },
  { at: 3545, title: "Empty-net seal", sub: "Ehlers completes the 5–3 Game 4 result." },
] as const;

export type SimMode = "idle" | "running" | "paused" | "ended";

export interface GameSim {
  mode: SimMode;
  elapsed: number;
  period: 1 | 2 | 3;
  clock: string;
  periodLabel: string;
  score: { car: number; vgk: number; last?: string };
  strength: string;
  iceStatus: string;
  reviewing: boolean;
  team: ReturnType<typeof teamStatsAt>;
  toi: Record<number, number>;
  playerSog: Record<number, number>;
  foHistory: Record<number, boolean[]>;
  onIce: Set<number>;
  insights: { title: string; sub: string; time: string; period: number }[];
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  reset: () => void;
  skip: (seconds: number) => void;
}

export function useGameSim(): GameSim {
  const [mode, setMode] = useState<SimMode>("idle");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (mode !== "running") return;
    const id = window.setInterval(() => {
      setElapsed(previous => Math.min(TOTAL_GAME_SECONDS, previous + 0.25));
    }, 250);
    return () => window.clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (mode === "running" && elapsed >= TOTAL_GAME_SECONDS) setMode("ended");
  }, [elapsed, mode]);

  const period = periodAt(elapsed);
  const score = useMemo(() => scoreAt(elapsed), [elapsed]);
  const team = useMemo(() => teamStatsAt(elapsed), [elapsed]);
  const foHistory = useMemo(() => foHistoryAt(elapsed), [elapsed]);
  const playerSog = useMemo(() => playerSogAt(elapsed), [elapsed]);
  const toi = useMemo(() => toiAt(elapsed), [elapsed]);
  const onIce = useMemo(() => onIceAt(elapsed), [elapsed]);
  const state = strengthAt(elapsed);

  const insights = INSIGHTS
    .filter(item => item.at <= elapsed)
    .map(item => {
      const itemPeriod = periodAt(item.at);
      return {
        title: item.title,
        sub: item.sub,
        period: itemPeriod,
        time: periodClockAt(item.at),
      };
    })
    .reverse();

  const skip = (seconds: number) => {
    setElapsed(previous => Math.min(TOTAL_GAME_SECONDS, Math.max(0, previous + seconds)));
  };

  return {
    mode,
    elapsed,
    period,
    clock: periodClockAt(elapsed),
    periodLabel: `${period}${period === 1 ? "st" : period === 2 ? "nd" : "rd"} Period`,
    score,
    strength: state.label,
    iceStatus: mode === "ended" ? "Final" : state.ice,
    reviewing: false,
    team,
    toi,
    playerSog,
    foHistory,
    onIce,
    insights,
    start: () => setMode("running"),
    pause: () => setMode("paused"),
    resume: () => setMode("running"),
    restart: () => { setElapsed(0); setMode("running"); },
    reset: () => { setElapsed(0); setMode("idle"); },
    skip,
  };
}
