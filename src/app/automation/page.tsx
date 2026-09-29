"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { AppShell } from "@/components/AppShell";

const automations = [
  { title: "automation.telegram", description: "automation.telegramDescription" },
  { title: "automation.scheduled", description: "automation.scheduledDescription" },
  { title: "automation.reminders", description: "automation.remindersDescription" },
] as const;

export default function AutomationPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <div className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("nav.automation")}
          </h1>
          <p className="mt-2 text-sm text-muted sm:text-base">
            {t("automation.description")}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {automations.map((item) => (
              <div
                key={t(item.title)}
                className="flex flex-col rounded-xl bg-surface p-6 ring-1 ring-line dark:shadow-none"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  {t(item.title)}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted">
                  {t(item.description)}
                </p>
                <span className="mt-6 inline-flex w-fit rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-muted dark:bg-zinc-800">
                  {t("common.comingSoon")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
