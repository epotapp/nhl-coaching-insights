import type { ReactNode } from "react";
import { HdIcon, type HdIconName } from "../HdIcon";
import { imageBase } from "../assets";
import type { DashboardWidgetId, DashboardWidgetSize } from "../DashboardCustomization";
import {
  CAR_TEAM_ID,
  VGK_TEAM_ID,
  type BackendPlayer,
  type BackendSimState,
  type BackendWidgets,
  type FaceoffMatchupRow,
  type GamePulseRow,
  type GoalieRow,
  type ShootingSectorRow,
  type VideoMomentRow,
  type WorkloadRow,
} from "../data/nhlBackend";

interface ConnectedWidgetProps {
  id: DashboardWidgetId;
  size: DashboardWidgetSize;
  sim: BackendSimState | null;
  widgets: BackendWidgets | null;
}

const pct = (value: number | null | undefined) => value == null ? "—" : `${(value * 100).toFixed(1)}%`;
const shortName = (name: string | null | undefined) => name?.split(" ").at(-1) ?? "Team";
const titleCase = (value: string) => value.split("_").map(word => word[0]?.toUpperCase() + word.slice(1)).join(" ");
const teamLabel = (teamId: number | null | undefined) => teamId === CAR_TEAM_ID ? "CAR" : teamId === VGK_TEAM_ID ? "VGK" : "NHL";

function WidgetPanel({ title, icon, source, className = "", children }: {
  title: string;
  icon: HdIconName;
  source: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`hd-panel hd-connected-panel ${className}`}>
      <header className="hd-panel-head">
        <span className="hd-panel-title"><HdIcon name={icon} size={17} /><strong>{title}</strong></span>
        <span className="hd-widget-source">{source}</span>
      </header>
      {children}
    </section>
  );
}

function Compact({ icon, label, value, context }: { icon: HdIconName; label: string; value: string; context: string }) {
  return (
    <article className="hd-custom-compact hd-connected-compact">
      <HdIcon name={icon} size={15} />
      <div><span>{label}</span><strong>{value}</strong><small>{context}</small></div>
    </article>
  );
}

const pulseFallback: GamePulseRow[] = [
  { teamId: CAR_TEAM_ID, attempts: 1, sog: 1, goals: 1, xg: 0.058, hits: 2, takeaways: 2, windowSeconds: 300 },
  { teamId: VGK_TEAM_ID, attempts: 4, sog: 2, goals: 0, xg: 0.302, hits: 1, takeaways: 0, windowSeconds: 300 },
];

function pulseScore(row: GamePulseRow) {
  return row.attempts + row.sog * 1.5 + row.goals * 4 + row.xg * 4 + row.hits * 0.5 + row.takeaways;
}

function GamePulse({ rows, compact = false }: { rows: GamePulseRow[]; compact?: boolean }) {
  const car = rows.find(row => row.teamId === CAR_TEAM_ID) ?? pulseFallback[0];
  const vgk = rows.find(row => row.teamId === VGK_TEAM_ID) ?? pulseFallback[1];
  const carScore = pulseScore(car);
  const vgkScore = pulseScore(vgk);
  const max = Math.max(1, carScore, vgkScore);
  if (compact) {
    const leader = carScore >= vgkScore ? "CAR" : "VGK";
    return <Compact icon="game-pulse" label="Game Pulse" value={leader} context={`${car.attempts}–${vgk.attempts} attempts · last 5 min`} />;
  }
  return (
    <div className="hd-pulse-widget">
      {[car, vgk].map(row => (
        <div className="hd-pulse-team" key={row.teamId}>
          <span className={`hd-team-dot team-${teamLabel(row.teamId).toLowerCase()}`} />
          <strong>{teamLabel(row.teamId)}</strong>
          <div className="hd-pulse-track"><i style={{ width: `${(pulseScore(row) / max) * 100}%` }} /></div>
          <span>{row.attempts} ATT</span><span>{row.sog} SOG</span><span>{row.xg.toFixed(2)} xG</span>
        </div>
      ))}
      <small>Rolling five-minute pressure window</small>
    </div>
  );
}

function ShotSectors({ rows, useBundledFallback = false }: { rows: ShootingSectorRow[]; useBundledFallback?: boolean }) {
  const carRows = rows.filter(row => row.teamId === CAR_TEAM_ID).sort((a, b) => b.estimatedXg - a.estimatedXg).slice(0, 5);
  const fallback: ShootingSectorRow[] = [
    { teamId: CAR_TEAM_ID, sector: "crease", attempts: 8, shotsOnGoal: 6, goals: 2, estimatedXg: 2.66, shootingPct: 33.3 },
    { teamId: CAR_TEAM_ID, sector: "inner_slot", attempts: 14, shotsOnGoal: 7, goals: 3, estimatedXg: 2.222, shootingPct: 42.9 },
    { teamId: CAR_TEAM_ID, sector: "outer_slot", attempts: 7, shotsOnGoal: 3, goals: 0, estimatedXg: 0.236, shootingPct: 0 },
  ];
  const values = carRows.length ? carRows : useBundledFallback ? fallback : [];
  if (!values.length) {
    return <div className="hd-connected-empty"><HdIcon name="shooting-sector" size={18} /><strong>Awaiting the first tracked shot</strong><span>Sector xG and shot volume will populate from live event coordinates.</span></div>;
  }
  const max = Math.max(...values.map(row => row.estimatedXg), 0.1);
  return (
    <div className="hd-sector-widget">
      {values.map(row => (
        <div key={row.sector}>
          <span>{titleCase(row.sector)}</span>
          <i><b style={{ width: `${Math.max(4, (row.estimatedXg / max) * 100)}%` }} /></i>
          <strong>{row.estimatedXg.toFixed(2)}</strong>
          <small>{row.goals}G · {row.shotsOnGoal} SOG</small>
        </div>
      ))}
    </div>
  );
}

function FaceoffMatchups({ rows }: { rows: FaceoffMatchupRow[] }) {
  const normalized = rows.map(row => row.playerA.teamId === CAR_TEAM_ID
    ? { car: row.playerA, vgk: row.playerB, total: row.total }
    : { car: row.playerB, vgk: row.playerA, total: row.total })
    .filter(row => row.car.teamId === CAR_TEAM_ID && row.vgk.teamId === VGK_TEAM_ID)
    .slice(0, 4);
  return (
    <div className="hd-h2h-widget">
      {(normalized.length ? normalized : [
        { car: { name: "Jordan Staal", wins: 4, pct: 66.7 }, vgk: { name: "Tomas Hertl", wins: 2, pct: 33.3 }, total: 6 },
        { car: { name: "Sebastian Aho", wins: 2, pct: 40 }, vgk: { name: "Jack Eichel", wins: 3, pct: 60 }, total: 5 },
      ]).map(row => (
        <article key={`${row.car.name}-${row.vgk.name}`}>
          <div><strong>{shortName(row.car.name)}</strong><small>CAR</small></div>
          <span><b style={{ width: `${row.car.pct ?? 50}%` }} /></span>
          <em>{row.car.wins}–{row.vgk.wins}</em>
          <div className="hd-h2h-away"><strong>{shortName(row.vgk.name)}</strong><small>VGK</small></div>
        </article>
      ))}
    </div>
  );
}

function formatElapsed(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function currentGoalieRows(rows: GoalieRow[], sim: BackendSimState | null) {
  if (!sim || sim.elapsedSeconds >= sim.maxElapsedSeconds) return rows;
  return rows.map(goalie => {
    if (!goalie.starter) return goalie;
    const shotsAgainst = goalie.teamId === CAR_TEAM_ID ? sim.team.sogVgk : sim.team.sogCar;
    const goalsAgainst = goalie.teamId === CAR_TEAM_ID ? sim.score.vgk : sim.score.car;
    const saves = Math.max(0, shotsAgainst - goalsAgainst);
    return {
      ...goalie,
      decision: null,
      timeOnIce: formatElapsed(Math.min(sim.elapsedSeconds, goalie.teamId === VGK_TEAM_ID ? 3495 : 3600)),
      shotsAgainst,
      saves,
      goalsAgainst,
      savePct: shotsAgainst > 0 ? saves / shotsAgainst : null,
    };
  });
}

function Goalies({ rows }: { rows: GoalieRow[] }) {
  const starters = rows.filter(row => row.starter).slice(0, 2);
  return (
    <div className="hd-goalie-widget">
      {starters.map(goalie => (
        <article key={goalie.playerId}>
          <img src={goalie.headshot || `${imageBase}${goalie.teamAbbrev === "CAR" ? "canes" : "vgk"}.png`} alt="" />
          <div><span>{goalie.teamAbbrev} · {goalie.decision ?? "Starter"}</span><strong>{goalie.name}</strong><small>{goalie.saves}/{goalie.shotsAgainst} saves · {goalie.timeOnIce}</small></div>
          <em>{pct(goalie.savePct)}</em>
        </article>
      ))}
    </div>
  );
}

function Lineup({ players, onIceIds }: { players: BackendPlayer[]; onIceIds: number[] }) {
  const active = players.filter(player => onIceIds.includes(player.playerId) || player.onIce);
  const candidates = active.length ? active : [...players].filter(player => player.position !== "G").sort((a, b) => b.toiSeconds - a.toiSeconds).slice(0, 10);
  const side = (teamId: number) => candidates.filter(player => player.teamId === teamId).slice(0, 5);
  return (
    <div className="hd-lineup-widget">
      {[CAR_TEAM_ID, VGK_TEAM_ID].map(teamId => (
        <section key={teamId}>
          <header><img src={`${imageBase}${teamId === CAR_TEAM_ID ? "canes" : "vgk"}.png`} alt="" /><strong>{teamLabel(teamId)}</strong><span>{active.length ? "On ice" : "TOI leaders"}</span></header>
          <div>{side(teamId).map(player => <span key={player.playerId}><b>#{player.sweaterNumber}</b>{shortName(player.name)}<small>{player.position}</small></span>)}</div>
        </section>
      ))}
    </div>
  );
}

function Workload({ rows }: { rows: WorkloadRow[] }) {
  const carRows = rows.filter(row => row.teamId === CAR_TEAM_ID).slice(0, 5);
  return (
    <div className="hd-workload-widget">
      {(carRows.length ? carRows : [
        { playerId: 1, name: "Jaccob Slavin", toi: "24:41", rest: "00:55", restSeconds: 55, risk: "normal" as const },
        { playerId: 2, name: "K'Andre Miller", toi: "22:45", rest: "00:00", restSeconds: 0, risk: "high" as const },
      ]).map(row => (
        <article key={row.playerId} className={row.risk === "high" ? "is-high" : ""}>
          <span className="hd-workload-risk" />
          <div><strong>{row.name}</strong><small>{row.toi} TOI</small></div>
          <em>{row.rest ?? "—"}<small>rest</small></em>
        </article>
      ))}
    </div>
  );
}

function VideoMoments({ rows }: { rows: VideoMomentRow[] }) {
  const moments = rows.slice(0, 4);
  const openMoment = (row: VideoMomentRow) => {
    const url = typeof row.details.highlightClipSharingUrl === "string" ? row.details.highlightClipSharingUrl : null;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <div className="hd-moments-widget">
      {moments.map(row => (
        <button type="button" key={row.eventId} onClick={() => openMoment(row)} disabled={typeof row.details.highlightClipSharingUrl !== "string"}>
          <HdIcon name={row.type === "goal" ? "play" : "video"} size={14} />
          <span><strong>{row.playerName ?? titleCase(row.type)}</strong><small>P{row.period} · {row.timeInPeriod} · {row.sector ? titleCase(row.sector) : "game event"}</small></span>
          <em>{row.estimatedXg == null ? row.type.toUpperCase() : `${row.estimatedXg.toFixed(2)} xG`}</em>
        </button>
      ))}
    </div>
  );
}

export function ConnectedWidget({ id, size, sim, widgets }: ConnectedWidgetProps) {
  const source = widgets ? "LIVE DATA" : "BUNDLED";
  const pulseRows = widgets?.gamePulse.rows ?? pulseFallback;
  const sectorRows = widgets?.shootingBySector.rows ?? [];
  const workloadRows = widgets?.restAndWorkload.rows ?? [];
  const lineupRows = widgets?.lineupAnalyzer.rows ?? sim?.players ?? [];
  const onIceIds = widgets?.lineupAnalyzer.onIcePlayerIds ?? [];
  const moments = widgets?.videoMoments.rows ?? [];
  const teams = widgets?.shotsOnGoal.teams ?? [];
  const car = teams.find(team => team.teamId === CAR_TEAM_ID);
  const vgk = teams.find(team => team.teamId === VGK_TEAM_ID);

  if (id === "gamePulse" || id === "gameFlow") {
    if (size === "small") return <GamePulse rows={pulseRows} compact />;
    return <WidgetPanel title={id === "gameFlow" ? "Game Flow" : "Game Pulse"} icon="game-pulse" source={source}><GamePulse rows={pulseRows} /></WidgetPanel>;
  }
  if (id === "shotMap") {
    return <WidgetPanel title="Shooting by Sector" icon="shooting-sector" source={source}><ShotSectors rows={sectorRows} useBundledFallback={!widgets} /></WidgetPanel>;
  }
  if (id === "faceoffMatchups") {
    return <WidgetPanel title="Head-to-Head Faceoffs" icon="head-to-head-faceoffs" source={source}><FaceoffMatchups rows={widgets?.headToHeadFaceoffs.rows ?? []} /></WidgetPanel>;
  }
  if (id === "goalies") {
    const goalies = currentGoalieRows(widgets?.goaltending.rows ?? [], sim);
    if (size === "small") {
      const carGoalie = goalies.find(row => row.teamId === CAR_TEAM_ID && row.starter);
      return <Compact icon="goalie-pull" label="Goaltending" value={pct(carGoalie?.savePct)} context={carGoalie ? `${carGoalie.saves}/${carGoalie.shotsAgainst} · ${shortName(carGoalie.name)}` : "Game 4 starters"} />;
    }
    return <WidgetPanel title="Goaltending" icon="goalie-pull" source={source}><Goalies rows={goalies} /></WidgetPanel>;
  }
  if (id === "videoMoments") {
    return <WidgetPanel title="Video Moments" icon="video" source={source}><VideoMoments rows={moments} /></WidgetPanel>;
  }
  if (id === "lineupAnalyzer" || id === "lineMatchups") {
    return <WidgetPanel title={id === "lineMatchups" ? "Line Matchups" : "Lineup Analyzer"} icon="lineup-analyzer" source={source}><Lineup players={lineupRows} onIceIds={onIceIds} /></WidgetPanel>;
  }
  if (id === "workload" || id === "restRisk") {
    const carRisk = workloadRows.filter(row => row.teamId === CAR_TEAM_ID && row.risk === "high");
    if (size === "small") return <Compact icon="counter" label="Rest Risk" value={String(carRisk.length)} context={carRisk.length === 1 ? "player flagged" : "players flagged"} />;
    return <WidgetPanel title={id === "restRisk" ? "Rest Risk" : "Shift Workload"} icon="counter" source={source}><Workload rows={workloadRows} /></WidgetPanel>;
  }
  if (id === "shotQuality") {
    const carSectors = sectorRows.filter(row => row.teamId === CAR_TEAM_ID);
    const xg = carSectors.reduce((sum, row) => sum + row.estimatedXg, 0);
    const highDanger = carSectors.filter(row => row.sector === "crease" || row.sector === "inner_slot").reduce((sum, row) => sum + row.shotsOnGoal, 0);
    if (size === "small") return <Compact icon="shooting-sector" label="Shot Quality" value={`${xg.toFixed(2)} xG`} context={`${highDanger} slot SOG`} />;
    return <WidgetPanel title="Shot Quality" icon="shooting-sector" source={source}><ShotSectors rows={sectorRows} useBundledFallback={!widgets} /></WidgetPanel>;
  }
  if (id === "penaltyWatch") {
    const penalties = moments.filter(row => row.type === "penalty");
    return <WidgetPanel title="Penalty Watch" icon="notes" source={source}><VideoMoments rows={penalties.length ? penalties : moments.filter(row => row.type !== "goal")} /></WidgetPanel>;
  }
  if (id === "shotAttempts") {
    const carValue = car?.shotAttempts ?? sim?.team.satCar ?? 52;
    const vgkValue = vgk?.shotAttempts ?? sim?.team.satVgk ?? 52;
    return <Compact icon="chart" label="Shot Attempts" value={`${carValue}–${vgkValue}`} context="CAR–VGK · all attempts" />;
  }
  if (id === "giveaways") {
    const carValue = car?.giveaways ?? sim?.team.gvCar ?? 15;
    const vgkValue = vgk?.giveaways ?? sim?.team.gvVgk ?? 23;
    return <Compact icon="game-pulse" label="Giveaways" value={`${carValue}–${vgkValue}`} context="CAR–VGK · possession loss" />;
  }
  return null;
}
