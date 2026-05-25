"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { tasks as initialTasks } from "@/data/mock";
import { getStoredNotes, type Note } from "@/lib/notes";
import { getTasks } from "@/lib/tasks";
import type { Task } from "@/types";

type SearchResult = {
  id: string;
  type: "Task" | "Note";
  title: string;
  description: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    setTasks(getTasks());
    setNotes(getStoredNotes());
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const taskResults: SearchResult[] = tasks
      .filter((task) => {
        const title = task.title.toLowerCase();
        const description = task.description?.toLowerCase() ?? "";

        return (
          title.includes(normalizedQuery) ||
          description.includes(normalizedQuery)
        );
      })
      .map((task) => ({
        id: task.id,
        type: "Task",
        title: task.title,
        description: task.description ?? "",
      }));

    const noteResults: SearchResult[] = notes
      .filter((note) => {
        const title = note.title.toLowerCase();
        const content = note.content.toLowerCase();

        return (
          title.includes(normalizedQuery) ||
          content.includes(normalizedQuery)
        );
      })
      .map((note) => ({
        id: note.id,
        type: "Note",
        title: note.title,
        description: note.content,
      }));

    return [...taskResults, ...noteResults];
  }, [query, tasks, notes]);

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
              key={`${item.type}-${item.id}`}
              className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {item.type}
                </span>

                <h2 className="text-2xl font-semibold">
                  {item.title}
                </h2>
              </div>

              <p className="text-zinc-600 dark:text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}

          {!results.length && query.trim() && (
            <div className="rounded-3xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-800">
              Nothing found.
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
