import type { ReactNode } from "react";
import { CircleUserRound, Play, SquareActivity, Target } from "lucide-react";
import { CAR_PLAYERS, GAME4_TEAM_TOTALS } from "./game4Data";

export type DetailStat = "toi" | "fo" | "sog";
export type StackEntry =
  | { kind: "detail"; stat: DetailStat }
  | { kind: "video"; stat: DetailStat; clip: number };

const imageBase = "/__mockup/images/hockey-dashboard/";
const videoBase = "/__mockup/videos/hockey-dashboard/";

interface ClipConfig { title: string; caption: string; src: string; poster: string; }
interface DetailConfig {
  title: string;
  subtitle: string;
  icon: ReactNode;
  cards: { title: string; sub: string; value: string }[];
  videos: ClipConfig[];
}

const clips = (group: "faceoffs" | "goals" | "shots", items: [string, string, string][]): ClipConfig[] =>
  items.map(([title, caption, slug]) => ({
    title,
    caption,
    src: `${videoBase}${group}/${slug}.mp4`,
    poster: `${imageBase}video-posters/${group}/${slug}.jpg`,
  }));

const CONFIG: Record<DetailStat, DetailConfig> = {
  toi: {
    title: "Time on Ice",
    subtitle: "Per Player · Game 4",
    icon: <CircleUserRound size={16} />,
    cards: [
      { title: "Forward leader", sub: "Nikolaj Ehlers", value: "19:09" },
      { title: "Defense leader", sub: "Jaccob Slavin", value: "24:41" },
      { title: "Team result", sub: "Stanley Cup Final · Game 4", value: "CAR 5–3 VGK" },
    ],
    videos: clips("goals", [
      ["Stankoven opens the scoring", "The second line converts at 1:06 of the first period.", "carolina-goal-1"],
      ["Blake extends the lead", "Blake finishes the Hall–Ehlers sequence at 3:28.", "carolina-goal-2"],
      ["Staal power-play finish", "Staal scores Carolina's third at 12:48.", "carolina-goal-3"],
    ]),
  },
  fo: {
    title: "Faceoff %",
    subtitle: "Per Player · Game 4",
    icon: <SquareActivity size={16} />,
    cards: [
      { title: "Team FO%", sub: "Carolina", value: "57%" },
      { title: "Team draws", sub: "Won / taken", value: "29 / 51" },
      { title: "Leader", sub: "Jordan Staal", value: "12–4" },
    ],
    videos: clips("faceoffs", [
      ["Opening center-ice faceoff", "Staal starts opposite Karlsson at 20:00.", "opening-center-ice-faceoff"],
      ["Offensive-zone faceoff", "Carolina sets its forecheck after an offensive-zone draw.", "offensive-zone-faceoff"],
      ["Draw after Carolina goal", "Neutral-zone faceoff after the opening goal.", "center-ice-faceoff-carolina-goal"],
    ]),
  },
  sog: {
    title: "Shots on Goal",
    subtitle: "Per Player · Game 4",
    icon: <Target size={16} />,
    cards: [
      { title: "Team SOG", sub: "Carolina", value: "28" },
      { title: "Opponent SOG", sub: "Vegas", value: "21" },
      { title: "Shot leader", sub: "Jordan Staal", value: "4" },
    ],
    videos: clips("shots", [
      ["Aho wrist shot", "Carolina's first official shot on goal at 0:42.", "sebastian-aho-wrist-shot"],
      ["Stankoven backhand goal", "Stankoven converts the second Carolina shot at 1:06.", "logan-stankoven-backhand-goal"],
      ["Blake wrist-shot goal", "Blake scores from 13 feet at 3:28.", "jackson-blake-wrist-shot-goal"],
    ]),
  },
};

const TITLES: Record<DetailStat, string> = { toi: "Time on Ice", fo: "Faceoff %", sog: "Shots on Goal" };

export interface LiveStats {
  toi: Record<number, number>;
  fo: Record<number, { w: number; l: number }>;
  sog: Record<number, number>;
}

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

function finalValue(player: (typeof CAR_PLAYERS)[number], stat: DetailStat): string {
  if (stat === "toi") return formatTime(player.toi);
  if (stat === "fo") {
    const wins = player.foW ?? 0;
    const losses = player.foL ?? 0;
    if (!wins && !losses) return "—";
    return `${Math.round((wins / (wins + losses)) * 100)}% (${wins}–${losses})`;
  }
  return String(player.sog);
}

function liveValue(player: (typeof CAR_PLAYERS)[number], stat: DetailStat, live: LiveStats): string {
  if (stat === "toi") return formatTime(live.toi[player.num] ?? 0);
  if (stat === "fo") {
    const result = live.fo[player.num];
    if (!result || result.w + result.l === 0) return "—";
    return `${Math.round((result.w / (result.w + result.l)) * 100)}% (${result.w}–${result.l})`;
  }
  return String(live.sog[player.num] ?? 0);
}

function CollapseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button aria-label={label} onClick={onClick} className="hd-ibtn">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5.5 1.5V5.5H1.5M9.5 1.5V5.5H13.5M13.5 9.5H9.5V13.5M1.5 9.5H5.5V13.5" />
      </svg>
    </button>
  );
}

export function WidgetDetailView({ stat, onCollapse, onOpenVideo, live }: {
  stat: DetailStat;
  onCollapse: () => void;
  onOpenVideo: (clip: number) => void;
  live?: LiveStats | null;
}) {
  const config = CONFIG[stat];
  const rows = CAR_PLAYERS.filter(player => stat !== "fo" || (player.foW ?? 0) + (player.foL ?? 0) > 0);
  return (
    <section className="hd-panel hd-detail">
      <div className="hd-panel-head">
        <span className="hd-panel-title">{config.icon}<strong>{config.title}</strong><span className="hd-detail-sub">| {config.subtitle}</span></span>
        <CollapseButton label={`Collapse ${config.title}`} onClick={onCollapse} />
      </div>
      <div className="hd-detail-list">
        {rows.map(player => (
          <div className="hd-detail-row" key={player.num}>
            <img src={`${imageBase}face${player.face}.png`} alt="" className="hd-detail-face" />
            <span className="hd-detail-num">#{player.num}</span>
            <span className="hd-detail-name">{player.name}</span>
            <strong className="hd-detail-val">{live ? liveValue(player, stat, live) : finalValue(player, stat)}</strong>
          </div>
        ))}
      </div>
      <div className="hd-detail-cards">
        {config.cards.map(card => <div className="hd-detail-card" key={card.title}><div className="hd-detail-card-head"><strong>{card.title}</strong><span>| {card.sub}</span></div><div className="hd-detail-card-val">{card.value}</div></div>)}
      </div>
      <div className="hd-detail-videos">
        {config.videos.map((video, index) => <button className="hd-video-row" key={video.title} onClick={() => onOpenVideo(index)}><span className="hd-video-row-title"><strong>Video</strong> | {video.title}</span><Play size={13} className="hd-video-row-play" /></button>)}
      </div>
      <footer className="hd-detail-source">Official Game 4 totals: CAR {GAME4_TEAM_TOTALS.CAR.shots} shots, {GAME4_TEAM_TOTALS.CAR.faceoffWins} faceoff wins.</footer>
    </section>
  );
}

export function VideoClipView({ stat, clip, onCollapse, onChangeClip }: {
  stat: DetailStat;
  clip: number;
  onCollapse: () => void;
  onChangeClip: (clip: number) => void;
}) {
  const config = CONFIG[stat];
  const selected = config.videos[Math.max(0, Math.min(config.videos.length - 1, clip))];
  return (
    <section className="hd-panel hd-detail hd-videoview">
      <div className="hd-panel-head">
        <span className="hd-panel-title">{config.icon}<strong>{config.title}</strong><span className="hd-detail-sub">| {selected.title}</span></span>
        <CollapseButton label="Back to detail view" onClick={onCollapse} />
      </div>
      <div className="hd-video-caption">{selected.caption}</div>
      <video key={selected.src} className="hd-native-video" controls preload="metadata" poster={selected.poster}>
        <source src={selected.src} type="video/mp4" />
      </video>
      <div className="hd-video-pagination">
        {config.videos.map((video, index) => <button type="button" key={video.src} className={index === clip ? "active" : ""} onClick={() => onChangeClip(index)}>{index + 1}. {video.title}</button>)}
      </div>
    </section>
  );
}

export { TITLES as DETAIL_TITLES };
