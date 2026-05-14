"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  CalendarDays,
  Car,
  CheckSquare,
  FileText,
  Inbox,
  Wallet,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { tasks as mockTasks } from "@/data/mock";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const TASKS_KEY = "personal-os.tasks";
const NOTES_KEY = "personal-os.notes";
const FINANCE_KEY = "personal-os.finance.transactions";
const CARS_KEY = "personal-os.cars";

const TASK_STATUSES: TaskStatus[] = ["todo", "in-progress", "done"];
const TASK_PRIORITIES: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

type NoteType = "note" | "idea" | "book" | "course" | "link";

type NoteRecord = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
};

const NOTE_TYPES: NoteType[] = ["note", "idea", "book", "course", "link"];

type TxType = "income" | "expense";

type CurrencyCode = "UAH" | "USD" | "EUR";

type Transaction = {
  id: string;
  type: TxType;
  category: string;
  amount: number;
  currency: CurrencyCode;
  note: string;
  createdAt: string;
};

type CarRecord = {
  id: string;
  name: string;
  owner: string;
  mileage: string;
  notes: string;
};

const CURRENCIES: CurrencyCode[] = ["UAH", "USD", "EUR"];

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    (TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

function isTaskRecord(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.title !== "string") return false;
  if (!isTaskStatus(o.status) || !isTaskPriority(o.priority)) return false;
  if (typeof o.workspaceId !== "string" || typeof o.createdAt !== "string") {
    return false;
  }
  if (
    o.description !== undefined &&
    typeof o.description !== "string"
  ) {
    return false;
  }
  if (o.dueDate !== undefined && typeof o.dueDate !== "string") {
    return false;
  }
  return true;
}

function readTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isTaskRecord);
  } catch {
    return [];
  }
}

function tasksWithFallback(): Task[] {
  const stored = readTasks();
  return stored.length > 0 ? stored : mockTasks;
}

function isNoteType(value: unknown): value is NoteType {
  return (
    typeof value === "string" &&
    (NOTE_TYPES as readonly string[]).includes(value)
  );
}

function isNoteRecord(value: unknown): value is NoteRecord {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string" &&
    isNoteType(o.type)
  );
}

function readNotes(): NoteRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isNoteRecord);
  } catch {
    return [];
  }
}

function isTxType(value: unknown): value is TxType {
  return value === "income" || value === "expense";
}

function isCurrency(value: unknown): value is CurrencyCode {
  return (
    typeof value === "string" &&
    (CURRENCIES as readonly string[]).includes(value)
  );
}

function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    isTxType(o.type) &&
    typeof o.category === "string" &&
    typeof o.amount === "number" &&
    Number.isFinite(o.amount) &&
    isCurrency(o.currency) &&
    typeof o.note === "string" &&
    typeof o.createdAt === "string"
  );
}

function readTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FINANCE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isTransaction);
  } catch {
    return [];
  }
}

function isCarRecord(value: unknown): value is CarRecord {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.owner === "string" &&
    typeof o.mileage === "string" &&
    typeof o.notes === "string"
  );
}

function readCars(): CarRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CARS_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isCarRecord);
  } catch {
    return [];
  }
}

type OverviewStats = {
  totalTasks: number;
  activeTasks: number;
  notesCount: number;
  financeCount: number;
  carsCount: number;
};

function computeOverview(): OverviewStats {
  if (typeof window === "undefined") {
    return {
      totalTasks: mockTasks.length,
      activeTasks: mockTasks.filter((t) => t.status !== "done").length,
      notesCount: 0,
      financeCount: 0,
      carsCount: 0,
    };
  }
  const taskList = tasksWithFallback();
  const notes = readNotes();
  const txs = readTransactions();
  const cars = readCars();
  return {
    totalTasks: taskList.length,
    activeTasks: taskList.filter((t) => t.status !== "done").length,
    notesCount: notes.length,
    financeCount: txs.length,
    carsCount: cars.length,
  };
}

const cards = [
  {
    title: "Today",
    description: "Daily focus, active work, and quick capture",
    icon: CalendarDays,
    href: "/today",
  },
  {
    title: "Inbox",
    description: "Capture and let AI route thoughts into your system",
    icon: Inbox,
    href: "/inbox",
  },
  {
    title: "Tasks",
    description: "Smart task management and prioritization",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    title: "Notes",
    description: "AI memory and knowledge storage",
    icon: FileText,
    href: "/notes",
  },
  {
    title: "AI Chat",
    description: "Second brain assistant interface",
    icon: Brain,
    href: "/ai-chat",
  },
  {
    title: "Finance",
    description: "Income, expenses, and cashflow",
    icon: Wallet,
    href: "/finance",
  },
  {
    title: "Cars",
    description: "Maintenance, costs, and reminders",
    icon: Car,
    href: "/cars",
  },
  {
    title: "Automation",
    description: "Telegram bots and workflows",
    icon: Zap,
    href: "/automation",
  },
];

const initialOverview: OverviewStats = {
  totalTasks: mockTasks.length,
  activeTasks: mockTasks.filter((t) => t.status !== "done").length,
  notesCount: 0,
  financeCount: 0,
  carsCount: 0,
};

export default function Home() {
  const pathname = usePathname();
  const [stats, setStats] = useState<OverviewStats>(initialOverview);

  useEffect(() => {
    function refresh() {
      if (typeof window === "undefined") return;
      setStats(computeOverview());
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/" && typeof window !== "undefined") {
      setStats(computeOverview());
    }
  }, [pathname]);

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
            Jump into your workspace modules.
          </p>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              System overview
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Total tasks</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.totalTasks}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  localStorage or demo seed
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Active tasks</p>
                <p className="mt-1 text-2xl font-semibold text-violet-700 dark:text-violet-300">
                  {stats.activeTasks}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  Not marked done
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Notes</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.notesCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  Saved in browser
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Finance txns</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.financeCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">Transactions</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 sm:col-span-2 lg:col-span-1 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Cars</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.carsCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">Garage list</p>
              </div>
            </div>
          </section>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 sm:p-8"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-200 transition group-hover:bg-zinc-300 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
                    <Icon className="h-6 w-6 text-zinc-800 dark:text-zinc-100" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
