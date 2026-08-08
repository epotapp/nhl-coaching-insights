/* Player Insights — official Carolina Game 4 data, Figma-aligned widgets */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Clock,
  Crosshair,
  LineChart,
  Percent,
  Shield,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import { PagePanel, type PageProps } from "../shared";
import { ShootingBySector } from "../widgets/NewWidgets";
import { CAR_PLAYERS, type PlayerGame4 } from "../game4Data";
import { mmss } from "../gameSim";
import "./player-insights.css";

const img = "/__mockup/images/hockey-dashboard/";
type Filter = "All" | "Saved" | "Forwards" | "Defence" | "Goalies";
type WidgetKey = "sector" | "toi" | "sog" | "fo" | "points" | "impact" | "trends";
const FILTERS: Filter[] = ["All", "Saved", "Forwards", "Defence", "Goalies"];
const SAVED = new Set([20, 11, 27, 74]);

function pct(w = 0, l = 0) {
  const total = w + l;
  return total ? `${Math.round((w / total) * 100)}%` : "—";
}

function shootingPct(player: PlayerGame4) {
  return player.sog ? `${((player.goals / player.sog) * 100).toFixed(1)}%` : "0.0%";
}

export function PlayerInsightsPage({ theme }: PageProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [sortByNum, setSortByNum] = useState(false);
  const [selId, setSelId] = useState(20);
  const [expanded, setExpanded] = useState<WidgetKey | null>(null);
  const [visible, setVisible] = useState<Record<WidgetKey, boolean>>({
    sector: true,
    toi: true,
    sog: true,
    fo: true,
    points: true,
    impact: true,
    trends: true,
  });

  const filtered = useMemo(() => {
    const list = CAR_PLAYERS.filter(player => {
      if (filter === "Saved") return SAVED.has(player.num);
      if (filter === "Forwards") return player.pos === "C" || player.pos === "W";
      if (filter === "Defence") return player.pos === "D";
      if (filter === "Goalies") return player.pos === "G";
      return true;
    });
    return [...list].sort((a, b) => sortByNum
      ? a.num - b.num
      : a.name.split(" ").at(-1)!.localeCompare(b.name.split(" ").at(-1)!));
  }, [filter, sortByNum]);

  const selected = filtered.find(player => player.num === selId) ?? filtered[0] ?? CAR_PLAYERS[0];
  const foW = selected.foW ?? 0;
  const foL = selected.foL ?? 0;
  const points = selected.goals + selected.assists;

  useEffect(() => {
    if (expanded && !visible[expanded]) setExpanded(null);
  }, [expanded, visible]);

  const toggleExpand = (key: WidgetKey) => setExpanded(current => current === key ? null : key);
  const panelClass = (key: WidgetKey, normal: string) =>
    `pi-pp ${expanded === key ? "pi-span-full pi-expanded" : normal}`;

  const statCard = (key: WidgetKey, title: string, icon: ReactNode, value: string, context: string) => (
    <PagePanel
      key={key}
      icon={icon}
      title={title}
      onExpand={() => toggleExpand(key)}
      collapse={expanded === key}
      className={`${panelClass(key, "pi-span-proj")} pi-statcard`}
    >
      <div className="pi-stat-body">
        <strong>{value}</strong>
        <span>{context}</span>
      </div>
    </PagePanel>
  );

  const widgets: ReactNode[] = [];
  if (visible.sector) widgets.push(
    <PagePanel
      key="sector"
      icon={<Target size={16} />}
      title="Shooting by Sector"
      subtitle={selected.short}
      onExpand={() => toggleExpand("sector")}
      collapse={expanded === "sector"}
      className={panelClass("sector", "pi-span-sector")}
    >
      <div className="pi-sector-host"><ShootingBySector theme={theme} variant="section" playerName={selected.short} /></div>
    </PagePanel>,
  );
  if (visible.toi) widgets.push(statCard("toi", "Game TOI", <Timer size={16} />, mmss(selected.toi), `${selected.shifts} shifts`));
  if (visible.sog) widgets.push(statCard("sog", "Shots on Goal", <Crosshair size={16} />, String(selected.sog), shootingPct(selected)));
  if (visible.fo) widgets.push(statCard("fo", "Faceoff Win Rate", <Percent size={16} />, pct(foW, foL), `${foW}–${foL}`));
  if (visible.points) widgets.push(statCard("points", "Game Points", <Trophy size={16} />, String(points), `${selected.goals} G · ${selected.assists} A`));
  if (visible.impact) widgets.push(
    <PagePanel
      key="impact"
      icon={<Sparkles size={16} />}
      title="Game 4 Player Impact"
      subtitle="Official totals"
      onExpand={() => toggleExpand("impact")}
      collapse={expanded === "impact"}
      className={panelClass("impact", "pi-span-half")}
    >
      <div className="pi-python-wrap">
        <img src={`${img}charts/player-impact.png`} alt="Game 4 shots and points by Carolina player" />
        <div className="pi-chart-summary">
          <span><strong>{selected.sog}</strong> SOG</span>
          <span><strong>{points}</strong> PTS</span>
          <span><strong>{selected.shifts}</strong> SHIFTS</span>
        </div>
      </div>
    </PagePanel>,
  );
  if (visible.trends) widgets.push(
    <PagePanel
      key="trends"
      icon={<LineChart size={16} />}
      title="Game Flow"
      subtitle="CAR vs VGK"
      onExpand={() => toggleExpand("trends")}
      collapse={expanded === "trends"}
      className={panelClass("trends", "pi-span-half")}
    >
      <div className="pi-python-wrap">
        <img src={`${img}charts/season-trends.png`} alt="Game 4 flow by period" />
        <div className="pi-chart-summary">
          <span><strong>5–3</strong> FINAL</span>
          <span><strong>28–21</strong> SOG</span>
          <span><strong>57%</strong> FO</span>
        </div>
      </div>
    </PagePanel>,
  );

  const gameChips = [
    { icon: <Clock size={15} />, label: "TOI", value: mmss(selected.toi) },
    { icon: <Activity size={15} />, label: "SHIFTS", value: String(selected.shifts) },
    { icon: <Crosshair size={15} />, label: "SOG", value: String(selected.sog) },
    { icon: <Zap size={15} />, label: "G–A", value: `${selected.goals}–${selected.assists}` },
    { icon: <Shield size={15} />, label: selected.pos === "G" ? "SAVES" : "PIM", value: String(selected.saves ?? selected.pim) },
  ];

  const toggles: { key: WidgetKey; label: string; icon: ReactNode }[] = [
    { key: "sector", label: "SECTOR", icon: <Target size={15} /> },
    { key: "toi", label: "TOI", icon: <Timer size={15} /> },
    { key: "sog", label: "SOG", icon: <Crosshair size={15} /> },
    { key: "fo", label: "FO%", icon: <Percent size={15} /> },
    { key: "points", label: "POINTS", icon: <Trophy size={15} /> },
    { key: "impact", label: "IMPACT", icon: <Sparkles size={15} /> },
    { key: "trends", label: "GAME FLOW", icon: <LineChart size={15} /> },
  ];

  return (
    <div className="pi-page">
      <div className="pi-filterbar">
        {FILTERS.map(item => (
          <button key={item} className={`pi-chip${filter === item ? " pi-chip-on" : ""}`} onClick={() => setFilter(item)}>{item}</button>
        ))}
        <button className="pi-sortby" onClick={() => setSortByNum(value => !value)}>
          Sort By {sortByNum ? "#" : "Name"}<ChevronDown size={15} />
        </button>
      </div>

      <div className="pi-rail">
        {filtered.map(player => (
          <button key={player.num} className={`pi-card${player.num === selected.num ? " pi-card-on" : ""}`} onClick={() => setSelId(player.num)}>
            <span className="pi-card-num">#{player.num}</span>
            {SAVED.has(player.num) && <span className="pi-card-star"><Star size={11} fill="currentColor" /></span>}
            <img className="pi-card-portrait" src={`${img}face${player.face}.png`} alt={player.name} />
            <span className="pi-card-name">{player.short}</span>
            <span className="pi-card-pos">{player.pos}</span>
          </button>
        ))}
      </div>

      <div className="pi-grid">{widgets}</div>

      <div className="pi-statbar">
        {gameChips.map(chip => (
          <div className="pi-statbar-chip pi-statbar-avg" key={chip.label}>
            {chip.icon}<span className="pi-statbar-abbr">GAME 4 {chip.label}</span><span className="pi-statbar-value">{chip.value}</span>
          </div>
        ))}
      </div>

      <div className="pi-statbar">
        {toggles.map(item => (
          <button key={item.key} className={`pi-statbar-chip${visible[item.key] ? "" : " pi-statbar-off"}`} onClick={() => setVisible(state => ({ ...state, [item.key]: !state[item.key] }))}>
            {item.icon}<span className="pi-statbar-abbr">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
