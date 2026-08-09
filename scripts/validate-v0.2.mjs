import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const appRoot = path.join(root, "artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard");
const publicRoot = path.join(root, "artifacts/mockup-sandbox/public");
const ignoredDirectories = new Set(["node_modules", "dist", ".git"]);
const failures = [];

function walk(directory, predicate = () => true) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
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
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
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

const placeholderTerms = [
  "Graph/Info Goes Here",
  "F. Last Name",
  "Title | Subtitle Context",
  "Month ##, Year",
];
const placeholderHits = [];
for (const file of walk(appRoot, entry => /\.(ts|tsx|css)$/.test(entry))) {
  const source = fs.readFileSync(file, "utf8");
  for (const term of placeholderTerms) {
    if (source.includes(term)) placeholderHits.push({ file: path.relative(root, file), term });
  }
}
if (placeholderHits.length) failures.push(`${placeholderHits.length} placeholder string(s)`);

const assets = walk(publicRoot);
const videos = assets.filter(file => /\.(mp4|mov|webm)$/i.test(file));
if (videos.length !== 17) failures.push(`expected 17 bundled videos, found ${videos.length}`);

const requiredFiles = [
  "README.md",
  "VERSION.md",
  "docs/V0.2_CHANGELOG.md",
  "docs/POSTGRESQL_SETUP.md",
  "lib/db/migrations/0001_nhl_dashboard.sql",
  "lib/db/seeds/game4-2025030414.sql",
  "artifacts/api-server/src/routes/nhl.ts",
  "artifacts/mockup-sandbox/src/components/mockups/hockey-dashboard/v0.2-polish.css",
];
const missingRequiredFiles = requiredFiles.filter(file => !fs.existsSync(path.join(root, file)));
if (missingRequiredFiles.length) failures.push(`${missingRequiredFiles.length} required file(s) missing`);

const report = {
  version: "0.2.0",
  sourceFiles: sourceFiles.length,
  syntaxErrors,
  placeholderHits,
  assets: assets.length,
  videos: videos.length,
  missingRequiredFiles,
  ok: failures.length === 0,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
