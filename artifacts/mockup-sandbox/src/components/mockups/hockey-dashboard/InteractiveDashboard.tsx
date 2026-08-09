import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { RotateCw } from "lucide-react";
import "./hockey-dashboard.css";
import "./pages/pages-shared.css";
import { APP_PAGES, type AppPage } from "./shared";
import { FeaturedInsightsPage } from "./pages/FeaturedInsightsPage";
import { PlayerInsightsPage } from "./pages/PlayerInsightsPage";
import { VideoPage } from "./pages/VideoPage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { CalendarPage, CalendarSidePanel } from "./pages/CalendarPage";
import { NotesPage, NotesSidePanel } from "./pages/NotesPage";
import { StatsPage } from "./pages/StatsPage";
import { LoginScreen } from "./LoginScreen";
import { OnboardingModal, type ObStep } from "./OnboardingModal";
import {
  VideoClipView,
  WidgetDetailView,
  type DetailStat,
  type LiveStats,
  type StackEntry,
} from "./ExpandedViews";
import { mmss, useGameSim } from "./gameSim";
import { AiFaceoffVisual, AiRelatedFullView, AiRelatedMiniatures, type AiRelatedKey } from "./AiInsightViews";
import { useNhlDashboardSnapshot } from "./data/useNhlDashboardSnapshot";
import type { DashboardSnapshot } from "./data/nhlDataClient";
import {
  CAR_PLAYERS,
  CAR_PRIMARY_PLAYER_NUMBERS,
  GAME4_META,
  GAME4_GOALS,
  GAME4_PENALTIES,
  GAME4_TEAM_TOTALS,
  playerHeadshot,
} from "./game4Data";
import "./v0.2-polish.css";
import "./v0.3-polish.css";
import "./v0.4-polish.css";
import { HdIcon, type HdIconName } from "./HdIcon";
import { imageBase } from "./assets";
import {
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
  PlacementSlot,
  WidgetCatalog,
  WidgetEditChrome,
  allowedZonesForSize,
  type DashboardLayoutItem,
  type DashboardWidgetId,
  type DashboardWidgetSize,
  type DashboardWidgetZone,
} from "./DashboardCustomization";

export const NHL_DASHBOARD_VERSION = "0.4.0";

type FlowStep = "login" | ObStep | "dashboard";
type Theme = "dark" | "light";

const primaryPlayers = CAR_PRIMARY_PLAYER_NUMBERS
  .map(num => CAR_PLAYERS.find(player => player.num === num))
  .filter((player): player is (typeof CAR_PLAYERS)[number] => Boolean(player));

const NAV_ICONS: Record<AppPage, ReactNode> = {
  Dashboard: <HdIcon name="home" className="hd-sidebar-icon" />,
  "Featured Insights": <HdIcon name="featured" className="hd-sidebar-icon" />,
  "Player Insights": <HdIcon name="player" className="hd-sidebar-icon" />,
  Video: <HdIcon name="video" className="hd-sidebar-icon" />,
  Stats: <HdIcon name="chart" className="hd-sidebar-icon" />,
  Notes: <HdIcon name="notes" className="hd-sidebar-icon" />,
  Calendar: <HdIcon name="calendar" className="hd-sidebar-icon" />,
  Preferences: <HdIcon name="profile" className="hd-sidebar-icon hd-sidebar-pref-icon" />,
};

const PAGE_FROM_QUERY: Record<string, AppPage> = {
  dashboard: "Dashboard",
  featured: "Featured Insights",
  players: "Player Insights",
  video: "Video",
  stats: "Stats",
  notes: "Notes",
  calendar: "Calendar",
  preferences: "Preferences",
};

function initialPreviewState(): { flow: FlowStep; page: AppPage } {
  if (typeof window === "undefined") return { flow: "login", page: "Dashboard" };
  const screen = new URLSearchParams(window.location.search).get("screen")?.toLowerCase() ?? "";
  if (screen.startsWith("onboarding")) {
    const n = Math.min(5, Math.max(1, Number(screen.replace(/\D/g, "")) || 2));
    return { flow: `ob${n}` as ObStep, page: "Dashboard" };
  }
  if (screen in PAGE_FROM_QUERY) return { flow: "dashboard", page: PAGE_FROM_QUERY[screen] };
  return { flow: "login", page: "Dashboard" };
}


function initialThemeState(): Theme {
  if (typeof window === "undefined") return "dark";
  const queryTheme = new URLSearchParams(window.location.search).get("theme");
  if (queryTheme === "light" || queryTheme === "dark") return queryTheme;
  const saved = window.localStorage.getItem("nhl-coaching-theme");
  return saved === "light" ? "light" : "dark";
}

function initialDashboardLayout(): DashboardLayoutItem[] {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_LAYOUT;
  try {
    const raw = window.localStorage.getItem("nhl-dashboard-layout-v0.4");
    if (!raw) return DEFAULT_DASHBOARD_LAYOUT;
    const parsed = JSON.parse(raw) as DashboardLayoutItem[];
    const validIds = new Set(DASHBOARD_WIDGETS.map(widget => widget.id));
    const validZones = new Set<DashboardWidgetZone>(["top", "lower", "rail", "other"]);
    const validSizes = new Set<DashboardWidgetSize>(["small", "medium", "large"]);
    const cleaned = parsed.filter(item => validIds.has(item.id) && validZones.has(item.zone) && validSizes.has(item.size));
    return cleaned.length ? cleaned : DEFAULT_DASHBOARD_LAYOUT;
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}

function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return <button type="button" className="hd-ibtn" aria-label={label} onClick={onClick}>{children}</button>;
}

function ExpandGlyph({ collapse = false }: { collapse?: boolean }) {
  return <HdIcon name={collapse ? "minimize" : "expand"} size={16} />;
}

function Panel({
  title,
  icon,
  children,
  className = "",
  onExpand,
  expanded = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  onExpand?: () => void;
  expanded?: boolean;
}) {
  return (
    <section className={`hd-panel ${className}`}>
      <header className="hd-panel-head">
        <span className="hd-panel-title">{icon}<strong>{title}</strong></span>
        {onExpand && <IconButton label={`${expanded ? "Collapse" : "Expand"} ${title}`} onClick={onExpand}><ExpandGlyph collapse={expanded} /></IconButton>}
      </header>
      {children}
    </section>
  );
}

function DemoControls({ sim }: { sim: ReturnType<typeof useGameSim> }) {
  if (sim.mode === "idle") {
    return (
      <button className="hd-nav-btn hd-demo-start" type="button" onClick={sim.start}>
        <HdIcon name="play" size={14} /> Start Demo
      </button>
    );
  }

  return (
    <>
      <button className="hd-nav-btn hd-cheat" type="button" onClick={() => sim.skip(-10)}><HdIcon name="back-10" size={14} /> back 10 sec</button>
      <button className="hd-nav-btn hd-cheat" type="button" onClick={() => sim.skip(30)}>skip 30 sec</button>
      <button className="hd-nav-btn hd-cheat" type="button" onClick={() => sim.skip(300)}>skip 5 min</button>
      <button
        className="hd-nav-btn"
        type="button"
        onClick={sim.mode === "running" ? sim.pause : sim.resume}
        disabled={sim.mode === "ended"}
      >
        {sim.mode === "running" ? <HdIcon name="pause" size={14} /> : <HdIcon name="play" size={14} />}
        {sim.mode === "running" ? "Pause" : sim.mode === "ended" ? "Final" : "Resume"}
      </button>
    </>
  );
}

function SearchBar() {
  return (
    <label className="hd-search">
      <HdIcon name="search" size={17} />
      <HdIcon name="sparkle" size={16} className="hd-search-star" />
      <input aria-label="Search" placeholder="Search" />
      <HdIcon name="mic" size={16} />
    </label>
  );
}

function TeamScore({ sim, snapshot }: { sim: ReturnType<typeof useGameSim>; snapshot: DashboardSnapshot | null }) {
  const idle = sim.mode === "idle";
  const carScore = snapshot?.live.score.away ?? (idle ? 5 : sim.score.car);
  const vgkScore = snapshot?.live.score.home ?? (idle ? 3 : sim.score.vgk);
  return (
    <div className="hd-score-band" aria-label="Live game score">
      <div className="hd-clock-block">
        <strong className="hd-clock">{idle ? "00:00" : sim.clock}</strong>
        <span>{idle ? "Game 4 Final" : sim.periodLabel}</span>
      </div>
      <div className="hd-score-center">
        <img src={`${imageBase}vgk.png`} alt="Vegas Golden Knights" />
        <strong>{String(vgkScore).padStart(2, "0")}</strong>
        <span>–</span>
        <strong>{String(carScore).padStart(2, "0")}</strong>
        <img src={`${imageBase}canes.png`} alt="Carolina Hurricanes" />
      </div>
      <div className="hd-strength-block">
        <span><i /> Current Strength</span>
        <strong>{idle ? "Carolina 5–3 Vegas" : sim.strength}</strong>
        <small>{idle ? "Final · June 9, 2026" : sim.iceStatus}</small>
      </div>
    </div>
  );
}

function PlayerToi({
  player,
  seconds,
  onIce,
}: {
  player: (typeof CAR_PLAYERS)[number];
  seconds: number;
  onIce: boolean;
}) {
  const ratio = Math.max(8, Math.min(100, (seconds / Math.max(1, player.toi)) * 100));
  return (
    <article className={`hd-toi-player${onIce ? " hd-player-onice" : ""}`}>
      <div className="hd-toi-face-wrap">
        <img src={playerHeadshot(player)} alt={player.name} className="hd-toi-face" />
        {onIce && <span className="hd-onice-dot" aria-label="On ice" />}
      </div>
      <span className="hd-toi-name">{player.short}</span>
      <strong className="hd-toi-time">{mmss(seconds)}</strong>
      <span className="hd-progress"><i style={{ width: `${ratio}%` }} /></span>
    </article>
  );
}

function FaceoffCard({ sim, onExpand }: { sim: ReturnType<typeof useGameSim>; onExpand: () => void }) {
  const idle = sim.mode === "idle";
  const car = idle ? GAME4_TEAM_TOTALS.CAR.faceoffWins : sim.team.foW;
  const vgk = idle ? GAME4_TEAM_TOTALS.VGK.faceoffWins : sim.team.foL;
  const total = Math.max(1, car + vgk);
  const pct = Math.round((car / total) * 100);
  const leaders = [11, 20, 77].map(num => CAR_PLAYERS.find(p => p.num === num)!).filter(Boolean);
  return (
    <Panel title="Faceoff Win Rate" icon={<HdIcon name="head-to-head-faceoffs" size={17} />} className="hd-primary-stat" onExpand={onExpand}>
      <div className="hd-fo-summary">
        <div><strong>{pct}%</strong><span>CAR · {car}/{total}</span></div>
        <div className="hd-fo-balance" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
        <div className="hd-stat-pair"><span>CAR <strong>{car}</strong></span><span><strong>{vgk}</strong> VGK</span></div>
      </div>
      <div className="hd-fo-leaders">
        {leaders.map(player => {
          const live = sim.team.fo[player.num];
          const w = idle ? player.foW ?? 0 : live?.w ?? 0;
          const l = idle ? player.foL ?? 0 : live?.l ?? 0;
          return (
            <div key={player.num}>
              <img src={playerHeadshot(player)} alt="" />
              <span>{player.short}</span>
              <strong>{w}-{l}</strong>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ShotsCard({ sim, onExpand, snapshot, theme }: { sim: ReturnType<typeof useGameSim>; onExpand: () => void; snapshot: DashboardSnapshot | null; theme: Theme }) {
  const idle = sim.mode === "idle";
  const car = snapshot?.live.shotsOnGoal.away ?? (idle ? GAME4_TEAM_TOTALS.CAR.shots : sim.team.sogCar);
  const vgk = snapshot?.live.shotsOnGoal.home ?? (idle ? GAME4_TEAM_TOTALS.VGK.shots : sim.team.sogVgk);
  return (
    <Panel title="Shots on Goal" icon={<HdIcon name="shooting-sector" size={17} />} className="hd-primary-stat" onExpand={onExpand}>
      <div className="hd-shot-score">
        <div><img src={`${imageBase}canes.png`} alt="" /><strong>{car}</strong><span>CAR</span></div>
        <span>–</span>
        <div><img src={`${imageBase}vgk.png`} alt="" /><strong>{vgk}</strong><span>VGK</span></div>
      </div>
      <img className="hd-mini-chart" src={`${imageBase}charts/game-flow${theme === "light" ? "-light" : ""}.png`} alt="Cumulative shots on goal by elapsed game time" />
    </Panel>
  );
}

function AiPanel({
  sim,
  snapshot,
  expanded,
  onToggleExpanded,
  onOpenRelated,
}: {
  sim: ReturnType<typeof useGameSim>;
  snapshot: DashboardSnapshot | null;
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenRelated: (key: AiRelatedKey) => void;
}) {
  const idleInsights = [
    { title: "Faceoff control", sub: "Staal won 12 of 16 draws", priority: "High" },
    { title: "Net-front execution", sub: "Two Staal goals drove the 5–3 win", priority: "High" },
    { title: "Shot control", sub: "Carolina finished ahead 28–21", priority: "Medium" },
  ];
  const databaseInsights = snapshot?.insights.slice(0, 3).map((row, index) => ({
    title: row.title,
    sub: row.summary,
    priority: index === 0 ? "High" : "Medium",
  }));
  const rows = databaseInsights?.length
    ? databaseInsights
    : sim.mode === "idle"
      ? idleInsights
      : sim.insights.length
        ? sim.insights.slice(0, 3).map((row, index) => ({ ...row, priority: index === 0 ? "High" : "Medium" }))
        : [{ title: "Opening structure", sub: "Staal line starts against Karlsson", priority: "High" }];

  return (
    <Panel
      title="AI Insights"
      icon={<HdIcon name="sparkle" size={17} />}
      className={`hd-ai-panel${expanded ? " hd-ai-panel-expanded" : ""}`}
      onExpand={onToggleExpanded}
      expanded={expanded}
    >
      {expanded ? (
        <>
          <AiFaceoffVisual />
          <AiRelatedMiniatures onOpen={onOpenRelated} />
        </>
      ) : (
        <>
          <AiFaceoffVisual compact />
          <div className="hd-ai-list">
            {rows.map((row, index) => (
              <article key={`${row.title}-${index}`}>
                <i />
                <div><strong>{row.title}</strong><span>{row.sub}</span></div>
                <small>{row.priority}</small>
              </article>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function ConciseStat({ label, value, context, onClick }: { label: string; value: string; context: string; onClick?: () => void }) {
  return (
    <button type="button" className="hd-concise" onClick={onClick}>
      <i />
      <span><strong>{value}</strong> | {label}</span>
      <small>{context}</small>
      <ExpandGlyph />
    </button>
  );
}

function OtherInsights({ sim }: { sim: ReturnType<typeof useGameSim> }) {
  const idle = sim.mode === "idle";
  const carPPOpps = GAME4_PENALTIES.filter(event =>
    event.team === "VGK" && event.elapsed <= sim.elapsed && event.elapsed !== 2310,
  ).length;
  const carPPGoals = GAME4_GOALS.filter(event =>
    event.team === "CAR" && event.strength === "PP" && event.elapsed <= sim.elapsed,
  ).length;
  const values = [
    ["Power Play", idle ? "1/3" : `${carPPGoals}/${carPPOpps}`],
    ["Hits", idle ? "34–38" : `${sim.team.hitCar}–${sim.team.hitVgk}`],
    ["Blocks", idle ? "16–12" : `${sim.team.blockCar}–${sim.team.blockVgk}`],
    ["Takeaways", idle ? "7–3" : `${sim.team.takeCar}–${sim.team.takeVgk}`],
    ["PIM", idle ? "8–8" : `${sim.team.pimCar}–${sim.team.pimVgk}`],
  ];
  return (
    <section className="hd-other">
      <h2>Other Insights</h2>
      <div className="hd-other-row">
        {values.map(([label, value]) => (
          <article key={label}><HdIcon name="game-pulse" size={15} /><div><span>{label}</span><strong>{value}</strong></div></article>
        ))}
      </div>
    </section>
  );
}

function CompactDashboardStat({ icon = "game-pulse", label, value, context }: { icon?: HdIconName; label: string; value: string; context?: string }) {
  return (
    <article className="hd-custom-compact">
      <HdIcon name={icon} size={15} />
      <div><span>{label}</span><strong>{value}</strong>{context && <small>{context}</small>}</div>
    </article>
  );
}

function AddedDashboardWidget({
  id,
  size,
  sim,
  theme,
}: {
  id: DashboardWidgetId;
  size: DashboardWidgetSize;
  sim: ReturnType<typeof useGameSim>;
  theme: Theme;
}) {
  const idle = sim.mode === "idle";
  if (id === "gameFlow") {
    return (
      <Panel title="Game Flow" icon={<HdIcon name="chart" size={17} />} className={`hd-added-panel hd-added-${size}`}>
        <div className="hd-added-chart-copy"><strong>{idle ? "28–21" : `${sim.team.sogCar}–${sim.team.sogVgk}`}</strong><span>Shots on goal · CAR–VGK</span></div>
        <img className="hd-added-chart" src={`${imageBase}charts/game-flow${theme === "light" ? "-light" : ""}.png`} alt="Cumulative shots on goal" />
      </Panel>
    );
  }
  if (id === "penaltyWatch") {
    const rows = GAME4_PENALTIES.filter(event => idle || event.elapsed <= sim.elapsed).slice(-4).reverse();
    return (
      <Panel title="Penalty Watch" icon={<HdIcon name="notes" size={17} />} className={`hd-added-panel hd-added-${size}`}>
        <div className="hd-added-list">
          {(rows.length ? rows : GAME4_PENALTIES.slice(0, 3)).map((event, index) => (
            <article key={`${event.elapsed}-${index}`}><i className={`team-${event.team.toLowerCase()}`} /><div><strong>{event.player ?? `${event.team} bench`}</strong><span>{event.detail}</span></div><small>P{event.period} · {event.clock}</small></article>
          ))}
        </div>
      </Panel>
    );
  }
  if (id === "lineMatchups") {
    const matchups = [
      ["Staal · Martinook · Jarvis", "Eichel line", "Defensive-zone priority"],
      ["Aho · Svechnikov · Blake", "Karlsson line", "Transition attack"],
      ["Ehlers · Stankoven · Hall", "Hertl line", "Speed advantage"],
    ];
    return (
      <Panel title="Line Matchups" icon={<HdIcon name="player" size={17} />} className={`hd-added-panel hd-added-${size}`}>
        <div className="hd-matchup-list">{matchups.map(([car, vgk, note]) => <article key={car}><strong>{car}</strong><span>vs {vgk}</span><small>{note}</small></article>)}</div>
      </Panel>
    );
  }
  if (id === "shotQuality") {
    if (size === "small") return <CompactDashboardStat icon="shooting-sector" label="High-danger share" value="58%" context="11–8 chances" />;
    return (
      <Panel title="Shot Quality" icon={<HdIcon name="shooting-sector" size={17} />} className="hd-added-panel hd-added-medium">
        <div className="hd-quality-hero"><strong>58%</strong><span>High-danger chance share</span></div>
        <div className="hd-quality-grid"><div><span>CAR</span><strong>11</strong></div><div><span>VGK</span><strong>8</strong></div><div><span>Goals</span><strong>5–3</strong></div></div>
      </Panel>
    );
  }
  if (id === "restRisk") {
    const longest = [...primaryPlayers].sort((a, b) => b.toi / b.shifts - a.toi / a.shifts)[0];
    const avg = Math.round(longest.toi / longest.shifts);
    if (size === "small") return <CompactDashboardStat icon="counter" label="Rest Risk" value={`${avg}s`} context={`${longest.short} avg shift`} />;
    return (
      <Panel title="Rest Risk" icon={<HdIcon name="counter" size={17} />} className="hd-added-panel hd-added-medium">
        <div className="hd-rest-risk"><strong>{avg}s</strong><span>Longest average shift · {longest.short}</span><i><b style={{ width: `${Math.min(100, avg * 1.55)}%` }} /></i><small>Review late-game recovery before the next matchup.</small></div>
      </Panel>
    );
  }
  return null;
}

export function InteractiveDashboard() {
  const preview = useMemo(initialPreviewState, []);
  const [flow, setFlow] = useState<FlowStep>(preview.flow);
  const [page, setPage] = useState<AppPage>(preview.page);
  const [theme, setTheme] = useState<Theme>(initialThemeState);
  const [textScale, setTextScale] = useState(50);
  const [density, setDensity] = useState(100);
  const [aiPrioritization, setAiPrioritization] = useState(true);
  const [aiChat, setAiChat] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [prioStats, setPrioStats] = useState<string[]>(["SH%", "FO%", "SOG"]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidePanel, setSidePanel] = useState<"notes" | "calendar" | null>(null);
  const [detailStack, setDetailStack] = useState<StackEntry[]>([]);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiRelated, setAiRelated] = useState<AiRelatedKey | null>(null);
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayoutItem[]>(initialDashboardLayout);
  const [widgetEditMode, setWidgetEditMode] = useState(false);
  const [widgetCatalogOpen, setWidgetCatalogOpen] = useState(false);
  const [pendingWidget, setPendingWidget] = useState<{ id: DashboardWidgetId; size: DashboardWidgetSize } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggered = useRef(false);
  const sim = useGameSim();
  const database = useNhlDashboardSnapshot(GAME4_META.gameId, sim.mode === "idle" ? 3600 : sim.elapsed);
  const databaseSnapshot = database.snapshot;

  useEffect(() => {
    window.localStorage.setItem("nhl-coaching-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("nhl-dashboard-layout-v0.4", JSON.stringify(dashboardLayout));
  }, [dashboardLayout]);

  useEffect(() => () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
  }, []);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    longPressOrigin.current = null;
  };

  const isFreeDashboardTarget = (target: EventTarget | null) => {
    const element = target instanceof HTMLElement ? target : null;
    return Boolean(element && !element.closest("[data-widget], button, input, a, .hd-widget-catalog, .hd-widget-edit-toolbar"));
  };

  const onDashboardPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !isFreeDashboardTarget(event.target)) return;
    longPressTriggered.current = false;
    longPressOrigin.current = { x: event.clientX, y: event.clientY };
    if (!widgetEditMode) {
      longPressTimer.current = window.setTimeout(() => {
        longPressTriggered.current = true;
        setWidgetEditMode(true);
        setWidgetCatalogOpen(false);
        setPendingWidget(null);
      }, 560);
    }
  };

  const onDashboardPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const origin = longPressOrigin.current;
    if (!origin) return;
    if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 9) clearLongPress();
  };

  const onDashboardPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const wasTriggered = longPressTriggered.current;
    clearLongPress();
    if (widgetEditMode && !widgetCatalogOpen && !pendingWidget && !wasTriggered && isFreeDashboardTarget(event.target)) {
      setWidgetEditMode(false);
    }
    longPressTriggered.current = false;
  };

  const removeDashboardWidget = (id: DashboardWidgetId) => {
    setDashboardLayout(layout => layout.filter(item => item.id !== id));
    if (id === "ai") setAiExpanded(false);
  };

  const chooseDashboardWidget = (id: DashboardWidgetId, size: DashboardWidgetSize) => {
    setPendingWidget({ id, size });
    setWidgetCatalogOpen(false);
    setWidgetEditMode(true);
  };

  const placeDashboardWidget = (zone: DashboardWidgetZone) => {
    if (!pendingWidget || !allowedZonesForSize(pendingWidget.size).includes(zone)) return;
    setDashboardLayout(layout => [...layout.filter(item => item.id !== pendingWidget.id), { ...pendingWidget, zone }]);
    setPendingWidget(null);
  };

  const resetDashboardWidgets = () => {
    setDashboardLayout(DEFAULT_DASHBOARD_LAYOUT);
    setPendingWidget(null);
    setWidgetCatalogOpen(false);
    setAiExpanded(false);
  };

  const openDetail = (stat: DetailStat) => {
    setAiExpanded(false);
    setAiRelated(null);
    setDetailStack([{ kind: "detail", stat }]);
  };
  const liveStats: LiveStats = { toi: sim.toi, fo: sim.team.fo, sog: sim.playerSog };

  const nextFlow = () => {
    const order: FlowStep[] = ["ob1", "ob2", "ob3", "ob4", "ob5", "dashboard"];
    const index = order.indexOf(flow);
    setFlow(index >= 0 && index < order.length - 1 ? order[index + 1] : "dashboard");
  };
  const previousFlow = () => {
    const order: FlowStep[] = ["ob1", "ob2", "ob3", "ob4", "ob5"];
    const index = order.indexOf(flow);
    if (index > 0) setFlow(order[index - 1]);
  };

  const renderPage = () => {
    if (page === "Featured Insights") return <FeaturedInsightsPage theme={theme} />;
    if (page === "Player Insights") return <PlayerInsightsPage theme={theme} />;
    if (page === "Video") return <VideoPage theme={theme} />;
    if (page === "Stats") return <StatsPage theme={theme} />;
    if (page === "Notes") return <NotesPage theme={theme} />;
    if (page === "Calendar") return <CalendarPage theme={theme} prioStats={prioStats} />;
    if (page === "Preferences") {
      return (
        <PreferencesPage
          theme={theme}
          onThemeChange={setTheme}
          textScale={textScale}
          onTextScale={setTextScale}
          density={density}
          onDensity={setDensity}
          aiPrioritization={aiPrioritization}
          onAIPrioritization={setAiPrioritization}
          aiChat={aiChat}
          onAIChat={setAiChat}
          aiSuggestions={aiSuggestions}
          onAISuggestions={setAiSuggestions}
        />
      );
    }

    if (aiRelated) {
      return <AiRelatedFullView itemKey={aiRelated} onBack={() => setAiRelated(null)} />;
    }

    const activeDetail = detailStack[detailStack.length - 1];
    if (activeDetail?.kind === "detail") {
      return (
        <div className="hd-dashboard-detail">
          <WidgetDetailView
            stat={activeDetail.stat}
            onCollapse={() => setDetailStack([])}
            onOpenVideo={clip => setDetailStack([...detailStack, { kind: "video", stat: activeDetail.stat, clip }])}
            live={sim.mode === "idle" ? null : liveStats}
          />
        </div>
      );
    }
    if (activeDetail?.kind === "video") {
      return (
        <div className="hd-dashboard-detail">
          <VideoClipView
            stat={activeDetail.stat}
            clip={activeDetail.clip}
            onCollapse={() => setDetailStack(detailStack.slice(0, -1))}
            onChangeClip={clip => setDetailStack([...detailStack.slice(0, -1), { ...activeDetail, clip }])}
          />
        </div>
      );
    }

    const idle = sim.mode === "idle";
    const staalGoals = idle
      ? 2
      : GAME4_GOALS.filter(event => event.playerNum === 11 && event.elapsed <= sim.elapsed).length;
    const carShots = databaseSnapshot?.live.shotsOnGoal.away ?? (idle ? 28 : sim.team.sogCar);
    const vgkShots = databaseSnapshot?.live.shotsOnGoal.home ?? (idle ? 21 : sim.team.sogVgk);
    const carPPOpps = idle ? 3 : GAME4_PENALTIES.filter(event => event.team === "VGK" && event.elapsed <= sim.elapsed && event.elapsed !== 2310).length;
    const carPPGoals = idle ? 1 : GAME4_GOALS.filter(event => event.team === "CAR" && event.strength === "PP" && event.elapsed <= sim.elapsed).length;
    const compactValues: Partial<Record<DashboardWidgetId, { label: string; value: string; context?: string; icon?: HdIconName }>> = {
      powerPlay: { label: "Power Play", value: `${carPPGoals}/${carPPOpps}`, context: carPPOpps ? `${Math.round((carPPGoals / carPPOpps) * 100)}% conversion` : "No opportunities" },
      hits: { label: "Hits", value: idle ? "34–38" : `${sim.team.hitCar}–${sim.team.hitVgk}`, context: "CAR–VGK" },
      blocks: { label: "Blocks", value: idle ? "16–12" : `${sim.team.blockCar}–${sim.team.blockVgk}`, context: "CAR–VGK" },
      takeaways: { label: "Takeaways", value: idle ? "7–3" : `${sim.team.takeCar}–${sim.team.takeVgk}`, context: "CAR–VGK" },
      pim: { label: "PIM", value: idle ? "8–8" : `${sim.team.pimCar}–${sim.team.pimVgk}`, context: "CAR–VGK" },
    };
    const itemsFor = (zone: DashboardWidgetZone) => dashboardLayout.filter(item => item.zone === zone);
    const pendingDefinition = pendingWidget ? DASHBOARD_WIDGETS.find(widget => widget.id === pendingWidget.id) : null;
    const placementFor = (zone: DashboardWidgetZone) => pendingWidget && allowedZonesForSize(pendingWidget.size).includes(zone)
      ? <PlacementSlot zone={zone} label={pendingDefinition?.name ?? "Widget"} onPlace={() => placeDashboardWidget(zone)} />
      : null;

    const renderDashboardWidget = (item: DashboardLayoutItem) => {
      const definition = DASHBOARD_WIDGETS.find(widget => widget.id === item.id);
      let content: ReactNode = null;
      if (item.id === "toi") {
        content = (
          <Panel title="Player TOI and Rest Time" icon={<HdIcon name="player" size={17} />} className={`hd-toi-panel hd-widget-size-${item.size}`} onExpand={() => openDetail("toi")}>
            <div className="hd-toi-list">
              {primaryPlayers.map(player => {
                const databasePlayer = databaseSnapshot?.players.find(row => row.team_code === "CAR" && row.jersey_number === player.num);
                return <PlayerToi key={player.num} player={player} seconds={databasePlayer?.live_toi_seconds ?? (idle ? player.toi : sim.toi[player.num] ?? 0)} onIce={databasePlayer?.on_ice ?? (!idle && sim.onIce.has(player.num))} />;
              })}
            </div>
          </Panel>
        );
      } else if (item.id === "faceoff") {
        content = <FaceoffCard sim={sim} onExpand={() => openDetail("fo")} />;
      } else if (item.id === "shots") {
        content = <ShotsCard sim={sim} snapshot={databaseSnapshot} theme={theme} onExpand={() => openDetail("sog")} />;
      } else if (item.id === "ai") {
        content = (
          <AiPanel
            sim={sim}
            snapshot={databaseSnapshot}
            expanded={aiExpanded}
            onToggleExpanded={() => { setDetailStack([]); setAiRelated(null); setAiExpanded(value => !value); }}
            onOpenRelated={setAiRelated}
          />
        );
      } else if (item.id === "foEdge") {
        content = <ConciseStat label="Faceoff Edge" value={`${idle ? 57 : sim.team.foCarPct}%`} context={`${idle ? 29 : sim.team.foW} CAR wins`} onClick={() => openDetail("fo")} />;
      } else if (item.id === "shotsEdge") {
        content = <ConciseStat label="Shots on Goal" value={`${carShots} | ${vgkShots}`} context="CAR | VGK" onClick={() => openDetail("sog")} />;
      } else if (item.id === "goals") {
        content = <ConciseStat label="Player Goals" value={String(staalGoals)} context="Jordan Staal" onClick={() => { setAiExpanded(false); setPage("Player Insights"); }} />;
      } else if (compactValues[item.id]) {
        const stat = compactValues[item.id]!;
        content = <CompactDashboardStat icon={stat.icon} label={stat.label} value={stat.value} context={stat.context} />;
      } else {
        content = <AddedDashboardWidget id={item.id} size={item.size} sim={sim} theme={theme} />;
      }
      return (
        <WidgetEditChrome
          key={item.id}
          active={widgetEditMode}
          label={definition?.name ?? item.id}
          onRemove={() => removeDashboardWidget(item.id)}
          className={`hd-layout-widget hd-layout-widget-${item.id} hd-layout-widget-${item.size}`}
        >
          {content}
        </WidgetEditChrome>
      );
    };

    const topItems = itemsFor("top");
    const lowerItems = itemsFor("lower");
    const otherItems = itemsFor("other");
    const railItems = itemsFor("rail");
    const mainIsEmpty = !topItems.length && !lowerItems.length && !otherItems.length && !pendingWidget;

    return (
      <main
        className={`hd-dashboard${widgetEditMode ? " hd-widget-edit-mode" : ""}`}
        onPointerDown={onDashboardPointerDown}
        onPointerMove={onDashboardPointerMove}
        onPointerUp={onDashboardPointerUp}
        onPointerCancel={clearLongPress}
      >
        {widgetEditMode && (
          <div className="hd-widget-edit-toolbar">
            <button type="button" className="hd-add-widgets-button" onClick={event => { event.stopPropagation(); setWidgetCatalogOpen(true); setPendingWidget(null); }}><HdIcon name="new-note" size={16} /> Add Widgets</button>
            <span>{pendingWidget ? `Choose where to place ${pendingDefinition?.name ?? "the widget"}.` : "Tap any minus button to remove a widget. Tap free space when finished."}</span>
            <button type="button" onClick={event => { event.stopPropagation(); resetDashboardWidgets(); }}>Reset layout</button>
            <button type="button" className="hd-widget-done" onClick={event => { event.stopPropagation(); setWidgetEditMode(false); setPendingWidget(null); setWidgetCatalogOpen(false); }}>Done</button>
          </div>
        )}
        <TeamScore sim={sim} snapshot={databaseSnapshot} />
        <div className={`hd-dashboard-grid${aiExpanded ? " hd-dashboard-grid-ai-expanded" : ""}${mainIsEmpty ? " hd-dashboard-grid-main-empty" : ""}`}>
          <div className="hd-dashboard-main">
            <div className="hd-dashboard-zone hd-dashboard-zone-top">{topItems.map(renderDashboardWidget)}{placementFor("top")}</div>
            <div className="hd-dashboard-zone hd-dashboard-zone-lower">{lowerItems.map(renderDashboardWidget)}{placementFor("lower")}</div>
            {(otherItems.length > 0 || placementFor("other")) && (
              <section className="hd-other hd-dashboard-zone-other">
                <h2>Other Insights</h2>
                <div className="hd-other-row">{otherItems.map(renderDashboardWidget)}{placementFor("other")}</div>
              </section>
            )}
          </div>
          <aside className={`hd-dashboard-rail${aiExpanded ? " hd-dashboard-rail-expanded" : ""}`}>
            {(aiExpanded ? railItems.filter(item => item.id === "ai") : railItems).map(renderDashboardWidget)}
            {!aiExpanded && placementFor("rail")}
          </aside>
        </div>
        {!widgetEditMode && <span className="hd-widget-longpress-hint">Long-press free space to customize widgets</span>}
        {widgetCatalogOpen && <WidgetCatalog layout={dashboardLayout} onClose={() => setWidgetCatalogOpen(false)} onChoose={chooseDashboardWidget} />}
      </main>
    );
  };

  if (flow === "login") return <LoginScreen onLogin={() => setFlow("ob1")} />;

  return (
    <div
      className={`hd-root hd-${theme} hd-theme-${theme}`}
      style={{ "--hd-text-scale": `${0.9 + textScale / 500}` } as CSSProperties}
    >
      <header className="hd-topbar">
        <div className="hd-topbar-left">
          <button type="button" className="hd-nav-btn hd-page-button" onClick={() => setMenuOpen(true)}>
            <HdIcon name="sidebar" size={18} /> {page}
          </button>
          <button type="button" className="hd-nav-btn hd-refresh" onClick={sim.reset} aria-label="Reset demo"><RotateCw size={14} /></button>
          <DemoControls sim={sim} />
        </div>
        <div className="hd-topbar-right">
          <SearchBar />
          <button type="button" className="hd-nav-btn" onClick={() => setSidePanel(sidePanel === "notes" ? null : "notes")}><HdIcon name="notes" size={17} /> Notes</button>
          <button type="button" className="hd-nav-btn" onClick={() => setSidePanel(sidePanel === "calendar" ? null : "calendar")}><HdIcon name="calendar" size={17} /> Calendar</button>
        </div>
      </header>

      <div className="hd-pagewrap">{renderPage()}</div>

      {menuOpen && (
        <div className="hd-sidebar-scrim" onClick={() => setMenuOpen(false)}>
          <nav className="hd-sidebar" onClick={event => event.stopPropagation()} aria-label="Main navigation">
            <button className="hd-sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}><HdIcon name="close" size={18} /></button>
            <div className="hd-sidebar-primary">
              {APP_PAGES.filter(item => item !== "Preferences").map(item => (
                <button
                  type="button"
                  key={item}
                  className={page === item ? "active" : ""}
                  onClick={() => { setPage(item); setMenuOpen(false); setDetailStack([]); setAiExpanded(false); setAiRelated(null); }}
                >
                  {NAV_ICONS[item]}<span>{item}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`hd-sidebar-preferences${page === "Preferences" ? " active" : ""}`}
              onClick={() => { setPage("Preferences"); setMenuOpen(false); setDetailStack([]); setAiExpanded(false); setAiRelated(null); }}
            >
              {NAV_ICONS.Preferences}<span>Preferences</span>
            </button>
            <small>Version {NHL_DASHBOARD_VERSION}</small>
          </nav>
        </div>
      )}

      {sidePanel === "notes" && (
        <NotesSidePanel
          theme={theme}
          onClose={() => setSidePanel(null)}
          onOpenNotes={() => { setPage("Notes"); setSidePanel(null); }}
        />
      )}
      {sidePanel === "calendar" && <CalendarSidePanel theme={theme} onClose={() => setSidePanel(null)} />}

      {flow !== "dashboard" && (
        <OnboardingModal
          step={flow as ObStep}
          theme={theme}
          textScale={textScale}
          density={density}
          aiPrioritization={aiPrioritization}
          aiChat={aiChat}
          aiSuggestions={aiSuggestions}
          onNext={nextFlow}
          onBack={flow === "ob1" ? null : previousFlow}
          onThemeChange={setTheme}
          onTextScaleChange={setTextScale}
          onDensityChange={setDensity}
          onAIPrioritizationChange={setAiPrioritization}
          onAIChatChange={setAiChat}
          onAISuggestionsChange={setAiSuggestions}
          onStatsChange={setPrioStats}
        />
      )}
    </div>
  );
}

export default InteractiveDashboard;
