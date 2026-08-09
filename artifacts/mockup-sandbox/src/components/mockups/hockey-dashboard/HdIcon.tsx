import type { CSSProperties } from "react";
import { iconBase } from "./assets";

export type HdIconName =
  | "arrow"
  | "back-10"
  | "back"
  | "bookmark-circle"
  | "bookmark"
  | "calendar"
  | "chart"
  | "check"
  | "close"
  | "counter"
  | "download"
  | "draw"
  | "edit"
  | "expand"
  | "featured"
  | "folder"
  | "forward-10"
  | "game-pulse"
  | "gear"
  | "goalie-pull"
  | "hand"
  | "head-to-head-faceoffs"
  | "home"
  | "info"
  | "lineup-analyzer"
  | "markup"
  | "mic"
  | "minimize"
  | "new-folder"
  | "new-note"
  | "notes"
  | "paperclip"
  | "pause"
  | "pin"
  | "play"
  | "player-speed"
  | "player"
  | "profile-alt"
  | "profile"
  | "search"
  | "select"
  | "shooting-sector"
  | "sidebar"
  | "slider"
  | "sparkle"
  | "toggle-on"
  | "trash"
  | "upload"
  | "video";

interface HdIconProps {
  name: HdIconName;
  size?: number | string;
  className?: string;
  decorative?: boolean;
  label?: string;
}

/**
 * Renders the supplied Figma icon PNGs as a CSS mask. This preserves the
 * approved geometry while allowing one icon set to inherit dark/light theme
 * colors through currentColor.
 */
export function HdIcon({
  name,
  size = 20,
  className = "",
  decorative = true,
  label,
}: HdIconProps) {
  const style = {
    "--hd-icon-image": `url("${iconBase}${name}.png")`,
    "--hd-icon-size": typeof size === "number" ? `${size}px` : size,
  } as CSSProperties;

  return (
    <span
      className={`hd-figma-icon ${className}`.trim()}
      style={style}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label ?? name}
    />
  );
}
