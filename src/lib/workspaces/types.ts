export type WorkspaceKey =
  | "personal"
  | "work"
  | "cars"
  | "business"
  | "knowledge";

export type WorkspaceOption = {
  key: WorkspaceKey;
  label: string;
  legacyIds: readonly string[];
};

export type WorkspaceRef = {
  key: WorkspaceKey;
  label: string;
  sourceId?: string;
};
