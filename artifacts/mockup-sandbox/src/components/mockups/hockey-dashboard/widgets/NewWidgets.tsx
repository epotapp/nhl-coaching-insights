import { PageProps } from "../shared";

const img = "/__mockup/images/hockey-dashboard/";

export interface WidgetProps extends PageProps {
  variant?: "card" | "section" | "full";
  playerName?: string;
}

interface H2HRow {
  face: number;
  car: string;
  carNum: number;
  vgkFace: number;
  vgk: string;
  vgkNum: number;
  won: number;
  total: number;
}

const H2H_ROWS: H2HRow[] = [
  { face: 5, car: "Staal", carNum: 11, vgkFace: 2, vgk: "Hertl", vgkNum: 48, won: 9, total: 14 },
  { face: 1, car: "Aho", carNum: 20, vgkFace: 6, vgk: "Eichel", vgkNum: 9, won: 5, total: 12 },
  { face: 2, car: "Stankoven", carNum: 22, vgkFace: 7, vgk: "Sissons", vgkNum: 10, won: 4, total: 8 },
  { face: 7, car: "Jankowski", carNum: 77, vgkFace: 4, vgk: "Dowd", vgkNum: 26, won: 4, total: 6 },
];

export function HeadToHeadFaceoffs({ variant = "card" }: WidgetProps) {
  const rich = variant !== "card";
  const rows = rich ? H2H_ROWS : H2H_ROWS.slice(0, 3);
  return (
    <div className={`fi-h2h fi-h2h-${variant}`}>
      {rich && (
        <div className="fi-h2h-legend">
          <span className="fi-h2h-legend-car"><img src={`${img}canes.png?v=6`} alt=""/> CAR</span>
          <span>Game 4 faceoff matchups</span>
          <span className="fi-h2h-legend-vgk"><img src={`${img}vgk.png?v=6`} alt=""/> VGK</span>
        </div>
      )}
      {rows.map(row => {
        const pct = Math.round((row.won / row.total) * 100);
        return (
          <div className="fi-h2h-row" key={`${row.carNum}-${row.vgkNum}`}>
            <div className="fi-h2h-side fi-h2h-car">
              <img src={`${img}face${row.face}.png?v=6`} alt={row.car} className="fi-h2h-face"/>
              <div className="fi-h2h-nm"><span className="fi-h2h-name">{row.car}</span><span className="fi-h2h-num">#{row.carNum}</span></div>
            </div>
            <div className="fi-h2h-mid">
              <div className="fi-h2h-pcts"><span className="fi-h2h-pct-car">{pct}%</span><span className="fi-h2h-pct-vgk">{100 - pct}%</span></div>
              <div className="fi-h2h-bar"><span className="fi-h2h-bar-car" style={{ width: `${pct}%` }}/><span className="fi-h2h-bar-vgk" style={{ width: `${100 - pct}%` }}/></div>
              {rich && <span className="fi-h2h-count">{row.won}/{row.total} CAR wins</span>}
            </div>
            <div className="fi-h2h-side fi-h2h-vgk">
              <div className="fi-h2h-nm fi-h2h-nm-r"><span className="fi-h2h-name">{row.vgk}</span><span className="fi-h2h-num">#{row.vgkNum}</span></div>
              <img src={`${img}face${row.vgkFace}.png?v=6`} alt={row.vgk} className="fi-h2h-face"/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SHOT_ROWS = [
  { name: "Jordan Staal", num: 11, pct: 50.0, shots: 4, goals: 2 },
  { name: "Logan Stankoven", num: 22, pct: 33.3, shots: 3, goals: 1 },
  { name: "Jackson Blake", num: 53, pct: 33.3, shots: 3, goals: 1 },
  { name: "Nikolaj Ehlers", num: 27, pct: 33.3, shots: 3, goals: 1 },
  { name: "Sebastian Aho", num: 20, pct: 0, shots: 3, goals: 0 },
];

export function ShotsPercentage({ variant = "card" }: WidgetProps) {
  const rich = variant !== "card";
  const rows = rich ? SHOT_ROWS : SHOT_ROWS.slice(0, 4);
  return (
    <div className={`fi-sp fi-sp-${variant}`}>
      <div className="fi-sp-bars">
        {rows.map(row => (
          <div className="fi-sp-row" key={row.num}>
            <span className="fi-sp-name">{rich ? `#${row.num} ${row.name}` : row.name.split(" ").at(-1)}</span>
            <div className="fi-sp-track"><span className="fi-sp-fill" style={{ width: `${Math.max(4, row.pct * 2)}%` }}/></div>
            <span className="fi-sp-val">{row.pct.toFixed(1)}%</span>
            {rich && <span className="fi-sp-shots">{row.goals}/{row.shots}</span>}
          </div>
        ))}
      </div>
      <div className="fi-sp-donut">
        <svg width="92" height="92" viewBox="0 0 92 92" aria-label="Carolina team shooting percentage 17.9 percent">
          <circle cx="46" cy="46" r="34" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10"/>
          <circle cx="46" cy="46" r="34" fill="none" stroke="#4186ff" strokeWidth="10" strokeLinecap="round" strokeDasharray="38.2 213.6" transform="rotate(-90 46 46)"/>
          <text x="46" y="42" textAnchor="middle" className="fi-sp-donut-num">17.9%</text>
          <text x="46" y="56" textAnchor="middle" className="fi-sp-donut-lbl">TEAM</text>
        </svg>
        {rich && <span className="fi-sp-donut-cap">5 goals / 28 shots</span>}
      </div>
    </div>
  );
}

const SECTOR_LAYOUT = `${img}shooting-by-sector-layout.png`;

export function ShootingBySector({ variant = "card", playerName }: WidgetProps) {
  const rich = variant !== "card";
  return (
    <div className={`fi-sec fi-sec-${variant}`}>
      {rich && <div className="fi-sec-title">Offensive Zone · {playerName ?? "Carolina"}</div>}
      <div className="fi-sec-map-wrap"><img className="fi-sec-map" src={SECTOR_LAYOUT} alt={`Shooting by sector map for ${playerName ?? "Carolina"}`}/></div>
      {rich && <div className="fi-sec-note">Goals / shots and conversion rate by offensive-zone sector</div>}
    </div>
  );
}

const PP1 = [
  { face: 4, name: "Gostisbehere", num: 4 },
  { face: 1, name: "Aho", num: 20 },
  { face: 3, name: "Jarvis", num: 24 },
  { face: 2, name: "Svechnikov", num: 37 },
  { face: 5, name: "Staal", num: 11 },
];
const PP_POS = [{ top: 8, left: 50 }, { top: 42, left: 20 }, { top: 42, left: 80 }, { top: 58, left: 50 }, { top: 86, left: 50 }];

export function PowerPlayWidget({ variant = "card" }: WidgetProps) {
  const rich = variant !== "card";
  return (
    <div className={`fi-pp fi-pp-${variant}`}>
      <div className="fi-pp-left">
        <div className="fi-pp-unit-label">Game 4 · PP1</div>
        <div className="fi-pp-ice">
          {PP1.map((chip, index) => (
            <div className="fi-pp-chip" key={chip.num} style={{ top: `${PP_POS[index].top}%`, left: `${PP_POS[index].left}%` }}>
              <img src={`${img}face${chip.face}.png?v=6`} alt={chip.name}/><span className="fi-pp-chip-num">{chip.num}</span>{rich && <span className="fi-pp-chip-name">{chip.name}</span>}
            </div>
          ))}
          <div className="fi-pp-net"/>
        </div>
      </div>
      <div className="fi-pp-right">
        <div className="fi-pp-stat"><span className="fi-pp-stat-num">33.3%</span><span className="fi-pp-stat-lbl">1 / 3 Power Play</span></div>
        <div className="fi-pp-timeline"><span className="fi-pp-tl-label">Opportunities</span><div className="fi-pp-tl-strip"><span className="fi-pp-tl-tick"/><span className="fi-pp-tl-tick fi-pp-tl-goal"/><span className="fi-pp-tl-tick"/></div></div>
        {rich && <div className="fi-pp-extra"><div className="fi-pp-extra-row"><span>PP goal</span><strong>Staal · 07:12 P1</strong></div><div className="fi-pp-extra-row"><span>PK</span><strong>3 / 3 · 100%</strong></div></div>}
      </div>
    </div>
  );
}
