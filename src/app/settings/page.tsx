"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Monitor, Moon, Sun } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
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
import { FEEDBACK_URL, isFeedbackUrlConfigured } from "@/lib/feedback";
import { resetOnboarding } from "@/lib/onboarding";
import type { TranslationKey } from "@/lib/i18n";

type SettingsSectionId =
  | "profile"
  | "integrations"
  | "billing"
  | "data-privacy";

const settingsSections: {
  descriptionKey: TranslationKey;
  detailKey: TranslationKey;
  id: SettingsSectionId;
  statusKey: TranslationKey;
  titleKey: TranslationKey;
}[] = [
  {
    id: "profile",
    titleKey: "settings.profile",
    statusKey: "settings.profileStatus",
    descriptionKey: "settings.profileDescription",
    detailKey: "settings.profileDetail",
  },
  {
    id: "integrations",
    titleKey: "settings.integrations",
    statusKey: "settings.integrationsStatus",
    descriptionKey: "settings.integrationsDescription",
    detailKey: "settings.integrationsDetail",
  },
  {
    id: "billing",
    titleKey: "settings.billing",
    statusKey: "settings.billingStatus",
    descriptionKey: "settings.billingDescription",
    detailKey: "settings.billingDetail",
  },
  {
    id: "data-privacy",
    titleKey: "settings.dataPrivacy",
    statusKey: "settings.dataPrivacyStatus",
    descriptionKey: "settings.dataPrivacyDescription",
    detailKey: "settings.dataPrivacyDetail",
  },
];

const appearanceOptions: {
  value: Theme;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: typeof Moon;
}[] = [
  {
    value: "dark",
    labelKey: "nav.dark",
    descriptionKey: "settings.darkDescription",
    icon: Moon,
  },
  {
    value: "light",
    labelKey: "nav.light",
    descriptionKey: "settings.lightDescription",
    icon: Sun,
  },
  {
    value: "system",
    labelKey: "nav.systemTheme",
    descriptionKey: "settings.systemDescription",
    icon: Monitor,
  },
];

const feedbackActions: TranslationKey[] = [
  "settings.sendFeedback",
  "settings.reportBug",
  "settings.suggestIdea",
];

export default function SettingsPage() {
  const { locale, setLocale, t } = useI18n();
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
  const feedbackConfigured = isFeedbackUrlConfigured();

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
      return t("common.importing");
    }

    if (!isAuthenticated) {
      return t("settings.signInToImport");
    }

    if (planLoading || authLoading) {
      return t("common.checking");
    }

    if (
      importPlan?.status === "ready" &&
      importPlan.taskCount + importPlan.noteCount === 0
    ) {
      return t("settings.nothingToImport");
    }

    return t("settings.importLocalData");
  }, [authLoading, importPlan, importing, isAuthenticated, planLoading, t]);

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
            {t("settings.title")}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
            {t("settings.subtitle")}
          </p>

          <Section className="mt-10">
            <Card>
              <SectionHeader
                title={t("settings.appearance")}
                subtitle={
                  <>
                    {t("settings.currentSelection")}{" "}
                    <span className="font-medium text-zinc-950 dark:text-white">
                      {!hydrated
                        ? t("common.loading")
                        : theme === "system"
                        ? `${t("nav.systemTheme")} (${t(
                            resolvedTheme === "dark" ? "nav.dark" : "nav.light",
                          )})`
                        : t(theme === "dark" ? "nav.dark" : "nav.light")}
                    </span>
                  </>
                }
              />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {appearanceOptions.map(
                  ({ value, labelKey, descriptionKey, icon: Icon }) => {
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
                        <span className="text-sm font-semibold">
                          {t(labelKey)}
                        </span>
                        <span
                          className={
                            active
                              ? "text-xs text-zinc-300 dark:text-zinc-600"
                              : "text-xs text-zinc-600 dark:text-zinc-400"
                          }
                        >
                          {t(descriptionKey)}
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
                title={t("settings.language")}
                subtitle={t("settings.languageSubtitle")}
              />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  {
                    description: t("settings.englishDescription"),
                    label: t("settings.english"),
                    value: "en" as const,
                  },
                  {
                    description: t("settings.ukrainianDescription"),
                    label: t("settings.ukrainian"),
                    value: "ua" as const,
                  },
                ].map((option) => {
                  const active = locale === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLocale(option.value)}
                      className={
                        active
                          ? "rounded-xl border border-violet-200/80 bg-violet-50 p-4 text-left text-violet-950 ring-1 ring-violet-200/60 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100 dark:ring-violet-500/15"
                          : "rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-violet-200 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-violet-500/25 dark:hover:bg-zinc-900"
                      }
                    >
                      <span className="text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-500">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title={t("settings.backupRestore")}
                subtitle={t("settings.backupRestoreDescription")}
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex min-h-[190px] flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      {t("settings.createBackup")}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {t("settings.createBackupDescription")}
                    </p>
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      {t("settings.supportedBackup")}
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button
                      className="h-9 w-full px-3 text-sm sm:w-auto"
                      onClick={exportData}
                    >
                      {t("settings.createBackupButton")}
                    </Button>
                  </div>
                </div>

                <div className="flex min-h-[190px] flex-col rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      {t("settings.restoreBackup")}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {t("settings.restoreBackupDescription")}
                    </p>
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      {t("settings.supportedBackup")}
                    </p>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button
                      className="h-9 w-full px-3 text-sm sm:w-auto"
                      disabled
                      variant="secondary"
                    >
                      {t("common.comingSoon")}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title={t("settings.localDataReset")}
                subtitle={t("settings.localDataResetDescription")}
              />
              <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      {t("settings.resetLocalData")}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {t("settings.resetLocalDataBody")}
                    </p>
                    <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      {t("settings.cannotBeUndone")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-xl border border-red-200/80 bg-white px-3 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70 dark:border-red-500/25 dark:bg-zinc-950/40 dark:text-red-300 dark:hover:border-red-500/35 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-500/30 sm:w-auto"
                    onClick={resetData}
                  >
                    {t("settings.resetLocalData")}
                  </button>
                </div>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title={t("settings.workspace")}
                subtitle={t("settings.workspaceDescription")}
              />
              <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {t("settings.workspaceCustomization")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {t("settings.workspaceCustomizationDescription")}
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {t("settings.onboarding")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {t("settings.onboardingDescription")}
                </p>
                <Button
                  className="mt-4 w-full sm:w-auto"
                  onClick={resetOnboardingState}
                  variant="secondary"
                >
                  {t("settings.resetOnboarding")}
                </Button>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title={t("settings.localDataSync")}
                subtitle={t("settings.localDataSyncDescription")}
              />
              <div className="mt-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                      {t("settings.oneTimeImport")}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {authLoading
                        ? t("settings.checkingSignIn")
                        : isAuthenticated
                        ? t("settings.importSignedIn")
                        : t("settings.importSignedOut")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
                      {t("settings.noAutoImport")}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
                      <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:ring-zinc-800">
                        <span className="block text-xs text-zinc-500 dark:text-zinc-500">
                          {t("settings.taskCandidates")}
                        </span>
                        <span className="font-semibold">
                          {planLoading || !importPlan
                            ? t("common.loading")
                            : importPlan.taskCount}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:ring-zinc-800">
                        <span className="block text-xs text-zinc-500 dark:text-zinc-500">
                          {t("settings.noteCandidates")}
                        </span>
                        <span className="font-semibold">
                          {planLoading || !importPlan
                            ? t("common.loading")
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
                        <p className="font-medium">
                          {t("settings.importCompleted")}
                        </p>
                        <p className="mt-0.5">
                          {t("settings.importCompletedBody")}{" "}
                          {t("settings.importedTasksNotes")
                            .replace(
                              "{tasks}",
                              String(importSummary.importedTasks),
                            )
                            .replace(
                              "{notes}",
                              String(importSummary.importedNotes),
                            )
                            .replace(
                              "{skippedTasks}",
                              String(importSummary.skippedTasks),
                            )
                            .replace(
                              "{skippedNotes}",
                              String(importSummary.skippedNotes),
                            )}
                        </p>
                        {importSummary.errors.length > 0 ? (
                          <p className="mt-1 text-red-700 dark:text-red-300">
                            {t("settings.importErrors").replace(
                              "{count}",
                              String(importSummary.errors.length),
                            )}
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
                title={t("settings.accountSettings")}
                subtitle={t("settings.accountSettingsDescription")}
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
                          {t(section.titleKey)}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-500">
                          {t(section.statusKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                    {t(selectedSettingsSection.statusKey)}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-zinc-950 dark:text-white">
                    {t(selectedSettingsSection.titleKey)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {t(selectedSettingsSection.descriptionKey)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
                    {t(selectedSettingsSection.detailKey)}
                  </p>
                </div>
              </div>
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title={t("settings.feedbackTitle")}
                subtitle={t("settings.feedbackDescription")}
              />
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {feedbackActions.map((labelKey) =>
                  feedbackConfigured ? (
                    <a
                      key={labelKey}
                      href={FEEDBACK_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 transition hover:bg-violet-50/70 hover:text-violet-800 hover:ring-violet-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-zinc-950/60 dark:text-zinc-200 dark:shadow-none dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/20 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
                    >
                      {t(labelKey)}
                    </a>
                  ) : (
                    <button
                      key={labelKey}
                      type="button"
                      disabled
                      className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-zinc-50 px-4 text-sm font-medium text-zinc-400 ring-1 ring-zinc-200/80 dark:bg-zinc-900/50 dark:text-zinc-600 dark:ring-zinc-800/80"
                    >
                      {t(labelKey)}
                    </button>
                  ),
                )}
              </div>
              {!feedbackConfigured ? (
                <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
                  {t("settings.feedbackUnavailable")}
                </p>
              ) : null}
            </Card>
          </Section>

          <Section className="mt-8">
            <Card>
              <SectionHeader
                title={t("settings.helpLegal")}
                subtitle={t("settings.helpLegalDescription")}
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Link
                  href="/help-center"
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm font-medium text-zinc-800 transition hover:bg-white hover:text-violet-800 hover:ring-1 hover:ring-violet-200/70 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
                >
                  {t("settings.helpCenter")}
                </Link>
                <Link
                  href="/legal/privacy"
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm font-medium text-zinc-800 transition hover:bg-white hover:text-violet-800 hover:ring-1 hover:ring-violet-200/70 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
                >
                  {t("settings.privacyPolicy")}
                </Link>
                <Link
                  href="/legal/terms"
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm font-medium text-zinc-800 transition hover:bg-white hover:text-violet-800 hover:ring-1 hover:ring-violet-200/70 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
                >
                  {t("settings.termsService")}
                </Link>
              </div>
            </Card>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("settings.resetLocalData")}
        confirming={resettingLocalData}
        description={t("settings.resetDialogDescription")}
        onCancel={() => {
          if (!resettingLocalData) {
            setResetDialogOpen(false);
          }
        }}
        onConfirm={confirmResetData}
        open={resetDialogOpen}
        title={t("settings.resetDialogTitle")}
        tone="danger"
      />

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("settings.resetOnboarding")}
        confirming={resettingOnboarding}
        description={t("settings.resetOnboardingDialogDescription")}
        onCancel={() => {
          if (!resettingOnboarding) {
            setOnboardingDialogOpen(false);
          }
        }}
        onConfirm={confirmResetOnboarding}
        open={onboardingDialogOpen}
        title={t("settings.resetOnboardingDialogTitle")}
        tone="default"
      />
    </AppShell>
  );
}
