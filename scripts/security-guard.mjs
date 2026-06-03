import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

const root = process.cwd();
const failures = [];

const codeExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const coreApiRoutes = [
  {
    path: "src/app/api/tasks/route.ts",
    checks: [
      {
        label: "validates API auth",
        pattern: /authenticateApiRequest\(request\)/,
      },
      {
        label: "filters reads by authenticated user",
        pattern: /\.eq\("user_id",\s*auth\.userId\)/,
      },
      {
        label: "excludes soft-deleted rows",
        pattern: /\.is\("deleted_at",\s*null\)/,
      },
      {
        label: "inserts authenticated user_id",
        pattern: /\.insert\(\{\s*\.{3}parsedPayload\.payload,\s*user_id:\s*auth\.userId\s*\}\)/,
      },
    ],
  },
  {
    path: "src/app/api/tasks/[id]/route.ts",
    checks: [
      {
        label: "validates API auth",
        pattern: /authenticateApiRequest\(request\)/,
      },
      {
        label: "scopes by task id",
        pattern: /\.eq\("id",\s*taskId\)/,
      },
      {
        label: "scopes by authenticated user",
        pattern: /\.eq\("user_id",\s*auth\.userId\)/,
      },
      {
        label: "ignores soft-deleted rows before mutation",
        pattern: /\.is\("deleted_at",\s*null\)/,
      },
    ],
  },
  {
    path: "src/app/api/notes/route.ts",
    checks: [
      {
        label: "validates API auth",
        pattern: /authenticateApiRequest\(request\)/,
      },
      {
        label: "filters reads by authenticated user",
        pattern: /\.eq\("user_id",\s*auth\.userId\)/,
      },
      {
        label: "excludes soft-deleted rows",
        pattern: /\.is\("deleted_at",\s*null\)/,
      },
      {
        label: "inserts authenticated user_id",
        pattern: /\.insert\(\{\s*\.{3}parsedPayload\.payload,\s*user_id:\s*auth\.userId\s*\}\)/,
      },
    ],
  },
  {
    path: "src/app/api/notes/[id]/route.ts",
    checks: [
      {
        label: "validates API auth",
        pattern: /authenticateApiRequest\(request\)/,
      },
      {
        label: "scopes by note id",
        pattern: /\.eq\("id",\s*noteId\)/,
      },
      {
        label: "scopes by authenticated user",
        pattern: /\.eq\("user_id",\s*auth\.userId\)/,
      },
      {
        label: "ignores soft-deleted rows before mutation",
        pattern: /\.is\("deleted_at",\s*null\)/,
      },
    ],
  },
  {
    path: "src/app/api/activities/route.ts",
    checks: [
      {
        label: "validates API auth",
        pattern: /authenticateApiRequest\(request\)/,
      },
      {
        label: "filters reads by authenticated user",
        pattern: /\.eq\("user_id",\s*auth\.userId\)/,
      },
      {
        label: "excludes soft-deleted rows",
        pattern: /\.is\("deleted_at",\s*null\)/,
      },
      {
        label: "inserts authenticated user_id",
        pattern: /\.insert\(\{\s*\.{3}parsedPayload\.payload,\s*user_id:\s*auth\.userId\s*\}\)/,
      },
    ],
  },
  {
    path: "src/app/api/captures/route.ts",
    checks: [
      {
        label: "validates API auth",
        pattern: /authenticateApiRequest\(request\)/,
      },
      {
        label: "filters reads by authenticated user",
        pattern: /\.eq\("user_id",\s*auth\.userId\)/,
      },
      {
        label: "excludes soft-deleted rows",
        pattern: /\.is\("deleted_at",\s*null\)/,
      },
      {
        label: "inserts authenticated user_id",
        pattern: /\.insert\(\{\s*\.{3}parsedPayload\.payload,\s*user_id:\s*auth\.userId\s*\}\)/,
      },
    ],
  },
  {
    path: "src/app/api/captures/[id]/route.ts",
    checks: [
      {
        label: "validates API auth",
        pattern: /authenticateApiRequest\(request\)/,
      },
      {
        label: "scopes by capture id",
        pattern: /\.eq\("id",\s*captureId\)/,
      },
      {
        label: "scopes by authenticated user",
        pattern: /\.eq\("user_id",\s*auth\.userId\)/,
      },
      {
        label: "ignores soft-deleted rows before mutation",
        pattern: /\.is\("deleted_at",\s*null\)/,
      },
    ],
  },
];

function readProjectFile(path) {
  return readFileSync(join(root, path), "utf8");
}

function fail(message) {
  failures.push(message);
}

function walkFiles(directory) {
  const absoluteDirectory = join(root, directory);

  if (!existsSync(absoluteDirectory)) {
    return [];
  }

  const files = [];

  for (const entry of readdirSync(absoluteDirectory)) {
    const absoluteEntry = join(absoluteDirectory, entry);
    const stats = statSync(absoluteEntry);

    if (stats.isDirectory()) {
      files.push(...walkFiles(relative(root, absoluteEntry)));
    } else if (codeExtensions.has(extname(entry))) {
      files.push(relative(root, absoluteEntry));
    }
  }

  return files;
}

function isApiRoute(path) {
  return path.split(sep).join("/").startsWith("src/app/api/");
}

function hasUseClientDirective(content) {
  return /^\s*["']use client["'];/.test(content);
}

function verifyRemovedTestEndpoint() {
  if (existsSync(join(root, "src/app/api/test/route.ts"))) {
    fail("Unsafe unauthenticated service-role test endpoint exists.");
  }
}

function verifyNoServiceRoleInClientCode() {
  const candidateFiles = [
    ...walkFiles("src/app").filter((path) => !isApiRoute(path)),
    ...walkFiles("src/components"),
  ];
  const serviceRolePattern =
    /SUPABASE_SERVICE_ROLE_KEY|service[_-]?role|serviceRoleKey|getSupabaseServerClient/;

  for (const file of candidateFiles) {
    const content = readProjectFile(file);

    if (serviceRolePattern.test(content)) {
      fail(`${file}: service-role/server Supabase usage appears in client UI code.`);
    }
  }
}

function verifyNoSensitiveConsoleLogging() {
  const files = [
    ...walkFiles("src/app"),
    ...walkFiles("src/components"),
    ...walkFiles("src/lib"),
    ...walkFiles("src/server"),
  ];
  const consolePattern = /console\.(log|info|warn|error|debug)\(([\s\S]*?)\)/g;
  const sensitivePattern =
    /\b(accessToken|refreshToken|refresh_token|session|Authorization|user)\b/i;

  for (const file of files) {
    const content = readProjectFile(file);
    const lines = content.split("\n");
    let match;

    while ((match = consolePattern.exec(content)) !== null) {
      const statement = match[0];

      if (!sensitivePattern.test(statement)) {
        continue;
      }

      const lineNumber = content.slice(0, match.index).split("\n").length;
      const line = lines[lineNumber - 1]?.trim() ?? statement.trim();

      fail(`${file}:${lineNumber}: sensitive value may be logged: ${line}`);
    }
  }
}

function verifyCoreApiOwnership() {
  for (const route of coreApiRoutes) {
    const absolutePath = join(root, route.path);

    if (!existsSync(absolutePath)) {
      fail(`${route.path}: core API route is missing.`);
      continue;
    }

    const content = readProjectFile(route.path);

    for (const check of route.checks) {
      if (!check.pattern.test(content)) {
        fail(`${route.path}: missing ${check.label}.`);
      }
    }
  }
}

function verifyClientComponentsDoNotImportServerModules() {
  const files = [
    ...walkFiles("src/app").filter((path) => !isApiRoute(path)),
    ...walkFiles("src/components"),
    ...walkFiles("src/lib"),
  ];
  const serverImportPattern = /from\s+["']@\/(?:server|env\/server)\b/;

  for (const file of files) {
    const content = readProjectFile(file);

    if (hasUseClientDirective(content) && serverImportPattern.test(content)) {
      fail(`${file}: client module imports a server-only module.`);
    }
  }
}

verifyRemovedTestEndpoint();
verifyNoServiceRoleInClientCode();
verifyNoSensitiveConsoleLogging();
verifyCoreApiOwnership();
verifyClientComponentsDoNotImportServerModules();

if (failures.length > 0) {
  console.error("Security guard failed:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Security guard passed.");
