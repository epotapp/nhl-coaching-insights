import { useMemo, useState, type ReactNode } from "react";
import { Activity, CircleUserRound, Play, Target, Users } from "lucide-react";
import type { PageProps } from "../shared";
import { PagePanel } from "../shared";
import { CAR_FACEOFFS, CAR_PLAYERS, GAME4_TEAM_TOTALS, VGK_FACEOFFS } from "../game4Data";
import "./featured.css";

const imageBase = "/__mockup/images/hockey-dashboard/";
const videoBase = "/__mockup/videos/hockey-dashboard/";

type VideoGroup = "Faceoffs" | "Goals" | "Shots";
type WidgetId = "video" | "faceoffs" | "sectors" | "lineup" | "flow" | "impact" | "goals";
type ExpandState = { id: WidgetId; level: 1 | 2 } | null;

interface ClipItem {
  title: string;
  subtitle: string;
  file: string;
  poster: string;
}

const CLIPS: Record<VideoGroup, ClipItem[]> = {
  Faceoffs: [
    ["Opening center-ice faceoff", "P1 20:00 · Staal vs Karlsson", "opening-center-ice-faceoff"],
    ["Offensive-zone draw", "P1 19:00 · Stankoven wins", "offensive-zone-faceoff"],
    ["Center draw after Carolina goal", "P1 18:54 · neutral zone", "center-ice-faceoff-carolina-goal"],
    ["Center draw after Vegas goal", "P1 12:38 · neutral zone", "center-ice-faceoff-vegas-goal"],
    ["Center draw after Carolina goal", "P1 07:12 · neutral zone", "center-ice-faceoff-carolina-goal-3"],
  ].map(([title, subtitle, slug]) => ({
    title,
    subtitle,
    file: `${videoBase}faceoffs/${slug}.mp4`,
    poster: `${imageBase}video-posters/faceoffs/${slug}.jpg`,
  })),
  Goals: [
    ["Stankoven opens the scoring", "P1 18:54 · CAR 1–0", "carolina-goal-1"],
    ["Blake extends the lead", "P1 16:32 · CAR 2–0", "carolina-goal-2"],
    ["Stone answers on transition", "P1 12:38 · CAR 2–1", "vegas-goal-1"],
    ["Staal power-play finish", "P1 07:12 · CAR 3–1", "carolina-goal-3"],
  ].map(([title, subtitle, slug]) => ({
    title,
    subtitle,
    file: `${videoBase}goals/${slug}.mp4`,
    poster: `${imageBase}video-posters/goals/${slug}.jpg`,
  })),
  Shots: [
    ["Sebastian Aho wrist shot", "P1 19:18 · on goal", "sebastian-aho-wrist-shot"],
    ["Logan Stankoven backhand goal", "P1 18:54 · goal", "logan-stankoven-backhand-goal"],
    ["Jackson Blake wrist-shot goal", "P1 16:32 · goal", "jackson-blake-wrist-shot-goal"],
    ["Mark Stone breakaway goal", "P1 12:38 · goal", "mark-stone-breakaway-goal"],
    ["Staal rebound power-play goal", "P1 07:12 · goal", "jordan-staal-rebound-pp-goal"],
    ["Taylor Hall late chance", "P1 00:22 · on goal", "taylor-hall-breakaway"],
    ["Vegas shot, no goal", "P1 00:13 · video review", "vegas-shot-no-goal"],
    ["Stone shorthanded breakaway", "P1 16:48 · CAR power play", "mark-stone-shorthanded-breakaway"],
  ].map(([title, subtitle, slug]) => ({
    title,
    subtitle,
    file: `${videoBase}shots/${slug}.mp4`,
    poster: `${imageBase}video-posters/shots/${slug}.jpg`,
  })),
};

function FaceoffScoreboard({ full = false }: { full?: boolean }) {
  const total = GAME4_TEAM_TOTALS.CAR.faceoffs;
  const car = GAME4_TEAM_TOTALS.CAR.faceoffWins;
  const vgk = GAME4_TEAM_TOTALS.VGK.faceoffWins;
  return (
    <div className={`fi-h2h-score${full ? " fi-h2h-score-full" : ""}`}>
      <div className="fi-h2h-end">
        <img src={`${imageBase}canes.png`} alt="Carolina Hurricanes" />
        <strong>{car}</strong>
        <span>CAR wins</span>
      </div>
      <div className="fi-h2h-center">
        <span>Head to Head</span>
        <strong>{total}</strong>
        <small>Total faceoffs</small>
      </div>
      <div className="fi-h2h-end">
        <img src={`${imageBase}vgk.png`} alt="Vegas Golden Knights" />
        <strong>{vgk}</strong>
        <span>VGK wins</span>
      </div>
    </div>
  );
}

function ClipReview({ full = false }: { full?: boolean }) {
  const [group, setGroup] = useState<VideoGroup>("Faceoffs");
  const [active, setActive] = useState(0);
  const clips = CLIPS[group];
  const selected = clips[Math.min(active, clips.length - 1)];
  const changeGroup = (next: VideoGroup) => { setGroup(next); setActive(0); };

  return (
    <div className={`fi-video-review${full ? " fi-video-full" : ""}`}>
      <div className="fi-video-tabs" role="tablist" aria-label="Video categories">
        {(Object.keys(CLIPS) as VideoGroup[]).map(name => (
          <button type="button" key={name} className={group === name ? "active" : ""} onClick={() => changeGroup(name)}>{name}</button>
        ))}
      </div>
      <video key={selected.file} className="fi-main-video" controls preload="metadata" poster={selected.poster}>
        <source src={selected.file} type="video/mp4" />
      </video>
      <div className="fi-team-timeline" aria-label="Game timeline">
        <img src={`${imageBase}canes.png`} alt="" /><span><i/><i/><i/><i/><i/></span>
        <img src={`${imageBase}vgk.png`} alt="" /><span><i/><i/><i/></span>
      </div>
      <div className="fi-clip-list">
        {clips.map((clip, index) => (
          <button type="button" key={clip.file} className={active === index ? "active" : ""} onClick={() => setActive(index)}>
            <img src={clip.poster} alt="" />
            <span><strong>{clip.title}</strong><small>{clip.subtitle}</small></span>
            <Play size={16} fill="currentColor" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SectorContent({ full = false }: { full?: boolean }) {
  return (
    <div className={`fi-sector${full ? " fi-sector-full" : ""}`}>
      <img src={`${imageBase}shooting-by-sector-layout.png`} alt="Shooting by sector layout" />
      {full && (
        <div className="fi-sector-summary">
          <div><strong>28</strong><span>Total CAR shots</span></div>
          <div><strong>8</strong><span>Slot attempts</span></div>
          <div><strong>50.0%</strong><span>Best sector conversion</span></div>
        </div>
      )}
    </div>
  );
}

function LineupAnalyzer({ full = false }: { full?: boolean }) {
  const players = [11, 24, 27, 74].map(num => CAR_PLAYERS.find(player => player.num === num)!).filter(Boolean);
  return (
    <div className={`fi-lineup${full ? " fi-lineup-full" : ""}`}>
      <div className="fi-lineup-players">
        {players.map(player => (
          <div key={player.num}>
            <img src={`${imageBase}face${player.face}.png`} alt={player.name} />
            <span><strong>#{player.num} {player.short}</strong><small>{player.pos} · {Math.floor(player.toi / 60)}:{String(player.toi % 60).padStart(2, "0")}</small></span>
          </div>
        ))}
      </div>
      <div className="fi-lineup-metrics">
        <label><span>Faceoff control</span><i><b style={{ width: "75%" }} /></i><strong>75%</strong></label>
        <label><span>Shot share</span><i><b style={{ width: "57%" }} /></i><strong>57%</strong></label>
        <label><span>Goals for</span><i><b style={{ width: "67%" }} /></i><strong>4–2</strong></label>
      </div>
    </div>
  );
}

function MiniChart({ source, alt, value }: { source: string; alt: string; value?: string }) {
  return (
    <div className="fi-mini-content">
      <img src={`${imageBase}charts/${source}`} alt={alt} />
      {value && <strong>{value}</strong>}
    </div>
  );
}

function FaceoffTable({ side }: { side: "CAR" | "VGK" }) {
  const rows = side === "CAR" ? CAR_FACEOFFS : VGK_FACEOFFS;
  return (
    <div className={`fi-fo-table fi-fo-${side.toLowerCase()}`}>
      <header><span>#</span><span>Player</span><span>Hand</span><span>FO</span><span>FOW</span><span>FO%</span></header>
      <div className="fi-fo-total"><span>—</span><strong>{side} Totals</strong><span>—</span><span>51</span><span>{side === "CAR" ? 29 : 22}</span><span>{side === "CAR" ? "57%" : "43%"}</span></div>
      {rows.map(row => {
        const pct = Math.round((row.wins / Math.max(1, row.fo)) * 100);
        return (
          <div key={`${side}-${row.num}`}>
            <span>{row.num}</span><strong>{row.name}</strong><span>{row.hand}</span><span>{row.fo}</span><span>{row.wins}</span><span className={pct >= 50 ? "positive" : "negative"}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function RinkFaceoffs() {
  // Official NHL Face-off Summary FS030414. The seven markers retain the
  // approved rink composition while displaying exact Game 4 zone/strength splits.
  const zones = [
    ["Offensive zone · 5v5", "58%", "7/12"],
    ["Offensive zone · power play", "33%", "1/3"],
    ["Offensive zone · total", "50%", "8/16"],
    ["Neutral zone · total", "44%", "8/18"],
    ["Defensive zone · total", "76%", "13/17"],
    ["Defensive zone · penalty kill", "80%", "4/5"],
    ["Defensive zone · 4v4", "100%", "1/1"],
  ];
  return (
    <div className="fi-rink">
      <span className="fi-rink-label top">Offensive Zone</span>
      <span className="fi-rink-label bottom">Defensive Zone</span>
      {zones.map(([name, pct, fraction], index) => (
        <div key={name} className={`fi-zone fi-zone-${index + 1}`} title={name}><strong>{pct}</strong><span>{fraction}</span></div>
      ))}
    </div>
  );
}

function FullFaceoffComparison() {
  return (
    <div className="fi-h2h-full">
      <div className="fi-h2h-filterbar">
        <div><button className="active">Game 4</button><button>Series</button><button>Playoffs</button></div>
        <div><button className="active">All</button><button>1st</button><button>2nd</button><button>3rd</button></div>
        <div><button>5 Clips</button><button>Reset</button></div>
      </div>
      <div className="fi-h2h-subfilters">
        <span><button className="active">All</button><button>LH</button><button>RH</button></span>
        <span><button className="active">All</button><button>EV</button><button>5v5</button><button>PP</button><button>PK</button><button>4v4</button></span>
        <span><button className="active">All</button><button>LH</button><button>RH</button></span>
      </div>
      <div className="fi-h2h-comparison">
        <FaceoffTable side="CAR" />
        <RinkFaceoffs />
        <FaceoffTable side="VGK" />
      </div>
    </div>
  );
}

interface WidgetConfig {
  id: WidgetId;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  className: string;
  render: (full?: boolean) => ReactNode;
}

export function FeaturedInsightsPage(_: PageProps) {
  const [expanded, setExpanded] = useState<ExpandState>(null);

  const widgets = useMemo<WidgetConfig[]>(() => [
    { id: "video", title: "Game 4 Video Review", subtitle: "Faceoffs · Goals · Shots", icon: <Play size={16} />, className: "fi-video-card", render: full => <ClipReview full={full} /> },
    { id: "faceoffs", title: "Head to Head Faceoffs", subtitle: "Game 4", icon: <Users size={16} />, className: "fi-faceoff-card", render: full => full ? <FullFaceoffComparison /> : <FaceoffScoreboard /> },
    { id: "sectors", title: "Shooting by Sector", subtitle: "CAR shots", icon: <Target size={16} />, className: "fi-sector-card", render: full => <SectorContent full={full} /> },
    { id: "lineup", title: "Lineup Analyzer", subtitle: "Current Lineup", icon: <CircleUserRound size={16} />, className: "fi-lineup-card", render: full => <LineupAnalyzer full={full} /> },
    { id: "flow", title: "Game Flow", subtitle: "Shots by time", icon: <Activity size={16} />, className: "fi-mini-card", render: () => <MiniChart source="game-flow.png" alt="Cumulative shot flow" /> },
    { id: "impact", title: "Player Impact", subtitle: "Points and SOG", icon: <Activity size={16} />, className: "fi-mini-card", render: () => <MiniChart source="player-impact.png" alt="Player impact" /> },
    { id: "goals", title: "Final Score", subtitle: "Game 4", icon: <Target size={16} />, className: "fi-mini-card", render: () => <MiniChart source="team-comparison.png" alt="Team comparison" value="CAR 5–3 VGK" /> },
  ], []);

  const handleExpand = (id: WidgetId) => {
    setExpanded(current => {
      if (!current || current.id !== id) return { id, level: 1 };
      if (current.level === 1) return { id, level: 2 };
      return { id, level: 1 };
    });
  };

  const renderPanel = (widget: WidgetConfig, full = false, extraClass = "") => (
    <PagePanel
      key={widget.id}
      icon={widget.icon}
      title={widget.title}
      subtitle={widget.subtitle}
      className={`${widget.className} ${extraClass}`.trim()}
      onExpand={() => handleExpand(widget.id)}
      expandLabel={expanded?.id === widget.id && expanded.level === 1 ? "Expand to full screen" : "Expand"}
      collapse={expanded?.id === widget.id && expanded.level === 2}
    >
      {widget.render(full)}
    </PagePanel>
  );

  if (expanded?.level === 2) {
    const selected = widgets.find(widget => widget.id === expanded.id)!;
    return <main className="fi-page fi-full-page">{renderPanel(selected, true, "fi-full-widget")}</main>;
  }

  if (expanded?.level === 1) {
    const selected = widgets.find(widget => widget.id === expanded.id)!;
    const remaining = widgets.filter(widget => widget.id !== expanded.id);
    return (
      <main className="fi-page fi-expanded-page">
        {renderPanel(selected, false, "fi-selected-widget")}
        <div className="fi-reflow-grid">{remaining.map(widget => renderPanel(widget))}</div>
      </main>
    );
  }

  const [video, faceoffs, sectors, lineup, flow, impact, goals] = widgets;
  return (
    <main className="fi-page fi-default-page">
      {renderPanel(video)}
      <div className="fi-right-stack">
        <div className="fi-top-row">{renderPanel(faceoffs)}{renderPanel(sectors)}</div>
        {renderPanel(lineup)}
        <div className="fi-bottom-row">{renderPanel(flow)}{renderPanel(impact)}{renderPanel(goals)}</div>
      </div>
    </main>
  );
}
