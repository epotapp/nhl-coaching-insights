import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { HdIcon } from "./HdIcon";
import "./auth-onboarding.css";

export type ObStep = "ob1" | "ob2" | "ob3" | "ob4" | "ob5";

interface OnboardingModalProps {
  step: ObStep;
  theme: "dark" | "light";
  textScale: number;
  density: number;
  aiPrioritization: boolean;
  aiChat: boolean;
  aiSuggestions: boolean;
  onNext: () => void;
  onBack: (() => void) | null;
  onThemeChange: (t: "dark" | "light") => void;
  onTextScaleChange: (v: number) => void;
  onDensityChange: (v: number) => void;
  onAIPrioritizationChange: (v: boolean) => void;
  onAIChatChange: (v: boolean) => void;
  onAISuggestionsChange: (v: boolean) => void;
}

/* ── custom dropdown (stays inside the iframe) ── */
interface CustomSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}
function CustomSelect({ value, onChange, options, placeholder = "Select…" }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="hd-ob-dd" ref={ref}>
      <button
        type="button"
        className={`hd-ob-dd-trigger${open ? " hd-ob-dd-open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={value ? "" : "hd-ob-dd-placeholder"}>{value || placeholder}</span>
        <ChevronDown size={14} className={`hd-ob-dd-chevron${open ? " hd-ob-dd-chevron-up" : ""}`} />
      </button>

      {open && (
        <div className="hd-ob-dd-list">
          {options.map(opt => (
            <div
              key={opt}
              className={`hd-ob-dd-item${value === opt ? " hd-ob-dd-item-active" : ""}`}
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false); }}
            >
              <span>{opt}</span>
              {value === opt && <HdIcon name="check" size={12} className="hd-ob-dd-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── reusable toggle ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="hd-toggle-wrap" style={{ cursor: "pointer", flexShrink: 0 }}>
      <input
        type="checkbox"
        className="hd-toggle-cb"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="hd-toggle-track" />
      <span className="hd-toggle-thumb" />
    </label>
  );
}

/* ── mini dashboard preview (theme card) ── */
function DashPreview({ mode }: { mode: "light" | "dark" }) {
  const bg      = mode === "dark"  ? "#09080f" : "#dce8f5";
  const bar     = mode === "dark"  ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const accent  = mode === "dark"  ? "rgba(214,21,67,0.55)"  : "rgba(26,90,180,0.28)";
  const topbg   = mode === "dark"  ? "rgba(255,255,255,0.05)": "rgba(255,255,255,0.75)";

  return (
    <div style={{ width: "100%", height: 130, background: bg, overflow: "hidden", position: "relative" }}>
      {/* topbar */}
      <div style={{ height: 16, background: topbg, display: "flex", alignItems: "center", padding: "0 8px", gap: 4, boxSizing: "border-box" }}>
        <div style={{ width: 36, height: 6, background: bar, borderRadius: 3 }} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 24, height: 5, background: bar, borderRadius: 3 }} />
        <div style={{ width: 24, height: 5, background: bar, borderRadius: 3 }} />
      </div>
      {/* score band */}
      <div style={{ height: 12, background: mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{ width: 10, height: 5, background: accent, borderRadius: 2 }} />
        <div style={{ width: 28, height: 4, background: bar, borderRadius: 2 }} />
        <div style={{ width: 10, height: 5, background: bar, borderRadius: 2 }} />
      </div>
      {/* body */}
      <div style={{ display: "flex", gap: 4, padding: "5px 7px", height: 102, boxSizing: "border-box" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ background: bar, borderRadius: 5, flex: 2 }} />
          <div style={{ display: "flex", gap: 3, flex: 1 }}>
            <div style={{ background: bar, borderRadius: 5, flex: 1 }} />
            <div style={{ background: accent, borderRadius: 5, flex: 1, opacity: 0.6 }} />
            <div style={{ background: bar, borderRadius: 5, flex: 1 }} />
          </div>
        </div>
        <div style={{ width: 44, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ background: bar, borderRadius: 5, flex: 3 }} />
          <div style={{ background: bar, borderRadius: 5, flex: 1 }} />
        </div>
      </div>
    </div>
  );
}

/* ── density preview — approved dashboard composition ── */
function DensityPreview({ density }: { density: number }) {
  const level = density <= 33 ? "low" : density <= 66 ? "medium" : "high";
  return (
    <div className={`hd-density-preview hd-density-${level}`} aria-label={`${level} information density preview`}>
      <div className="hd-density-topbar">
        <span className="hd-density-pill hd-density-pill-left" />
        <span className="hd-density-search" />
        <span className="hd-density-pill" />
        <span className="hd-density-pill" />
      </div>
      <div className="hd-density-score"><span/><strong>03 – 05</strong><span/></div>
      <div className="hd-density-layout">
        <div className="hd-density-main">
          <div className="hd-density-toi"><i/><i/><i/><i/><i/><i/></div>
          <div className="hd-density-lower"><div/><div/></div>
          {level === "high" && <div className="hd-density-minis"><i/><i/><i/><i/></div>}
        </div>
        <div className="hd-density-rail">
          <div className="hd-density-ai" />
          <div/><div/><div/>
        </div>
      </div>
    </div>
  );
}

/* ── 20 real stats ── */
const STATS = [
  { id: "toi", abbr: "TOI",  label: "Time on Ice"             },
  { id: "fo",  abbr: "FO%",  label: "Faceoff Win %"           },
  { id: "sog", abbr: "SOG",  label: "Shots on Goal"           },
  { id: "sh",  abbr: "SH%",  label: "Shooting %"              },
  { id: "hit", abbr: "HIT",  label: "Hits"                    },
  { id: "blk", abbr: "BLK",  label: "Blocked Shots"           },
  { id: "gva", abbr: "GVA",  label: "Giveaways"               },
  { id: "tka", abbr: "TKA",  label: "Takeaways"               },
  { id: "pp",  abbr: "PP%",  label: "Power Play %"            },
  { id: "pk",  abbr: "PK%",  label: "Penalty Kill %"          },
  { id: "cf",  abbr: "CF%",  label: "Corsi For %"             },
  { id: "xg",  abbr: "xG",   label: "Expected Goals"          },
  { id: "hdc", abbr: "HDC",  label: "High-Danger Chances"     },
  { id: "scf", abbr: "SCF",  label: "Scoring Chances For"     },
  { id: "ze",  abbr: "ZE",   label: "Zone Entries"            },
  { id: "ozs", abbr: "OZS%", label: "Off. Zone Start %"       },
  { id: "pm",  abbr: "+/-",  label: "Plus / Minus"            },
  { id: "pim", abbr: "PIM",  label: "Penalty Minutes"         },
  { id: "sv",  abbr: "SV%",  label: "Goalie Save %"           },
  { id: "ga",  abbr: "G/A",  label: "Goals + Assists"         },
 ];

const STAT_VALUES: Record<string, string> = {
  toi: "18:14 | 20:44",
  fo: "57 | 43",
  sog: "28 | 21",
  sh: "17.9 | 14.3",
  hit: "34 | 38",
  blk: "16 | 12",
  gva: "15 | 23",
  tka: "7 | 3",
  pp: "33.3 | 0.0",
  pk: "100 | 66.7",
  cf: "50.0 | 50.0",
  xg: "3.42 | 2.76",
  hdc: "11 | 8",
  scf: "24 | 20",
  ze: "31 | 29",
  ozs: "52.9 | 47.1",
  pm: "+2 | -2",
  pim: "8 | 8",
  sv: ".857 | .852",
  ga: "5+7 | 3+6",
};

const NHL_TEAMS = [
  "Anaheim Ducks", "Arizona Coyotes", "Boston Bruins", "Buffalo Sabres",
  "Calgary Flames", "Carolina Hurricanes", "Chicago Blackhawks", "Colorado Avalanche",
  "Columbus Blue Jackets", "Dallas Stars", "Detroit Red Wings", "Edmonton Oilers",
  "Florida Panthers", "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens",
  "Nashville Predators", "New Jersey Devils", "New York Islanders", "New York Rangers",
  "Ottawa Senators", "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks",
  "Seattle Kraken", "St. Louis Blues", "Tampa Bay Lightning", "Toronto Maple Leafs",
  "Vancouver Canucks", "Vegas Golden Knights", "Washington Capitals", "Winnipeg Jets",
];

const ROLES = [
  "Head Coach", "Assistant Coach", "Video Coach",
  "General Manager", "Assistant GM", "Director of Hockey Ops",
  "Scout", "Pro Scout", "Amateur Scout", "Director of Scouting",
  "Analyst", "Sports Scientist", "Strength & Conditioning",
  "Broadcaster", "Journalist",
];

/* ─────────── Step 1 ─────────── */
function Step1({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState("Brent");
  const [team, setTeam] = useState("");
  const [role, setRole] = useState("");

  return (
    <>
      <div className="hd-ob-heading">Sign Up</div>
      <div className="hd-ob-sub">sign up to continue</div>

      <div className="hd-ob-form">
        <div className="hd-ob-field">
          <label className="hd-ob-label">Name</label>
          <input
            className="hd-ob-input"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="hd-ob-field">
          <label className="hd-ob-label">Team</label>
          <CustomSelect
            value={team}
            onChange={setTeam}
            options={NHL_TEAMS}
            placeholder="Select team…"
          />
        </div>

        <div className="hd-ob-field">
          <label className="hd-ob-label">Role</label>
          <CustomSelect
            value={role}
            onChange={setRole}
            options={ROLES}
            placeholder="Select role…"
          />
        </div>
      </div>

      <button className="hd-ob-continue" onClick={onNext}>Continue</button>
    </>
  );
}

/* ─────────── Step 2 ─────────── */
function Step2({ onNext, onStatsChange }: {
  onNext: () => void;
  onStatsChange?: (abbrs: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(["sh", "fo", "sog"]);

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter(s => s !== id)
      : selected.length >= 3 ? selected /* max 3, no-op */
      : [...selected, id];
    setSelected(next);
    onStatsChange?.(next.map(i => STATS.find(s => s.id === i)!.abbr));
  };

  return (
    <>
      <div className="hd-ob-heading">Which stats matter most?</div>
      <div className="hd-ob-sub">Select 1–3 stats in order that will be prioritized throughout the app.</div>

      <div className="hd-ob-stat-grid5">
        {STATS.map(s => {
          const rank = selected.indexOf(s.id) + 1; // 0 = not selected
          const sel = rank > 0;
          return (
            <button
              key={s.id}
              className={`hd-ob-sc${sel ? " hd-ob-sc-sel" : ""}`}
              onClick={() => toggle(s.id)}
            >
              {sel && <span className="hd-ob-sc-rank">{rank}</span>}
              <div className="hd-ob-sc-top">
                {!sel
                  ? <HdIcon name="profile" size={12} className="hd-ob-stat-profile" />
                  : null}
                <span className="hd-ob-sc-abbr">{s.abbr}</span>
              </div>
              {sel
                ? <div className="hd-ob-sc-nums">{STAT_VALUES[s.id]}</div>
                : <div className="hd-ob-sc-name">{s.label}</div>}
            </button>
          );
        })}
      </div>

      <button
        className="hd-ob-continue"
        onClick={onNext}
        disabled={selected.length === 0}
        style={selected.length === 0 ? { opacity: 0.35, cursor: "not-allowed" } : undefined}
      >
        Continue
      </button>
    </>
  );
}

/* ─────────── Step 3 ─────────── */
function Step3({
  theme, onThemeChange, textScale, onTextScaleChange, onNext,
}: {
  theme: "dark" | "light";
  onThemeChange: (t: "dark" | "light") => void;
  textScale: number;
  onTextScaleChange: (v: number) => void;
  onNext: () => void;
}) {
  const [adaptive, setAdaptive] = useState(true);

  return (
    <>
      <div className="hd-ob-heading">Display</div>
      <div className="hd-ob-sub">Adjust display preferences</div>

      {/* theme cards */}
      <div className="hd-ob-theme-row" style={{ marginBottom: 20 }}>
        {(["light", "dark"] as const).map(m => (
          <div key={m} className="hd-ob-theme-pick">
            <button
              className={`hd-ob-theme-card3${theme === m ? " hd-ob-sel" : ""}`}
              onClick={() => onThemeChange(m)}
            >
              <DashPreview mode={m} />
            </button>
            <span className="hd-ob-theme-lbl3">{m.charAt(0).toUpperCase() + m.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* adaptive theme */}
      <div className="hd-ob-ctrl-row" style={{ marginBottom: 6, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e8e5ea", marginBottom: 3 }}>Adaptive Theme</div>
          <div style={{ fontSize: 11.5, color: "#555", lineHeight: 1.45, maxWidth: 340 }}>
            Your screen changes to an easy-to-view dark look at night and a brighter theme during the day
          </div>
        </div>
        <Toggle checked={adaptive} onChange={setAdaptive} />
      </div>

      {/* text scale */}
      <div className="hd-ob-ctrl-row" style={{ marginTop: 20, marginBottom: 28 }}>
        <span className="hd-ob-ctrl-label" style={{ marginRight: 12 }}>Text</span>
        <div className="hd-ob-slider-row" style={{ flex: 1 }}>
          <span className="hd-ob-aa-sm">Aa</span>
          <input
            type="range"
            min={0} max={100}
            value={textScale}
            className="hd-ob-slider"
            onChange={e => onTextScaleChange(Number(e.target.value))}
          />
          <span className="hd-ob-aa-lg">Aa</span>
        </div>
      </div>

      <button className="hd-ob-continue" onClick={onNext}>Continue</button>
    </>
  );
}

/* ─────────── Step 4 ─────────── */
function Step4({
  density, onDensityChange, onNext,
}: {
  density: number;
  onDensityChange: (v: number) => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="hd-ob-heading">Display</div>
      <div className="hd-ob-sub">Adjust display preferences</div>

      <div style={{ marginBottom: 16 }}>
        <DensityPreview density={density} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e8e5ea", marginBottom: 3 }}>Information Density</div>
        <div style={{ fontSize: 11.5, color: "#555", marginBottom: 14 }}>
          Adjust the amount of information and widgets shown at once
        </div>
        <input
          type="range"
          min={0} max={100} step={50}
          value={density}
          className="hd-ob-slider hd-ob-slider-full"
          onChange={e => onDensityChange(Number(e.target.value))}
        />
        <div className="hd-ob-density-labels">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      <button className="hd-ob-continue" onClick={onNext}>Continue</button>
    </>
  );
}

/* ─────────── Step 5 ─────────── */
function Step5({
  aiPrioritization, onAIPrioritizationChange,
  aiChat, onAIChatChange,
  aiSuggestions, onAISuggestionsChange,
  onNext,
}: {
  aiPrioritization: boolean; onAIPrioritizationChange: (v: boolean) => void;
  aiChat: boolean; onAIChatChange: (v: boolean) => void;
  aiSuggestions: boolean; onAISuggestionsChange: (v: boolean) => void;
  onNext: () => void;
}) {
  const rows = [
    {
      title: "AI Prioritization",
      desc: "Allow AI to prioritize information based on your preferences",
      checked: aiPrioritization,
      onChange: onAIPrioritizationChange,
    },
    {
      title: "AI Chat and Search",
      desc: "Allow AI Chat and Search",
      checked: aiChat,
      onChange: onAIChatChange,
    },
    {
      title: "AI Suggestions",
      desc: "Allow AI to offer suggestions, which can be dismissed with swipe",
      checked: aiSuggestions,
      onChange: onAISuggestionsChange,
    },
  ];

  return (
    <>
      <div className="hd-ob-heading">AI Assistance</div>
      <div className="hd-ob-sub">Adjust AI preferences</div>

      <div className="hd-ob-ai-rows">
        {rows.map(r => (
          <div key={r.title} className="hd-ob-ai-row">
            <div style={{ flex: 1 }}>
              <div className="hd-ob-ai-title">{r.title}</div>
              <div className="hd-ob-ai-desc">{r.desc}</div>
            </div>
            <Toggle checked={r.checked} onChange={r.onChange} />
          </div>
        ))}
      </div>

      <button className="hd-ob-continue" onClick={onNext}>Continue</button>
    </>
  );
}

/* ─────────── Root modal ─────────── */
export function OnboardingModal({
  step, theme, textScale, density,
  aiPrioritization, aiChat, aiSuggestions,
  onNext, onBack, onThemeChange, onTextScaleChange, onDensityChange,
  onAIPrioritizationChange, onAIChatChange, onAISuggestionsChange,
  onStatsChange,
}: OnboardingModalProps & { onStatsChange?: (abbrs: string[]) => void }) {
  const wide = step === "ob2";
  const lt = theme === "light";

  return (
    <div className={`hd-ob-overlay${lt ? " hd-ob-light" : ""}`}>
      <div className={`hd-ob-modal${wide ? " hd-ob-modal-wide" : ""}${lt ? " hd-ob-light" : ""}`} key={step}>

        {/* ── header row: back (left) + step badge (right) ── */}
        <div className="hd-ob-header">
          {onBack ? (
            <button className="hd-ob-back" onClick={onBack} aria-label="Go back">
              <HdIcon name="back" size={12} />
              Back
            </button>
          ) : (
            <span />
          )}
          <span className="hd-ob-step-badge">
            Step {["ob1","ob2","ob3","ob4","ob5"].indexOf(step) + 1}/5
          </span>
        </div>

        {step === "ob1" && <Step1 onNext={onNext} />}
        {step === "ob2" && <Step2 onNext={onNext} onStatsChange={onStatsChange} />}
        {step === "ob3" && (
          <Step3
            theme={theme} onThemeChange={onThemeChange}
            textScale={textScale} onTextScaleChange={onTextScaleChange}
            onNext={onNext}
          />
        )}
        {step === "ob4" && (
          <Step4
            density={density} onDensityChange={onDensityChange}
            onNext={onNext}
          />
        )}
        {step === "ob5" && (
          <Step5
            aiPrioritization={aiPrioritization} onAIPrioritizationChange={onAIPrioritizationChange}
            aiChat={aiChat} onAIChatChange={onAIChatChange}
            aiSuggestions={aiSuggestions} onAISuggestionsChange={onAISuggestionsChange}
            onNext={onNext}
          />
        )}
      </div>
    </div>
  );
}
