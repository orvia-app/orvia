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
  dueDate?: string;
  createdAt: string;
};