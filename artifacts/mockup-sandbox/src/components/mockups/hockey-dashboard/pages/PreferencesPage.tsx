/* Preferences — functional recreation of the approved design */
import { useState } from "react";
import {
  Sparkles,
  MessageSquare,
  Lightbulb,
  Star,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from "lucide-react";
import { PageProps, Flash } from "../shared";
import "./preferences.css";

export interface PreferencesProps extends PageProps {
  onThemeChange: (t: "dark" | "light") => void;
  textScale: number;
  onTextScale: (n: number) => void;
  density: number;
  onDensity: (n: number) => void;
  aiPrioritization: boolean;
  onAIPrioritization: (b: boolean) => void;
  aiChat: boolean;
  onAIChat: (b: boolean) => void;
  aiSuggestions: boolean;
  onAISuggestions: (b: boolean) => void;
}

type Priority = "Low" | "Medium" | "High";
type Role = "Head Coach" | "Video Coach" | "Goaltending Coach";
type ThemeMode = "Light" | "Dark" | "Adaptive";

interface PrefRow {
  key: string;
  label: string;
  priority: Priority;
}
interface PrefCategory {
  key: string;
  title: string;
  rows: PrefRow[];
}

/* short abbreviation used in the Summary card */
const ABBR: Record<string, string> = {
  Forwards: "Forwards",
  Defensemen: "Defensemen",
  Goaltender: "Goaltenders",
  TOI: "TOI",
  "FO%": "FO%",
  SOG: "SOG",
  Hits: "Hits",
  "+/-": "+/-",
  "Even Strength": "5v5",
  "Power Play": "PP",
  "Penalty Kill": "PK",
  "Empty Net": "EN",
  "Save %": "Save %",
  GAA: "GAA",
  "High-Danger Saves": "HD Saves",
  "Score Flow": "Score Flow",
  "Shots by Period": "Shots/Per",
  "Zone Time": "Zone Time",
};

function seedCategories(): PrefCategory[] {
  return [
    {
      key: "position",
      title: "Player Position",
      rows: [
        { key: "fwd", label: "Forwards", priority: "High" },
        { key: "def", label: "Defensemen", priority: "Medium" },
        { key: "goalie", label: "Goaltender", priority: "Medium" },
      ],
    },
    {
      key: "playerstats",
      title: "Player Statistics",
      rows: [
        { key: "toi", label: "TOI", priority: "High" },
        { key: "fo", label: "FO%", priority: "High" },
        { key: "sog", label: "SOG", priority: "Medium" },
        { key: "hits", label: "Hits", priority: "Low" },
        { key: "pm", label: "+/-", priority: "Medium" },
      ],
    },
    {
      key: "strength",
      title: "Strength & Situation",
      rows: [
        { key: "ev", label: "Even Strength", priority: "Medium" },
        { key: "pp", label: "Power Play", priority: "High" },
        { key: "pk", label: "Penalty Kill", priority: "High" },
        { key: "en", label: "Empty Net", priority: "Low" },
      ],
    },
    {
      key: "goaltender",
      title: "Goaltender Statistics",
      rows: [
        { key: "sv", label: "Save %", priority: "Low" },
        { key: "gaa", label: "GAA", priority: "Low" },
        { key: "hd", label: "High-Danger Saves", priority: "Medium" },
      ],
    },
    {
      key: "game",
      title: "Game Statistics",
      rows: [
        { key: "flow", label: "Score Flow", priority: "Medium" },
        { key: "shots", label: "Shots by Period", priority: "Medium" },
        { key: "zone", label: "Zone Time", priority: "Low" },
      ],
    },
  ];
}

/* re-seed priorities sensibly per coaching role */
function applyRole(cats: PrefCategory[], role: Role): PrefCategory[] {
  const set = (
    catKey: string,
    rowKey: string,
    priority: Priority,
    c: PrefCategory[],
  ) =>
    c.map((cat) =>
      cat.key === catKey
        ? {
            ...cat,
            rows: cat.rows.map((r) =>
              r.key === rowKey ? { ...r, priority } : r,
            ),
          }
        : cat,
    );

  let next = seedCategories();
  if (role === "Head Coach") {
    // default seed already reflects an all-round head coach
    return next;
  }
  if (role === "Video Coach") {
    next = set("game", "flow", "High", next);
    next = set("game", "shots", "High", next);
    next = set("game", "zone", "High", next);
    next = set("strength", "pp", "High", next);
    next = set("strength", "pk", "High", next);
    next = set("goaltender", "sv", "Low", next);
    next = set("goaltender", "gaa", "Low", next);
    next = set("goaltender", "hd", "Low", next);
    return next;
  }
  // Goaltending Coach
  next = set("goaltender", "sv", "High", next);
  next = set("goaltender", "gaa", "High", next);
  next = set("goaltender", "hd", "High", next);
  next = set("position", "goalie", "High", next);
  next = set("position", "fwd", "Low", next);
  next = set("position", "def", "Medium", next);
  next = set("playerstats", "toi", "Medium", next);
  next = set("playerstats", "fo", "Low", next);
  return next;
}

function Toggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`pf-toggle${on ? " pf-toggle-on" : ""}`}
      role="switch"
      aria-checked={on}
      onClick={onToggle}
    >
      <span className="pf-toggle-knob" />
    </button>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  size?: "md" | "sm";
}) {
  return (
    <div className={`pf-seg${size === "sm" ? " pf-seg-sm" : ""}`}>
      {options.map((opt) => (
        <button
          key={opt}
          className={`pf-seg-btn${value === opt ? " pf-seg-active" : ""}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <span className="pf-stars">
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          size={13}
          className={i < count ? "pf-star-on" : "pf-star-off"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export function PreferencesPage({
  onThemeChange,
  textScale,
  onTextScale,
  density,
  onDensity,
  aiPrioritization,
  onAIPrioritization,
  aiChat,
  onAIChat,
  aiSuggestions,
  onAISuggestions,
  theme,
}: PreferencesProps) {
  const [role, setRole] = useState<Role>("Head Coach");
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    theme === "light" ? "Light" : "Dark",
  );
  const [cats, setCats] = useState<PrefCategory[]>(() => seedCategories());
  const [expanded, setExpanded] = useState<string>("position");

  // Static approved preview values — no animated counters.
  const preview = { toi: 18.2, sog: 28, fo: 57 };

  const changeRole = (r: Role) => {
    setRole(r);
    setCats((c) => applyRole(c, r));
  };

  const changeTheme = (m: ThemeMode) => {
    setThemeMode(m);
    if (m === "Light") onThemeChange("light");
    else if (m === "Dark") onThemeChange("dark");
    // Adaptive: keep current theme
  };

  const setRowPriority = (
    catKey: string,
    rowKey: string,
    priority: Priority,
  ) => {
    setCats((c) =>
      c.map((cat) =>
        cat.key === catKey
          ? {
              ...cat,
              rows: cat.rows.map((r) =>
                r.key === rowKey ? { ...r, priority } : r,
              ),
            }
          : cat,
      ),
    );
  };

  // group all rows by priority for the summary card
  const allRows = cats.flatMap((c) => c.rows);
  const summaryFor = (p: Priority) =>
    allRows
      .filter((r) => r.priority === p)
      .map((r) => ABBR[r.label] ?? r.label)
      .join(", ") || "—";

  return (
    <div className="pf-page">
      {/* ═══════════ LEFT COLUMN ═══════════ */}
      <div className="pf-left">
        {/* Live Preview */}
        <div className="pf-preview-block">
          <div className="pf-preview-grid">
            <div className="pf-preview-card pf-preview-card-lg">
              <span className="pf-preview-ghost">Graph/Info Goes Here</span>
              <button className="pf-preview-exp" aria-label="Expand preview">
                <Maximize2 size={11} />
              </button>
            </div>
            <div className="pf-preview-card">
              <span className="pf-preview-ghost">Graph/Info Goes Here</span>
              <div className="pf-preview-stat">
                <span className="pf-preview-tag">Title | Subtitle Context</span>
              </div>
            </div>
          </div>
          <div className="pf-preview-foot">
            <span className="pf-preview-label">Live Preview</span>
            <div className="pf-preview-mini">
              <span className="pf-preview-mini-tag">
                Stat Context <Flash value={preview.sog} />
              </span>
            </div>
          </div>
        </div>

        {/* Role Template */}
        <div className="pf-section">
          <h3 className="pf-h">Role Template</h3>
          <p className="pf-sub">
            Applies a preconfigured stat priority set matching your coaching
            role.
          </p>
          <Segmented
            options={["Head Coach", "Video Coach", "Goaltending Coach"]}
            value={role}
            onChange={changeRole}
          />
        </div>

        {/* Display */}
        <div className="pf-section">
          <h3 className="pf-h">Display</h3>
          <p className="pf-sub">Adjust app display preferences</p>

          <div className="pf-card">
            <div className="pf-field-title">Theme</div>
            <div className="pf-field-sub">Change the theme</div>
            <Segmented
              options={["Light", "Dark", "Adaptive"]}
              value={themeMode}
              onChange={changeTheme}
            />

            <div className="pf-field-title pf-mt">Information Density</div>
            <div className="pf-field-sub">
              Adjust the amount of information and widgets shown at once
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={density}
              onChange={(e) => onDensity(Number(e.target.value))}
              className="pf-slider"
            />
            <div className="pf-slider-scale">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>

            <div className="pf-field-title pf-mt">Text Size</div>
            <div className="pf-field-sub">Adjust the minimum text size</div>
            <div className="pf-textsize-row">
              <input
                type="range"
                min={0}
                max={100}
                value={textScale}
                onChange={(e) => onTextScale(Number(e.target.value))}
                className="pf-slider"
              />
              <span className="pf-textsize-aa">Aa</span>
            </div>
          </div>
        </div>

        {/* AI Preferences */}
        <div className="pf-section">
          <h3 className="pf-h">AI Preferences</h3>
          <p className="pf-sub">Adjust AI preferences</p>

          <div className="pf-ai-row">
            <div className="pf-ai-icon">
              <Sparkles size={16} />
            </div>
            <div className="pf-ai-text">
              <div className="pf-ai-title">AI Prioritization</div>
              <div className="pf-ai-sub">Allow AI to prioritize information</div>
            </div>
            <Toggle
              on={aiPrioritization}
              onToggle={() => onAIPrioritization(!aiPrioritization)}
            />
          </div>

          <div className="pf-ai-row">
            <div className="pf-ai-icon">
              <MessageSquare size={16} />
            </div>
            <div className="pf-ai-text">
              <div className="pf-ai-title">AI Chat and Search</div>
              <div className="pf-ai-sub">Enable conversational AI search</div>
            </div>
            <Toggle on={aiChat} onToggle={() => onAIChat(!aiChat)} />
          </div>

          <div className="pf-ai-row">
            <div className="pf-ai-icon">
              <Lightbulb size={16} />
            </div>
            <div className="pf-ai-text">
              <div className="pf-ai-title">AI Suggestions</div>
              <div className="pf-ai-sub">Show proactive insight suggestions</div>
            </div>
            <Toggle
              on={aiSuggestions}
              onToggle={() => onAISuggestions(!aiSuggestions)}
            />
          </div>
        </div>
      </div>

      {/* ═══════════ RIGHT COLUMN ═══════════ */}
      <div className="pf-right">
        {/* Summary */}
        <div className="pf-section">
          <h3 className="pf-h">Summary</h3>
          <p className="pf-sub">Summary of Preferences</p>

          <div className="pf-summary-card">
            <div className="pf-summary-icon">
              <Stars count={3} />
            </div>
            <div className="pf-summary-text">
              <div className="pf-summary-title">High Priority</div>
              <div className="pf-summary-list">
                <Flash value={summaryFor("High")} />
              </div>
            </div>
          </div>

          <div className="pf-summary-card">
            <div className="pf-summary-icon">
              <Stars count={2} />
            </div>
            <div className="pf-summary-text">
              <div className="pf-summary-title">Medium Priority</div>
              <div className="pf-summary-list">
                <Flash value={summaryFor("Medium")} />
              </div>
            </div>
          </div>

          <div className="pf-summary-card">
            <div className="pf-summary-icon">
              <Stars count={1} />
            </div>
            <div className="pf-summary-text">
              <div className="pf-summary-title">Low Priority</div>
              <div className="pf-summary-list">
                <Flash value={summaryFor("Low")} />
              </div>
            </div>
          </div>
        </div>

        {/* All Preferences */}
        <div className="pf-section">
          <h3 className="pf-h">All Preferences</h3>
          <p className="pf-sub">Configure stat priorities for each category</p>

          {cats.map((cat) => {
            const open = expanded === cat.key;
            const editList = cat.rows.map((r) => r.label).join(", ");
            return (
              <div
                key={cat.key}
                className={`pf-cat${open ? " pf-cat-open" : ""}`}
              >
                <button
                  className="pf-cat-head"
                  onClick={() => setExpanded(open ? "" : cat.key)}
                >
                  <span className="pf-cat-head-text">
                    <span className="pf-cat-title">{cat.title}</span>
                    <span className="pf-cat-edit">Edit • {editList}</span>
                  </span>
                  {open ? (
                    <ChevronUp size={18} className="pf-cat-chev" />
                  ) : (
                    <ChevronDown size={18} className="pf-cat-chev" />
                  )}
                </button>

                {open && (
                  <div className="pf-cat-body">
                    {cat.rows.map((row) => (
                      <div key={row.key} className="pf-cat-row">
                        <span className="pf-cat-row-label">{row.label}</span>
                        <Segmented
                          options={["Low", "Medium", "High"]}
                          value={row.priority}
                          onChange={(p) =>
                            setRowPriority(cat.key, row.key, p)
                          }
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
