import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const source = (path) => readFileSync(resolve(root, path), "utf8");

function load(path, dependencies = {}) {
  const filename = resolve(root, path);
  const compiled = ts.transpileModule(source(path), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });
  const loaded = { exports: {} };
  vm.runInNewContext(compiled.outputText, {
    exports: loaded.exports,
    module: loaded,
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Missing test dependency ${id}`);
      return dependencies[id];
    },
  }, { filename });
  return loaded.exports;
}

const { translations } = load("src/lib/i18n.ts");
let locale = "en";
const { SuccessToast, SUCCESS_TOAST_DURATION_MS } = load(
  "src/components/ui/SuccessToast.tsx",
  {
    react: React,
    "react/jsx-runtime": require("react/jsx-runtime"),
    "lucide-react": require("lucide-react"),
    "@/components/i18n/I18nProvider": {
      useI18n: () => ({ t: (key) => translations[locale][key] }),
    },
  },
);

test("Capture and Task, Note, Event success labels are exact in EN and UA", () => {
  const labels = {
    en: ["Added to Inbox", "Task created", "Note created", "Event created"],
    ua: ["Додано до Вхідних", "Завдання створено", "Нотатку створено", "Подію створено"],
  };
  const keys = ["quickCapture.savedCloud", "inbox.convertedTask", "inbox.convertedNote", "inbox.convertedEvent"];
  for (const language of ["en", "ua"]) {
    assert.deepEqual(keys.map((key) => translations[language][key]), labels[language]);
  }
});

test("shared toast renders each action as one accessible, dismissible status in both locales", () => {
  assert.equal(SUCCESS_TOAST_DURATION_MS, 4000);
  for (const language of ["en", "ua"]) {
    locale = language;
    for (const key of ["quickCapture.savedCloud", "inbox.convertedTask", "inbox.convertedNote", "inbox.convertedEvent"]) {
      const message = translations[language][key];
      const html = renderToStaticMarkup(React.createElement(SuccessToast, {
        toast: { id: 1, message },
        onDismiss: () => {},
      }));
      assert.match(html, /role="status"/);
      assert.match(html, /aria-live="polite"/);
      assert.match(html, /aria-atomic="true"/);
      assert.match(html, /aria-hidden="true"/);
      assert.match(html, /aria-label="[^"]+"/);
      assert.equal(html.split(message).length - 1, 1);
      assert.match(html, /pointer-events-none fixed/);
    }
  }
});

test("Capture and Inbox use the shared toast without duplicate inline success feedback", () => {
  const capture = source("src/components/quick-capture/QuickCapture.tsx");
  const inbox = source("src/app/inbox/page.tsx");
  assert.match(capture, /<SuccessToast toast=\{toast\}/);
  assert.match(inbox, /<SuccessToast toast=\{toast\}/);
  assert.match(capture, /showSuccessToast\(\s*t\("quickCapture.savedCloud"\)/);
  for (const key of ["inbox.convertedTask", "inbox.convertedNote", "inbox.convertedEvent"]) {
    assert.match(inbox, new RegExp(`showSuccessToast\\(t\\("${key}"\\)\\)`));
  }
  assert.doesNotMatch(capture, /toastMessage|toastTimeoutRef|role="status"/);
  assert.doesNotMatch(inbox, /queueStatus|orvia-feedback|inbox\.itemCreated|role="status"/);
});
