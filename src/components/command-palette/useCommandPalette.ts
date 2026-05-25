"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type { CommandAction, CommandItem } from "@/lib/commands/types";

type UseCommandPaletteOptions = {
  enabled?: boolean;
  onAction?: (action: CommandAction) => void;
};

function commandMatches(command: CommandItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    command.title,
    command.subtitle,
    command.group,
    ...(command.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
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

  const filteredCommands = useMemo(
    () => commands.filter((command) => commandMatches(command, query)),
    [commands, query],
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
    [closePalette, onAction, router],
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

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

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
    inputRef,
    onActiveIndexChange: setActiveIndex,
    onCommandSelect: runCommand,
    onOpenChange: handleOpenChange,
    onQueryChange: handleQueryChange,
    open,
    query,
  };
}
