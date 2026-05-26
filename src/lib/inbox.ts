import type { NoteType } from "@/lib/notes";
import { dedupeTags } from "@/lib/tags/tag-utils";
import { getLegacyWorkspaceId } from "@/lib/workspaces/workspaces";
import type { TaskPriority } from "@/types";

export type InboxItemType =
  | "Reminder"
  | "Idea"
  | "Task"
  | "Note"
  | "Finance"
  | "Car"
  | "Inbox item";

export type InboxParserSource = "deterministic";

export type InboxConfidenceLabel = "low" | "medium" | "high";

export type InboxConfidence = {
  label: InboxConfidenceLabel;
  score: number;
};

export type InboxActionKind = "task" | "note";

export type InboxPreviewResult = {
  source: InboxParserSource;
  detectedType: InboxItemType;
  suggestedTitle: string;
  suggestedWorkspace: string;
  suggestedTags: string[];
  confidence: InboxConfidence;
  priority: TaskPriority;
  summary: string;
  actionKind: InboxActionKind;
  normalizedText: string;
};

export type InboxParseResult = InboxPreviewResult & {
  type: InboxItemType;
  workspace: string;
};

const typeKeywordMap: Record<InboxItemType, readonly string[]> = {
  Reminder: [
    "remind",
    "reminder",
    "tomorrow",
    "next week",
    "later",
    "follow up",
    "call",
  ],
  Task: [
    "todo",
    "task",
    "schedule",
    "prepare",
    "finish",
    "fix",
    "build",
    "send",
    "submit",
    "book",
  ],
  Note: ["note", "save", "remember", "reference", "write down"],
  Idea: ["idea", "concept", "what if", "maybe", "brainstorm"],
  Finance: [
    "budget",
    "invoice",
    "payment",
    "expense",
    "receipt",
    "revenue",
    "stripe",
    "bank",
    "transaction",
    "paid",
    "pay",
  ],
  Car: [
    "infiniti",
    "car",
    "vehicle",
    "suspension",
    "oil",
    "tire",
    "brake",
    "mileage",
    "service",
    "maintenance",
  ],
  "Inbox item": [],
};

const financeAmountPattern =
  /(?:^|\s)(?:[$€£]\s?\d+|\d+(?:\.\d{2})?\s?(?:usd|eur|uah|gbp))(?:\s|$)/i;

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function countKeywordMatches(
  normalizedText: string,
  keywords: readonly string[],
): number {
  return keywords.filter((keyword) => normalizedText.includes(keyword)).length;
}

export function detectItemType(text: string): InboxItemType {
  const normalizedText = normalizeText(text).toLowerCase();
  const scores = new Map<InboxItemType, number>();

  Object.entries(typeKeywordMap).forEach(([type, keywords]) => {
    scores.set(
      type as InboxItemType,
      countKeywordMatches(normalizedText, keywords),
    );
  });

  if (financeAmountPattern.test(normalizedText)) {
    scores.set("Finance", (scores.get("Finance") ?? 0) + 2);
  }

  const sortedScores = Array.from(scores.entries()).sort(
    ([, leftScore], [, rightScore]) => rightScore - leftScore,
  );
  const bestScore = sortedScores[0];

  if (!bestScore) {
    return "Inbox item";
  }

  const [detectedType, score] = bestScore;

  if (score <= 0) {
    return "Inbox item";
  }

  if (
    detectedType === "Reminder" &&
    normalizedText.includes("idea") &&
    (scores.get("Idea") ?? 0) >= score
  ) {
    return "Idea";
  }

  return detectedType;
}

export function detectWorkspace(text: string): string {
  const normalizedText = normalizeText(text).toLowerCase();

  if (detectItemType(text) === "Car") {
    return "Cars";
  }

  if (detectItemType(text) === "Finance") {
    return "Business";
  }

  if (
    normalizedText.includes("qa") ||
    normalizedText.includes("client") ||
    normalizedText.includes("meeting") ||
    normalizedText.includes("interview")
  ) {
    return "Work";
  }

  if (normalizedText.includes("rehab")) {
    return "Business";
  }

  if (
    normalizedText.includes("devops") ||
    normalizedText.includes("research") ||
    normalizedText.includes("course") ||
    normalizedText.includes("learn")
  ) {
    return "Knowledge";
  }

  return "Personal";
}

export function buildSuggestedTitle(text: string): string {
  const cleanedTitle = normalizeText(text)
    .replace(/^idea:/i, "")
    .replace(/^remind me to/i, "")
    .replace(/^reminder:/i, "")
    .replace(/^schedule/i, "")
    .replace(/^save/i, "")
    .replace(/^note:/i, "")
    .replace(/^task:/i, "")
    .trim();

  return cleanedTitle || "Untitled capture";
}

export function priorityFromType(type: InboxItemType): TaskPriority {
  switch (type) {
    case "Reminder":
    case "Task":
      return "high";

    case "Idea":
    case "Note":
    case "Finance":
    case "Car":
      return "medium";

    default:
      return "low";
  }
}

export function workspaceIdFromLabel(workspace: string): string {
  return getLegacyWorkspaceId(workspace);
}

export function noteTypeFromInboxType(
  inboxType: InboxItemType,
): Extract<NoteType, "idea" | "note"> {
  if (inboxType === "Idea") {
    return "idea";
  }

  return "note";
}

export function actionKindFromInboxType(type: InboxItemType): InboxActionKind {
  if (type === "Task" || type === "Reminder") {
    return "task";
  }

  return "note";
}

export function buildSuggestedTags(
  text: string,
  type: InboxItemType,
  workspace: string,
): string[] {
  const normalizedText = normalizeText(text).toLowerCase();
  const tags = [type, workspace];

  if (normalizedText.includes("tomorrow")) {
    tags.push("tomorrow");
  }

  if (normalizedText.includes("next week")) {
    tags.push("next-week");
  }

  if (normalizedText.includes("research")) {
    tags.push("research");
  }

  if (normalizedText.includes("onboarding")) {
    tags.push("onboarding");
  }

  if (normalizedText.includes("infiniti")) {
    tags.push("infiniti");
  }

  return dedupeTags(tags);
}

export function confidenceFromSignals(input: {
  text: string;
  type: InboxItemType;
  tags: readonly string[];
}): InboxConfidence {
  const normalizedText = normalizeText(input.text).toLowerCase();
  const keywordMatches = countKeywordMatches(
    normalizedText,
    typeKeywordMap[input.type],
  );
  const lengthSignal = normalizedText.length >= 20 ? 1 : 0;
  const tagSignal = Math.min(input.tags.length, 3);
  const score = Math.min(
    95,
    35 + keywordMatches * 15 + lengthSignal * 10 + tagSignal * 5,
  );

  if (score >= 75) {
    return { label: "high", score };
  }

  if (score >= 55) {
    return { label: "medium", score };
  }

  return { label: "low", score };
}

export function buildCaptureSummary(input: {
  type: InboxItemType;
  workspace: string;
  title: string;
  tags: readonly string[];
}): string {
  const tagText =
    input.tags.length > 0 ? ` Tags: ${input.tags.join(", ")}.` : "";

  return `${input.type} capture for ${input.workspace}: ${input.title}.${tagText}`;
}

export function parseInboxInput(text: string): InboxParseResult {
  const normalizedText = normalizeText(text);
  const type = detectItemType(text);
  const workspace = detectWorkspace(text);
  const suggestedTitle = buildSuggestedTitle(text);
  const suggestedTags = buildSuggestedTags(text, type, workspace);
  const summary = buildCaptureSummary({
    type,
    workspace,
    title: suggestedTitle,
    tags: suggestedTags,
  });

  return {
    source: "deterministic",
    detectedType: type,
    type,
    workspace,
    suggestedWorkspace: workspace,
    suggestedTags,
    suggestedTitle,
    priority: priorityFromType(type),
    confidence: confidenceFromSignals({
      text,
      type,
      tags: suggestedTags,
    }),
    summary,
    actionKind: actionKindFromInboxType(type),
    normalizedText,
  };
}
