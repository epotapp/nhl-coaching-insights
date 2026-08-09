import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const globalNodeModules = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
const ts = require(path.join(globalNodeModules, "typescript"));

const root = path.resolve(new URL("..", import.meta.url).pathname);
const appRoot = path.join(root, "artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard");
const publicRoot = path.join(root, "artifacts/mockup-sandbox/public");
const iconRoot = path.join(publicRoot, "images/hockey-dashboard/icons");
const ignored = new Set(["node_modules", "dist", ".git"]);
const failures = [];

function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return [];
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute, predicate));
    else if (predicate(absolute)) output.push(absolute);
  }
  return output;
}

const sourceFiles = walk(root, file => /\.(ts|tsx)$/.test(file));
const syntaxErrors = [];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  });
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    syntaxErrors.push({
      file: path.relative(root, file),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
    });
  }
}
if (syntaxErrors.length) failures.push(`${syntaxErrors.length} TypeScript syntax diagnostic(s)`);

const relativeImportErrors = [];
function resolvesRelativeImport(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.json`, `${base}.css`,
    path.join(base, "index.ts"), path.join(base, "index.tsx"), path.join(base, "index.js"), path.join(base, "index.jsx"),
  ];
  return candidates.some(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    let specifier = null;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifier = node.moduleSpecifier.text;
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      specifier = node.arguments[0].text;
    }
    if (specifier?.startsWith(".") && !resolvesRelativeImport(file, specifier)) {
      relativeImportErrors.push({ file: path.relative(root, file), specifier });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}
if (relativeImportErrors.length) failures.push(`${relativeImportErrors.length} unresolved relative import(s)`);

const cssFiles = walk(appRoot, file => file.endsWith(".css"));
const cssErrors = [];
for (const file of cssFiles) {
  const source = fs.readFileSync(file, "utf8");
  let depth = 0;
  let quote = null;
  let comment = false;
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i];
    const n = source[i + 1];
    if (comment) {
      if (c === "*" && n === "/") { comment = false; i += 1; }
      continue;
    }
    if (!quote && c === "/" && n === "*") { comment = true; i += 1; continue; }
    if (quote) {
      if (c === "\\") { i += 1; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === "{") depth += 1;
    if (c === "}") depth -= 1;
    if (depth < 0) { cssErrors.push({ file: path.relative(root, file), error: "unexpected closing brace" }); break; }
  }
  if (depth !== 0) cssErrors.push({ file: path.relative(root, file), error: `brace depth ${depth}` });
  if (quote) cssErrors.push({ file: path.relative(root, file), error: "unclosed quote" });
  if (comment) cssErrors.push({ file: path.relative(root, file), error: "unclosed comment" });
}
if (cssErrors.length) failures.push(`${cssErrors.length} CSS structural diagnostic(s)`);

const placeholderTerms = [
  "Graph/Info Goes Here",
  "F. Last Name",
  "Title | Subtitle Context",
  "Month ##, Year",
];
const placeholderHits = [];
for (const file of walk(appRoot, entry => /\.(ts|tsx)$/.test(entry))) {
  const source = fs.readFileSync(file, "utf8");
  for (const term of placeholderTerms) {
    if (source.includes(term)) placeholderHits.push({ file: path.relative(root, file), term });
  }
}
if (placeholderHits.length) failures.push(`${placeholderHits.length} placeholder string(s)`);

const forbiddenPathHits = [];
for (const file of walk(root, entry => /\.(ts|tsx|css|html|sql|py)$/.test(entry))) {
  const source = fs.readFileSync(file, "utf8");
  if (source.includes("/__mockup/")) forbiddenPathHits.push(path.relative(root, file));
}
if (forbiddenPathHits.length) failures.push(`${forbiddenPathHits.length} legacy /__mockup/ reference(s)`);

const iconFiles = walk(iconRoot, file => file.endsWith(".png"));
if (iconFiles.length !== 49) failures.push(`expected 49 supplied Figma icons, found ${iconFiles.length}`);
const iconComponent = fs.readFileSync(path.join(appRoot, "HdIcon.tsx"), "utf8");
const declaredIcons = [...iconComponent.matchAll(/\|\s+"([a-z0-9-]+)"/g)].map(match => match[1]);
const missingIconFiles = declaredIcons.filter(name => !fs.existsSync(path.join(iconRoot, `${name}.png`)));
if (missingIconFiles.length) failures.push(`${missingIconFiles.length} declared icon(s) missing a PNG`);

const staticIconUses = [];
for (const file of walk(appRoot, entry => entry.endsWith(".tsx"))) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(/<HdIcon\b[^>]*\bname="([a-z0-9-]+)"/g)) {
    staticIconUses.push({ file: path.relative(root, file), name: match[1] });
  }
}
const invalidIconUses = staticIconUses.filter(use => !declaredIcons.includes(use.name));
if (invalidIconUses.length) failures.push(`${invalidIconUses.length} invalid static HdIcon use(s)`);

const assets = walk(publicRoot);
const videos = assets.filter(file => /\.(mp4|mov|webm)$/i.test(file));
if (videos.length !== 17) failures.push(`expected 17 bundled videos, found ${videos.length}`);

const rootPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (rootPackage.version !== "0.4.0") failures.push(`root package version is ${rootPackage.version}`);
const dashboardSource = fs.readFileSync(path.join(appRoot, "InteractiveDashboard.tsx"), "utf8");
if (!dashboardSource.includes('NHL_DASHBOARD_VERSION = "0.4.0"')) failures.push("dashboard version constant is not 0.4.0");
if (!dashboardSource.includes('import "./v0.4-polish.css"')) failures.push("v0.4 polish stylesheet is not imported");

const polish = fs.readFileSync(path.join(appRoot, "v0.4-polish.css"), "utf8");
const approvedEditAccents = [
  "--hd-widget-edit-accent: #4186ff;",
  "--hd-widget-edit-accent: #2155fc;",
  "--hd-widget-edit-accent-hover: #0925ab;",
];
for (const accent of approvedEditAccents) {
  if (!polish.toLowerCase().includes(accent)) failures.push(`approved widget-edit accent missing: ${accent}`);
}
for (const forbiddenEditColor of ["#ff453a", "#ff3b30"]) {
  if (polish.toLowerCase().includes(forbiddenEditColor)) failures.push(`forbidden red widget-edit color remains: ${forbiddenEditColor}`);
}
for (const required of [
  ".hd-widget-catalog",
  ".hd-widget-minus",
  ".cal-approved-page",
  ".hd-ob-overlay.hd-ob-light",
  ".hd-root.hd-theme-light .hd-sidebar",
  ".pi-rail",
  ".vd-player-strip",
  ".st-report-list button.active",
]) {
  if (!polish.includes(required)) failures.push(`v0.4 stylesheet missing token: ${required}`);
}

const documentationText = ["README.md", "README-V0.4.md", "docs/V0.4_CHANGELOG.md"]
  .map(file => fs.readFileSync(path.join(root, file), "utf8"))
  .join("\n");
if (/red minus controls|red minus/i.test(documentationText)) failures.push("documentation still describes the removed red minus controls");

const customizationSource = fs.readFileSync(path.join(appRoot, "DashboardCustomization.tsx"), "utf8");
for (const required of ["WidgetCatalog", "WidgetEditChrome", "PlacementSlot", "Add Widgets", "Choose a size"]) {
  if (!customizationSource.includes(required)) failures.push(`dashboard customization missing token: ${required}`);
}
for (const required of ["setTimeout", "560", "nhl-dashboard-layout-v0.4", "back 10 sec", "sim.skip(-10)"]) {
  if (!dashboardSource.includes(required)) failures.push(`dashboard interaction missing token: ${required}`);
}
if (/className="hd-nav-btn"[^>]*>[^<]*Restart/i.test(dashboardSource)) failures.push("worded Restart button still appears in dashboard controls");

const calendarSource = fs.readFileSync(path.join(appRoot, "pages/CalendarPage.tsx"), "utf8");
for (const required of ["WeekBoard", "CalendarAgenda", "CalendarSidePanel", "cal-approved-page", "+ Add Task"]) {
  if (!calendarSource.includes(required)) failures.push(`approved calendar missing token: ${required}`);
}

const playerDataSource = fs.readFileSync(path.join(appRoot, "game4Data.ts"), "utf8");
const headshotMappings = [...playerDataSource.matchAll(/^\s{2}(\d+):\s+"https:\/\/assets\.nhle\.com\/mugs\/nhl\//gm)];
if (headshotMappings.length !== 19) failures.push(`expected 19 official Carolina headshot mappings, found ${headshotMappings.length}`);
if (!playerDataSource.includes('27: "https://assets.nhle.com/mugs/nhl/20262027/CAR/8477940.png"')) failures.push("Nikolaj Ehlers headshot mapping is missing or incorrect");

const playerCss = fs.readFileSync(path.join(appRoot, "pages/player-insights.css"), "utf8");
const videoCss = fs.readFileSync(path.join(appRoot, "pages/video.css"), "utf8");
if (!playerCss.includes("flex-wrap: nowrap") || !playerCss.includes("scrollbar-width: none")) failures.push("Player Insights rail is not configured as a hidden-scrollbar single row");
if (!videoCss.includes("vd-player-strip") || !videoCss.includes("flex-wrap:nowrap") || !videoCss.includes("scrollbar-width:none")) failures.push("Video player rail is not configured as a hidden-scrollbar single row");

const requiredFiles = [
  "README.md",
  "README-V0.4.md",
  "VERSION.md",
  "docs/V0.4_CHANGELOG.md",
  "docs/V0.4_VALIDATION.md",
  "docs/DEPLOYMENT.md",
  "docs/POSTGRESQL_SETUP.md",
  ".github/workflows/deploy-pages.yml",
  "lib/db/migrations/0001_nhl_dashboard.sql",
  "lib/db/seeds/game4-2025030414.sql",
  "artifacts/api-server/src/routes/nhl.ts",
  "artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard/HdIcon.tsx",
  "artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard/DashboardCustomization.tsx",
  "artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard/v0.4-polish.css",
];
const missingRequiredFiles = requiredFiles.filter(file => !fs.existsSync(path.join(root, file)));
if (missingRequiredFiles.length) failures.push(`${missingRequiredFiles.length} required file(s) missing`);

const report = {
  version: "0.4.0",
  sourceFiles: sourceFiles.length,
  syntaxErrors,
  relativeImportErrors,
  cssFiles: cssFiles.length,
  cssErrors,
  placeholderHits,
  forbiddenPathHits,
  suppliedIcons: iconFiles.length,
  declaredIcons: declaredIcons.length,
  missingIconFiles,
  staticIconUses: staticIconUses.length,
  invalidIconUses,
  assets: assets.length,
  videos: videos.length,
  missingRequiredFiles,
  ok: failures.length === 0,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
