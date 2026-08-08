/* Notes — editor + note library. Faithful recreation of the approved design. */
import { useMemo, useRef, useState } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, CheckSquare,
  Paperclip, ChevronDown, Pin, SquarePen, PanelLeft,
  Library, X, Folder, Trash2, FolderPlus, Circle,
} from "lucide-react";
import { PageProps, Flash } from "../shared";
import "./notes.css";

/* ── data model ── */
type Folder =
  | "Pre-Game" | "Post-Game" | "Players" | "Systems";

interface Note {
  id: string;
  title: string;
  body: string;
  snippet: string;
  pinned: boolean;
  folder: Folder | null;
  deleted: boolean;
  /* minutes-ago for "today", or a bucket keyword */
  when: number;                       // minutes ago
  bucket: "today" | "yesterday" | "week";
}

const FOLDERS: Folder[] = ["Pre-Game", "Post-Game", "Players", "Systems"];

function seedNotes(): Note[] {
  return [
    {
      id: "n1",
      title: "Game 4 pre-scout — VGK PP1 tendencies",
      body:
        "Vegas PP1 runs a 1-3-1. Eichel (#9) QB from the right half-wall — he'll walk the line looking for the one-timer to Karlsson (#71) at the left dot.\n\nKey reads:\n- Stone (#61) net-front screen + tips, box him out early\n- Hertl (#48) bumper in the slot, our low forward must stay tight\n- If PK pressures the half-wall, they reverse to Stephenson (#20) at the point\n\nPK adjust: overload strong side, take away the seam pass first.",
      snippet: "Vegas PP1 runs a 1-3-1. Eichel QB from the right half-wall…",
      pinned: true,
      folder: "Pre-Game",
      deleted: false,
      when: 0,
      bucket: "today",
    },
    {
      id: "n2",
      title: "Blake — shot selection notes",
      body:
        "Blake (#74) is passing up A-grade looks off the rush. Wants the perfect play instead of getting pucks to the net.\n\n- Encourage the quick release from the top of the circles\n- On the PP bumper spot he's over-handling — one-touch it\n- Track: shot attempts vs. passes on the entry this week",
      snippet: "Blake is passing up A-grade looks off the rush…",
      pinned: true,
      folder: "Players",
      deleted: false,
      when: 0,
      bucket: "today",
    },
    {
      id: "n3",
      title: "Opponent Scouting",
      body:
        "Vegas defensive-zone coverage: strong-side lock, D pinch aggressively on the wall. Beat it with quick D-to-D and stretch the weak-side winger (Jarvis #24).",
      snippet: "Vegas defensive-zone coverage: strong-side lock, D pinch…",
      pinned: false,
      folder: "Pre-Game",
      deleted: false,
      when: 3,
      bucket: "today",
    },
    {
      id: "n4",
      title: "Morning Meeting",
      body:
        "Line changes for tonight:\n- Aho (#20) between Svechnikov (#37) and Jarvis (#24)\n- Staal (#11) anchors the shutdown line with Martinook (#48)\n- Watch neutral-zone regroups — we were too flat last game.",
      snippet: "Line changes for tonight: Aho between Svechnikov and Jarvis…",
      pinned: false,
      folder: null,
      deleted: false,
      when: 10,
      bucket: "today",
    },
    {
      id: "n5",
      title: "Power Play Ideas",
      body:
        "PP1: try Gostisbehere (#8) walking the blue line to open the seam for Aho's one-timer. Kotkaniemi (#82) net-front for tips and rebounds. Get a shot mentality — too many extra passes.",
      snippet: "PP1: try Gostisbehere walking the blue line to open the seam…",
      pinned: false,
      folder: "Systems",
      deleted: false,
      when: 25,
      bucket: "today",
    },
    {
      id: "n6",
      title: "PK structure fixes from Game 3",
      body:
        "PK gave up two seam passes for one-timers. Fixes:\n- Down-low forward stays below the dots, don't chase the bumper\n- Diamond rotation must be tighter on the QB\n- Faceoff PK: Staal (#11) taking D-zone draws, Martinook wing lock",
      snippet: "PK gave up two seam passes for one-timers. Fixes…",
      pinned: false,
      folder: "Post-Game",
      deleted: false,
      when: 1080,
      bucket: "yesterday",
    },
    {
      id: "n7",
      title: "Faceoff assignments",
      body:
        "D-zone draws: Staal (#11) & Aho (#20).\nO-zone draws: Kotkaniemi (#82) & Blake (#74).\nNeutral: Jarvis (#24) can jump in on the fly.\nVs. Eichel (#9): quick tie-up, win it back to Burns (#8/#4).",
      snippet: "D-zone draws: Staal & Aho. O-zone draws: Kotkaniemi & Blake…",
      pinned: false,
      folder: "Systems",
      deleted: false,
      when: 1200,
      bucket: "yesterday",
    },
    {
      id: "n8",
      title: "Season goals & benchmarks",
      body:
        "Team targets: top-10 xGF%, PK above 82%, PP above 24%. Individual: Svechnikov 40 goals, Aho 90 points, Jarvis a Selke-caliber two-way season.",
      snippet: "Team targets: top-10 xGF%, PK above 82%, PP above 24%…",
      pinned: false,
      folder: null,
      deleted: false,
      when: 5760,
      bucket: "week",
    },
    /* recently deleted (ghosted) */
    {
      id: "d1",
      title: "Old pre-scout — DET",
      body: "Outdated Detroit scout, superseded.",
      snippet: "Outdated Detroit scout, superseded.",
      pinned: false,
      folder: "Pre-Game",
      deleted: true,
      when: 8000,
      bucket: "week",
    },
    {
      id: "d2",
      title: "Draft line combos (scrapped)",
      body: "Combos we tried in camp — not using these anymore.",
      snippet: "Combos we tried in camp — not using these anymore.",
      pinned: false,
      folder: null,
      deleted: true,
      when: 9000,
      bucket: "week",
    },
  ];
}

function relTime(n: Note): string {
  if (n.bucket === "today") {
    if (n.when === 0) return "just now";
    if (n.when < 60) return `${n.when} min ago`;
    return `${Math.round(n.when / 60)} hr ago`;
  }
  if (n.bucket === "yesterday") return "Yesterday";
  const days = Math.round(n.when / 1440);
  return `${days} days ago`;
}

/* ═══════════ shared list (used by page right column AND side panel) ═══════════ */
function NoteRow({
  note, active, onSelect,
}: { note: Note; active: boolean; onSelect: () => void }) {
  return (
    <button
      className={`nt-row${active ? " nt-row-active" : ""}`}
      onClick={onSelect}
    >
      {note.pinned && <span className="nt-row-pin"><Pin size={12} fill="currentColor"/></span>}
      <div className="nt-row-title">{note.title || "Untitled Note"}</div>
      <div className="nt-row-snippet">{note.snippet || "No additional text"}</div>
      <div className="nt-row-time"><Flash value={relTime(note)}/></div>
    </button>
  );
}

function NotesList({
  notes, activeId, onSelect,
}: { notes: Note[]; activeId: string | null; onSelect: (id: string) => void }) {
  const live = notes.filter((n) => !n.deleted);
  const pinned = live.filter((n) => n.pinned);
  const today = live.filter((n) => !n.pinned && n.bucket === "today");
  const yesterday = live.filter((n) => !n.pinned && n.bucket === "yesterday");
  const week = live.filter((n) => !n.pinned && n.bucket === "week");

  const section = (title: string, rows: Note[]) =>
    rows.length > 0 && (
      <>
        <div className="nt-section-head">
          <span className="nt-section-title">{title}</span>
          <span className="nt-section-chev"><ChevronDown size={16}/></span>
        </div>
        {rows.map((n) => (
          <NoteRow key={n.id} note={n} active={n.id === activeId} onSelect={() => onSelect(n.id)}/>
        ))}
      </>
    );

  return (
    <div className="nt-side-list">
      {section("Pinned", pinned)}
      {section("Today", today)}
      {section("Yesterday", yesterday)}
      {section("Last 7 Days", week)}
    </div>
  );
}

/* ═══════════ Editor toolbar ═══════════ */
function EditorToolbar({
  bold, italic, underline, onToggleBold, onToggleItalic, onToggleUnderline,
}: {
  bold: boolean; italic: boolean; underline: boolean;
  onToggleBold: () => void; onToggleItalic: () => void; onToggleUnderline: () => void;
}) {
  return (
    <div className="nt-toolbar">
      <button className={`nt-tool${bold ? " nt-tool-on" : ""}`} onClick={onToggleBold} aria-label="Bold"><Bold size={15}/></button>
      <button className={`nt-tool${italic ? " nt-tool-on" : ""}`} onClick={onToggleItalic} aria-label="Italic"><Italic size={15}/></button>
      <button className={`nt-tool${underline ? " nt-tool-on" : ""}`} onClick={onToggleUnderline} aria-label="Underline"><Underline size={15}/></button>
      <span className="nt-tool-sep"/>
      <button className="nt-tool" aria-label="Bullet list"><List size={15}/></button>
      <button className="nt-tool" aria-label="Numbered list"><ListOrdered size={15}/></button>
      <button className="nt-tool" aria-label="Checklist"><CheckSquare size={15}/></button>
      <span className="nt-tool-sep"/>
      <button className="nt-tool" aria-label="Attach"><Paperclip size={15}/></button>
    </div>
  );
}

/* ═══════════ Main page ═══════════ */
export function NotesPage(_: PageProps) {
  const [notes, setNotes] = useState<Note[]>(seedNotes);
  const [activeId, setActiveId] = useState<string>("n1");
  const [view, setView] = useState<"editor" | "library">("editor");
  const [libFilter, setLibFilter] = useState<string>("All Notes");

  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  const titleRef = useRef<HTMLInputElement | null>(null);

  const active = notes.find((n) => n.id === activeId) ?? null;


  const updateActive = (patch: Partial<Note>) =>
    setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, ...patch } : n)));

  const onTitleChange = (v: string) => updateActive({ title: v });
  const onBodyChange = (v: string) =>
    updateActive({ body: v, snippet: v.split("\n")[0].slice(0, 60) });

  const togglePin = () => updateActive({ pinned: !active?.pinned });

  const newNote = () => {
    const id = `n${Date.now()}`;
    const note: Note = {
      id, title: "", body: "", snippet: "",
      pinned: false, folder: null, deleted: false,
      when: 0, bucket: "today",
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(id);
    setView("editor");
    setBold(false); setItalic(false); setUnderline(false);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const selectNote = (id: string) => {
    setActiveId(id);
    setView("editor");
  };

  /* ── library filtering ── */
  const libNotes = useMemo(() => {
    if (libFilter === "Recently Deleted") return notes.filter((n) => n.deleted);
    const live = notes.filter((n) => !n.deleted);
    switch (libFilter) {
      case "All Notes": return live;
      case "Today": return live.filter((n) => n.bucket === "today");
      case "Yesterday": return live.filter((n) => n.bucket === "yesterday");
      case "Last 7 Days": return live;
      default: return live.filter((n) => n.folder === libFilter); // folder name
    }
  }, [notes, libFilter]);

  /* ═══════ LIBRARY VIEW ═══════ */
  if (view === "library") {
    return (
      <div className="nt-lib">
        {/* left rail */}
        <section className="hd-panel nt-rail">
          <div className="nt-rail-scroll">
            <div className="nt-rail-grouphead">
              <span className="nt-rail-grouptitle">Notes</span>
              <span className="nt-section-chev"><ChevronDown size={16}/></span>
            </div>
            {["All Notes", "Today", "Yesterday", "Last 7 Days"].map((item) => (
              <button
                key={item}
                className={`nt-rail-item${libFilter === item ? " nt-rail-active" : ""}`}
                onClick={() => setLibFilter(item)}
              >
                {item}
              </button>
            ))}

            <div className="nt-rail-grouphead">
              <span className="nt-rail-grouptitle">Folders</span>
              <span className="nt-section-chev"><ChevronDown size={16}/></span>
            </div>
            {FOLDERS.map((f) => (
              <button
                key={f}
                className={`nt-rail-item${libFilter === f ? " nt-rail-active" : ""}`}
                onClick={() => setLibFilter(f)}
              >
                <Folder size={15}/> {f}
              </button>
            ))}

            <button
              className={`nt-rail-item${libFilter === "Recently Deleted" ? " nt-rail-active" : ""}`}
              onClick={() => setLibFilter("Recently Deleted")}
              style={{ marginTop: 8 }}
            >
              <Trash2 size={15}/> Recently Deleted
            </button>
          </div>

          <button className="nt-rail-newnote" onClick={newNote}>
            <FolderPlus size={16}/> New Note
          </button>
        </section>

        {/* main library area */}
        <section className="hd-panel nt-libmain">
          <div className="nt-libmain-head">
            <span className="hd-panel-title">
              <Library size={15}/>
              <span className="nt-libmain-title">Notes Library</span>
              <span className="nt-libmain-count">{libFilter} · {libNotes.length}</span>
            </span>
            <button className="hd-ibtn" aria-label="Back to editor" onClick={() => setView("editor")}>
              <X size={16}/>
            </button>
          </div>
          <div className="nt-libgrid">
            {libNotes.length === 0 && (
              <div className="nt-libgrid-empty">No notes in {libFilter}.</div>
            )}
            {libNotes.map((n) => (
              <button
                key={n.id}
                className={`nt-card${n.deleted ? " nt-card-ghost" : ""}`}
                onClick={() => { if (!n.deleted) selectNote(n.id); }}
              >
                {n.pinned && <span className="nt-card-pin"><Pin size={12} fill="currentColor"/></span>}
                <div className="nt-card-title">{n.title || "Untitled Note"}</div>
                <div className="nt-card-snippet">{n.snippet || "No additional text"}</div>
                <div className="nt-card-foot">
                  {n.folder
                    ? <span className="nt-card-folder">{n.folder}</span>
                    : <span/>}
                  <span className="nt-card-time">{relTime(n)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  /* ═══════ EDITOR VIEW ═══════ */
  return (
    <div className="nt-page">
      {/* editor */}
      <section className="hd-panel nt-editor">
        <div className="nt-editor-head">
          <input
            ref={titleRef}
            className="nt-editor-title-input"
            value={active?.title ?? ""}
            placeholder="Title Here…."
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <div className="nt-tools">
            <button
              className={`nt-tool${active?.pinned ? " nt-tool-on" : ""}`}
              onClick={togglePin}
              aria-label={active?.pinned ? "Unpin note" : "Pin note"}
            >
              <Pin size={16} fill={active?.pinned ? "currentColor" : "none"}/>
            </button>
            <button className="nt-tool" aria-label="Note options"><Circle size={16}/></button>
            <button className="nt-tool" onClick={newNote} aria-label="New note"><SquarePen size={16}/></button>
          </div>
        </div>

        <div className="nt-meta">
          <span>{active ? relTime(active) : ""}</span>
          {active?.folder && <><span className="nt-meta-dot">·</span><span className="nt-meta-folder">{active.folder}</span></>}
          {active?.pinned && <><span className="nt-meta-dot">·</span><span className="nt-meta-pinned"><Pin size={10} fill="currentColor"/> Pinned</span></>}
        </div>

        <EditorToolbar
          bold={bold} italic={italic} underline={underline}
          onToggleBold={() => setBold((b) => !b)}
          onToggleItalic={() => setItalic((i) => !i)}
          onToggleUnderline={() => setUnderline((u) => !u)}
        />

        <textarea
          className={`nt-body-input${bold ? " nt-b" : ""}${italic ? " nt-i" : ""}`}
          value={active?.body ?? ""}
          placeholder="Example Text Here…."
          onChange={(e) => onBodyChange(e.target.value)}
          spellCheck={false}
          style={underline ? { textDecoration: "underline" } : undefined}
        />
      </section>

      {/* right list column */}
      <div className="nt-listcol">
        <div className="nt-listcol-top">
          <button className="nt-lib-btn" onClick={() => setView("library")}>
            <Library size={15}/> View Library
          </button>
        </div>
        <div className="nt-list">
          <NotesList notes={notes} activeId={activeId} onSelect={selectNote}/>
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Notes side panel (global, from the top bar) ═══════════ */
export function NotesSidePanel({
  onClose, onOpenNotes,
}: PageProps & { onClose: () => void; onOpenNotes?: () => void }) {
  const [notes] = useState<Note[]>(seedNotes);
  const [activeId, setActiveId] = useState<string | null>("n1");

  return (
    <aside className="hd-sidepanel">
      <div className="hd-sidepanel-head">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <PanelLeft size={16}/> Notes
        </span>
        <button className="hd-ibtn" aria-label="Close notes" onClick={onClose}>
          <X size={16}/>
        </button>
      </div>
      <div className="hd-sidepanel-body">
        <NotesList notes={notes} activeId={activeId} onSelect={setActiveId}/>
      </div>
      <div className="nt-side-foot">
        <button className="nt-side-newbtn" onClick={onOpenNotes}>
          <SquarePen size={15}/> Open Notes
        </button>
      </div>
    </aside>
  );
}
