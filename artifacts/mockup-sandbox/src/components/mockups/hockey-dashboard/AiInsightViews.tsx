import { HdIcon } from "./HdIcon";
import { imageBase, videoBase } from "./assets";
import { CAR_FACEOFFS, GAME4_TEAM_TOTALS, VGK_FACEOFFS } from "./game4Data";


export type AiRelatedKey =
  | "staal-faceoffs"
  | "team-faceoffs"
  | "opening-faceoff"
  | "offensive-faceoff";

export interface AiRelatedItem {
  key: AiRelatedKey;
  kind: "stat" | "video";
  eyebrow: string;
  title: string;
  value?: string;
  context: string;
  source?: string;
  poster?: string;
}

export const AI_RELATED_ITEMS: AiRelatedItem[] = [
  {
    key: "staal-faceoffs",
    kind: "stat",
    eyebrow: "Player · Game 4",
    title: "Jordan Staal",
    value: "75%",
    context: "12 wins in 16 draws",
  },
  {
    key: "team-faceoffs",
    kind: "stat",
    eyebrow: "Team · Game 4",
    title: "Carolina",
    value: "57%",
    context: "29 wins in 51 draws",
  },
  {
    key: "opening-faceoff",
    kind: "video",
    eyebrow: "Video · P1 20:00",
    title: "Opening center-ice draw",
    context: "Staal starts against Karlsson",
    source: `${videoBase}faceoffs/opening-center-ice-faceoff.mp4`,
    poster: `${imageBase}video-posters/faceoffs/opening-center-ice-faceoff.jpg`,
  },
  {
    key: "offensive-faceoff",
    kind: "video",
    eyebrow: "Video · P1 19:00",
    title: "Offensive-zone draw",
    context: "Carolina establishes possession",
    source: `${videoBase}faceoffs/offensive-zone-faceoff.mp4`,
    poster: `${imageBase}video-posters/faceoffs/offensive-zone-faceoff.jpg`,
  },
];

const carRows = [...CAR_FACEOFFS]
  .sort((a, b) => b.fo - a.fo || b.wins - a.wins)
  .map(row => ({ ...row, losses: row.fo - row.wins, pct: Math.round((row.wins / Math.max(1, row.fo)) * 100) }));
const vgkRows = [...VGK_FACEOFFS]
  .sort((a, b) => b.fo - a.fo || b.wins - a.wins)
  .map(row => ({ ...row, losses: row.fo - row.wins, pct: Math.round((row.wins / Math.max(1, row.fo)) * 100) }));

export function AiFaceoffVisual({ compact = false }: { compact?: boolean }) {
  const rows = carRows.slice(0, compact ? 4 : 6);
  return (
    <div className={`ai-faceoff-visual${compact ? " ai-faceoff-visual-compact" : ""}`}>
      <div className="ai-faceoff-callout">
        <span><HdIcon name="sparkle" size={15} /> Highest-confidence coaching edge</span>
        <strong>Keep Staal on defensive and late-game draws</strong>
        <p>Carolina won 57% of all faceoffs. Jordan Staal led every regular taker at 12–4.</p>
      </div>
      <div className="ai-faceoff-bars" aria-label="Carolina Game 4 faceoff results sorted by attempts">
        {rows.map(row => (
          <div className="ai-faceoff-row" key={row.num}>
            <span className="ai-faceoff-player"><b>#{row.num}</b> {row.name}</span>
            <span className="ai-faceoff-track"><i style={{ width: `${row.pct}%` }} /></span>
            <strong>{row.pct}%</strong>
            <small>{row.wins}–{row.losses}</small>
          </div>
        ))}
      </div>
      {!compact && (
        <>
          <div className="ai-faceoff-context">
            <div><small>Primary deployment</small><strong>Defensive-zone draws</strong><span>Staal · 75% · 12–4</span></div>
            <div><small>Secondary option</small><strong>Jankowski</strong><span>71% · 5–2</span></div>
            <div><small>Matchup caution</small><strong>Aho workload</strong><span>38% · 5–8</span></div>
          </div>
          <div className="ai-faceoff-summary">
            <div><strong>29</strong><span>CAR wins</span></div>
            <div><strong>22</strong><span>VGK wins</span></div>
            <div><strong>+7</strong><span>draw differential</span></div>
          </div>
        </>
      )}
    </div>
  );
}

export function AiRelatedMiniatures({ onOpen }: { onOpen: (key: AiRelatedKey) => void }) {
  const stats = AI_RELATED_ITEMS.filter(item => item.kind === "stat");
  const videos = AI_RELATED_ITEMS.filter(item => item.kind === "video");
  return (
    <div className="ai-related-zone">
      <div className="ai-related-stats">
        {stats.map(item => (
          <button type="button" className="ai-related-stat" key={item.key} onClick={() => onOpen(item.key)}>
            <i />
            <span><small>{item.eyebrow}</small><strong>{item.value}</strong><b>{item.title}</b></span>
            <em>{item.context}</em>
            <HdIcon name="head-to-head-faceoffs" size={16} />
          </button>
        ))}
      </div>
      <div className="ai-related-videos">
        {videos.map(item => (
          <button type="button" className="ai-related-video" key={item.key} onClick={() => onOpen(item.key)}>
            <img src={item.poster} alt="" />
            <span><small>{item.eyebrow}</small><strong>{item.title}</strong><em>{item.context}</em></span>
            <HdIcon name="play" size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="ai-full-back" onClick={onClick}><HdIcon name="back" size={14} /> Back to AI Insight</button>;
}

function TeamComparison() {
  const car = GAME4_TEAM_TOTALS.CAR;
  const vgk = GAME4_TEAM_TOTALS.VGK;
  return (
    <div className="ai-team-comparison">
      <div className="ai-team-card">
        <img src={`${imageBase}canes.png`} alt="Carolina Hurricanes" />
        <strong>{Math.round((car.faceoffWins / car.faceoffs) * 100)}%</strong>
        <span>{car.faceoffWins} wins · {car.faceoffs - car.faceoffWins} losses</span>
      </div>
      <div className="ai-team-divider"><span>51</span><small>Total draws</small></div>
      <div className="ai-team-card">
        <img src={`${imageBase}vgk.png`} alt="Vegas Golden Knights" />
        <strong>{Math.round((vgk.faceoffWins / vgk.faceoffs) * 100)}%</strong>
        <span>{vgk.faceoffWins} wins · {vgk.faceoffs - vgk.faceoffWins} losses</span>
      </div>
    </div>
  );
}

function FaceoffTable({ team }: { team: "CAR" | "VGK" }) {
  const rows = team === "CAR" ? carRows : vgkRows;
  return (
    <div className="ai-full-table">
      <header><span>#</span><span>Player</span><span>FO</span><span>W–L</span><span>FO%</span></header>
      {rows.map(row => (
        <div key={`${team}-${row.num}`}>
          <span>{row.num}</span><strong>{row.name}</strong><span>{row.fo}</span><span>{row.wins}–{row.losses}</span><b>{row.pct}%</b>
        </div>
      ))}
    </div>
  );
}

export function AiRelatedFullView({ itemKey, onBack }: { itemKey: AiRelatedKey; onBack: () => void }) {
  const item = AI_RELATED_ITEMS.find(entry => entry.key === itemKey)!;

  if (item.kind === "video") {
    return (
      <main className="ai-full-view ai-video-full-view">
        <header className="ai-full-header">
          <div><HdIcon name="sparkle" size={17} /><span><strong>AI Insights</strong><small> | {item.title}</small></span></div>
          <BackButton onClick={onBack} />
        </header>
        <div className="ai-video-copy">
          <strong>{item.title}</strong>
          <span>{item.context}</span>
        </div>
        <video className="ai-full-video" controls preload="metadata" poster={item.poster}>
          <source src={item.source} type="video/mp4" />
        </video>
        <div className="ai-video-note"><HdIcon name="lineup-analyzer" size={18} /><span>Use this clip with the Game 4 faceoff table to review the matchup and first-touch support.</span></div>
      </main>
    );
  }

  const playerMode = item.key === "staal-faceoffs";
  return (
    <main className="ai-full-view">
      <header className="ai-full-header">
        <div><HdIcon name="sparkle" size={17} /><span><strong>AI Insights</strong><small> | {item.title}</small></span></div>
        <BackButton onClick={onBack} />
      </header>
      <section className="ai-full-hero">
        <div className="ai-full-hero-copy">
          <span>{item.eyebrow}</span>
          <strong>{item.value}</strong>
          <h1>{playerMode ? "Jordan Staal controlled the highest-leverage draws" : "Carolina finished Game 4 with a seven-draw edge"}</h1>
          <p>{playerMode
            ? "Staal took the largest Carolina workload and won 12 of 16 draws. That combination of volume and efficiency makes him the preferred late-game option."
            : "Carolina won 29 of 51 faceoffs. The advantage was concentrated in Staal and Jankowski rather than spread evenly across all centers."}</p>
        </div>
        {playerMode ? <AiFaceoffVisual /> : <TeamComparison />}
      </section>
      <section className="ai-full-data-grid">
        <div>
          <h2>Carolina faceoff takers</h2>
          <FaceoffTable team="CAR" />
        </div>
        <div>
          <h2>Vegas faceoff takers</h2>
          <FaceoffTable team="VGK" />
        </div>
      </section>
      <footer className="ai-full-recommendation"><HdIcon name="sparkle" size={16} /><span><strong>Coaching recommendation:</strong> prioritize Staal for defensive-zone and protecting-a-lead situations; use Jankowski as the secondary high-efficiency option.</span></footer>
    </main>
  );
}
