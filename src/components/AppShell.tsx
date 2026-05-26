"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CalendarDays,
  Car,
  CheckSquare,
  CircleDot,
  FileText,
  House,
  Inbox,
  MessageSquare,
  Monitor,
  Moon,
  Settings,
  Search,
  Sun,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { CommandCenter } from "@/components/command-palette/CommandCenter";
import { useTheme, type Theme } from "@/components/ThemeProvider";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: House },
  { label: "Search", href: "/search", icon: Search },
  { label: "Today", href: "/today", icon: CalendarDays },
  { label: "Timeline", href: "/timeline", icon: CircleDot },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "AI Chat", href: "/ai-chat", icon: MessageSquare },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Cars", href: "/cars", icon: Car },
  { label: "Automation", href: "/automation", icon: Zap },
  { label: "Settings", href: "/settings", icon: Settings },
];

const themeOptions: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mt-auto border-t border-zinc-200/80 pt-5 dark:border-zinc-800/80">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        Theme
      </p>
      <div className="flex flex-col gap-1.5">
        {themeOptions.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={
                active
                  ? "flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2.5 text-left text-sm font-medium text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  : "flex items-center gap-2 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70 dark:hover:text-white"
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-white">
      <CommandCenter />

      <aside className="hidden w-72 shrink-0 flex-col border-r border-zinc-200/80 bg-white/95 p-6 dark:border-zinc-800/80 dark:bg-zinc-950 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <Bot className="h-5 w-5 text-zinc-800 dark:text-zinc-100" aria-hidden />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
              Personal OS
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              AI-powered operating system
            </p>
          </div>
        </div>

        <nav
          className="mt-10 flex flex-1 flex-col gap-1.5 overflow-y-auto"
          aria-label="Main"
        >
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isNavActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 py-2.5 text-sm font-medium text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    : "flex items-center gap-3 rounded-xl border border-transparent px-3.5 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70 dark:hover:text-white"
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <ThemeSwitcher />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-zinc-200/80 bg-white px-6 py-4 dark:border-zinc-800/80 dark:bg-black lg:hidden">
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
            Personal OS
          </p>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
