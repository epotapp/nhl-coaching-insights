/* Calendar — fullscreen month board (June 2026 · 2026 Stanley Cup Final) */
import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageProps } from "../shared";
import "./calendar.css";

const img = "/__mockup/images/hockey-dashboard/";

export interface CalendarPageProps extends PageProps {
  /* onboarding-selected stat priorities (abbrs like "TOI", "FO%") */
  prioStats: string[];
}

/* map a priority stat abbr → a sensible in-game widget label.
   Keys MUST match the `abbr` values of STATS in OnboardingModal.tsx
   (source of truth for step-2 selections passed down as prioStats). */
const CHIP_LABEL: Record<string, string> = {
  TOI: "Live TOI tracking",
  "FO%": "FO% matchup alerts",
  SOG: "SOG pace card",
  "SH%": "Shooting % feed",
  HIT: "Hit heatmap",
  BLK: "Blocked-shot ticker",
  GVA: "Giveaway alerts",
  TKA: "Takeaway alerts",
  "PP%": "PP unit efficiency",
  "PK%": "PK pressure map",
  "CF%": "Corsi flow chart",
  xG: "xG live model",
  HDC: "High-danger chance feed",
  SCF: "Scoring-chance flow",
  ZE: "Zone-entry tracker",
  "OZS%": "O-zone start map",
  "+/-": "On-ice +/- board",
  PIM: "Penalty watch",
  "SV%": "Save % tracker",
  "G/A": "Points ticker",
};
function chipFor(abbr: string): string {
  return CHIP_LABEL[abbr] ?? `${abbr} live card`;
}

/* ── month model ── */
type GameKind = "home" | "away";

interface GameCell {
  kind: GameKind;
  title: string; // e.g. "Game 1 VGK Leads 1-0"
  away: string; // team abbr
  home: string;
  scoreLeft: { abbr: string; goals: number };
  scoreRight: { abbr: string; goals: number };
  logo: string; // logo filename (canes.png / vgk.png)
}

interface UpcomingCell {
  title: string; // "Game 4 · Tonight"
  subtitle: string; // "7:00 PM · Lenovo Center"
  logo: string;
  chips: string[];
}

interface FutureCell {
  label: string; // "Game 5 · Jun 11 @VGK"
}

/* June 2026: Jun 1 is a Monday. Grid starts on Sunday (May 31). */
interface DayCell {
  n: number; // day number shown
  inMonth: boolean;
  game?: GameCell;
  upcoming?: UpcomingCell;
  future?: FutureCell;
}

export function CalendarPage({ theme, prioStats }: CalendarPageProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const upcomingChips = useMemo(() => {
    const src = prioStats.length ? prioStats : ["TOI", "FO%", "SOG"];
    return src.slice(0, 2).map(chipFor);
  }, [prioStats]);

  /* series cells keyed by June day number */
  const games = useMemo<Record<number, DayCell>>(() => {
    const m: Record<number, DayCell> = {};

    /* G1 · Tue Jun 2 · AWAY @VGK · VGK 5, CAR 4 */
    m[2] = {
      n: 2,
      inMonth: true,
      game: {
        kind: "away",
        title: "Game 1 VGK Leads 1-0",
        away: "CAR",
        home: "VGK",
        scoreLeft: { abbr: "VGK", goals: 5 },
        scoreRight: { abbr: "CAR", goals: 4 },
        logo: "vgk.png",
      },
    };

    /* G2 · Thu Jun 4 · AWAY · CAR 5, VGK 3 */
    m[4] = {
      n: 4,
      inMonth: true,
      game: {
        kind: "away",
        title: "Game 2 Tied 1-1",
        away: "CAR",
        home: "VGK",
        scoreLeft: { abbr: "CAR", goals: 5 },
        scoreRight: { abbr: "VGK", goals: 3 },
        logo: "vgk.png",
      },
    };

    /* G3 · Sat Jun 6 · HOME · VGK 4, CAR 2 */
    m[6] = {
      n: 6,
      inMonth: true,
      game: {
        kind: "home",
        title: "Game 3 VGK Leads 2-1",
        away: "VGK",
        home: "CAR",
        scoreLeft: { abbr: "VGK", goals: 4 },
        scoreRight: { abbr: "CAR", goals: 2 },
        logo: "canes.png",
      },
    };

    /* G4 · Tue Jun 9 · HOME · UPCOMING tonight */
    m[9] = {
      n: 9,
      inMonth: true,
      upcoming: {
        title: "Game 4 · Tonight",
        subtitle: "7:00 PM · Lenovo Center",
        logo: "canes.png",
        chips: upcomingChips,
      },
    };

    /* future placeholders */
    m[11] = { n: 11, inMonth: true, future: { label: "Game 5 · Jun 11 @VGK" } };
    m[14] = { n: 14, inMonth: true, future: { label: "Game 6 · Jun 14 HOME" } };

    return m;
  }, [upcomingChips]);

  /* build 5 rows × 7 cols. Jun 1 = Monday → col index 1 (Sun=0). */
  const weeks = useMemo<DayCell[][]>(() => {
    const cells: DayCell[] = [];
    /* leading out-of-month: May 31 in the Sunday slot */
    cells.push({ n: 31, inMonth: false });
    for (let d = 1; d <= 30; d++) {
      cells.push(games[d] ?? { n: d, inMonth: true });
    }
    /* trailing out-of-month: Jul 1..4 to fill last row (5 rows × 7 = 35) */
    let jul = 1;
    while (cells.length < 35) {
      cells.push({ n: jul++, inMonth: false });
    }
    const rows: DayCell[][] = [];
    for (let r = 0; r < 5; r++) rows.push(cells.slice(r * 7, r * 7 + 7));
    return rows;
  }, [games]);

  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="cal-page">
      <div className="cal-header">
        <span className="cal-month-label">
          <strong>June</strong> <span className="cal-year">2026</span>
        </span>
        <span className="cal-month-chev" aria-hidden="true">
          <ChevronDown size={13} strokeWidth={2.5} />
        </span>
        <div className="cal-toggle" role="tablist" aria-label="Calendar view">
          <button
            className={`cal-toggle-seg${view === "week" ? " cal-toggle-seg-on" : ""}`}
            role="tab"
            aria-selected={view === "week"}
            onClick={() => setView("week")}
          >
            Week
          </button>
          <button
            className={`cal-toggle-seg${view === "month" ? " cal-toggle-seg-on" : ""}`}
            role="tab"
            aria-selected={view === "month"}
            onClick={() => setView("month")}
          >
            Month
          </button>
        </div>
      </div>

      {view === "week" ? (
        <WeekView theme={theme} />
      ) : (
        <>
          <div className="cal-weekdays">
            {dows.map((d) => (
              <div className="cal-weekday" key={d}>
                {d}
              </div>
            ))}
          </div>

          <div className="cal-grid">
            {weeks.map((row, ri) =>
              row.map((cell, ci) => <MonthCell key={`${ri}-${ci}`} cell={cell} />)
            )}
          </div>

          <div className="cal-legend">
            <span className="cal-legend-item">
              <span className="cal-legend-dot cal-dot-home" /> Home
            </span>
            <span className="cal-legend-item">
              <span className="cal-legend-dot cal-dot-away" /> Away
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════ WEEK VIEW (3-day time-grid + right rail) ═══════════════ */
/* time model: 9 AM → 10 PM (labels every 3 hours) */
const WK_START = 9;
const WK_END = 22;
const WK_HOURS = WK_END - WK_START; // 13
const WK_PX = 46; // px per hour
const WK_TRACK = WK_HOURS * WK_PX;

function wkY(h: number, m = 0): number {
  return (h - WK_START + m / 60) * WK_PX;
}

interface WkEvent {
  title: string;
  sub: string;
  startH: number;
  startM?: number;
  endH: number;
  endM?: number;
  accent?: boolean;
}

function wkTimeStr(e: WkEvent): string {
  const fmt = (h: number, m: number) => {
    const ap = h >= 12 ? "PM" : "AM";
    let hh = h % 12;
    if (hh === 0) hh = 12;
    return `${hh}:${m.toString().padStart(2, "0")} ${ap}`;
  };
  return `${fmt(e.startH, e.startM ?? 0)} – ${fmt(e.endH, e.endM ?? 0)}`;
}

function WeekView({ theme }: { theme: "dark" | "light" }) {
  const days: { dow: string; num: string; sub: string; events: WkEvent[] }[] = [
    {
      dow: "Mon",
      num: "8",
      sub: "Off",
      events: [
        { title: "Video Review", sub: "Team", startH: 10, endH: 11 },
        { title: "Recovery Session", sub: "Training Room", startH: 13, endH: 14, endM: 30 },
        { title: "Media Availability", sub: "Press Room", startH: 16, endH: 16, endM: 30 },
      ],
    },
    {
      dow: "Tue",
      num: "9",
      sub: "CAR vs VGK",
      events: [
        { title: "Morning Skate", sub: "Optional", startH: 10, endH: 10, endM: 45 },
        { title: "Pre-Game Meeting", sub: "Video Room", startH: 16, startM: 30, endH: 17 },
        {
          title: "Game 4 vs VGK",
          sub: "Lenovo Center",
          startH: 19,
          endH: 21,
          endM: 30,
          accent: true,
        },
      ],
    },
    {
      dow: "Wed",
      num: "10",
      sub: "Practice",
      events: [
        { title: "Practice", sub: "Full Team", startH: 11, endH: 12, endM: 30 },
        { title: "Systems Review", sub: "PP Units", startH: 14, endH: 15 },
      ],
    },
  ];

  const marks = [9, 12, 15, 18, 21];
  const gridlines = Array.from({ length: WK_HOURS + 1 }, (_, i) => WK_START + i);

  return (
    <div className="cal-wk-layout">
      <div className="cal-wk-main">
        <div className="cal-wk-headrow">
          <div className="cal-wk-gutter-head" />
          {days.map((d) => (
            <div className="cal-wk-dayhead" key={d.dow}>
              <div className="cal-wk-dow">{d.dow}</div>
              <div className="cal-wk-num">{d.num}</div>
              <div className="cal-wk-sub">{d.sub}</div>
            </div>
          ))}
        </div>

        <div className="cal-wk-body">
          <div className="cal-wk-gutter" style={{ height: WK_TRACK }}>
            {marks.map((h) => (
              <div className="cal-wk-gutter-label" key={h} style={{ top: wkY(h) }}>
                {(() => {
                  const ap = h >= 12 ? "PM" : "AM";
                  let hh = h % 12;
                  if (hh === 0) hh = 12;
                  return `${hh}:00 ${ap}`;
                })()}
              </div>
            ))}
          </div>

          {days.map((d) => (
            <div className="cal-wk-col" key={d.dow} style={{ height: WK_TRACK }}>
              {gridlines.map((h) => (
                <div className="cal-wk-line" key={h} style={{ top: wkY(h) }} />
              ))}
              {d.events.map((e, i) => {
                const top = wkY(e.startH, e.startM ?? 0);
                const bottom = wkY(e.endH, e.endM ?? 0);
                const minHeight = Math.max(bottom - top, 84);
                return (
                  <div
                    className={`cal-wk-event${e.accent ? " cal-wk-event-accent" : ""}`}
                    key={i}
                    style={{ top, minHeight }}
                  >
                    <div className="cal-wk-event-title">{e.title}</div>
                    <div className="cal-wk-event-sub">{e.sub}</div>
                    <div className="cal-wk-event-time">{wkTimeStr(e)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="cal-wk-rail">
        <WeekRail theme={theme} />
      </div>
    </div>
  );
}

/* week-view right rail: mini month cal + agenda + add-task pill.
   Uses its own cal-wk- classes so CalendarSidePanel stays untouched. */
const WK_RAIL_HOME = new Set([6, 9, 14]);
const WK_RAIL_AWAY = new Set([2, 4, 11]);

interface WkAgendaItem {
  title: string;
  sub: string;
  time: string;
}
const WK_AGENDA: WkAgendaItem[] = [
  { title: "Morning Skate", sub: "Optional", time: "10:00 – 10:45 AM" },
  { title: "Pre-Game Meeting", sub: "Video Room", time: "4:30 – 5:00 PM" },
  { title: "Warmups", sub: "Lenovo Center", time: "6:30 – 6:50 PM" },
  { title: "Game 4 vs VGK", sub: "Lenovo Center", time: "7:00 – 9:30 PM" },
];

function WeekRail({ theme: _theme }: { theme: "dark" | "light" }) {
  const [extra, setExtra] = useState<WkAgendaItem[]>([]);

  /* June 2026: Jun 1 is a Monday → one leading blank (Sunday slot) */
  const cells: (number | null)[] = [null];
  for (let d = 1; d <= 30; d++) cells.push(d);
  const dows = ["S", "M", "T", "W", "T", "F", "S"];

  const addTask = () =>
    setExtra((p) => [...p, { title: "New Task", sub: "Added just now", time: "6:00 – 6:30 PM" }]);

  const agenda = [...WK_AGENDA, ...extra];

  return (
    <div className="cal-wk-rail-inner">
      {/* mini month */}
      <div>
        <div className="cal-wk-mini-head">
          <button className="cal-wk-mini-nav" aria-label="Previous month">
            <ChevronLeft size={15} />
          </button>
          <span className="cal-wk-mini-title">June 2026</span>
          <button className="cal-wk-mini-nav" aria-label="Next month">
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="cal-wk-mini-grid">
          {dows.map((d, i) => (
            <div className="cal-wk-mini-dow" key={i}>
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div className="cal-wk-mini-cell" key={`e${i}`} />;
            const home = WK_RAIL_HOME.has(d);
            const away = WK_RAIL_AWAY.has(d);
            const sel = d === 9;
            const cls = [
              "cal-wk-mini-cell",
              home ? "cal-wk-mini-home" : "",
              away ? "cal-wk-mini-away" : "",
              sel ? "cal-wk-mini-sel" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div className={cls} key={d}>
                <span>{d}</span>
              </div>
            );
          })}
        </div>
        <div className="cal-wk-mini-legend">
          <span className="cal-legend-item">
            <span className="cal-wk-legend-dot cal-wk-dot-home" /> Home
          </span>
          <span className="cal-legend-item">
            <span className="cal-wk-legend-dot cal-wk-dot-away" /> Away
          </span>
        </div>
      </div>

      {/* agenda */}
      <div>
        <div className="cal-wk-agenda-head">
          <span className="cal-wk-agenda-title">June 9</span>
          <button className="cal-wk-agenda-all">View All</button>
        </div>
        <div className="cal-wk-agenda-list">
          {agenda.map((e, i) => (
            <div className="cal-wk-agenda-item" key={i}>
              <div className="cal-wk-agenda-item-title">
                {e.title} <span className="cal-wk-agenda-item-sub">| {e.sub}</span>
              </div>
              <div className="cal-wk-agenda-item-time">{e.time}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="cal-wk-add" onClick={addTask}>
        + Add Task
      </button>
    </div>
  );
}

function MonthCell({ cell }: { cell: DayCell }) {
  /* out-of-month day cell */
  if (!cell.inMonth) {
    return (
      <div className="cal-cell cal-cell-out">
        <span className="cal-cell-num">{cell.n}</span>
      </div>
    );
  }

  /* finished / played game — inverted light card */
  if (cell.game) {
    const g = cell.game;
    const cardCls =
      g.kind === "home" ? "cal-cell-game cal-cell-game-home" : "cal-cell-game cal-cell-game-away";
    const leftBold = g.scoreLeft.goals > g.scoreRight.goals;
    return (
      <div className={`cal-cell ${cardCls}`}>
        <img className="cal-game-logo" src={`${img}${g.logo}`} alt={g.home} />
        <span className="cal-cell-num cal-cell-num-dark">{cell.n}</span>
        <div className="cal-game-body">
          <div className="cal-game-title">{g.title}</div>
          <div className="cal-game-score">
            <span className={leftBold ? "cal-score-win" : ""}>
              {g.scoreLeft.abbr} {g.scoreLeft.goals}
            </span>
            {", "}
            <span className={!leftBold ? "cal-score-win" : ""}>
              {g.scoreRight.abbr} {g.scoreRight.goals}
            </span>
          </div>
        </div>
        <div className="cal-game-chips">
          <span className="cal-game-chip">Game Summary</span>
          <span className="cal-game-chip">+3 More</span>
        </div>
      </div>
    );
  }

  /* upcoming (tonight) — ringed light card */
  if (cell.upcoming) {
    const u = cell.upcoming;
    return (
      <div className="cal-cell cal-cell-game cal-cell-game-home cal-cell-upcoming">
        <img className="cal-game-logo" src={`${img}${u.logo}`} alt="CAR" />
        <span className="cal-cell-num cal-cell-num-dark">9</span>
        <div className="cal-game-body">
          <div className="cal-game-title cal-game-title-live">{u.title}</div>
          <div className="cal-game-sub">{u.subtitle}</div>
        </div>
        <div className="cal-game-chips">
          {u.chips.map((c) => (
            <span className="cal-game-chip cal-game-chip-live" key={c}>
              {c}
            </span>
          ))}
        </div>
      </div>
    );
  }

  /* future placeholder — muted text-only cell */
  if (cell.future) {
    return (
      <div className="cal-cell">
        <span className="cal-cell-num">{cell.n}</span>
        <div className="cal-future">{cell.future.label}</div>
      </div>
    );
  }

  /* plain in-month day */
  return (
    <div className="cal-cell">
      <span className="cal-cell-num">{cell.n}</span>
    </div>
  );
}

/* ── month mini-grid model for June 2026 (side panel) ── */
interface GameMark {
  day: number;
  kind: "home" | "away";
}
const GAME_DAYS: GameMark[] = [
  { day: 2, kind: "away" },
  { day: 4, kind: "away" },
  { day: 6, kind: "home" },
  { day: 9, kind: "home" },
  { day: 11, kind: "away" },
  { day: 14, kind: "home" },
];

interface DayEvt {
  title: string;
  sub: string;
  time: string;
}
const DAY_EVENTS: DayEvt[] = [
  { title: "Morning Skate", sub: "Optional + rush drills", time: "10:00 – 11:00 AM" },
  { title: "Line Review", sub: "Matchup vs Eichel", time: "11:30 – 12:30 PM" },
  { title: "Pre-Game Meal", sub: "Team lunch", time: "1:00 – 2:00 PM" },
  { title: "CAR vs VGK", sub: "Game 4 · Lenovo Center", time: "7:00 PM" },
];

function CalSidebarContent({ theme: _theme }: PageProps) {
  const [extra, setExtra] = useState<DayEvt[]>([]);
  const gameMap = useMemo(() => {
    const m = new Map<number, GameMark["kind"]>();
    GAME_DAYS.forEach((g) => m.set(g.day, g.kind));
    return m;
  }, []);

  /* June 2026: June 1 is a Monday → offset 1 */
  const cells: (number | null)[] = [];
  for (let i = 0; i < 1; i++) cells.push(null);
  for (let d = 1; d <= 30; d++) cells.push(d);
  const dows = ["S", "M", "T", "W", "T", "F", "S"];

  const addTask = () => {
    setExtra((prev) => [
      ...prev,
      {
        title: "New Task",
        sub: "Added just now",
        time: "6:00 – 6:30 PM",
      },
    ]);
  };

  const allEvents = [...DAY_EVENTS, ...extra];

  return (
    <div className="cal-sidebar-inner">
      {/* month mini grid */}
      <div>
        <div className="cal-mini-head">
          <button className="cal-mini-nav" aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <span className="cal-mini-title">June 2026</span>
          <button className="cal-mini-nav" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="cal-mini-grid">
          {dows.map((d, i) => (
            <div className="cal-mini-dow" key={i}>
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div className="cal-mini-cell" key={`e${i}`} />;
            const game = gameMap.get(d);
            const isToday = d === 9;
            const cls = ["cal-mini-cell", isToday ? "cal-mini-cell-today" : ""]
              .filter(Boolean)
              .join(" ");
            return (
              <div className={cls} key={d}>
                <span>{d}</span>
                {game && (
                  <span
                    className={`cal-mini-dot ${
                      game === "home" ? "cal-dot-home" : "cal-dot-away"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="cal-mini-legend">
          <span className="cal-legend-item">
            <span className="cal-legend-dot cal-dot-home" /> Home
          </span>
          <span className="cal-legend-item">
            <span className="cal-legend-dot cal-dot-away" /> Away
          </span>
        </div>
      </div>

      {/* day list */}
      <div>
        <div className="cal-list-head">
          <span className="cal-list-title">June 9</span>
          <button className="cal-view-all">View All</button>
        </div>
        <div className="cal-list">
          {allEvents.map((e, i) => (
            <div className="cal-list-item" key={i}>
              <div className="cal-list-item-title">
                {e.title} <span className="cal-list-item-sub">| {e.sub}</span>
              </div>
              <div className="cal-list-item-time">{e.time}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="cal-add-btn" onClick={addTask}>
        + Add Task
      </button>
    </div>
  );
}

/* Right-hand month calendar side panel — reused as the global
   Calendar panel available from the top bar on every page. */
export function CalendarSidePanel({
  theme,
  onClose,
}: PageProps & { onClose: () => void }) {
  return (
    <aside className="hd-sidepanel">
      <div className="hd-sidepanel-head">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={16} /> Calendar
        </span>
        <button className="hd-ibtn" aria-label="Close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="hd-sidepanel-body">
        <CalSidebarContent theme={theme} />
      </div>
    </aside>
  );
}
