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

function loadAuthErrorHelpers() {
  const sourcePath = resolve(projectRoot, "src/lib/supabase/auth-errors.ts");
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
    Error,
    exports: module.exports,
    module,
    require,
  });

  return module.exports;
}

test("expected Supabase signed-out errors include missing auth sessions", () => {
  const { isExpectedSupabaseSignedOutError } = loadAuthErrorHelpers();

  assert.equal(
    isExpectedSupabaseSignedOutError({
      name: "AuthSessionMissingError",
      message: "Auth session missing!",
    }),
    true,
  );
  assert.equal(
    isExpectedSupabaseSignedOutError(
      new Error("Auth session missing!"),
    ),
    true,
  );
  assert.equal(
    isExpectedSupabaseSignedOutError({
      code: "session_not_found",
      message: "Session not found",
    }),
    true,
  );
  assert.equal(
    isExpectedSupabaseSignedOutError(
      new Error("missing auth session"),
    ),
    true,
  );
});

test("expected Supabase signed-out errors include invalid refresh tokens only", () => {
  const { isExpectedSupabaseSignedOutError } = loadAuthErrorHelpers();

  assert.equal(
    isExpectedSupabaseSignedOutError(
      new Error("Invalid Refresh Token: Refresh Token Not Found"),
    ),
    true,
  );
  assert.equal(
    isExpectedSupabaseSignedOutError(
      new Error("Refresh token is not valid"),
    ),
    true,
  );
  assert.equal(
    isExpectedSupabaseSignedOutError({
      code: "refresh_token_not_found",
      message: "No matching refresh token found.",
    }),
    true,
  );
  assert.equal(
    isExpectedSupabaseSignedOutError(new Error("Unexpected database error")),
    false,
  );
});
