"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getRecentCommands,
  recordCommandExecution,
} from "@/lib/commands/history";
import type { CommandAction, CommandItem } from "@/lib/commands/types";

type UseCommandPaletteOptions = {
  enabled?: boolean;
  onAction?: (action: CommandAction) => void;
};

export type CommandPaletteSection = {
  id: string;
  label: string;
  commands: readonly CommandItem[];
};

const COMMAND_GROUP_ORDER = [
  "Recent",
  "Capture",
  "Actions",
  "Search",
  "Navigation",
  "AI",
  "Entities",
] as const;

function commandMatches(command: CommandItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    command.title,
    command.subtitle,
    command.group,
    command.metadata?.category,
    command.metadata?.recentLabel,
    ...(command.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

function getCommandRank(command: CommandItem): number {
  const priorityScore = {
    primary: 300,
    normal: 100,
    secondary: 0,
  }[command.metadata?.priority ?? "normal"];

  return priorityScore + (command.metadata?.contextualScore ?? 0);
}

function sortCommands(commands: readonly CommandItem[]): CommandItem[] {
  return [...commands].sort((a, b) => {
    const groupDifference =
      COMMAND_GROUP_ORDER.indexOf(a.group) - COMMAND_GROUP_ORDER.indexOf(b.group);

    if (groupDifference !== 0) {
      return groupDifference;
    }

    const rankDifference = getCommandRank(b) - getCommandRank(a);

    if (rankDifference !== 0) {
      return rankDifference;
    }

    return a.title.localeCompare(b.title);
  });
}

function createCommandSections(input: {
  commands: readonly CommandItem[];
  query: string;
  recentCommands: readonly CommandItem[];
}): CommandPaletteSection[] {
  const recentCommands = input.recentCommands.filter((command) =>
    commandMatches(command, input.query),
  );
  const groupedCommands = sortCommands(input.commands).filter((command) =>
    commandMatches(command, input.query),
  );
  const sections: CommandPaletteSection[] = [];

  if (recentCommands.length > 0) {
    sections.push({
      id: "recent",
      label: "Recent",
      commands: recentCommands,
    });
  }

  COMMAND_GROUP_ORDER.filter((group) => group !== "Recent").forEach((group) => {
    const groupCommands = groupedCommands.filter(
      (command) => command.group === group,
    );

    if (groupCommands.length === 0) {
      return;
    }

    sections.push({
      id: group.toLowerCase(),
      label: group,
      commands: groupCommands,
    });
  });

  return sections;
}

export function useCommandPalette(
  commands: readonly CommandItem[],
  options: UseCommandPaletteOptions = {},
) {
  const { enabled = true, onAction } = options;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<CommandItem[]>([]);

  const commandSections = useMemo(
    () =>
      createCommandSections({
        commands,
        query,
        recentCommands,
      }),
    [commands, query, recentCommands],
  );

  const filteredCommands = useMemo(
    () => commandSections.flatMap((section) => section.commands),
    [commandSections],
  );

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const togglePalette = useCallback(() => {
    setOpen((currentOpen) => {
      const nextOpen = !currentOpen;

      if (!nextOpen) {
        setQuery("");
        setActiveIndex(0);
      }

      return nextOpen;
    });
  }, []);

  const runCommand = useCallback(
    (command: CommandItem) => {
      recordCommandExecution(command.id);
      setRecentCommands(getRecentCommands(commands));

      switch (command.action.type) {
        case "navigate":
          router.push(command.action.href);
          break;
        case "create-task":
        case "create-note":
        case "ai-action":
        case "open-entity":
          onAction?.(command.action);
          break;
      }

      closePalette();
    },
    [closePalette, commands, onAction, router],
  );

  const handleQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setActiveIndex(0);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setOpen(true);
      } else {
        closePalette();
      }
    },
    [closePalette],
  );

  useEffect(() => {
    if (!open) return;

    setRecentCommands(getRecentCommands(commands));

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [commands, open]);

  useEffect(() => {
    if (activeIndex <= filteredCommands.length - 1) return;

    setActiveIndex(Math.max(filteredCommands.length - 1, 0));
  }, [activeIndex, filteredCommands.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!enabled) {
        return;
      }

      const isPaletteShortcut =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);

      if (isPaletteShortcut) {
        event.preventDefault();
        togglePalette();
        return;
      }

      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((currentIndex) => {
          if (filteredCommands.length === 0) return 0;
          return (currentIndex + 1) % filteredCommands.length;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((currentIndex) => {
          if (filteredCommands.length === 0) return 0;
          return (
            (currentIndex - 1 + filteredCommands.length) %
            filteredCommands.length
          );
        });
        return;
      }

      if (event.key === "Enter") {
        const activeCommand = filteredCommands[activeIndex];

        if (!activeCommand) {
          return;
        }

        event.preventDefault();
        runCommand(activeCommand);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    activeIndex,
    closePalette,
    enabled,
    filteredCommands,
    open,
    runCommand,
    togglePalette,
  ]);

  return {
    activeIndex,
    commands: filteredCommands,
    commandSections,
    inputRef,
    onActiveIndexChange: setActiveIndex,
    onCommandSelect: runCommand,
    onOpenChange: handleOpenChange,
    onQueryChange: handleQueryChange,
    open,
    query,
  };
}
