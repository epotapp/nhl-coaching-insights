import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HdIcon } from "../HdIcon";
import type { PageProps } from "../shared";
import "./calendar.css";

export interface CalendarPageProps extends PageProps {
  prioStats: string[];
}

type CalendarEvent = {
  title: string;
  subtitle: string;
  start: number;
  end: number;
  time: string;
  accent?: boolean;
};

type CalendarDay = {
  weekday: string;
  date: number;
  context: string;
  events: CalendarEvent[];
};

const DAYS: CalendarDay[] = [
  {
    weekday: "Monday",
    date: 8,
    context: "Off",
    events: [
      { title: "Video Review", subtitle: "Team", start: 10, end: 11.25, time: "10:00 – 11:15 AM" },
      { title: "Recovery Session", subtitle: "Training Room", start: 13, end: 14.5, time: "1:00 – 2:30 PM" },
      { title: "Media Availability", subtitle: "Press Room", start: 16, end: 16.75, time: "4:00 – 4:45 PM" },
    ],
  },
  {
    weekday: "Tuesday",
    date: 9,
    context: "CAR vs VGK",
    events: [
      { title: "Morning Skate", subtitle: "Optional", start: 10, end: 11, time: "10:00 – 11:00 AM" },
      { title: "Pre-Game Meeting", subtitle: "Video Room", start: 14.5, end: 15.5, time: "2:30 – 3:30 PM" },
      { title: "Game 4 vs VGK", subtitle: "Lenovo Center", start: 17.2, end: 19.9, time: "7:00 – 9:30 PM", accent: true },
    ],
  },
  {
    weekday: "Wednesday",
    date: 10,
    context: "Practice",
    events: [
      { title: "Practice", subtitle: "Full Team", start: 10.8, end: 12.4, time: "11:00 AM – 12:30 PM" },
      { title: "Systems Review", subtitle: "PP Units", start: 13.8, end: 15, time: "2:00 – 3:00 PM" },
    ],
  },
];

const AGENDA_BASE = [
  { title: "Morning Skate", subtitle: "Optional + rush drills", time: "10:00 – 11:00 AM" },
  { title: "Line Review", subtitle: "Matchup vs Eichel", time: "11:30 AM – 12:30 PM" },
  { title: "Pre-Game Meal", subtitle: "Team lunch", time: "1:00 – 2:00 PM" },
  { title: "CAR vs VGK", subtitle: "Game 4 · Lenovo Center", time: "7:00 PM" },
];

const HOME_DAYS = new Set([6, 9, 14]);
const AWAY_DAYS = new Set([2, 4, 11]);

function MiniMonth() {
  const cells: (number | null)[] = [null, ...Array.from({ length: 30 }, (_, index) => index + 1)];
  return (
    <div className="cal-approved-month">
      <div className="cal-approved-month-head">
        <button type="button" aria-label="Previous month"><ChevronLeft size={16} /></button>
        <strong>June 2026</strong>
        <button type="button" aria-label="Next month"><ChevronRight size={16} /></button>
      </div>
      <div className="cal-approved-month-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => <span className="cal-approved-dow" key={`${label}-${index}`}>{label}</span>)}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} />;
          const className = [
            "cal-approved-day",
            day === 9 ? "selected" : "",
            HOME_DAYS.has(day) ? "home" : "",
            AWAY_DAYS.has(day) ? "away" : "",
          ].filter(Boolean).join(" ");
          return <button type="button" className={className} key={day}><span>{day}</span></button>;
        })}
      </div>
      <div className="cal-approved-legend"><span><i className="home" />Home</span><span><i className="away" />Away</span></div>
    </div>
  );
}

function CalendarAgenda({ compact = false }: { compact?: boolean }) {
  const [added, setAdded] = useState<{ title: string; subtitle: string; time: string }[]>([]);
  const agenda = [...AGENDA_BASE, ...added];
  return (
    <div className={`cal-approved-rail-content${compact ? " compact" : ""}`}>
      <MiniMonth />
      <div className="cal-approved-agenda-head"><strong>June 9</strong><button type="button">View All</button></div>
      <div className="cal-approved-agenda-list">
        {agenda.map((event, index) => (
          <article key={`${event.title}-${index}`}>
            <div><strong>{event.title}</strong><span> | {event.subtitle}</span></div>
            <small>{event.time}</small>
          </article>
        ))}
      </div>
      <button type="button" className="cal-approved-add" onClick={() => setAdded(items => [...items, { title: "New Task", subtitle: "Coaching staff", time: "6:00 – 6:30 PM" }])}>+ Add Task</button>
    </div>
  );
}

function WeekBoard({ priority }: { priority: string }) {
  const startHour = 9;
  const endHour = 20;
  const track = 720;
  const y = (hour: number) => ((hour - startHour) / (endHour - startHour)) * track;
  const lines = [9, 12, 15, 18];
  return (
    <div className="cal-approved-board">
      <div className="cal-approved-head-spacer" />
      {DAYS.map(day => (
        <header key={day.weekday}>
          <strong>{day.weekday}</strong><b>{day.date}</b><span>{day.context}</span>
        </header>
      ))}
      <div className="cal-approved-times" style={{ height: track }}>
        {lines.map(hour => <span key={hour} style={{ top: y(hour) }}>{hour === 12 ? "12:00 PM" : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}</span>)}
      </div>
      {DAYS.map(day => (
        <div className="cal-approved-column" style={{ height: track }} key={day.weekday}>
          {lines.map(hour => <i className="cal-approved-gridline" key={hour} style={{ top: y(hour) }} />)}
          {day.events.map(event => (
            <article
              className={event.accent ? "accent" : ""}
              key={event.title}
              style={{ top: y(event.start), minHeight: Math.max(112, y(event.end) - y(event.start)) }}
            >
              <strong>{event.title}</strong>
              <span>{event.subtitle}{event.accent ? ` · ${priority}` : ""}</span>
              <small>{event.time}</small>
            </article>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CalendarPage({ prioStats }: CalendarPageProps) {
  const priority = useMemo(() => (prioStats.length ? prioStats.slice(0, 2).join(" + ") : "TOI + FO%"), [prioStats]);
  return (
    <main className="cal-approved-page">
      <WeekBoard priority={priority} />
      <aside className="cal-approved-rail"><CalendarAgenda /></aside>
    </main>
  );
}

export function CalendarSidePanel({ onClose }: { theme: "dark" | "light"; onClose: () => void }) {
  return (
    <aside className="hd-sidepanel cal-approved-sidepanel" aria-label="Calendar panel">
      <header className="hd-sidepanel-head"><span><HdIcon name="calendar" size={16} /> Calendar</span><button type="button" aria-label="Close calendar" onClick={onClose}><HdIcon name="close" size={16} /></button></header>
      <div className="hd-sidepanel-body"><CalendarAgenda compact /></div>
    </aside>
  );
}
