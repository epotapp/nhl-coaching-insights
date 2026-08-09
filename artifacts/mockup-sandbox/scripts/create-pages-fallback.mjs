import { copyFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");
const source = path.join(dist, "index.html");
const destination = path.join(dist, "404.html");

await access(source);
await copyFile(source, destination);
console.log("Created GitHub Pages SPA fallback: dist/404.html");
