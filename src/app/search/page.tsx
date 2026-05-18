"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { tasks as initialTasks } from "@/data/mock";

type NoteItem = {
  id: string;
  title: string;
  content: string;
  type: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState(initialTasks);
  const [notes, setNotes] = useState<NoteItem[]>([]);

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem("personal-os.tasks");
      const storedNotes = localStorage.getItem("personal-os.notes");

      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }

      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch {}
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return [];
    }

    const q = query.toLowerCase();

    const taskResults = tasks
      .filter(
        (task) =>
          task.title.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q)
      )
      .map((task) => ({
        id: task.id,
        type: "Task",
        title: task.title,
        description: task.description || "",
      }));

    const noteResults = notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q)
      )
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 py-4 pl-12 pr-4 text-white outline-none focus:border-zinc-600 dark:bg-zinc-950"
          />
        </div>

        <div className="space-y-4">
          {results.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs">
                  {item.type}
                </span>

                <h2 className="text-2xl font-semibold">
                  {item.title}
                </h2>
              </div>

              <p className="text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}

          {!results.length && query && (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-10 text-center text-zinc-500">
              Nothing found.
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}