"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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

import { BrandMark } from "@/components/BrandMark";
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
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        Theme
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {themeOptions.map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={
                active
                  ? "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-2 text-center text-[11px] font-medium text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  : "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-2 py-2 text-center text-[11px] font-medium text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70 dark:hover:text-white"
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const activeItem = navItems.find((item) => isNavActive(pathname, item.href));
    const activeElement = activeItem
      ? navItemRefs.current[activeItem.href]
      : null;

    activeElement?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-white">
      <CommandCenter />

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-950 lg:flex">
        <div className="flex shrink-0 items-center gap-3 px-5 pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-none">
            <BrandMark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              Archflow
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
              Capture operating system
            </p>
          </div>
        </div>

        <nav
          className="app-scrollbar app-scrollbar-quiet mt-7 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 pb-4"
          aria-label="Main"
        >
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isNavActive(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                ref={(element) => {
                  navItemRefs.current[href] = element;
                }}
                className={
                  active
                    ? "flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    : "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-800 dark:hover:bg-zinc-900/70 dark:hover:text-white"
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-zinc-200/80 bg-white/95 px-5 pb-5 pt-4 dark:border-zinc-800/80 dark:bg-zinc-950">
          <ThemeSwitcher />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col bg-zinc-50 dark:bg-black">
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800/70 dark:bg-black/85 lg:hidden">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800">
              <BrandMark className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm font-semibold text-zinc-950 dark:text-white">
              Archflow
            </p>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <Link
          href="/inbox"
          className="fixed bottom-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg shadow-zinc-950/20 transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-black/30 dark:hover:bg-white lg:hidden"
          aria-label="Capture in Inbox"
        >
          <Inbox className="h-5 w-5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
