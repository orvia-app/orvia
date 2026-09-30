export type TaskStatus = "todo" | "in-progress" | "done";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type WorkspaceType =
  | "work"
  | "personal"
  | "finance"
  | "investments"
  | "cars"
  | "knowledge"
  | "business";

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  color?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  workspaceId: string;
  /** Existing deadline: a local date, never an occupied time slot. */
  dueDate?: string;
  /** UTC instant at which work is intended to start. */
  plannedStart?: string | null;
  /** Positive, bounded estimate; valid without a planned start. */
  estimatedDurationMinutes?: number | null;
  /** Explicit local planning assignment, independent of dueDate and plannedStart. */
  planDay?: string | null;
  createdAt: string;
};
