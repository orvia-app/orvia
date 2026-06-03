"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

type SettingsSectionId =
  | "profile"
  | "integrations"
  | "billing"
  | "data-privacy";

const settingsSections: {
  id: SettingsSectionId;
  title: string;
  status: string;
  description: string;
  detail: string;
}[] = [
  {
    id: "profile",
    title: "Profile",
    status: "Coming in Beta",
    description: "Name, avatar, and personal workspace identity.",
    detail:
      "Profile controls will let you manage account identity and workspace defaults once account settings are fully cloud-backed.",
  },
  {
    id: "integrations",
    title: "Integrations",
    status: "Coming in Beta",
    description: "Calendar, email, and messaging connections.",
    detail:
      "Calendar, email, Telegram, and other integrations are planned for a future release after backend linking and consent controls are ready.",
  },
  {
    id: "billing",
    title: "Billing",
    status: "Future release",
    description: "Plans, invoices, and payment management.",
    detail:
      "Billing will be added when Orvia introduces paid plans. Payment details will be handled by a payment provider, not stored directly by Orvia.",
  },
  {
    id: "data-privacy",
    title: "Data & Privacy",
    status: "In progress",
    description: "Export, local reset, and future account controls.",
    detail:
      "Available now: create a local backup, reset browser-local Orvia data, and keep cloud account data protected by account authentication. Coming later: full cloud account export, account deletion, and retention controls.",
  },
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
  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSectionId>("profile");
  const selectedSettingsSection = settingsSections.find(
    (section) => section.id === activeSettingsSection,
  ) ?? settingsSections[0];

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
  const importButtonLabel = useMemo(() => {
    if (importing) {
      return "Importing...";
    }

    if (!isAuthenticated) {
      return "Sign in to import";
    }

    if (planLoading || authLoading) {
      return "Checking...";
    }

    if (
      importPlan?.status === "ready" &&
      importPlan.taskCount + importPlan.noteCount === 0
    ) {
      return "Nothing to import";
    }

    return "Import local data to cloud";
  }, [authLoading, importPlan, importing, isAuthenticated, planLoading]);

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
                title="Backup & Restore"
                subtitle="Protect your workspace by creating a backup and restoring it later if needed."
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex min-h-[190px] flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Create Backup
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      Export your tasks, notes, and supported local workspace
                      data into a backup file.
                    </p>
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      Supported format: Orvia backup file (.json)
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button
                      className="h-9 w-full px-3 text-sm sm:w-auto"
                      onClick={exportData}
                    >
                      Create backup
                    </Button>
                  </div>
                </div>

                <div className="flex min-h-[190px] flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Restore Backup
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      Import a previously exported Orvia backup. Restore is not
                      available yet.
                    </p>
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      Supported format: Orvia backup file (.json)
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button
                      className="h-9 w-full px-3 text-sm sm:w-auto"
                      disabled
                      variant="secondary"
                    >
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title="Local data reset"
                subtitle="Clear browser-local Orvia data without deleting cloud records."
              />
              <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Reset local data
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      Remove Orvia data stored in this browser only. Cloud
                      tasks, notes, captures, and activity are not deleted.
                    </p>
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-xl border border-red-200/80 bg-white px-3 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 dark:border-red-500/25 dark:bg-zinc-950/40 dark:text-red-300 dark:hover:border-red-500/35 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-500/30 sm:w-auto"
                    onClick={resetData}
                  >
                    Reset local data
                  </button>
                </div>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title="Workspace"
                subtitle="Module organization and workspace customization."
              />
              <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Workspace customization
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  Workspace customization is planned for a future release.
                  Future versions of Orvia will allow enabling, disabling, and
                  organizing workspace modules.
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Onboarding
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
                subtitle="Explicitly import supported local-only tasks and notes into your signed-in cloud account."
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
                        ? "Signed in. Import is manual, does not delete local browser data, and only supports tasks and notes."
                        : "Sign in to import supported local-only tasks and notes to cloud storage."}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
                      Orvia does not auto-import on login. Inbox captures,
                      settings, and Labs data remain local-only for now.
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
                      <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-2.5 text-sm leading-6 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                        <p className="font-medium">Import completed.</p>
                        <p className="mt-0.5">
                          Supported local tasks and notes were copied to your
                          cloud account. Imported {importSummary.importedTasks}{" "}
                          tasks and {importSummary.importedNotes} notes. Skipped{" "}
                          {importSummary.skippedTasks} tasks and{" "}
                          {importSummary.skippedNotes} notes.
                        </p>
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
                    {importButtonLabel}
                  </Button>
                </div>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title="Account settings"
                subtitle="These areas are intentionally staged for beta."
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div className="grid gap-2">
                  {settingsSections.map((section) => {
                    const active = section.id === activeSettingsSection;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSettingsSection(section.id)}
                        className={
                          active
                            ? "rounded-xl bg-violet-50 px-3 py-3 text-left ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:ring-violet-500/25"
                            : "rounded-xl bg-zinc-50/80 px-3 py-3 text-left ring-1 ring-zinc-200/80 transition hover:bg-white hover:ring-violet-200/70 dark:bg-zinc-900/40 dark:ring-zinc-800/80 dark:hover:bg-zinc-900 dark:hover:ring-violet-500/20"
                        }
                      >
                        <span className="block text-sm font-semibold text-zinc-950 dark:text-white">
                          {section.title}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-500">
                          {section.status}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                    {selectedSettingsSection.status}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-zinc-950 dark:text-white">
                    {selectedSettingsSection.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {selectedSettingsSection.description}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
                    {selectedSettingsSection.detail}
                  </p>
                </div>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title="Help & Legal"
                subtitle="Learn how Orvia works and review early beta policies."
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Link
                  href="/help-center"
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm font-medium text-zinc-800 transition hover:bg-white hover:text-violet-800 hover:ring-1 hover:ring-violet-200/70 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
                >
                  Help Center
                </Link>
                <Link
                  href="/legal/privacy"
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm font-medium text-zinc-800 transition hover:bg-white hover:text-violet-800 hover:ring-1 hover:ring-violet-200/70 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/legal/terms"
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm font-medium text-zinc-800 transition hover:bg-white hover:text-violet-800 hover:ring-1 hover:ring-violet-200/70 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
                >
                  Terms of Service
                </Link>
              </div>
            </Card>
          </Section>
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
