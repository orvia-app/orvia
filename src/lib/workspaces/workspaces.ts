import type {
  WorkspaceKey,
  WorkspaceOption,
  WorkspaceRef,
} from "@/lib/workspaces/types";

export const WORKSPACE_OPTIONS: readonly WorkspaceOption[] = [
  {
    key: "personal",
    label: "Personal",
    legacyIds: ["1", "personal"],
  },
  {
    key: "work",
    label: "Work",
    legacyIds: ["2", "work"],
  },
  {
    key: "cars",
    label: "Cars",
    legacyIds: ["3", "cars"],
  },
  {
    key: "business",
    label: "Business",
    legacyIds: ["4", "business", "finance"],
  },
  {
    key: "knowledge",
    label: "Knowledge",
    legacyIds: ["5", "knowledge", "notes"],
  },
] as const;

const DEFAULT_WORKSPACE_KEY: WorkspaceKey = "personal";

function normalizeWorkspaceValue(value: string): string {
  return value.trim().toLowerCase();
}

export function isWorkspaceKey(value: unknown): value is WorkspaceKey {
  return (
    typeof value === "string" &&
    WORKSPACE_OPTIONS.some((workspace) => workspace.key === value)
  );
}

export function getWorkspaceOptions(): readonly WorkspaceOption[] {
  return WORKSPACE_OPTIONS;
}

export function getWorkspaceKey(
  value: string | null | undefined,
): WorkspaceKey {
  if (!value) {
    return DEFAULT_WORKSPACE_KEY;
  }

  const normalizedValue = normalizeWorkspaceValue(value);
  const workspace = WORKSPACE_OPTIONS.find(
    (option) =>
      option.key === normalizedValue ||
      option.legacyIds.some(
        (legacyId) => normalizeWorkspaceValue(legacyId) === normalizedValue,
      ),
  );

  return workspace?.key ?? DEFAULT_WORKSPACE_KEY;
}

export function getWorkspaceLabel(value: string | null | undefined): string {
  const key = getWorkspaceKey(value);
  return (
    WORKSPACE_OPTIONS.find((workspace) => workspace.key === key)?.label ??
    "Personal"
  );
}

export function getLegacyWorkspaceId(
  value: string | null | undefined,
): string {
  const key = getWorkspaceKey(value);
  const workspace = WORKSPACE_OPTIONS.find((option) => option.key === key);

  return workspace?.legacyIds[0] ?? "1";
}

export function getWorkspaceRef(
  value: string | null | undefined,
): WorkspaceRef {
  const key = getWorkspaceKey(value);

  return {
    key,
    label: getWorkspaceLabel(key),
    sourceId: value ?? undefined,
  };
}
