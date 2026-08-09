import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { PagePanel, type PageProps } from "../shared";
import { HdIcon } from "../HdIcon";
import { imageBase } from "../assets";
import { ShootingBySector } from "../widgets/NewWidgets";
import {
  CAR_PLAYERS,
  CAR_SHOTS,
  GAME4_GOALS,
  GAME4_TEAM_TOTALS,
  type PlayerGame4,
} from "../game4Data";
import { mmss } from "../gameSim";
import "./player-insights.css";

const img = imageBase;
type Filter = "All" | "Saved" | "Forwards" | "Defence" | "Goalies";
type WidgetKey = "sector" | "toi" | "sog" | "fo" | "points" | "impact" | "trends";
type WidgetVariant = "compact" | "medium" | "wide" | "expanded";
const FILTERS: Filter[] = ["All", "Saved", "Forwards", "Defence", "Goalies"];
const SAVED = new Set([20, 11, 27, 74]);
const WIDGET_ORDER: WidgetKey[] = ["sector", "toi", "sog", "fo", "points", "impact", "trends"];
const STAT_WIDGETS: WidgetKey[] = ["toi", "sog", "fo", "points"];
const CHART_WIDGETS: WidgetKey[] = ["impact", "trends"];

function percentage(wins = 0, losses = 0) {
  const total = wins + losses;
  return total ? Math.round((wins / total) * 100) : 0;
}

function shootingPercentage(player: PlayerGame4) {
  return player.sog ? (player.goals / player.sog) * 100 : 0;
}

function rankFor(player: PlayerGame4, selector: (item: PlayerGame4) => number, eligible = CAR_PLAYERS) {
  const ordered = [...eligible].sort((a, b) => selector(b) - selector(a) || a.num - b.num);
  return ordered.findIndex(item => item.num === player.num) + 1;
}

function balancedRows<T>(items: T[], maxPerRow: number): T[][] {
  if (!items.length) return [];
  const rows: T[][] = [];
  let index = 0;
  while (index < items.length) {
    const remaining = items.length - index;
    const rowsLeft = Math.ceil(remaining / maxPerRow);
    const rowSize = Math.ceil(remaining / rowsLeft);
    rows.push(items.slice(index, index + rowSize));
    index += rowSize;
  }
  return rows;
}

function MetricBreakdown({ items }: { items: { label: string; value: string; emphasis?: boolean }[] }) {
  return (
    <div className="pi-metric-breakdown">
      {items.map(item => (
        <div key={item.label} className={item.emphasis ? "pi-breakdown-emphasis" : ""}>
          <span>{item.label}</span><strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function ProgressComparison({ value, benchmark, valueLabel, benchmarkLabel }: {
  value: number;
  benchmark: number;
  valueLabel: string;
  benchmarkLabel: string;
}) {
  const max = Math.max(1, value, benchmark);
  return (
    <div className="pi-comparison">
      <div><span>{valueLabel}</span><i><b style={{ width: `${Math.max(3, (value / max) * 100)}%` }} /></i><strong>{value}</strong></div>
      <div><span>{benchmarkLabel}</span><i><b style={{ width: `${Math.max(3, (benchmark / max) * 100)}%` }} /></i><strong>{benchmark}</strong></div>
    </div>
  );
}

function ExpandedMetricHero({
  value,
  label,
  progress,
  eyebrow,
  headline,
  summary,
  facts,
}: {
  value: string;
  label: string;
  progress: number;
  eyebrow: string;
  headline: string;
  summary: string;
  facts: { label: string; value: string }[];
}) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  return (
    <div className="pi-expanded-metric-hero">
      <div
        className="pi-expanded-gauge"
        style={{ background: `conic-gradient(var(--hd-accent) 0 ${safeProgress}%, var(--hd-divider) ${safeProgress}% 100%)` }}
        aria-label={`${label}: ${value}`}
      >
        <div><strong>{value}</strong><span>{label}</span></div>
      </div>
      <div className="pi-expanded-metric-copy">
        <span className="pi-expanded-eyebrow">{eyebrow}</span>
        <h3>{headline}</h3>
        <p>{summary}</p>
        <div className="pi-expanded-facts">
          {facts.map(fact => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}
        </div>
      </div>
    </div>
  );
}

function ToiContent({ player, variant }: { player: PlayerGame4; variant: WidgetVariant }) {
  const avgShift = player.shifts ? Math.round(player.toi / player.shifts) : 0;
  const rank = rankFor(player, item => item.toi, CAR_PLAYERS.filter(item => item.pos !== "G"));
  const share = Math.round((player.toi / 3600) * 100);
  if (variant === "expanded") {
    return (
      <div className="pi-metric-content pi-metric-expanded">
        <ExpandedMetricHero
          value={mmss(player.toi)}
          label="Game 4 TOI"
          progress={(player.toi / 1200) * 100}
          eyebrow="Workload and shift efficiency"
          headline={`${player.short} logged ${player.shifts} shifts with an average length of ${avgShift} seconds.`}
          summary={`The workload ranks #${rank} among Carolina skaters and represents ${share}% of the full game. Use the shift distribution below to evaluate matchup exposure and recovery windows.`}
          facts={[
            { label: "Team rank", value: `#${rank}` },
            { label: "Shifts", value: String(player.shifts) },
            { label: "Avg. shift", value: `${avgShift}s` },
          ]}
        />
        <div className="pi-expanded-support-grid">
          <MetricBreakdown items={[
            { label: "First 20-min share", value: `${Math.round((player.toi / 1200) * 100)}%`, emphasis: true },
            { label: "Full-game share", value: `${share}%` },
            { label: "Rest profile", value: avgShift >= 48 ? "Long shifts" : "Controlled" },
          ]} />
          <div className="pi-expanded-support-card">
            <strong>Usage against 20:00</strong>
            <span>{mmss(player.toi)} of a regulation-period benchmark</span>
            <div className="pi-usage-bar"><i><b style={{ width: `${Math.min(100, (player.toi / 1200) * 100)}%` }} /></i></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`pi-metric-content pi-metric-${variant}`}>
      <div className="pi-metric-primary"><strong>{mmss(player.toi)}</strong><span>Game 4 TOI · team rank #{rank}</span></div>
      <MetricBreakdown items={[
        { label: "Shifts", value: String(player.shifts), emphasis: true },
        { label: "Avg. shift", value: `${avgShift}s` },
        { label: "Game share", value: `${share}%` },
      ]} />
      <div className="pi-usage-bar"><span>Usage against 20:00</span><i><b style={{ width: `${Math.min(100, (player.toi / 1200) * 100)}%` }} /></i></div>
    </div>
  );
}

function ShotsContent({ player, variant }: { player: PlayerGame4; variant: WidgetVariant }) {
  const rate = shootingPercentage(player);
  const rank = rankFor(player, item => item.sog);
  const teamShare = Math.round((player.sog / GAME4_TEAM_TOTALS.CAR.shots) * 100);
  const teamLeader = Math.max(1, ...CAR_PLAYERS.map(item => item.sog));
  if (variant === "expanded") {
    return (
      <div className="pi-metric-content pi-metric-expanded">
        <ExpandedMetricHero
          value={String(player.sog)}
          label="Shots on goal"
          progress={(player.sog / teamLeader) * 100}
          eyebrow="Shot volume and conversion"
          headline={`${player.short} generated ${teamShare}% of Carolina's shots on goal.`}
          summary={`${player.sog} shots rank #${rank} on the team. ${player.goals ? `${player.goals} finished as ${player.goals === 1 ? "a goal" : "goals"}, producing a ${rate.toFixed(1)}% conversion rate.` : "No shot was converted, so the priority is improving location and rebound support rather than increasing raw volume alone."}`}
          facts={[
            { label: "Team rank", value: `#${rank}` },
            { label: "Goals", value: String(player.goals) },
            { label: "Conversion", value: `${rate.toFixed(1)}%` },
          ]}
        />
        <div className="pi-expanded-support-grid">
          <MetricBreakdown items={[
            { label: "Team SOG share", value: `${teamShare}%`, emphasis: true },
            { label: "CAR total", value: String(GAME4_TEAM_TOTALS.CAR.shots) },
            { label: "Per-shift rate", value: (player.sog / Math.max(1, player.shifts)).toFixed(2) },
          ]} />
          <div className="pi-expanded-support-card">
            <strong>Shot volume comparison</strong>
            <span>Player versus the Carolina skater average</span>
            <ProgressComparison value={player.sog} benchmark={Math.max(1, Math.round(GAME4_TEAM_TOTALS.CAR.shots / 18))} valueLabel={player.short} benchmarkLabel="CAR skater avg." />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`pi-metric-content pi-metric-${variant}`}>
      <div className="pi-metric-primary"><strong>{player.sog}</strong><span>Shots on goal · team rank #{rank}</span></div>
      <MetricBreakdown items={[
        { label: "Goals", value: String(player.goals), emphasis: true },
        { label: "Shooting", value: `${rate.toFixed(1)}%` },
        { label: "Team SOG share", value: `${teamShare}%` },
      ]} />
      <ProgressComparison value={player.sog} benchmark={Math.max(1, Math.round(GAME4_TEAM_TOTALS.CAR.shots / 18))} valueLabel={player.short} benchmarkLabel="CAR skater avg." />
    </div>
  );
}

function FaceoffContent({ player, variant }: { player: PlayerGame4; variant: WidgetVariant }) {
  const wins = player.foW ?? 0;
  const losses = player.foL ?? 0;
  const attempts = wins + losses;
  const rate = percentage(wins, losses);
  const teamRate = Math.round((GAME4_TEAM_TOTALS.CAR.faceoffWins / GAME4_TEAM_TOTALS.CAR.faceoffs) * 100);
  const eligible = CAR_PLAYERS.filter(item => (item.foW ?? 0) + (item.foL ?? 0) > 0);
  const rank = attempts ? rankFor(player, item => percentage(item.foW, item.foL), eligible) : 0;

  if (!attempts) {
    if (variant === "expanded") {
      const role = player.pos === "D" ? "defence" : player.pos === "G" ? "goaltending" : "wing support";
      return (
        <div className="pi-metric-content pi-metric-expanded pi-role-context">
          <ExpandedMetricHero
            value={`${teamRate}%`}
            label="Carolina FO%"
            progress={teamRate}
            eyebrow="Post-draw support context"
            headline={`${player.short} did not take a faceoff; evaluate the ${role} role around the draw.`}
            summary="The relevant coaching signal is not individual draw efficiency. Track possession recoveries, contested-puck support and the first completed play after Carolina's 29 faceoff wins."
            facts={[
              { label: "Player draws", value: "0" },
              { label: "CAR record", value: "29–22" },
              { label: "Role", value: player.pos === "D" ? "Defence" : player.pos === "G" ? "Goalie" : "Wing" },
            ]}
          />
          <div className="pi-expanded-support-grid">
            <MetricBreakdown items={[
              { label: "Team faceoffs", value: "51", emphasis: true },
              { label: "CAR wins", value: "29" },
              { label: "VGK wins", value: "22" },
            ]} />
            <div className="pi-expanded-support-card">
              <strong>Database-ready support metrics</strong>
              <span>Possession retained, first-touch wins and post-draw exits can populate this card from PostgreSQL event rows.</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={`pi-metric-content pi-metric-${variant} pi-role-context`}>
        <div className="pi-metric-primary"><strong>0</strong><span>No Game 4 faceoffs taken</span></div>
        <MetricBreakdown items={[
          { label: "Role", value: player.pos === "D" ? "Defence" : player.pos === "G" ? "Goalie" : "Wing" },
          { label: "Team FO%", value: `${teamRate}%`, emphasis: true },
          { label: "Team record", value: "29–22" },
        ]} />
        <p className="pi-context-note">Use this space for wing-support and post-draw possession data when supplied by PostgreSQL.</p>
      </div>
    );
  }

  if (variant === "expanded") {
    const delta = rate - teamRate;
    return (
      <div className="pi-metric-content pi-metric-expanded">
        <ExpandedMetricHero
          value={`${rate}%`}
          label="Faceoff win rate"
          progress={rate}
          eyebrow="Draw volume and efficiency"
          headline={`${player.short} finished ${wins}–${losses} across ${attempts} faceoffs.`}
          summary={`${rate >= teamRate ? "The performance exceeded" : "The performance trailed"} Carolina's ${teamRate}% team rate by ${Math.abs(delta)} percentage points. ${attempts >= 12 ? "The sample is large enough to influence matchup decisions." : "Use this as supporting evidence alongside zone and opponent context."}`}
          facts={[
            { label: "Efficiency rank", value: `#${rank}` },
            { label: "Attempts", value: String(attempts) },
            { label: "vs. team", value: `${delta >= 0 ? "+" : ""}${delta} pt` },
          ]}
        />
        <div className="pi-expanded-support-grid">
          <MetricBreakdown items={[
            { label: "Wins", value: String(wins), emphasis: true },
            { label: "Losses", value: String(losses) },
            { label: "CAR team FO%", value: `${teamRate}%` },
          ]} />
          <div className="pi-expanded-support-card">
            <strong>Player versus team</strong>
            <span>Faceoff efficiency, sorted for coaching relevance</span>
            <ProgressComparison value={rate} benchmark={teamRate} valueLabel={player.short} benchmarkLabel="Carolina" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`pi-metric-content pi-metric-${variant}`}>
      <div className="pi-metric-primary"><strong>{rate}%</strong><span>{wins} wins · {losses} losses · rank #{rank}</span></div>
      <MetricBreakdown items={[
        { label: "Attempts", value: String(attempts), emphasis: true },
        { label: "vs. team", value: `${rate - teamRate >= 0 ? "+" : ""}${rate - teamRate} pt` },
        { label: "Team FO%", value: `${teamRate}%` },
      ]} />
      <ProgressComparison value={rate} benchmark={teamRate} valueLabel={player.short} benchmarkLabel="Carolina" />
    </div>
  );
}

function PointsContent({ player, variant }: { player: PlayerGame4; variant: WidgetVariant }) {
  const points = player.goals + player.assists;
  const participation = Math.round((points / GAME4_TEAM_TOTALS.CAR.goals) * 100);
  const rank = rankFor(player, item => item.goals + item.assists);
  if (variant === "expanded") {
    return (
      <div className="pi-metric-content pi-metric-expanded">
        <ExpandedMetricHero
          value={String(points)}
          label="Game points"
          progress={participation}
          eyebrow="Direct scoring contribution"
          headline={`${player.short} contributed to ${participation}% of Carolina's Game 4 goals.`}
          summary={`${points} point${points === 1 ? "" : "s"} rank #${rank} on the team: ${player.goals} goal${player.goals === 1 ? "" : "s"} and ${player.assists} assist${player.assists === 1 ? "" : "s"}. The split below separates finishing from playmaking contribution.`}
          facts={[
            { label: "Team rank", value: `#${rank}` },
            { label: "Goals", value: String(player.goals) },
            { label: "Assists", value: String(player.assists) },
          ]}
        />
        <div className="pi-expanded-support-grid">
          <MetricBreakdown items={[
            { label: "Goal participation", value: `${participation}%`, emphasis: true },
            { label: "CAR goals", value: String(GAME4_TEAM_TOTALS.CAR.goals) },
            { label: "Points per SOG", value: player.sog ? (points / player.sog).toFixed(2) : "—" },
          ]} />
          <div className="pi-expanded-support-card">
            <strong>Scoring split</strong>
            <span>Goals and assists within the player's total</span>
            <div className="pi-points-split"><span style={{ flex: Math.max(1, player.goals) }}>G {player.goals}</span><span style={{ flex: Math.max(1, player.assists) }}>A {player.assists}</span></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`pi-metric-content pi-metric-${variant}`}>
      <div className="pi-metric-primary"><strong>{points}</strong><span>Game points · team rank #{rank}</span></div>
      <MetricBreakdown items={[
        { label: "Goals", value: String(player.goals), emphasis: true },
        { label: "Assists", value: String(player.assists) },
        { label: "Goal participation", value: `${participation}%` },
      ]} />
      <div className="pi-points-split"><span style={{ flex: Math.max(1, player.goals) }}>G {player.goals}</span><span style={{ flex: Math.max(1, player.assists) }}>A {player.assists}</span></div>
    </div>
  );
}

function SectorContent({ player, variant, theme }: { player: PlayerGame4; variant: WidgetVariant; theme: PageProps["theme"] }) {
  const shots = CAR_SHOTS.filter(event => event.playerNum === player.num);
  return (
    <div className={`pi-sector-content pi-sector-${variant}`}>
      <div className="pi-sector-map"><ShootingBySector theme={theme} variant="section" playerName={player.short} /></div>
      <div className="pi-sector-summary">
        <div><span>Game 4 SOG</span><strong>{player.sog}</strong></div>
        <div><span>Goals</span><strong>{player.goals}</strong></div>
        <div><span>Conversion</span><strong>{shootingPercentage(player).toFixed(1)}%</strong></div>
        <div><span>Recorded shot events</span><strong>{shots.length}</strong></div>
      </div>
      {!shots.length && <p className="pi-sector-note">No shot-on-goal location was recorded for this player; the map remains in team-context mode.</p>}
    </div>
  );
}

function ImpactContent({ player, variant }: { player: PlayerGame4; variant: WidgetVariant }) {
  const leaders = [...CAR_PLAYERS]
    .filter(item => item.pos !== "G")
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists) || b.sog - a.sog || b.toi - a.toi)
    .slice(0, variant === "compact" ? 4 : 7);
  const maxPoints = Math.max(1, ...leaders.map(item => item.goals + item.assists));
  const maxShots = Math.max(1, ...leaders.map(item => item.sog));
  return (
    <div className={`pi-impact-content pi-impact-${variant}`}>
      <div className="pi-impact-legend"><span><i />Points</span><span><i />Shots</span><small>Sorted by points, then SOG</small></div>
      <div className="pi-impact-list">
        {leaders.map(item => {
          const active = item.num === player.num;
          const points = item.goals + item.assists;
          return (
            <div key={item.num} className={active ? "active" : ""}>
              <span>#{item.num} {item.short}</span>
              <i><b style={{ width: `${(points / maxPoints) * 100}%` }} /><em style={{ width: `${(item.sog / maxShots) * 100}%` }} /></i>
              <strong>{points} P · {item.sog} S</strong>
            </div>
          );
        })}
      </div>
      <div className="pi-impact-footer"><strong>{player.goals + player.assists} points</strong><span>{player.sog} SOG · {mmss(player.toi)} TOI</span></div>
    </div>
  );
}

function TimelineContent({ player, variant }: { player: PlayerGame4; variant: WidgetVariant }) {
  const shots = CAR_SHOTS.filter(event => event.playerNum === player.num);
  const goals = GAME4_GOALS.filter(event => event.team === "CAR" && event.playerNum === player.num);
  const events = shots.map(event => ({ ...event, isGoal: goals.some(goal => goal.elapsed === event.elapsed) }));
  return (
    <div className={`pi-timeline-content pi-timeline-${variant}`}>
      <div className="pi-timeline-periods"><span>1st</span><span>2nd</span><span>3rd</span></div>
      <div className="pi-timeline-track">
        <i className="pi-period-line pi-period-line-one" /><i className="pi-period-line pi-period-line-two" />
        {events.map((event, index) => (
          <span
            key={`${event.elapsed}-${index}`}
            className={event.isGoal ? "goal" : "shot"}
            style={{ left: `${Math.min(100, (event.elapsed / 3600) * 100)}%` }}
            title={`${event.periodTime} P${event.period} · ${event.detail}`}
          />
        ))}
      </div>
      <div className="pi-timeline-summary">
        <div><strong>{events.length}</strong><span>shot events</span></div>
        <div><strong>{goals.length}</strong><span>goals</span></div>
        <div><strong>{player.shifts}</strong><span>shifts</span></div>
        <div><strong>{Math.round(player.toi / Math.max(1, player.shifts))}s</strong><span>avg. shift</span></div>
      </div>
      <div className="pi-timeline-events">
        {(events.length ? events : GAME4_GOALS.filter(event => event.team === "CAR").slice(0, 3)).slice(0, variant === "compact" ? 3 : 6).map((event, index) => (
          <div key={`${event.elapsed}-${index}`}><span>P{event.period} · {event.clock}</span><strong>{event.player ?? player.short}</strong><small>{event.detail}</small></div>
        ))}
      </div>
    </div>
  );
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
  const visibleKeys = WIDGET_ORDER.filter(key => visible[key]);

  useEffect(() => {
    if (expanded && !visible[expanded]) setExpanded(null);
  }, [expanded, visible]);

  const toggleVisible = (key: WidgetKey) => {
    setVisible(current => {
      const activeCount = Object.values(current).filter(Boolean).length;
      if (current[key] && activeCount === 1) return current;
      return { ...current, [key]: !current[key] };
    });
  };

  const renderWidget = (key: WidgetKey, variant: WidgetVariant) => {
    const common = {
      onExpand: () => setExpanded(current => current === key ? null : key),
      collapse: expanded === key,
      expandLabel: expanded === key ? "Collapse" : "Expand",
      className: `pi-widget pi-widget-${key} pi-widget-${variant}`,
    };

    if (key === "sector") return (
      <PagePanel key={key} icon={<HdIcon name="shooting-sector" size={18} />} title="Shooting by Sector" subtitle={selected.short} {...common}>
        <SectorContent player={selected} variant={variant} theme={theme} />
      </PagePanel>
    );
    if (key === "toi") return (
      <PagePanel key={key} icon={<HdIcon name="counter" size={17} />} title="Game TOI" subtitle={selected.short} {...common}>
        <ToiContent player={selected} variant={variant} />
      </PagePanel>
    );
    if (key === "sog") return (
      <PagePanel key={key} icon={<HdIcon name="player-speed" size={18} />} title="Shots on Goal" subtitle={selected.short} {...common}>
        <ShotsContent player={selected} variant={variant} />
      </PagePanel>
    );
    if (key === "fo") return (
      <PagePanel key={key} icon={<HdIcon name="head-to-head-faceoffs" size={18} />} title="Faceoff Win Rate" subtitle={selected.short} {...common}>
        <FaceoffContent player={selected} variant={variant} />
      </PagePanel>
    );
    if (key === "points") return (
      <PagePanel key={key} icon={<HdIcon name="featured" size={17} />} title="Game Points" subtitle={selected.short} {...common}>
        <PointsContent player={selected} variant={variant} />
      </PagePanel>
    );
    if (key === "impact") return (
      <PagePanel key={key} icon={<HdIcon name="sparkle" size={17} />} title="Game 4 Player Impact" subtitle="Official totals" {...common}>
        <ImpactContent player={selected} variant={variant} />
      </PagePanel>
    );
    return (
      <PagePanel key={key} icon={<HdIcon name="chart" size={17} />} title="Game Event Timeline" subtitle={selected.short} {...common}>
        <TimelineContent player={selected} variant={variant} />
      </PagePanel>
    );
  };

  const renderBalancedRow = (keys: WidgetKey[], variant: WidgetVariant, className: string) => (
    <div className={className} style={{ gridTemplateColumns: `repeat(${keys.length}, minmax(0, 1fr))` }} key={keys.join("-")}>
      {keys.map(key => renderWidget(key, variant))}
    </div>
  );

  const renderDefaultLayout = () => {
    const hasSector = visible.sector;
    const stats = STAT_WIDGETS.filter(key => visible[key]);
    const charts = CHART_WIDGETS.filter(key => visible[key]);
    return (
      <div className="pi-adaptive-layout">
        {hasSector && (
          <div className={`pi-hero-row${stats.length ? "" : " pi-hero-row-single"}`}>
            {renderWidget("sector", stats.length ? "wide" : "expanded")}
            {stats.length > 0 && (
              <div className="pi-stat-matrix">
                {balancedRows(stats, 2).map(row => renderBalancedRow(row, row.length === 1 ? "medium" : "compact", "pi-stat-matrix-row"))}
              </div>
            )}
          </div>
        )}
        {!hasSector && balancedRows(stats, 4).map(row => renderBalancedRow(row, row.length === 1 ? "wide" : row.length === 2 ? "medium" : "compact", "pi-balanced-row"))}
        {balancedRows(charts, 2).map(row => renderBalancedRow(row, row.length === 1 ? "wide" : "medium", "pi-balanced-row pi-chart-row"))}
      </div>
    );
  };

  const renderExpandedLayout = () => {
    if (!expanded) return renderDefaultLayout();
    const remaining = visibleKeys.filter(key => key !== expanded);
    const remainingStats = remaining.filter(key => STAT_WIDGETS.includes(key));
    const remainingLarge = remaining.filter(key => !STAT_WIDGETS.includes(key));
    return (
      <div className="pi-adaptive-layout pi-expanded-layout">
        {renderWidget(expanded, "expanded")}
        {balancedRows(remainingStats, 3).map(row => renderBalancedRow(row, row.length === 1 ? "wide" : row.length === 2 ? "medium" : "compact", "pi-balanced-row"))}
        {balancedRows(remainingLarge, 2).map(row => renderBalancedRow(row, row.length === 1 ? "wide" : "medium", "pi-balanced-row pi-chart-row"))}
      </div>
    );
  };

  const gameChips = [
    { icon: <HdIcon name="counter" size={16} />, label: "TOI", value: mmss(selected.toi) },
    { icon: <HdIcon name="game-pulse" size={16} />, label: "SHIFTS", value: String(selected.shifts) },
    { icon: <HdIcon name="player-speed" size={16} />, label: "SOG", value: String(selected.sog) },
    { icon: <HdIcon name="featured" size={16} />, label: "G–A", value: `${selected.goals}–${selected.assists}` },
    { icon: <HdIcon name="info" size={16} />, label: selected.pos === "G" ? "SAVES" : "PIM", value: String(selected.saves ?? selected.pim) },
  ];

  const toggles: { key: WidgetKey; label: string; icon: ReactNode }[] = [
    { key: "sector", label: "SECTOR", icon: <HdIcon name="shooting-sector" size={16} /> },
    { key: "toi", label: "TOI", icon: <HdIcon name="counter" size={16} /> },
    { key: "sog", label: "SOG", icon: <HdIcon name="player-speed" size={16} /> },
    { key: "fo", label: "FO%", icon: <HdIcon name="head-to-head-faceoffs" size={16} /> },
    { key: "points", label: "POINTS", icon: <HdIcon name="featured" size={16} /> },
    { key: "impact", label: "IMPACT", icon: <HdIcon name="sparkle" size={16} /> },
    { key: "trends", label: "TIMELINE", icon: <HdIcon name="chart" size={16} /> },
  ];

  return (
    <main className="pi-page">
      <div className="pi-filterbar">
        {FILTERS.map(item => (
          <button type="button" key={item} className={`pi-chip${filter === item ? " pi-chip-on" : ""}`} onClick={() => setFilter(item)}>{item}</button>
        ))}
        <button type="button" className="pi-sortby" onClick={() => setSortByNum(value => !value)}>
          Sort By {sortByNum ? "#" : "Name"}<ChevronDown size={15} />
        </button>
      </div>

      <div className="pi-rail">
        {filtered.map(player => (
          <button type="button" key={player.num} className={`pi-card${player.num === selected.num ? " pi-card-on" : ""}`} onClick={() => setSelId(player.num)}>
            <span className="pi-card-num">#{player.num}</span>
            {SAVED.has(player.num) && <span className="pi-card-star"><HdIcon name="bookmark" size={11} /></span>}
            <img className="pi-card-portrait" src={`${img}face${player.face}.png`} alt={player.name} />
            <span className="pi-card-name">{player.short}</span>
            <span className="pi-card-pos">{player.pos}</span>
          </button>
        ))}
      </div>

      {expanded ? renderExpandedLayout() : renderDefaultLayout()}

      <section className="pi-controls-section">
        <div className="pi-controls-label"><strong>{selected.short}</strong><span>Game 4 snapshot</span></div>
        <div className="pi-statbar pi-game-statbar">
          {gameChips.map(chip => (
            <div className="pi-statbar-chip pi-statbar-avg" key={chip.label}>
              {chip.icon}<span className="pi-statbar-abbr">{chip.label}</span><span className="pi-statbar-value">{chip.value}</span>
            </div>
          ))}
        </div>
        <div className="pi-controls-label"><strong>Visible widgets</strong><span>Remaining widgets always repack to fill the available width</span></div>
        <div className="pi-statbar pi-toggle-statbar">
          {toggles.map(item => (
            <button type="button" key={item.key} className={`pi-statbar-chip${visible[item.key] ? "" : " pi-statbar-off"}`} onClick={() => toggleVisible(item.key)}>
              {item.icon}<span className="pi-statbar-abbr">{item.label}</span><span className="pi-toggle-state">{visible[item.key] ? "On" : "Off"}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
