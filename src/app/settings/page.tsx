"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  createPersonalOsExport,
  getPersonalOsExportFileName,
  serializePersonalOsExport,
} from "@/lib/data-export/export-data";
import { resetLocalPersonalOsData } from "@/lib/data-export/reset-data";

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
  {
    value: "dark",
    label: "Dark",
    description: "Easier on the eyes at night.",
    icon: Moon,
  },
  {
    value: "light",
    label: "Light",
    description: "Bright interface for daytime.",
    icon: Sun,
  },
  {
    value: "system",
    label: "System",
    description: "Match your OS preference.",
    icon: Monitor,
  },
];

export default function SettingsPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  function exportData() {
    const dataExport = createPersonalOsExport();
    const blob = new Blob([serializePersonalOsExport(dataExport)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = getPersonalOsExportFileName(dataExport);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function resetData() {
    const confirmed = window.confirm(
      "Reset all local Personal OS data on this browser? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    resetLocalPersonalOsData();
    window.location.reload();
  }

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

          <Section className="mt-10">
            <Card>
              <SectionHeader
                title="Appearance"
                subtitle={
                  <>
                    Current selection:{" "}
                    <span className="font-medium text-zinc-950 dark:text-white">
                      {theme === "system"
                        ? `System (${resolvedTheme})`
                        : theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </>
                }
              />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {appearanceOptions.map(
                  ({ value, label, description, icon: Icon }) => {
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
                  },
                )}
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title="Data Management"
                subtitle="Export or reset the data stored locally in this browser."
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                    Export data
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    Download a JSON snapshot of local tasks, notes, finance,
                    cars, captures, and theme preference.
                  </p>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    onClick={exportData}
                  >
                    Export JSON
                  </Button>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                    Reset local data
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-red-800/80 dark:text-red-200/80">
                    Clear only Personal OS local data from this browser. Other
                    browser storage is left untouched.
                  </p>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    onClick={resetData}
                    variant="danger"
                  >
                    Reset local data
                  </Button>
                </div>
              </div>
            </Card>
          </Section>

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
