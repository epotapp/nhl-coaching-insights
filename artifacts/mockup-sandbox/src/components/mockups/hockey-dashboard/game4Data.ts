/**
 * Carolina Hurricanes vs Vegas Golden Knights — Stanley Cup Final, Game 4
 * June 9, 2026 · Carolina 5, Vegas 3 · NHL game id 2025030414.
 *
 * Goal, penalty, team-total, player-total and Carolina shot timestamps below
 * are transcribed from the official NHL Game Summary, Event Summary and
 * Play-by-Play reports. Vegas shot timestamps use the official PBP where
 * identified and preserve the official per-period and per-player totals.
 */

export type TeamCode = "CAR" | "VGK";
export type EventKind = "goal" | "shot" | "penalty";

export interface GameEvent {
  elapsed: number; // elapsed game seconds, 0..3600
  period: 1 | 2 | 3;
  periodTime: string; // elapsed time in the period
  clock: string; // time remaining in the period
  team: TeamCode;
  kind: EventKind;
  player?: string;
  playerNum?: number;
  detail: string;
  strength?: "EV" | "PP" | "EN" | "4v4";
}

const global = (period: 1 | 2 | 3, elapsedInPeriod: number) => (period - 1) * 1200 + elapsedInPeriod;
const shot = (
  period: 1 | 2 | 3,
  t: number,
  team: TeamCode,
  player: string,
  playerNum: number,
  detail = "Shot on goal",
): GameEvent => ({
  elapsed: global(period, t), period, periodTime: formatClock(t), clock: formatClock(1200 - t),
  team, kind: "shot", player, playerNum, detail,
});

export const GAME4_META = {
  gameId: "2025030414",
  date: "June 9, 2026",
  venue: "T-Mobile Arena",
  away: { code: "CAR" as const, name: "Carolina Hurricanes", score: 5 },
  home: { code: "VGK" as const, name: "Vegas Golden Knights", score: 3 },
};

export const GAME4_GOALS: GameEvent[] = [
  { elapsed: global(1, 66),   period: 1, periodTime: "01:06", clock: "18:54", team: "CAR", kind: "goal", player: "Logan Stankoven", playerNum: 22, strength: "EV", detail: "Stankoven from Chatfield and Blake" },
  { elapsed: global(1, 208),  period: 1, periodTime: "03:28", clock: "16:32", team: "CAR", kind: "goal", player: "Jackson Blake", playerNum: 53, strength: "EV", detail: "Blake from Hall and Ehlers" },
  { elapsed: global(1, 442),  period: 1, periodTime: "07:22", clock: "12:38", team: "VGK", kind: "goal", player: "Mark Stone", playerNum: 61, strength: "EV", detail: "Stone from Theodore and McNabb" },
  { elapsed: global(1, 768),  period: 1, periodTime: "12:48", clock: "07:12", team: "CAR", kind: "goal", player: "Jordan Staal", playerNum: 11, strength: "PP", detail: "Staal power-play goal from Gostisbehere and Aho" },
  { elapsed: global(2, 262),  period: 2, periodTime: "04:22", clock: "15:38", team: "VGK", kind: "goal", player: "William Karlsson", playerNum: 71, strength: "EV", detail: "Karlsson from Andersson and Marner" },
  { elapsed: global(2, 1028), period: 2, periodTime: "17:08", clock: "02:52", team: "VGK", kind: "goal", player: "Brett Howden", playerNum: 21, strength: "EV", detail: "Howden from Sissons and Karlsson" },
  { elapsed: global(3, 392),  period: 3, periodTime: "06:32", clock: "13:28", team: "CAR", kind: "goal", player: "Jordan Staal", playerNum: 11, strength: "EV", detail: "Staal from Ehlers" },
  { elapsed: global(3, 1145), period: 3, periodTime: "19:05", clock: "00:55", team: "CAR", kind: "goal", player: "Nikolaj Ehlers", playerNum: 27, strength: "EN", detail: "Ehlers empty-net goal" },
];

export const GAME4_PENALTIES: GameEvent[] = [
  { elapsed: global(1, 84), period: 1, periodTime: "01:24", clock: "18:36", team: "VGK", kind: "penalty", player: "Shea Theodore", playerNum: 27, detail: "Tripping — 2 min" },
  { elapsed: global(1, 747), period: 1, periodTime: "12:27", clock: "07:33", team: "VGK", kind: "penalty", detail: "Bench minor — too many men — 2 min" },
  { elapsed: global(1, 1052), period: 1, periodTime: "17:32", clock: "02:28", team: "CAR", kind: "penalty", player: "Taylor Hall", playerNum: 71, detail: "Slashing — 2 min" },
  { elapsed: global(2, 690), period: 2, periodTime: "11:30", clock: "08:30", team: "VGK", kind: "penalty", player: "Nic Dowd", playerNum: 26, detail: "Cross-checking — 2 min" },
  { elapsed: global(2, 860), period: 2, periodTime: "14:20", clock: "05:40", team: "CAR", kind: "penalty", player: "Jordan Martinook", playerNum: 48, detail: "Interference — 2 min" },
  { elapsed: global(2, 1110), period: 2, periodTime: "18:30", clock: "01:30", team: "CAR", kind: "penalty", player: "Jackson Blake", playerNum: 53, detail: "Goalkeeper interference — 2 min" },
  { elapsed: global(2, 1110), period: 2, periodTime: "18:30", clock: "01:30", team: "VGK", kind: "penalty", player: "Brayden McNabb", playerNum: 3, detail: "Cross-checking — 2 min" },
  { elapsed: global(3, 102), period: 3, periodTime: "01:42", clock: "18:18", team: "CAR", kind: "penalty", player: "K'Andre Miller", playerNum: 19, detail: "Tripping — 2 min" },
];

// Complete Carolina SOG timeline: 14 / 9 / 5 = 28.
export const CAR_SHOTS: GameEvent[] = [
  shot(1, 42, "CAR", "Sebastian Aho", 20),
  shot(1, 66, "CAR", "Logan Stankoven", 22, "Goal"),
  shot(1, 158, "CAR", "Sebastian Aho", 20),
  shot(1, 199, "CAR", "Nikolaj Ehlers", 27),
  shot(1, 208, "CAR", "Jackson Blake", 53, "Goal"),
  shot(1, 354, "CAR", "Logan Stankoven", 22),
  shot(1, 423, "CAR", "Jalen Chatfield", 5),
  shot(1, 425, "CAR", "Jordan Staal", 11),
  shot(1, 599, "CAR", "Seth Jarvis", 24),
  shot(1, 603, "CAR", "Jaccob Slavin", 74),
  shot(1, 768, "CAR", "Jordan Staal", 11, "Power-play goal"),
  shot(1, 792, "CAR", "Taylor Hall", 71),
  shot(1, 803, "CAR", "Logan Stankoven", 22),
  shot(1, 1178, "CAR", "Taylor Hall", 71),
  shot(2, 92, "CAR", "Jackson Blake", 53),
  shot(2, 191, "CAR", "Nikolaj Ehlers", 27),
  shot(2, 485, "CAR", "K'Andre Miller", 19),
  shot(2, 554, "CAR", "Jordan Martinook", 48),
  shot(2, 609, "CAR", "Sean Walker", 26),
  shot(2, 628, "CAR", "Jordan Staal", 11),
  shot(2, 735, "CAR", "Shayne Gostisbehere", 4),
  shot(2, 1106, "CAR", "Jackson Blake", 53),
  shot(2, 1192, "CAR", "Jaccob Slavin", 74),
  shot(3, 352, "CAR", "Sebastian Aho", 20),
  shot(3, 384, "CAR", "Seth Jarvis", 24),
  shot(3, 392, "CAR", "Jordan Staal", 11, "Goal"),
  shot(3, 672, "CAR", "Taylor Hall", 71),
  shot(3, 1145, "CAR", "Nikolaj Ehlers", 27, "Empty-net goal"),
];

// Vegas timeline preserves the official 6 / 6 / 9 period totals and player totals.
export const VGK_SHOTS: GameEvent[] = [
  shot(1, 133, "VGK", "Mark Stone", 61),
  shot(1, 442, "VGK", "Mark Stone", 61, "Goal"),
  shot(1, 702, "VGK", "Tomas Hertl", 48),
  shot(1, 895, "VGK", "Jack Eichel", 9),
  shot(1, 980, "VGK", "Tomas Hertl", 48),
  shot(1, 1162, "VGK", "Ivan Barbashev", 49),
  shot(2, 262, "VGK", "William Karlsson", 71, "Goal"),
  shot(2, 830, "VGK", "Jack Eichel", 9),
  shot(2, 903, "VGK", "Jack Eichel", 9),
  shot(2, 943, "VGK", "Mark Stone", 61),
  shot(2, 1028, "VGK", "Brett Howden", 21, "Goal"),
  shot(2, 1152, "VGK", "Rasmus Andersson", 4),
  shot(3, 67, "VGK", "Mark Stone", 61),
  shot(3, 95, "VGK", "Pavel Dorofeyev", 16),
  shot(3, 97, "VGK", "Colton Sissons", 10),
  shot(3, 157, "VGK", "Mark Stone", 61),
  shot(3, 436, "VGK", "Noah Hanifin", 15),
  shot(3, 573, "VGK", "Colton Sissons", 10),
  shot(3, 890, "VGK", "Pavel Dorofeyev", 16),
  shot(3, 1029, "VGK", "Shea Theodore", 27),
  shot(3, 1147, "VGK", "Shea Theodore", 27),
];

export const GAME4_TEAM_TOTALS = {
  CAR: { goals: 5, shots: 28, hits: 34, blocks: 16, giveaways: 15, takeaways: 7, pim: 8, faceoffWins: 29, faceoffs: 51, ppGoals: 1, ppOpps: 3 },
  VGK: { goals: 3, shots: 21, hits: 38, blocks: 12, giveaways: 23, takeaways: 3, pim: 8, faceoffWins: 22, faceoffs: 51, ppGoals: 0, ppOpps: 3 },
};

export interface PlayerGame4 {
  name: string;
  short: string;
  num: number;
  pos: "C" | "W" | "D" | "G";
  face: number;
  toi: number;
  shifts: number;
  sog: number;
  goals: number;
  assists: number;
  pim: number;
  foW?: number;
  foL?: number;
  saves?: number;
  shotsAgainst?: number;
}

/**
 * Official Game 4 Carolina player totals from NHL Event Summary ES030414.
 * Names, sweater numbers and numerical values below are bound to the official
 * report. Portraits are resolved separately by sweater number through the NHL
 * roster headshot mapping, preventing reordered lists from mismatching faces.
 */
export const CAR_PLAYERS: PlayerGame4[] = [
  { name: "Sebastian Aho", short: "S. Aho", num: 20, pos: "C", face: 1, toi: 1094, shifts: 24, sog: 3, goals: 0, assists: 1, pim: 0, foW: 5, foL: 8 },
  { name: "Jordan Staal", short: "J. Staal", num: 11, pos: "C", face: 5, toi: 994, shifts: 25, sog: 4, goals: 2, assists: 0, pim: 0, foW: 12, foL: 4 },
  { name: "Logan Stankoven", short: "L. Stankoven", num: 22, pos: "C", face: 2, toi: 1014, shifts: 24, sog: 3, goals: 1, assists: 0, pim: 0, foW: 3, foL: 6 },
  { name: "Nikolaj Ehlers", short: "N. Ehlers", num: 27, pos: "W", face: 6, toi: 1149, shifts: 22, sog: 3, goals: 1, assists: 2, pim: 0, foW: 2, foL: 0 },
  { name: "Seth Jarvis", short: "S. Jarvis", num: 24, pos: "W", face: 3, toi: 1110, shifts: 24, sog: 2, goals: 0, assists: 0, pim: 0, foW: 0, foL: 2 },
  { name: "Jaccob Slavin", short: "J. Slavin", num: 74, pos: "D", face: 4, toi: 1481, shifts: 32, sog: 2, goals: 0, assists: 0, pim: 0 },
  { name: "Shayne Gostisbehere", short: "S. Gostisbehere", num: 4, pos: "D", face: 7, toi: 782, shifts: 18, sog: 1, goals: 0, assists: 1, pim: 0 },
  { name: "Jalen Chatfield", short: "J. Chatfield", num: 5, pos: "D", face: 4, toi: 1371, shifts: 29, sog: 1, goals: 0, assists: 1, pim: 0 },
  { name: "K'Andre Miller", short: "K. Miller", num: 19, pos: "D", face: 7, toi: 1365, shifts: 32, sog: 1, goals: 0, assists: 0, pim: 2 },
  { name: "Alexander Nikishin", short: "A. Nikishin", num: 21, pos: "D", face: 2, toi: 613, shifts: 15, sog: 0, goals: 0, assists: 0, pim: 0 },
  { name: "Sean Walker", short: "S. Walker", num: 26, pos: "D", face: 5, toi: 1337, shifts: 32, sog: 1, goals: 0, assists: 0, pim: 0 },
  { name: "William Carrier", short: "W. Carrier", num: 28, pos: "W", face: 4, toi: 503, shifts: 14, sog: 0, goals: 0, assists: 0, pim: 0, foW: 1, foL: 0 },
  { name: "Andrei Svechnikov", short: "A. Svechnikov", num: 37, pos: "W", face: 2, toi: 776, shifts: 19, sog: 0, goals: 0, assists: 0, pim: 0 },
  { name: "Jordan Martinook", short: "J. Martinook", num: 48, pos: "W", face: 3, toi: 828, shifts: 19, sog: 1, goals: 0, assists: 0, pim: 2 },
  { name: "Eric Robinson", short: "E. Robinson", num: 50, pos: "W", face: 6, toi: 618, shifts: 14, sog: 0, goals: 0, assists: 0, pim: 0 },
  { name: "Jackson Blake", short: "J. Blake", num: 53, pos: "W", face: 7, toi: 914, shifts: 24, sog: 3, goals: 1, assists: 1, pim: 2 },
  { name: "Taylor Hall", short: "T. Hall", num: 71, pos: "W", face: 6, toi: 993, shifts: 25, sog: 3, goals: 0, assists: 1, pim: 2, foW: 1, foL: 0 },
  { name: "Mark Jankowski", short: "M. Jankowski", num: 77, pos: "C", face: 7, toi: 578, shifts: 14, sog: 0, goals: 0, assists: 0, pim: 0, foW: 5, foL: 2 },
  { name: "Brandon Bussi", short: "B. Bussi", num: 32, pos: "G", face: 1, toi: 3600, shifts: 1, sog: 0, goals: 0, assists: 0, pim: 0, saves: 18, shotsAgainst: 21 },
];


/** Official Carolina player headshots keyed by sweater number.
 * URLs are returned by the NHL roster API for the 2026-27 Hurricanes roster.
 * Keeping the mapping by jersey number prevents a portrait from being attached
 * to the wrong player when lists are sorted or filtered.
 */
export const CAR_HEADSHOTS: Readonly<Record<number, string>> = {
  20: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8478427.png",
  53: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8482809.png",
  28: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8477478.png",
  27: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8477940.png",
  71: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8475791.png",
  77: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8476873.png",
  24: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8482093.png",
  48: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8476921.png",
  50: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8480762.png",
  11: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8473533.png",
  22: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8482702.png",
  37: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8480830.png",
  5: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8478970.png",
  4: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8476906.png",
  19: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8480817.png",
  21: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8482100.png",
  74: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8476958.png",
  26: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8480336.png",
  32: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8483548.png",
};

export function playerHeadshot(player: Pick<PlayerGame4, "num" | "face">): string {
  return CAR_HEADSHOTS[player.num] ?? `/images/hockey-dashboard/face${player.face}.png`;
}

export const CAR_PRIMARY_PLAYER_NUMBERS = [20, 11, 22, 27, 24, 74] as const;

export type ShiftInterval = readonly [start: number, end: number];

/**
 * Exact elapsed-game shift intervals for the six players shown in the live TOI
 * widget. These are transcribed from the official NHL Away Team Time On Ice
 * report. Keeping the raw intervals lets the demo recompute TOI and on-ice
 * state immediately after a 30-second or five-minute jump.
 */
export const CAR_PRIMARY_SHIFTS: Readonly<Record<number, readonly ShiftInterval[]>> = {
  20: [
    [36, 60], [84, 167], [262, 300], [436, 478], [675, 704], [747, 768], [841, 898], [1090, 1132],
    [1238, 1277], [1393, 1446], [1593, 1633], [1725, 1789], [1890, 1949], [2147, 2216], [2310, 2354],
    [2400, 2431], [2567, 2631], [2706, 2754], [2895, 2937], [3094, 3130], [3134, 3180], [3291, 3334], [3369, 3409], [3545, 3585],
  ],
  11: [
    [0, 36], [84, 97], [208, 253], [390, 436], [567, 613], [704, 735], [747, 768], [941, 983], [1052, 1090],
    [1200, 1238], [1379, 1393], [1549, 1593], [1789, 1848], [1890, 1897], [2032, 2147], [2354, 2378],
    [2483, 2566], [2754, 2792], [2935, 2994], [3130, 3134], [3180, 3214], [3238, 3271], [3344, 3369], [3461, 3545], [3585, 3600],
  ],
  22: [
    [60, 84], [167, 208], [253, 262], [300, 359], [478, 520], [613, 674], [735, 747], [768, 810], [983, 1052], [1179, 1200],
    [1281, 1331], [1446, 1510], [1633, 1685], [1848, 1890], [1951, 2025], [2216, 2238], [2281, 2310],
    [2431, 2483], [2665, 2706], [2833, 2895], [3026, 3094], [3271, 3291], [3334, 3344], [3411, 3459],
  ],
  27: [
    [0, 31], [97, 208], [391, 442], [550, 614], [704, 735], [884, 919], [970, 998],
    [1200, 1279], [1362, 1393], [1550, 1588], [1783, 1830], [1897, 2032], [2354, 2400],
    [2400, 2434], [2490, 2502], [2751, 2792], [2937, 2991], [3122, 3223], [3238, 3275], [3344, 3386], [3459, 3545], [3585, 3600],
  ],
  24: [
    [0, 34], [84, 164], [406, 442], [569, 611], [704, 740], [747, 768], [973, 1000], [1092, 1132],
    [1200, 1244], [1378, 1393], [1531, 1618], [1787, 1831], [1890, 1951], [2149, 2228], [2310, 2354],
    [2467, 2502], [2567, 2631], [2753, 2792], [2938, 2998], [3159, 3213], [3238, 3270], [3344, 3376], [3456, 3545], [3585, 3600],
  ],
  74: [
    [41, 84], [253, 297], [403, 442], [475, 505], [569, 622], [704, 736], [821, 891], [1000, 1036], [1092, 1132], [1176, 1200],
    [1239, 1283], [1393, 1426], [1462, 1511], [1607, 1681], [1688, 1700], [1742, 1801], [1849, 1890], [2060, 2150], [2228, 2238], [2280, 2354], [2381, 2400],
    [2433, 2475], [2502, 2567], [2631, 2657], [2752, 2792], [2833, 2898], [2992, 3039], [3071, 3109], [3180, 3213], [3273, 3337], [3370, 3411], [3441, 3545],
  ],
} as const;

export const VGK_FACEOFFS = [
  { name: "J. Eichel", num: 9, hand: "R", fo: 11, wins: 5 },
  { name: "C. Sissons", num: 10, hand: "R", fo: 6, wins: 3 },
  { name: "B. Howden", num: 21, hand: "L", fo: 1, wins: 1 },
  { name: "N. Dowd", num: 26, hand: "R", fo: 8, wins: 4 },
  { name: "T. Hertl", num: 48, hand: "L", fo: 9, wins: 5 },
  { name: "K. Kolesar", num: 55, hand: "R", fo: 2, wins: 0 },
  { name: "M. Stone", num: 61, hand: "R", fo: 1, wins: 0 },
  { name: "W. Karlsson", num: 71, hand: "L", fo: 12, wins: 4 },
  { name: "M. Marner", num: 93, hand: "R", fo: 1, wins: 0 },
];

export const CAR_FACEOFFS = [
  { name: "S. Jarvis", num: 24, hand: "R", fo: 2, wins: 0 },
  { name: "M. Jankowski", num: 77, hand: "L", fo: 7, wins: 5 },
  { name: "J. Staal", num: 11, hand: "L", fo: 16, wins: 12 },
  { name: "S. Aho", num: 20, hand: "L", fo: 13, wins: 5 },
  { name: "L. Stankoven", num: 22, hand: "R", fo: 9, wins: 3 },
  { name: "N. Ehlers", num: 27, hand: "L", fo: 2, wins: 2 },
  { name: "W. Carrier", num: 28, hand: "L", fo: 1, wins: 1 },
  { name: "T. Hall", num: 71, hand: "L", fo: 1, wins: 1 },
];

export const GAME4_EVENTS = [...GAME4_GOALS, ...GAME4_PENALTIES, ...CAR_SHOTS, ...VGK_SHOTS]
  .sort((a, b) => a.elapsed - b.elapsed || (a.kind === "goal" ? -1 : 1));

export function formatClock(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function periodAt(elapsed: number): 1 | 2 | 3 {
  if (elapsed >= 2400) return 3;
  if (elapsed >= 1200) return 2;
  return 1;
}

export function periodClockAt(elapsed: number): string {
  if (elapsed >= 3600) return "00:00";
  const inPeriod = elapsed % 1200;
  return formatClock(1200 - inPeriod);
}
