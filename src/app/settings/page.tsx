"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useTheme, type Theme } from "@/components/ThemeProvider";

const sections = [
  { title: "Profile", description: "Name, avatar, and preferences." },
  {
    title: "Integrations",
    description: "Connect calendars, messengers, and APIs.",
  },
  { title: "Billing", description: "Plans and payment methods." },
  { title: "Data & Privacy", description: "Export, retention, and security." },
];

const appearanceOptions: {
  value: Theme;
  label: string;
  description: string;
  icon: typeof Moon;
}[] = [
  { value: "dark", label: "Dark", description: "Easier on the eyes at night.", icon: Moon },
  { value: "light", label: "Light", description: "Bright interface for daytime.", icon: Sun },
  { value: "system", label: "System", description: "Match your OS preference.", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
            Manage your account and workspace defaults.
          </p>

          <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Current selection:{" "}
              <span className="font-medium text-zinc-950 dark:text-white">
                {theme === "system"
                  ? `System (${resolvedTheme})`
                  : theme.charAt(0).toUpperCase() + theme.slice(1)}
              </span>
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {appearanceOptions.map(({ value, label, description, icon: Icon }) => {
                const active = theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={
                      active
                        ? "flex flex-1 flex-col items-start gap-2 rounded-xl border border-zinc-900 bg-zinc-900 p-4 text-left text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 sm:min-w-[140px]"
                        : "flex flex-1 flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 sm:min-w-[140px]"
                    }
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                    <span className="text-sm font-semibold">{label}</span>
                    <span
                      className={
                        active
                          ? "text-xs text-zinc-300 dark:text-zinc-600"
                          : "text-xs text-zinc-600 dark:text-zinc-400"
                      }
                    >
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <ul className="mt-8 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {sections.map((section) => (
              <li key={section.title} className="px-5 py-5 sm:px-6">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {section.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
