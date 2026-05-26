"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getStoredNotes, type Note } from "@/lib/notes";
import { createSearchableEntities, searchEntities } from "@/lib/search";
import { getTasks } from "@/lib/tasks";
import type { Task } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setTasks(getTasks());
    setNotes(getStoredNotes());
  }, []);

  const searchableEntities = useMemo(
    () => createSearchableEntities({ tasks, notes }),
    [notes, tasks],
  );

  const results = useMemo(
    () => searchEntities(searchableEntities, query),
    [query, searchableEntities],
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl p-8">
        <div className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight">
            Global Search
          </h1>

          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            Search across your tasks and notes.
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-4 h-5 w-5 text-zinc-500" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anything..."
            className="w-full rounded-3xl border border-zinc-200 bg-white py-4 pl-12 pr-4 text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-600"
          />
        </div>

        <div className="space-y-4">
          {results.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {item.typeLabel}
                </span>

                <h2 className="text-2xl font-semibold">
                  {item.title}
                </h2>
              </div>

              <p className="text-zinc-600 dark:text-zinc-400">
                {item.subtitle}
              </p>
            </div>
          ))}

          {!results.length && query.trim() && (
            <EmptyState
              title="No results"
              description="Try a different keyword or capture something new."
            />
          )}
        </div>
      </main>
    </AppShell>
  );
}
