import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
export function createLoader(stubs = {}, globals = {}) {
  const cache = new Map();
  function load(path) {
    const filename = resolve(path);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
    }).outputText;
    vm.runInNewContext(source, {
      module, exports: module.exports, console, Request, Response, URL, TextDecoder,
      AbortSignal, setTimeout, clearTimeout, crypto: globalThis.crypto, fetch,
      ...globals,
      require(id) {
        if (id in stubs) return stubs[id];
        if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`);
        return require(id);
      },
    }, { filename });
    return module.exports;
  }
  return load;
}
