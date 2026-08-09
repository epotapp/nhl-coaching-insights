/**
 * Deployment-safe public asset helpers.
 *
 * Vite exposes BASE_URL with a trailing slash. Building paths from it keeps
 * images and videos working on localhost, a custom domain, and GitHub Pages
 * repository subpaths without relying on the Replit-only /__mockup prefix.
 */
const viteBase = import.meta.env.BASE_URL || "/";
const normalizedBase = viteBase.endsWith("/") ? viteBase : `${viteBase}/`;

export function hdAsset(relativePath: string): string {
  return `${normalizedBase}${relativePath.replace(/^\/+/, "")}`;
}

export const imageBase = hdAsset("images/hockey-dashboard/");
export const videoBase = hdAsset("videos/hockey-dashboard/");
export const iconBase = hdAsset("images/hockey-dashboard/icons/");
