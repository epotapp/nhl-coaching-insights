/* ── shared primitives for all hockey-dashboard pages ────────── */
import { ReactNode } from "react";

/* every page of the app (opened from the nav menu) */
export type AppPage =
  | "Dashboard"
  | "Featured Insights"
  | "Player Insights"
  | "Video"
  | "Notes"
  | "Stats"
  | "Calendar"
  | "Preferences";

/* sidebar order per the nav reference — Preferences renders pinned at the bottom */
export const APP_PAGES: AppPage[] = [
  "Dashboard",
  "Featured Insights",
  "Player Insights",
  "Video",
  "Stats",
  "Notes",
  "Calendar",
  "Preferences",
];

export interface PageProps {
  theme: "dark" | "light";
}

/* ── Flash — retained as a compatibility wrapper.
   Game-clock and stat values update immediately with no animation. */
export function Flash({
  value,
  className = "",
}: {
  value: string | number;
  className?: string;
}) {
  return <span className={className}>{value}</span>;
}

/* ── PagePanel — consistent widget chrome for the new pages ── */
export function PagePanel({
  icon,
  title,
  subtitle,
  onExpand,
  expandLabel = "Expand",
  collapse = false,
  className = "",
  headExtra,
  children,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onExpand?: () => void;
  expandLabel?: string;
  collapse?: boolean; // true → show collapse (inward) glyph instead
  className?: string;
  headExtra?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className={`hd-panel hd-pp ${className}`}>
      <div className="hd-panel-head">
        <span className="hd-panel-title">
          {icon}
          <span className="hd-pp-title-text">
            <strong>{title}</strong>
            {subtitle && <span className="hd-pp-sub"> | {subtitle}</span>}
          </span>
        </span>
        <span className="hd-pp-head-right">
          {headExtra}
          {onExpand && (
            <button className="hd-ibtn" aria-label={`${expandLabel} ${title}`} onClick={onExpand}>
              {collapse ? (
                <svg width="13" height="13" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5.5 2v3.5H2M9.5 2v3.5H13M13 9.5H9.5V13M2 9.5h3.5V13"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 5.5V2h3.5M10 2h3v3.5M13 10v3h-3.5M5.5 13H2v-3"/>
                </svg>
              )}
            </button>
          )}
        </span>
      </div>
      {children}
    </section>
  );
}
