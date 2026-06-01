"use client";

import { useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  createPersonalOsExport,
  getPersonalOsExportFileName,
  serializePersonalOsExport,
} from "@/lib/data-export/export-data";
import { resetLocalPersonalOsData } from "@/lib/data-export/reset-data";
import {
  buildLocalCloudImportPlan,
  importLocalItemsToCloud,
  type LocalCloudImportPlan,
  type LocalCloudImportSummary,
} from "@/lib/local-cloud-sync";
import { resetOnboarding } from "@/lib/onboarding";

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
  const { hydrated, theme, resolvedTheme, setTheme } = useTheme();
  const { isAuthenticated, loading: authLoading, session } = useAuthSession();
  const accessToken = session?.access_token;
  const [importPlan, setImportPlan] = useState<LocalCloudImportPlan | null>(
    null,
  );
  const [planLoading, setPlanLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] =
    useState<LocalCloudImportSummary | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resettingLocalData, setResettingLocalData] = useState(false);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const importDisabled = useMemo(() => {
    if (authLoading || planLoading || importing || !isAuthenticated) {
      return true;
    }

    return (
      !importPlan ||
      importPlan.status !== "ready" ||
      importPlan.taskCount + importPlan.noteCount === 0
    );
  }, [authLoading, importing, importPlan, isAuthenticated, planLoading]);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      return () => {
        cancelled = true;
      };
    }

    setPlanLoading(true);
    setImportSummary(null);

    void buildLocalCloudImportPlan({ accessToken }).then((plan) => {
      if (cancelled) {
        return;
      }

      setImportPlan(plan);
      setPlanLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading]);

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
    setResetDialogOpen(true);
  }

  function confirmResetData() {
    setResettingLocalData(true);
    resetLocalPersonalOsData();
    window.location.reload();
  }

  function resetOnboardingState() {
    setOnboardingDialogOpen(true);
  }

  function confirmResetOnboarding() {
    setResettingOnboarding(true);
    resetOnboarding();
    window.location.href = "/";
  }

  async function importLocalDataToCloud() {
    if (!accessToken) {
      return;
    }

    setImporting(true);
    setImportSummary(null);

    const summary = await importLocalItemsToCloud({ accessToken });
    const nextPlan = await buildLocalCloudImportPlan({ accessToken });

    setImportSummary(summary);
    setImportPlan(nextPlan);
    setImporting(false);
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
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
                      {!hydrated
                        ? "Loading"
                        : theme === "system"
                        ? `System (${resolvedTheme})`
                        : theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </span>
                  </>
                }
              />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {appearanceOptions.map(
                  ({ value, label, description, icon: Icon }) => {
                    const active = hydrated && theme === value;

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
                    Clear only Orvia local data from this browser. Other
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

              <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Reset onboarding
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Show the Dashboard onboarding panel again for this browser.
                </p>
                <Button
                  className="mt-4 w-full sm:w-auto"
                  onClick={resetOnboardingState}
                  variant="secondary"
                >
                  Reset onboarding
                </Button>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title="Local data sync"
                subtitle="Import local-only tasks and notes into your signed-in cloud account."
              />
              <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      One-time local import
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {authLoading
                        ? "Checking sign-in status..."
                        : isAuthenticated
                        ? "Signed in. Local items can be imported without deleting browser data."
                        : "Sign in to import local-only tasks and notes to cloud storage."}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
                      <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:ring-zinc-800">
                        <span className="block text-xs text-zinc-500 dark:text-zinc-500">
                          Task candidates
                        </span>
                        <span className="font-semibold">
                          {planLoading || !importPlan
                            ? "Loading"
                            : importPlan.taskCount}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:ring-zinc-800">
                        <span className="block text-xs text-zinc-500 dark:text-zinc-500">
                          Note candidates
                        </span>
                        <span className="font-semibold">
                          {planLoading || !importPlan
                            ? "Loading"
                            : importPlan.noteCount}
                        </span>
                      </div>
                    </div>
                    {importPlan?.status === "error" ? (
                      <p className="mt-3 text-sm text-red-700 dark:text-red-300">
                        {importPlan.error}
                      </p>
                    ) : null}
                    {importSummary ? (
                      <div className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        Imported {importSummary.importedTasks} tasks and{" "}
                        {importSummary.importedNotes} notes. Skipped{" "}
                        {importSummary.skippedTasks} tasks and{" "}
                        {importSummary.skippedNotes} notes.
                        {importSummary.errors.length > 0 ? (
                          <p className="mt-1 text-red-700 dark:text-red-300">
                            {importSummary.errors.length} item
                            {importSummary.errors.length === 1 ? "" : "s"} could
                            not be imported.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    className="w-full shrink-0 sm:w-auto"
                    disabled={importDisabled}
                    onClick={importLocalDataToCloud}
                  >
                    {importing ? "Importing..." : "Import local data to cloud"}
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

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Reset local data"
        confirming={resettingLocalData}
        description="This clears Orvia data stored in this browser only. Cloud data remains safe. Local-only unsynced data will be lost."
        onCancel={() => {
          if (!resettingLocalData) {
            setResetDialogOpen(false);
          }
        }}
        onConfirm={confirmResetData}
        open={resetDialogOpen}
        title="Reset local browser data?"
        tone="danger"
      />

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Reset onboarding"
        confirming={resettingOnboarding}
        description="This shows the Dashboard onboarding panel again on this browser. Your tasks, notes, and cloud data are not changed."
        onCancel={() => {
          if (!resettingOnboarding) {
            setOnboardingDialogOpen(false);
          }
        }}
        onConfirm={confirmResetOnboarding}
        open={onboardingDialogOpen}
        title="Show onboarding again?"
        tone="default"
      />
    </AppShell>
  );
}
