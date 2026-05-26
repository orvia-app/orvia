import { createLocalListRepository } from "@/core/repositories/local-json-repository";
import type { CommandItem } from "@/lib/commands/types";
import { STORAGE_KEYS } from "@/lib/storage";

const MAX_COMMAND_HISTORY_ITEMS = 8;

export type CommandHistoryEntry = {
  commandId: string;
  executedAt: string;
};

function isCommandHistoryEntry(value: unknown): value is CommandHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.commandId === "string" &&
    entry.commandId.trim().length > 0 &&
    typeof entry.executedAt === "string" &&
    entry.executedAt.trim().length > 0
  );
}

const commandHistoryRepository =
  createLocalListRepository<CommandHistoryEntry>({
    key: STORAGE_KEYS.commandHistory,
    validate: isCommandHistoryEntry,
  });

function readCommandHistoryEntries(): CommandHistoryEntry[] {
  return commandHistoryRepository.list().slice(0, MAX_COMMAND_HISTORY_ITEMS);
}

export function getRecentCommandIds(): string[] {
  return readCommandHistoryEntries().map((entry) => entry.commandId);
}

export function getRecentCommands(
  commands: readonly CommandItem[],
): CommandItem[] {
  const commandById = new Map(commands.map((command) => [command.id, command]));

  return getRecentCommandIds()
    .map((commandId) => commandById.get(commandId))
    .filter((command): command is CommandItem => command !== undefined);
}

export function recordCommandExecution(commandId: string): void {
  const nextEntries: CommandHistoryEntry[] = [
    {
      commandId,
      executedAt: new Date().toISOString(),
    },
    ...readCommandHistoryEntries().filter(
      (entry) => entry.commandId !== commandId,
    ),
  ].slice(0, MAX_COMMAND_HISTORY_ITEMS);

  commandHistoryRepository.save(nextEntries);
}
