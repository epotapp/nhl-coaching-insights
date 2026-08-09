/* ── shared primitives for all hockey-dashboard pages ────────── */
import { ReactNode } from "react";
import { HdIcon } from "./HdIcon";

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
  const resolvedExpandLabel = collapse && expandLabel === "Expand" ? "Collapse" : expandLabel;
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
            <button className="hd-ibtn" aria-label={`${resolvedExpandLabel} ${title}`} onClick={onExpand}>
              <HdIcon name={collapse ? "minimize" : "expand"} size={16} />
            </button>
          )}
        </span>
      </div>
      {children}
    </section>
  );
}
