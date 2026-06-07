import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadAuthStorageHelpers() {
  const sourcePath = resolve(projectRoot, "src/lib/supabase/auth-storage.ts");
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });
  const module = { exports: {} };

  vm.runInNewContext(transpiled.outputText, {
    exports: module.exports,
    module,
    require,
    URL,
  });

  return module.exports;
}

test("Supabase auth storage key is derived from the project URL", () => {
  const { getSupabaseAuthStorageKey } = loadAuthStorageHelpers();

  assert.equal(
    getSupabaseAuthStorageKey("https://abcd1234.supabase.co"),
    "sb-abcd1234-auth-token",
  );
  assert.equal(getSupabaseAuthStorageKey("not a url"), null);
});

test("only configured Supabase auth storage keys are selected for cleanup", () => {
  const { getSupabaseAuthStorageKeysToClear } = loadAuthStorageHelpers();

  assert.deepEqual(
    getSupabaseAuthStorageKeysToClear(
      [
        "sb-abcd1234-auth-token",
        "sb-abcd1234-auth-token-code-verifier",
        "sb-otherproject-auth-token",
        "supabase.auth.token",
        "personal-os.tasks",
      ],
      "https://abcd1234.supabase.co",
    ),
    [
      "sb-abcd1234-auth-token",
      "sb-abcd1234-auth-token-code-verifier",
      "supabase.auth.token",
    ],
  );
});

test("corrupt configured Supabase auth storage is selected for cleanup without app data", () => {
  const { getRecoverableCorruptSupabaseAuthStorageKeysToClear } =
    loadAuthStorageHelpers();

  assert.deepEqual(
    Array.from(getRecoverableCorruptSupabaseAuthStorageKeysToClear(
      [
        [
          "sb-abcd1234-auth-token",
          JSON.stringify({
            access_token: "broken",
            refresh_token: "broken",
            expires_at: 1,
            expires_in: 0,
            token_type: "bearer",
            user: null,
          }),
        ],
        ["sb-abcd1234-auth-token-code-verifier", "verifier"],
        ["personal-os.tasks", "[]"],
        ["personal-os.user.user-a.tasks", "[]"],
      ],
      "https://abcd1234.supabase.co",
    )),
    [
      "sb-abcd1234-auth-token",
      "sb-abcd1234-auth-token-code-verifier",
    ],
  );
});

test("valid-looking Supabase auth storage is not pre-cleared", () => {
  const { getRecoverableCorruptSupabaseAuthStorageKeysToClear } =
    loadAuthStorageHelpers();

  assert.deepEqual(
    getRecoverableCorruptSupabaseAuthStorageKeysToClear(
      [
        [
          "sb-abcd1234-auth-token",
          JSON.stringify({
            access_token: "token",
            refresh_token: "refresh",
            expires_at: 4102444800,
            user: { id: "user-a" },
          }),
        ],
      ],
      "https://abcd1234.supabase.co",
    ).length,
    0,
  );
});
