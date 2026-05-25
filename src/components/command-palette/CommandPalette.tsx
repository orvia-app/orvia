"use client";

import type { RefObject } from "react";
import { Search } from "lucide-react";

import type { CommandItem } from "@/lib/commands/types";

type CommandPaletteProps = {
  activeIndex: number;
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
  commands,
  inputRef,
  onActiveIndexChange,
  onCommandSelect,
  onOpenChange,
  onQueryChange,
  open,
  query,
}: CommandPaletteProps) {
  if (!open) {
    return null;
  }

  const activeCommandId = commands[activeIndex]?.id;
  let currentGroup: string | null = null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/55 px-4 py-20 backdrop-blur-sm dark:bg-black/70 sm:py-24"
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
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/15 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40"
        role="dialog"
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
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
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-zinc-950 outline-none placeholder:text-zinc-500 dark:text-white dark:placeholder:text-zinc-600"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search commands..."
            role="combobox"
            spellCheck={false}
            value={query}
          />
          <kbd className="hidden rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 sm:inline-flex">
            Esc
          </kbd>
        </div>

        <div
          id="command-palette-results"
          className="max-h-[min(28rem,60vh)] overflow-y-auto p-2"
          role="listbox"
        >
          {commands.length > 0 ? (
            <div className="space-y-2">
              {commands.map((command, index) => {
                const Icon = command.icon;
                const active = index === activeIndex;
                const showGroup = command.group !== currentGroup;
                currentGroup = command.group;

                return (
                  <div key={command.id}>
                    {showGroup ? (
                      <div className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                        {command.group}
                      </div>
                    ) : null}
                    <button
                      id={command.id}
                      type="button"
                      aria-selected={active}
                      className={
                        active
                          ? "flex w-full items-center gap-3 rounded-xl bg-zinc-900 px-3 py-3 text-left text-white dark:bg-zinc-800"
                          : "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                      }
                      onClick={() => onCommandSelect(command)}
                      onMouseEnter={() => onActiveIndexChange(index)}
                      role="option"
                    >
                      <span
                        className={
                          active
                            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"
                            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                        }
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {command.title}
                        </span>
                        {command.subtitle ? (
                          <span
                            className={
                              active
                                ? "mt-0.5 block truncate text-xs text-zinc-300"
                                : "mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-500"
                            }
                          >
                            {command.subtitle}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                No commands found
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                Try a different search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
