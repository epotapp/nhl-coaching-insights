/* Video — real clip library: Faceoffs · Goals · Shots */
import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronLeft, SkipBack, SkipForward } from "lucide-react";
import { PageProps } from "../shared";
import { HdIcon } from "../HdIcon";
import { imageBase, videoBase } from "../assets";
import "./video.css";

const media = videoBase;
const posters = `${imageBase}video-posters/`;

type PlaylistName = "Faceoffs" | "Goals" | "Shots";

interface Clip {
  id: number;
  title: string;
  subject: string;
  event: string;
  period: string;
  clock: string;
  playlist: PlaylistName;
  durSec: number;
  src: string;
  poster: string;
}

const CLIPS: Clip[] = [
  {
    id: 0,
    title: "Offensive-zone faceoff",
    subject: "#22 Logan Stankoven vs #9 Jack Eichel",
    event: "CAR wins offensive-zone draw",
    period: "1ST PERIOD",
    clock: "19:00",
    playlist: "Faceoffs",
    durSec: 12.2,
    src: `${media}faceoffs/offensive-zone-faceoff.mp4`,
    poster: `${posters}faceoffs/offensive-zone-faceoff.jpg`,
  },
  {
    id: 1,
    title: "Opening center-ice faceoff",
    subject: "Jordan Staal vs William Karlsson",
    event: "Opening draw",
    period: "1ST PERIOD",
    clock: "20:00",
    playlist: "Faceoffs",
    durSec: 16.1,
    src: `${media}faceoffs/opening-center-ice-faceoff.mp4`,
    poster: `${posters}faceoffs/opening-center-ice-faceoff.jpg`,
  },
  {
    id: 2,
    title: "Center-ice faceoff — Vegas goal",
    subject: "Reset after Mark Stone goal",
    event: "Center-ice draw · CAR 2–1",
    period: "1ST PERIOD",
    clock: "12:38",
    playlist: "Faceoffs",
    durSec: 14.6,
    src: `${media}faceoffs/center-ice-faceoff-vegas-goal.mp4`,
    poster: `${posters}faceoffs/center-ice-faceoff-vegas-goal.jpg`,
  },
  {
    id: 3,
    title: "Center-ice faceoff — Carolina goal",
    subject: "Reset after Logan Stankoven goal",
    event: "Center-ice draw · CAR 1–0",
    period: "1ST PERIOD",
    clock: "18:54",
    playlist: "Faceoffs",
    durSec: 8.6,
    src: `${media}faceoffs/center-ice-faceoff-carolina-goal.mp4`,
    poster: `${posters}faceoffs/center-ice-faceoff-carolina-goal.jpg`,
  },
  {
    id: 4,
    title: "Center-ice faceoff — Carolina third goal",
    subject: "Reset after Jordan Staal goal",
    event: "Center-ice draw · CAR 3–1",
    period: "1ST PERIOD",
    clock: "07:12",
    playlist: "Faceoffs",
    durSec: 14.6,
    src: `${media}faceoffs/center-ice-faceoff-carolina-goal-3.mp4`,
    poster: `${posters}faceoffs/center-ice-faceoff-carolina-goal-3.jpg`,
  },
  {
    id: 5,
    title: "Mark Stone goal",
    subject: "#61 Mark Stone",
    event: "Breakaway goal · CAR 2–1",
    period: "1ST PERIOD",
    clock: "12:38",
    playlist: "Goals",
    durSec: 51.8,
    src: `${media}goals/vegas-goal-1.mp4`,
    poster: `${posters}goals/vegas-goal-1.jpg`,
  },
  {
    id: 6,
    title: "Logan Stankoven goal",
    subject: "#22 Logan Stankoven",
    event: "Backhand goal · CAR 1–0",
    period: "1ST PERIOD",
    clock: "18:54",
    playlist: "Goals",
    durSec: 32.8,
    src: `${media}goals/carolina-goal-1.mp4`,
    poster: `${posters}goals/carolina-goal-1.jpg`,
  },
  {
    id: 7,
    title: "Jackson Blake goal",
    subject: "#53 Jackson Blake",
    event: "Wrist-shot goal · CAR 2–0",
    period: "1ST PERIOD",
    clock: "16:32",
    playlist: "Goals",
    durSec: 47.8,
    src: `${media}goals/carolina-goal-2.mp4`,
    poster: `${posters}goals/carolina-goal-2.jpg`,
  },
  {
    id: 8,
    title: "Jordan Staal power-play goal",
    subject: "#11 Jordan Staal",
    event: "Power-play goal · CAR 3–1",
    period: "1ST PERIOD",
    clock: "07:12",
    playlist: "Goals",
    durSec: 40.0,
    src: `${media}goals/carolina-goal-3.mp4`,
    poster: `${posters}goals/carolina-goal-3.jpg`,
  },
  {
    id: 9,
    title: "Taylor Hall late chance",
    subject: "#71 Taylor Hall",
    event: "Wrist shot on goal",
    period: "1ST PERIOD",
    clock: "00:22",
    playlist: "Shots",
    durSec: 27.1,
    src: `${media}shots/taylor-hall-breakaway.mp4`,
    poster: `${posters}shots/taylor-hall-breakaway.jpg`,
  },
  {
    id: 10,
    title: "Sebastian Aho wrist shot",
    subject: "#20 Sebastian Aho",
    event: "Opening shot on goal",
    period: "1ST PERIOD",
    clock: "19:18",
    playlist: "Shots",
    durSec: 9.2,
    src: `${media}shots/sebastian-aho-wrist-shot.mp4`,
    poster: `${posters}shots/sebastian-aho-wrist-shot.jpg`,
  },
  {
    id: 11,
    title: "Vegas shot — no goal",
    subject: "Vegas Golden Knights",
    event: "Late attempt · video review",
    period: "1ST PERIOD",
    clock: "00:13",
    playlist: "Shots",
    durSec: 22.8,
    src: `${media}shots/vegas-shot-no-goal.mp4`,
    poster: `${posters}shots/vegas-shot-no-goal.jpg`,
  },
  {
    id: 12,
    title: "Mark Stone shorthanded breakaway",
    subject: "#61 Mark Stone",
    event: "Shorthanded chance during CAR power play",
    period: "1ST PERIOD",
    clock: "16:48",
    playlist: "Shots",
    durSec: 21.5,
    src: `${media}shots/mark-stone-shorthanded-breakaway.mp4`,
    poster: `${posters}shots/mark-stone-shorthanded-breakaway.jpg`,
  },
  {
    id: 13,
    title: "Jackson Blake wrist shot — goal",
    subject: "#53 Jackson Blake",
    event: "Wrist-shot goal · CAR 2–0",
    period: "1ST PERIOD",
    clock: "16:32",
    playlist: "Shots",
    durSec: 28.5,
    src: `${media}shots/jackson-blake-wrist-shot-goal.mp4`,
    poster: `${posters}shots/jackson-blake-wrist-shot-goal.jpg`,
  },
  {
    id: 14,
    title: "Logan Stankoven backhand — goal",
    subject: "#22 Logan Stankoven",
    event: "Backhand goal · CAR 1–0",
    period: "1ST PERIOD",
    clock: "18:54",
    playlist: "Shots",
    durSec: 18.1,
    src: `${media}shots/logan-stankoven-backhand-goal.mp4`,
    poster: `${posters}shots/logan-stankoven-backhand-goal.jpg`,
  },
  {
    id: 15,
    title: "Mark Stone breakaway — goal",
    subject: "#61 Mark Stone",
    event: "Breakaway goal · CAR 2–1",
    period: "1ST PERIOD",
    clock: "12:38",
    playlist: "Shots",
    durSec: 24.8,
    src: `${media}shots/mark-stone-breakaway-goal.mp4`,
    poster: `${posters}shots/mark-stone-breakaway-goal.jpg`,
  },
  {
    id: 16,
    title: "Jordan Staal rebound — PP goal",
    subject: "#11 Jordan Staal",
    event: "Power-play rebound goal · CAR 3–1",
    period: "1ST PERIOD",
    clock: "07:12",
    playlist: "Shots",
    durSec: 42.1,
    src: `${media}shots/jordan-staal-rebound-pp-goal.mp4`,
    poster: `${posters}shots/jordan-staal-rebound-pp-goal.jpg`,
  },
];

const PLAYLIST_DEFS: { name: PlaylistName; date: string; desc: string }[] = [
  { name: "Faceoffs", date: "Game 4 · vs Vegas", desc: "Opening, center-ice and offensive-zone draws" },
  { name: "Goals", date: "Game 4 · vs Vegas", desc: "Complete scoring sequences from both teams" },
  { name: "Shots", date: "Game 4 · vs Vegas", desc: "Breakaways, wrist shots, rebounds and ruled-out attempts" },
];

const PLAY_DATE = "GAME 4 • VS VEGAS";

function pad(n: number) {
  return n < 10 ? "0" + n : "" + n;
}
function mmss(sec: number) {
  const safe = Number.isFinite(sec) ? Math.max(0, sec) : 0;
  return pad(Math.floor(safe / 60)) + ":" + pad(Math.floor(safe % 60));
}

type View =
  | { kind: "home" }
  | { kind: "playlist"; name: PlaylistName }
  | { kind: "player"; clipId: number; from: View };

export function VideoPage({ theme: _theme }: PageProps) {
  const [view, setView] = useState<View>({ kind: "home" });
  const [saved, setSaved] = useState<Set<number>>(new Set([7, 13]));

  const openPlayer = (clipId: number) =>
    setView((cur) => ({ kind: "player", clipId, from: cur }));

  const toggleSaved = (id: number) =>
    setSaved((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (view.kind === "player") {
    const clip = CLIPS.find((c) => c.id === view.clipId)!;
    return (
      <VideoPlayer
        clip={clip}
        onBack={() => setView(view.from)}
        isSaved={saved.has(clip.id)}
        onToggleSaved={() => toggleSaved(clip.id)}
      />
    );
  }

  if (view.kind === "playlist") {
    const def = PLAYLIST_DEFS.find((p) => p.name === view.name)!;
    const clips = CLIPS.filter((c) => c.playlist === view.name);
    return (
      <PlaylistDetail
        def={def}
        clips={clips}
        onBack={() => setView({ kind: "home" })}
        onOpenClip={openPlayer}
      />
    );
  }

  const savedClips = CLIPS.filter((c) => saved.has(c.id));
  const recommended = CLIPS.filter((c) => !saved.has(c.id)).slice(0, 8);

  return (
    <div className="vd-root">
      <div>
        {/* Real media grouped into the three supplied sections. */}
        {PLAYLIST_DEFS.map((p) => {
          const clips = CLIPS.filter((c) => c.playlist === p.name);
          return (
            <section className="vd-home-section" key={p.name}>
              <div className="vd-sec-head">
                <button
                  className="vd-sec-title vd-sec-title-btn"
                  onClick={() => setView({ kind: "playlist", name: p.name })}
                >
                  {p.name}
                </button>
                <span className="vd-count">{clips.length}</span>
                <button
                  className="vd-sec-arrow-inline"
                  aria-label={`Open ${p.name}`}
                  onClick={() => setView({ kind: "playlist", name: p.name })}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="vd-carousel">
                {clips.slice(0, 3).map((c) => (
                  <button key={c.id} className="vd-clip-card" onClick={() => openPlayer(c.id)}>
                    <img className="vd-clip-thumb" src={c.poster} alt="" />
                    <div className="vd-clip-cap">
                      {c.title} <span>| {c.period}</span>
                    </div>
                    <span className="vd-clip-expand"><HdIcon name="expand" size={16} /></span>
                    <span className="vd-clip-play"><HdIcon name="play" size={18} /></span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}

        <div className="vd-two-col">
          <div className="vd-col">
            <div className="vd-sec-head">
              <span className="vd-sec-title">Saved</span>
              <span className="vd-count">{savedClips.length}</span>
            </div>
            <div className="vd-list-panel">
              {savedClips.length === 0 ? (
                <div className="vd-list-empty">No saved clips yet</div>
              ) : (
                savedClips.map((c) => <MiniRow key={c.id} clip={c} onClick={() => openPlayer(c.id)} />)
              )}
            </div>
          </div>

          <div className="vd-col">
            <div className="vd-sec-head">
              <span className="vd-sec-title">Recommended Clips</span>
              <span className="vd-count">{recommended.length}</span>
            </div>
            <div className="vd-list-panel">
              {recommended.map((c) => <MiniRow key={c.id} clip={c} onClick={() => openPlayer(c.id)} />)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="vd-rail-title">Video Sections</div>
        <div className="vd-rail-list">
          {PLAYLIST_DEFS.map((p) => {
            const clips = CLIPS.filter((c) => c.playlist === p.name);
            return (
              <button
                key={p.name}
                className="vd-playlist-row"
                onClick={() => setView({ kind: "playlist", name: p.name })}
              >
                <img className="vd-playlist-cover" src={clips[0]?.poster} alt="" />
                <span className="vd-playlist-meta">
                  <span className="vd-playlist-name">{p.name}</span>
                  <span className="vd-playlist-count">{clips.length} clips</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniRow({ clip, onClick }: { clip: Clip; onClick: () => void }) {
  return (
    <button className="vd-mini-row" onClick={onClick}>
      <img className="vd-mini-thumb" src={clip.poster} alt="" />
      <span className="vd-mini-info">
        <span className="vd-mini-title">{clip.title}</span>
        <span className="vd-mini-date">{clip.event} · {clip.period}</span>
      </span>
      <span className="vd-mini-go"><ChevronRight size={22} /></span>
    </button>
  );
}

function PlaylistDetail({
  def,
  clips,
  onBack,
  onOpenClip,
}: {
  def: { name: PlaylistName; date: string; desc: string };
  clips: Clip[];
  onBack: () => void;
  onOpenClip: (id: number) => void;
}) {
  return (
    <div>
      <button className="vd-back" onClick={onBack}><ChevronLeft size={18} /> Back</button>

      <div className="vd-pl-header">
        <img src={clips[0]?.poster} alt="" />
        <div className="vd-pl-header-shade" />
        <div className="vd-pl-header-body">
          <div className="vd-pl-title">{def.name}</div>
          <div className="vd-pl-date">{def.date}</div>
          <div className="vd-pl-desc">{def.desc}</div>
          <button className="vd-pl-playall" onClick={() => clips[0] && onOpenClip(clips[0].id)}>
            <HdIcon name="play" size={16} /> Play All
          </button>
        </div>
      </div>

      <div className="vd-pl-rows">
        {clips.map((c) => (
          <button key={c.id} className="vd-pl-row" onClick={() => onOpenClip(c.id)}>
            <img className="vd-pl-row-thumb" src={c.poster} alt="" />
            <span className="vd-pl-row-info">
              <span className="vd-pl-row-title">
                {c.title} <span>| {c.event} · {c.period} {c.clock}</span>
              </span>
            </span>
            <span className="vd-pl-row-dur">{mmss(c.durSec)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function VideoPlayer({
  clip,
  onBack,
  isSaved,
  onToggleSaved,
}: {
  clip: Clip;
  onBack: () => void;
  isSaved: boolean;
  onToggleSaved: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(0);
  const [duration, setDuration] = useState(clip.durSec);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPos(0);
    setDuration(clip.durSec);
    setPlaying(false);
  }, [clip]);

  const seek = (next: number) => {
    const video = videoRef.current;
    if (!video) return;
    const total = Number.isFinite(video.duration) ? video.duration : duration;
    const clamped = Math.max(0, Math.min(total, next));
    video.currentTime = clamped;
    setPos(clamped);
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) await video.play();
      else video.pause();
    } catch {
      setPlaying(false);
    }
  };

  const seekFromEvent = (e: React.MouseEvent) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const pct = duration > 0 ? (pos / duration) * 100 : 0;

  return (
    <div className="vd-player">
      <div className="vd-player-top">
        <button className="vd-back" onClick={onBack}><ChevronLeft size={18} /> Back</button>
        <div className="vd-player-meta">
          <div className="vd-player-meta-top">{PLAY_DATE} • {clip.playlist.toUpperCase()}</div>
          <div className="vd-player-meta-main">
            <strong>{clip.subject}</strong> • {clip.event} • {clip.period} {clip.clock}
          </div>
        </div>
        <div className="vd-player-tools">
          <button
            className={`vd-tool-btn${isSaved ? " vd-tool-on" : ""}`}
            aria-label="Bookmark"
            onClick={onToggleSaved}
          >
            <HdIcon name={isSaved ? "bookmark-circle" : "bookmark"} size={17} />
          </button>
          <button className="vd-tool-btn" aria-label="Clip information"><HdIcon name="info" size={17} /></button>
        </div>
      </div>

      <button className="vd-frame" onClick={togglePlay} aria-label={playing ? "Pause video" : "Play video"}>
        <video
          ref={videoRef}
          src={clip.src}
          poster={clip.poster}
          preload="metadata"
          playsInline
          onLoadedMetadata={(e) => {
            const total = e.currentTarget.duration;
            if (Number.isFinite(total) && total > 0) setDuration(total);
          }}
          onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        {!playing && <span className="vd-frame-play"><HdIcon name="play" size={34} /></span>}
      </button>

      <div className="vd-transport">
        <button className="vd-t-btn" aria-label="Back 10 seconds" onClick={() => seek(pos - 10)}>
          <HdIcon name="back-10" size={27} />
        </button>
        <button className="vd-t-btn" aria-label="Frame back" onClick={() => seek(pos - 0.25)}>
          <SkipBack size={22} fill="currentColor" />
        </button>
        <button className="vd-t-btn" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay}>
          {playing ? <HdIcon name="pause" size={26} /> : <HdIcon name="play" size={26} />}
        </button>
        <button className="vd-t-btn" aria-label="Frame forward" onClick={() => seek(pos + 0.25)}>
          <SkipForward size={22} fill="currentColor" />
        </button>
        <button className="vd-t-btn" aria-label="Forward 10 seconds" onClick={() => seek(pos + 10)}>
          <HdIcon name="forward-10" size={27} />
        </button>
      </div>

      <div className="vd-scrub">
        <span className="vd-scrub-time">{mmss(pos)}</span>
        <div className="vd-scrub-bar" ref={barRef} onClick={seekFromEvent}>
          <div className="vd-scrub-fill" style={{ width: pct + "%" }} />
          <div className="vd-scrub-handle" style={{ left: pct + "%" }} />
        </div>
        <span className="vd-scrub-time vd-scrub-time-r">{mmss(duration)}</span>
      </div>
    </div>
  );
}
