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
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/45 px-3 py-16 backdrop-blur-sm dark:bg-black/65 sm:px-4 sm:py-24"
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl shadow-zinc-950/15 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:shadow-black/40 dark:ring-zinc-800"
        role="dialog"
      >
        <div className="ring-1 ring-inset ring-zinc-200/60 dark:ring-zinc-800/70">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                Archflow Command Center
              </p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                Capture, navigate, and recall context from one place.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <kbd className="hidden rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 sm:inline-flex">
                Esc
              </kbd>
              <button
                type="button"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white dark:focus-visible:ring-zinc-600"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 px-4 pb-3">
            <Search
              aria-hidden
              className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-500"
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
              className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-zinc-950 outline-none placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-600"
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
          className="app-scrollbar max-h-[min(34rem,64vh)] scroll-py-3 overflow-y-auto p-2"
          role="listbox"
        >
          {commands.length > 0 ? (
            <div className="space-y-2.5">
              {commandSections.map((section) => (
                <div key={section.id}>
                  <div className="flex items-center justify-between px-3 pb-1 pt-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                      {section.label}
                    </div>
                    <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600">
                      {section.commands.length}
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
                          ? "flex w-full cursor-pointer items-center gap-3 rounded-xl bg-zinc-950 px-3 py-2.5 text-left text-white dark:bg-zinc-100 dark:text-zinc-950"
                          : primary
                            ? "flex w-full cursor-pointer items-center gap-3 rounded-xl bg-zinc-100/70 px-3 py-2.5 text-left text-zinc-800 ring-1 ring-zinc-200/60 hover:bg-white hover:text-zinc-950 hover:ring-zinc-300 dark:bg-zinc-900/45 dark:text-zinc-200 dark:ring-zinc-800/70 dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:ring-zinc-700"
                            : "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                          }
                          onClick={() => onCommandSelect(command)}
                          onMouseEnter={() => onActiveIndexChange(index)}
                          role="option"
                        >
                          <span
                            className={
                              active
                                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white dark:bg-zinc-950/10 dark:text-zinc-950"
                                : primary
                                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-800 shadow-sm shadow-zinc-950/[0.03] dark:bg-zinc-950 dark:text-zinc-200 dark:shadow-none"
                                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
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
                                    ? "mt-0.5 block truncate text-xs text-zinc-300 dark:text-zinc-600"
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
            <div className="px-6 py-12 text-center">
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
