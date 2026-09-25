// Supabase 2.106.2 logs expected session failures before application recovery.
// Keep SDK behavior intact; scope the logging fix to its two recovery paths.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sdk = dirname(require.resolve("@supabase/auth-js/package.json"));
const version = JSON.parse(readFileSync(resolve(sdk, "package.json"), "utf8")).version;
if (version !== "2.106.2") {
  throw new Error("Review Supabase recovery logging patch for new SDK version.");
}
const marker = "// Orvia: expected-session recovery logging patch";
const classifier = readFileSync(resolve(root, "src/lib/supabase/auth-errors.ts"), "utf8")
  .replaceAll("export function", "function");
const helper = `${marker}\nconst orviaExpectedSessionError = (() => {\n${classifier}\nreturn isExpectedSupabaseSignedOutError;\n})();\n`;

for (const file of ["src/GoTrueClient.ts", "dist/main/GoTrueClient.js", "dist/module/GoTrueClient.js"]) {
  const path = resolve(sdk, file);
  let source = readFileSync(path, "utf8");
  // Regenerate the embedded classifier on subsequent installs as well.
  const existing = source.indexOf(marker);
  if (existing !== -1) source = source.slice(0, existing);
  source = source.replaceAll(/if \(!orviaExpectedSessionError\((?:error|err)\)\) /g, "");
  for (const [start, end, variable, method] of [
    ["async _recoverAndRefresh()", "async _callRefreshToken(", "error", "error"],
    ["async _recoverAndRefresh()", "async _callRefreshToken(", "err", "error"],
    ["async _emitInitialSession(", "async resetPasswordForEmail(", "err", "error"],
    ["async _emitInitialSession(", "async resetPasswordForEmail(", "err", "warn"],
  ]) {
    const a = source.indexOf(start);
    const b = source.indexOf(end, a);
    if (a === -1 || b === -1) throw new Error(`Supabase patch boundary changed: ${file}`);
    const section = source.slice(a, b);
    const target = `console.${method}(${variable})`;
    if (section.split(target).length !== 2) throw new Error(`Supabase logging target changed: ${file}`);
    const replacement = `if (!orviaExpectedSessionError(${variable})) console.${method}(${variable})`;
    source = source.slice(0, a) + section.replace(target, replacement) + source.slice(b);
  }
  const appended = file.endsWith(".ts") ? helper : marker + "\n" + ts.transpileModule(helper, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None, removeComments: true },
  }).outputText;
  writeFileSync(path, source + appended);
}
