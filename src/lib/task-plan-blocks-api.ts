import {
  isUtcInstant,
  validateTaskPlanBlock,
  type TaskPlanBlock,
} from "@/core/schedule/domain";
import type { PlanTaskBlockSummary } from "@/core/plan/workspace";

type BlockErrorKind = "invalid" | "conflict" | "missing" | "unavailable";

export class TaskPlanBlockApiError extends Error {
  constructor(readonly kind: BlockErrorKind) {
    super(`Task plan block request failed: ${kind}`);
    this.name = "TaskPlanBlockApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function headers(accessToken: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function parseSummary(value: unknown): PlanTaskBlockSummary | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.taskId !== "string" ||
      !isUtcInstant(value.startAt) || !isUtcInstant(value.endAt) ||
      Date.parse(value.endAt) <= Date.parse(value.startAt) ||
      typeof value.version !== "number" || !Number.isInteger(value.version) || value.version < 1) {
    return null;
  }
  return { id: value.id, taskId: value.taskId, startAt: value.startAt,
    endAt: value.endAt, version: value.version };
}

function summaryFromDomain(value: unknown): PlanTaskBlockSummary | null {
  try {
    const block: TaskPlanBlock = validateTaskPlanBlock(value);
    return { id: block.id, taskId: block.taskId, startAt: block.interval.start,
      endAt: block.interval.end, version: block.version };
  } catch {
    return null;
  }
}

async function body(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

function failure(response: Response): TaskPlanBlockApiError {
  if (response.status === 400) return new TaskPlanBlockApiError("invalid");
  if (response.status === 404) return new TaskPlanBlockApiError("missing");
  if (response.status === 409) return new TaskPlanBlockApiError("conflict");
  return new TaskPlanBlockApiError("unavailable");
}

export async function fetchTaskPlanBlocks(accessToken: string): Promise<PlanTaskBlockSummary[]> {
  const response = await fetch("/api/task-plan-blocks", {
    cache: "no-store",
    headers: headers(accessToken),
  });
  const value = await body(response);
  if (!response.ok) throw failure(response);
  if (!isRecord(value) || value.ok !== true || !Array.isArray(value.blocks)) {
    throw new TaskPlanBlockApiError("unavailable");
  }
  const blocks = value.blocks.map(parseSummary);
  if (blocks.some((block) => block === null)) throw new TaskPlanBlockApiError("unavailable");
  return blocks as PlanTaskBlockSummary[];
}

async function mutate(
  url: string,
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
  accessToken: string,
): Promise<PlanTaskBlockSummary> {
  const response = await fetch(url, {
    method,
    headers: headers(accessToken, true),
    body: JSON.stringify(payload),
  });
  const value = await body(response);
  if (!response.ok) throw failure(response);
  const block = isRecord(value) && value.ok === true ? summaryFromDomain(value.block) : null;
  if (!block) throw new TaskPlanBlockApiError("unavailable");
  return block;
}

export function createTaskPlanBlock(
  taskId: string,
  input: { startAt: string; endAt: string },
  accessToken: string,
): Promise<PlanTaskBlockSummary> {
  return mutate(`/api/tasks/${encodeURIComponent(taskId)}/blocks`, "POST", input, accessToken);
}

export function updateTaskPlanBlock(
  taskId: string,
  blockId: string,
  input: { startAt: string; endAt: string; expectedVersion: number },
  accessToken: string,
): Promise<PlanTaskBlockSummary> {
  return mutate(`/api/tasks/${encodeURIComponent(taskId)}/blocks/${encodeURIComponent(blockId)}`,
    "PATCH", input, accessToken);
}
