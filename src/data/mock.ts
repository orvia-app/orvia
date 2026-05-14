import { Task, Workspace } from "@/types";

export const workspaces: Workspace[] = [
  {
    id: "1",
    name: "Personal",
    color: "#3B82F6",
    type: "personal",
  },
  {
    id: "2",
    name: "Work",
    color: "#10B981",
    type: "work",
  },
];

export const tasks: Task[] = [
  {
    id: "1",
    title: "Finish Personal OS MVP",
    description: "Build dashboard and task architecture",
    status: "in-progress",
    priority: "high",
    workspaceId: "2",
    dueDate: "2026-05-20",
    createdAt: "2026-05-14",
  },
  {
    id: "2",
    title: "Plan Rehab Center",
    description: "Prepare finance and launch roadmap",
    status: "todo",
    priority: "critical",
    workspaceId: "1",
    dueDate: "2026-05-30",
    createdAt: "2026-05-14",
  },
  {
    id: "3",
    title: "Prepare DevOps Roadmap",
    description: "Learning and infrastructure planning",
    status: "done",
    priority: "medium",
    workspaceId: "2",
    createdAt: "2026-05-14",
  },
];