"use client";

import { useEffect, type RefObject } from "react";
import { Search, X } from "lucide-react";

import type { CommandItem } from "@/lib/commands/types";
import type { CommandPaletteSection } from "@/components/command-palette/useCommandPalette";

type CommandPaletteProps = {
  activeIndex: number;
  commandSections: readonly CommandPaletteSection[];
  commands: readonly CommandItem[];
  inputRef: RefObject<HTMLInputElement | null>;
  onActiveIndexChange: (index: number) => void;
  onCommandSelect: (command: CommandItem) => void;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  open: boolean;
  query: string;
};

export function CommandPalette({
  activeIndex,
  commandSections,
  commands,
  inputRef,
  onActiveIndexChange,
  onCommandSelect,
  onOpenChange,
  onQueryChange,
  open,
  query,
}: CommandPaletteProps) {
  const activeCommandId =
    commands[activeIndex] ? `command-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!activeCommandId) {
      return;
    }

    document
      .getElementById(activeCommandId)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeCommandId, open]);

  if (!open) {
    return null;
  }

  let commandIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/45 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))] backdrop-blur-sm dark:bg-zinc-950/70 sm:items-start sm:px-4 sm:py-20"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        aria-labelledby="command-palette-title"
        aria-modal="true"
        className="flex max-h-[calc(100dvh-4rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl shadow-zinc-950/15 ring-1 ring-zinc-200/80 dark:bg-zinc-900/95 dark:shadow-black/40 dark:ring-zinc-800 sm:max-h-[min(40rem,84vh)]"
        role="dialog"
      >
        <div className="shrink-0 border-b border-zinc-200/75 bg-zinc-50/65 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-950/35 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                Orvia Command Center
              </p>
              <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
                Capture, navigate, and recall context from one place.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 ring-1 ring-zinc-200/70 transition-colors hover:bg-violet-50 hover:text-violet-700 hover:ring-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/25 dark:focus-visible:ring-violet-400"
              >
                <X className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2.25} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex h-11 items-center gap-3 rounded-xl bg-white px-3 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/80 dark:bg-zinc-900/70 dark:shadow-none dark:ring-zinc-800/80">
            <Search
              aria-hidden
              className="h-4.5 w-4.5 shrink-0 text-violet-600 dark:text-violet-300"
            />
            <label id="command-palette-title" className="sr-only">
              Command palette
            </label>
            <input
              ref={inputRef}
              aria-activedescendant={activeCommandId}
              aria-autocomplete="list"
              aria-controls="command-palette-results"
              aria-label="Search commands"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-zinc-950 outline-none placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-600"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search commands..."
              role="combobox"
              spellCheck={false}
              value={query}
            />
          </div>
        </div>

        <div
          id="command-palette-results"
          className="app-scrollbar min-h-0 flex-1 overscroll-contain scroll-py-4 overflow-y-auto bg-white/75 px-2 py-3 dark:bg-zinc-900/75 sm:px-3"
          role="listbox"
        >
          {commands.length > 0 ? (
            <div className="space-y-3 pb-2">
              {commandSections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                      {section.label}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {section.commands.map((command) => {
                      const Icon = command.icon;
                      const index = commandIndex;
                      const active = index === activeIndex;
                      const primary =
                        command.metadata?.priority === "primary" &&
                        section.id !== "recent";
                      const title =
                        section.id === "recent" && command.metadata?.recentLabel
                          ? command.metadata.recentLabel
                          : command.title;
                      commandIndex += 1;

                      return (
                        <button
                          id={`command-option-${index}`}
                          key={`${section.id}-${command.id}`}
                          type="button"
                          aria-selected={active}
                          className={
                            active
                              ? "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-violet-200/80 bg-violet-50 px-3 py-2.5 text-left text-violet-950 shadow-sm shadow-violet-950/[0.025] transition-colors dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100 dark:shadow-none"
                              : primary
                                ? "flex w-full cursor-pointer items-center gap-3 rounded-xl bg-zinc-50/90 px-3 py-2.5 text-left text-zinc-800 ring-1 ring-zinc-200/70 transition-colors hover:bg-white hover:text-violet-800 hover:ring-violet-200/80 dark:bg-zinc-950/35 dark:text-zinc-200 dark:ring-zinc-800/70 dark:hover:bg-violet-500/10 dark:hover:text-violet-100 dark:hover:ring-violet-500/25"
                                : "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-zinc-700 transition-colors hover:bg-violet-50 hover:text-violet-800 dark:text-zinc-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-100"
                          }
                          onClick={() => onCommandSelect(command)}
                          onMouseEnter={() => onActiveIndexChange(index)}
                          role="option"
                        >
                          <span
                            className={
                              active
                                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm shadow-violet-950/[0.025] ring-1 ring-violet-200/75 dark:bg-violet-500/15 dark:text-violet-200 dark:shadow-none dark:ring-violet-500/20"
                                : primary
                                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm shadow-zinc-950/[0.03] dark:bg-zinc-950/60 dark:text-violet-300 dark:shadow-none"
                                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-400"
                            }
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {title}
                            </span>
                            {command.subtitle ? (
                              <span
                                className={
                                  active
                                    ? "mt-0.5 block truncate text-xs text-violet-700/80 dark:text-violet-200/70"
                                    : "mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-500"
                                }
                              >
                                {command.subtitle}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No matching commands
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                Try “task”, “inbox”, “timeline”, or “search”.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
