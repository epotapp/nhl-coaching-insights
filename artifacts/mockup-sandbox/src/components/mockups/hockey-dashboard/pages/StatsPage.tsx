import { useMemo, useState, type ReactNode } from "react";
import { HdIcon } from "../HdIcon";
import { imageBase } from "../assets";
import type { PageProps } from "../shared";
import { PagePanel } from "../shared";
import { CAR_PLAYERS, GAME4_TEAM_TOTALS } from "../game4Data";
import "./stats.css";

type WidgetKey = "trends" | "fo" | "cum" | "keys" | "trends2";

interface StatWidget {
  key: WidgetKey;
  title: string;
  subtitle: string;
  icon: ReactNode;
  image: string;
  footer: string;
  lead?: string;
}

const WIDGET_PAIRS: Partial<Record<WidgetKey, WidgetKey>> = {
  cum: "fo",
  fo: "cum",
  trends2: "keys",
  keys: "trends2",
};

function ReportRail() {
  const interactive = ["Shootout Planner", "Custom Stat Sheet", "Goalie Pull"];
  const reports = [
    "Game Summary",
    "Event Summary",
    "Full Play-by-Play",
    "Faceoff Summary",
    "Faceoff Comparison",
    "Roster Report",
    "TOI – Opponent Team",
    "Shot Report",
  ];
  const categories = ["Skater Stats", "Goalie Stats", "Team Stats", "Special Teams", "Advanced Metrics"];
  const [selected, setSelected] = useState("Shootout Planner");
  const reportList = (items: string[]) => (
    <div className="st-report-list">
      {items.map(label => (
        <button type="button" key={label} className={selected === label ? "active" : ""} onClick={() => setSelected(label)}>
          {label}
        </button>
      ))}
    </div>
  );
  return (
    <aside className="st-rail">
      <section>
        <h3>Interactive Reports</h3>
        {reportList(interactive)}
      </section>
      <section>
        <h3>Official Game Reports</h3>
        {reportList(reports)}
      </section>
      <section>
        <h3>Report Category</h3>
        <button type="button" className="st-select"><span>All Categories</span><HdIcon name="select" size={15} /></button>
        {reportList(categories)}
      </section>
      <section className="st-game-facts">
        <h3>Game 4 Summary</h3>
        <dl><div><dt>Final</dt><dd>CAR 5–3 VGK</dd></div><div><dt>Shots</dt><dd>28–21</dd></div><div><dt>Faceoffs</dt><dd>29–22</dd></div><div><dt>Power play</dt><dd>1/3–0/3</dd></div></dl>
      </section>
    </aside>
  );
}

function KeyInsights() {
  const rows = [
    ["Shot attempts", 92],
    ["Zone entries", 74],
    ["High-danger share", 61],
    ["Takeaways", 48],
    ["Blocks", 33],
  ] as const;
  return (
    <div className="st-key-bars">
      {rows.map(([label, value]) => <label key={label}><span>{label}</span><i><b style={{ width: `${value}%` }} /></i><strong>{value}</strong></label>)}
    </div>
  );
}

function FaceoffSummary() {
  const top = CAR_PLAYERS.filter(player => player.foW !== undefined).sort((a, b) => (b.foW ?? 0) - (a.foW ?? 0)).slice(0, 5);
  return (
    <div className="st-fo-content">
      <div className="st-fo-bars"><i style={{ height: "57%" }} /><i style={{ height: "43%" }} /></div>
      <div className="st-fo-score"><strong>57%</strong><span>CAR faceoff win rate</span><small>29 wins · 22 losses</small></div>
      <div className="st-fo-leaders">
        {top.map(player => <span key={player.num}><b>#{player.num} {player.short}</b><em>{player.foW}-{player.foL}</em></span>)}
      </div>
    </div>
  );
}

export function StatsPage({ theme }: PageProps) {
  const [expanded, setExpanded] = useState<WidgetKey | null>(null);
  const widgets = useMemo<StatWidget[]>(() => [
    { key: "trends", title: "Team Game Flow", subtitle: "Game 4", icon: <HdIcon name="chart" size={17} />, image: "game-flow.png", footer: "CAR closed with a 28–21 shot advantage", lead: "28–21" },
    { key: "fo", title: "FO Win Rate", subtitle: "Game 4", icon: <HdIcon name="head-to-head-faceoffs" size={18} />, image: "faceoff-centers.png", footer: "Jordan Staal won 12 of 16 draws", lead: "57%" },
    { key: "cum", title: "Cumulative Points", subtitle: "2026 Playoffs", icon: <HdIcon name="game-pulse" size={17} />, image: "cumulative-points.png", footer: "Ehlers added three points in Game 4", lead: "16 pts" },
    { key: "keys", title: "Key Insights", subtitle: "Carolina", icon: <HdIcon name="sparkle" size={17} />, image: "player-impact.png", footer: "Staal and Ehlers led the decisive events", lead: "5 goals" },
    { key: "trends2", title: "Season Trends", subtitle: "Faceoffs and shots", icon: <HdIcon name="shooting-sector" size={18} />, image: "season-trends.png", footer: "Game 4 ended at 57% on draws", lead: "57%" },
  ], []);

  const selected = expanded ? widgets.find(widget => widget.key === expanded) ?? null : null;
  const pair = selected ? widgets.find(widget => widget.key === WIDGET_PAIRS[selected.key]) ?? null : null;
  const remaining = selected ? widgets.filter(widget => widget.key !== selected.key && widget.key !== pair?.key) : widgets;

  const renderWidget = (widget: StatWidget, wide = false) => (
    <PagePanel
      key={widget.key}
      icon={widget.icon}
      title={widget.title}
      subtitle={widget.subtitle}
      className={`st-widget ${wide ? "st-widget-wide" : ""}`}
      onExpand={() => setExpanded(current => current === widget.key ? null : widget.key)}
      collapse={expanded === widget.key}
    >
      {widget.key === "keys" ? <KeyInsights /> : widget.key === "fo" && wide ? <FaceoffSummary /> : (
        <div className="st-chart-wrap">
          <img src={`${imageBase}charts/${widget.image.replace(".png", `${theme === "light" ? "-light" : ""}.png`)}`} alt={`${widget.title} chart`} data-chart={widget.key} />
          {widget.lead && <strong>{widget.lead}</strong>}
        </div>
      )}
      <footer>{widget.footer}</footer>
    </PagePanel>
  );

  return (
    <main className="st-page">
      <div className={`st-main${selected ? " st-main-expanded" : ""}`}>
        {selected ? (
          <>
            {renderWidget(selected, true)}
            {pair && renderWidget(pair, true)}
            <div className="st-widget-grid">{remaining.map(widget => renderWidget(widget, widget.key === "trends"))}</div>
          </>
        ) : (
          <div className="st-widget-grid">
            {widgets.map(widget => renderWidget(widget, widget.key === "trends"))}
          </div>
        )}
      </div>
      <ReportRail />
    </main>
  );
}
