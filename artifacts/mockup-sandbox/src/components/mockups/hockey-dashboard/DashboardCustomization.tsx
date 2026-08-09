import { useMemo, useState, type ReactNode } from "react";
import { HdIcon, type HdIconName } from "./HdIcon";

export type DashboardWidgetId =
  | "toi"
  | "faceoff"
  | "shots"
  | "ai"
  | "foEdge"
  | "shotsEdge"
  | "goals"
  | "powerPlay"
  | "hits"
  | "blocks"
  | "takeaways"
  | "pim"
  | "gameFlow"
  | "penaltyWatch"
  | "lineMatchups"
  | "shotQuality"
  | "restRisk";

export type DashboardWidgetSize = "small" | "medium" | "large";
export type DashboardWidgetZone = "top" | "lower" | "rail" | "other";

export interface DashboardLayoutItem {
  id: DashboardWidgetId;
  size: DashboardWidgetSize;
  zone: DashboardWidgetZone;
}

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  name: string;
  description: string;
  icon: HdIconName;
  sizes: DashboardWidgetSize[];
  category: "Game" | "Players" | "Coaching";
}

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  { id: "toi", name: "Player TOI & Rest", description: "Six-player workload, shifts and live on-ice state.", icon: "player", sizes: ["large"], category: "Players" },
  { id: "faceoff", name: "Faceoff Win Rate", description: "Team share, center leaders and draw context.", icon: "head-to-head-faceoffs", sizes: ["medium", "large"], category: "Game" },
  { id: "shots", name: "Shots on Goal", description: "Live team totals and cumulative game flow.", icon: "shooting-sector", sizes: ["medium", "large"], category: "Game" },
  { id: "ai", name: "AI Insights", description: "Prioritized coaching takeaways and related widgets.", icon: "sparkle", sizes: ["medium", "large"], category: "Coaching" },
  { id: "foEdge", name: "Faceoff Edge", description: "Concise faceoff advantage and win count.", icon: "head-to-head-faceoffs", sizes: ["small"], category: "Game" },
  { id: "shotsEdge", name: "Shot Differential", description: "Concise Carolina–Vegas shot comparison.", icon: "shooting-sector", sizes: ["small"], category: "Game" },
  { id: "goals", name: "Player Goals", description: "Current scoring leader and goal count.", icon: "featured", sizes: ["small"], category: "Players" },
  { id: "powerPlay", name: "Power Play", description: "Conversion and opportunity count.", icon: "game-pulse", sizes: ["small"], category: "Game" },
  { id: "hits", name: "Hits", description: "Physical-play comparison.", icon: "game-pulse", sizes: ["small"], category: "Game" },
  { id: "blocks", name: "Blocks", description: "Team shot-blocking comparison.", icon: "game-pulse", sizes: ["small"], category: "Game" },
  { id: "takeaways", name: "Takeaways", description: "Possession recovery comparison.", icon: "game-pulse", sizes: ["small"], category: "Game" },
  { id: "pim", name: "Penalty Minutes", description: "Live team penalty-minute comparison.", icon: "game-pulse", sizes: ["small"], category: "Game" },
  { id: "gameFlow", name: "Game Flow", description: "Cumulative shot pressure and scoring events.", icon: "chart", sizes: ["medium", "large"], category: "Game" },
  { id: "penaltyWatch", name: "Penalty Watch", description: "Active and recent penalties with strength context.", icon: "notes", sizes: ["medium", "large"], category: "Coaching" },
  { id: "lineMatchups", name: "Line Matchups", description: "Priority Carolina units and opposing matchups.", icon: "player", sizes: ["medium", "large"], category: "Coaching" },
  { id: "shotQuality", name: "Shot Quality", description: "High-danger share and scoring efficiency.", icon: "shooting-sector", sizes: ["small", "medium"], category: "Game" },
  { id: "restRisk", name: "Rest Risk", description: "Long-shift and recovery alert summary.", icon: "counter", sizes: ["small", "medium"], category: "Players" },
];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { id: "toi", size: "large", zone: "top" },
  { id: "faceoff", size: "medium", zone: "lower" },
  { id: "shots", size: "medium", zone: "lower" },
  { id: "ai", size: "medium", zone: "rail" },
  { id: "foEdge", size: "small", zone: "rail" },
  { id: "shotsEdge", size: "small", zone: "rail" },
  { id: "goals", size: "small", zone: "rail" },
  { id: "powerPlay", size: "small", zone: "other" },
  { id: "hits", size: "small", zone: "other" },
  { id: "blocks", size: "small", zone: "other" },
  { id: "takeaways", size: "small", zone: "other" },
  { id: "pim", size: "small", zone: "other" },
];

export const allowedZonesForSize = (size: DashboardWidgetSize): DashboardWidgetZone[] =>
  size === "large" ? ["top", "lower"] : size === "medium" ? ["lower", "rail"] : ["other", "rail"];

export function WidgetEditChrome({
  active,
  label,
  onRemove,
  children,
  className = "",
}: {
  active: boolean;
  label: string;
  onRemove: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`hd-editable-widget${active ? " is-editing" : ""} ${className}`} data-widget="true">
      {active && <button type="button" className="hd-widget-minus" aria-label={`Remove ${label}`} onClick={event => { event.stopPropagation(); onRemove(); }}>−</button>}
      {children}
    </div>
  );
}

export function PlacementSlot({ zone, label, onPlace }: { zone: DashboardWidgetZone; label: string; onPlace: () => void }) {
  return (
    <button type="button" className={`hd-widget-placement hd-widget-placement-${zone}`} onClick={event => { event.stopPropagation(); onPlace(); }}>
      <HdIcon name="new-note" size={17} /> Place “{label}” here
    </button>
  );
}

export function WidgetCatalog({
  layout,
  onClose,
  onChoose,
}: {
  layout: DashboardLayoutItem[];
  onClose: () => void;
  onChoose: (id: DashboardWidgetId, size: DashboardWidgetSize) => void;
}) {
  const [selected, setSelected] = useState<DashboardWidgetDefinition | null>(null);
  const visibleIds = useMemo(() => new Set(layout.map(item => item.id)), [layout]);
  const available = DASHBOARD_WIDGETS.filter(widget => !visibleIds.has(widget.id));
  const categories = ["Game", "Players", "Coaching"] as const;

  return (
    <div className="hd-widget-catalog" onPointerDown={event => event.stopPropagation()}>
      <button type="button" className="hd-widget-workspace-strip" onClick={onClose}>
        <span className="hd-widget-workspace-mini"><i/><i/><i/><i/><i/></span>
        <span><strong>Dashboard workspace</strong><small>Tap this strip to return without adding a widget</small></span>
        <HdIcon name="back" size={17} />
      </button>
      <header className="hd-widget-catalog-head">
        <div><span>Customize Dashboard</span><h2>{selected ? `Choose a size for ${selected.name}` : "Add Widgets"}</h2></div>
        <button type="button" aria-label="Close widget catalogue" onClick={onClose}><HdIcon name="close" size={18} /></button>
      </header>
      {selected ? (
        <div className="hd-widget-size-stage">
          <div className="hd-widget-preview-large">
            <HdIcon name={selected.icon} size={22} />
            <div><strong>{selected.name}</strong><span>{selected.description}</span></div>
          </div>
          <div className="hd-widget-size-options">
            {selected.sizes.map(size => (
              <button type="button" key={size} onClick={() => onChoose(selected.id, size)}>
                <span className={`hd-size-shape hd-size-${size}`}><i/><i/><i/></span>
                <strong>{size[0].toUpperCase() + size.slice(1)}</strong>
                <small>{size === "small" ? "Concise glance" : size === "medium" ? "Balanced detail" : "Full analysis"}</small>
              </button>
            ))}
          </div>
          <button type="button" className="hd-widget-back-catalog" onClick={() => setSelected(null)}><HdIcon name="back" size={15} /> Back to catalogue</button>
        </div>
      ) : (
        <div className="hd-widget-catalog-scroll">
          {available.length === 0 && <div className="hd-widget-catalog-empty"><HdIcon name="check" size={24} /><strong>Every widget is already on the dashboard</strong><span>Remove a widget with its minus button to make it available here.</span></div>}
          {categories.map(category => {
            const widgets = available.filter(widget => widget.category === category);
            if (!widgets.length) return null;
            return (
              <section key={category}>
                <h3>{category}</h3>
                <div className="hd-widget-catalog-grid">
                  {widgets.map(widget => (
                    <button type="button" key={widget.id} onClick={() => setSelected(widget)}>
                      <span className="hd-widget-catalog-icon"><HdIcon name={widget.icon} size={20} /></span>
                      <span><strong>{widget.name}</strong><small>{widget.description}</small></span>
                      <HdIcon name="arrow" size={15} />
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
