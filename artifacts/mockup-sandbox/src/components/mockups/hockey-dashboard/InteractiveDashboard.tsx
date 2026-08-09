import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
} from "./game4Data";
import "./v0.2-polish.css";
import "./v0.3-polish.css";
import { HdIcon } from "./HdIcon";
import { imageBase } from "./assets";

export const NHL_DASHBOARD_VERSION = "0.3.0";

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
      <button className="hd-nav-btn" type="button" onClick={sim.restart}><RotateCw size={14} /> Restart</button>
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
        <img src={`${imageBase}face${player.face}.png`} alt={player.name} className="hd-toi-face" />
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
              <img src={`${imageBase}face${player.face}.png`} alt="" />
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
  const sim = useGameSim();
  const database = useNhlDashboardSnapshot(GAME4_META.gameId, sim.mode === "idle" ? 3600 : sim.elapsed);
  const databaseSnapshot = database.snapshot;

  useEffect(() => {
    window.localStorage.setItem("nhl-coaching-theme", theme);
  }, [theme]);

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
    return (
      <main className="hd-dashboard">
        <TeamScore sim={sim} snapshot={databaseSnapshot} />
        <div className={`hd-dashboard-grid${aiExpanded ? " hd-dashboard-grid-ai-expanded" : ""}`}>
          <div className="hd-dashboard-main">
            <Panel title="Player TOI and Rest Time" icon={<HdIcon name="player" size={17} />} className="hd-toi-panel" onExpand={() => openDetail("toi")}>
              <div className="hd-toi-list">
                {primaryPlayers.map(player => {
                  const databasePlayer = databaseSnapshot?.players.find(item => item.team_code === "CAR" && item.jersey_number === player.num);
                  return (
                  <PlayerToi
                    key={player.num}
                    player={player}
                    seconds={databasePlayer?.live_toi_seconds ?? (idle ? player.toi : sim.toi[player.num] ?? 0)}
                    onIce={databasePlayer?.on_ice ?? (!idle && sim.onIce.has(player.num))}
                  />
                  );
                })}
              </div>
            </Panel>
            <div className="hd-lower-grid">
              <FaceoffCard sim={sim} onExpand={() => openDetail("fo")} />
              <ShotsCard sim={sim} snapshot={databaseSnapshot} theme={theme} onExpand={() => openDetail("sog")} />
            </div>
            <OtherInsights sim={sim} />
          </div>
          <aside className={`hd-dashboard-rail${aiExpanded ? " hd-dashboard-rail-expanded" : ""}`}>
            <AiPanel
              sim={sim}
              snapshot={databaseSnapshot}
              expanded={aiExpanded}
              onToggleExpanded={() => { setDetailStack([]); setAiRelated(null); setAiExpanded(value => !value); }}
              onOpenRelated={setAiRelated}
            />
            {!aiExpanded && (
              <>
                <ConciseStat
                  label="Faceoff Edge"
                  value={`${idle ? 57 : sim.team.foCarPct}%`}
                  context={`${idle ? 29 : sim.team.foW} CAR wins`}
                  onClick={() => openDetail("fo")}
                />
                <ConciseStat
                  label="Shots on Goal"
                  value={`${databaseSnapshot?.live.shotsOnGoal.away ?? (idle ? 28 : sim.team.sogCar)} | ${databaseSnapshot?.live.shotsOnGoal.home ?? (idle ? 21 : sim.team.sogVgk)}`}
                  context="CAR | VGK"
                  onClick={() => openDetail("sog")}
                />
                <ConciseStat
                  label="Player Goals"
                  value={String(staalGoals)}
                  context="Jordan Staal"
                  onClick={() => { setAiExpanded(false); setPage("Player Insights"); }}
                />
              </>
            )}
          </aside>
        </div>
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
