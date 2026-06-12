"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader, PageSection } from "@/components/ui/Page";
import {
  AdminFeedbackApiError,
  fetchAdminFeedbackViaApi,
  updateAdminFeedbackStatusViaApi,
  type AdminFeedbackItem,
} from "@/lib/admin-feedback-api";
import type {
  SupabaseFeedbackStatus,
  SupabaseFeedbackType,
} from "@/lib/supabase";
import type { TranslationKey } from "@/lib/i18n";

type FeedbackFilter = SupabaseFeedbackType | "all";

const feedbackFilters: {
  labelKey: TranslationKey;
  value: FeedbackFilter;
}[] = [
  { value: "all", labelKey: "admin.feedback.all" },
  { value: "bug", labelKey: "admin.feedback.bug" },
  { value: "idea", labelKey: "admin.feedback.idea" },
  { value: "confusing", labelKey: "admin.feedback.confusing" },
  { value: "missing_feature", labelKey: "admin.feedback.missingFeature" },
  { value: "general", labelKey: "admin.feedback.general" },
];

const feedbackStatuses: {
  labelKey: TranslationKey;
  value: SupabaseFeedbackStatus;
}[] = [
  { value: "new", labelKey: "admin.feedback.statusNew" },
  { value: "reviewed", labelKey: "admin.feedback.statusReviewed" },
  { value: "planned", labelKey: "admin.feedback.statusPlanned" },
  { value: "closed", labelKey: "admin.feedback.statusClosed" },
];

const typeLabelKeys: Record<SupabaseFeedbackType, TranslationKey> = {
  bug: "admin.feedback.bug",
  confusing: "admin.feedback.confusing",
  general: "admin.feedback.general",
  idea: "admin.feedback.idea",
  missing_feature: "admin.feedback.missingFeature",
};

const statusLabelKeys: Record<SupabaseFeedbackStatus, TranslationKey> = {
  closed: "admin.feedback.statusClosed",
  new: "admin.feedback.statusNew",
  planned: "admin.feedback.statusPlanned",
  reviewed: "admin.feedback.statusReviewed",
};

const typeBadgeVariants: Record<SupabaseFeedbackType, BadgeVariant> = {
  bug: "danger",
  confusing: "warning",
  general: "default",
  idea: "info",
  missing_feature: "warning",
};

const statusBadgeVariants: Record<SupabaseFeedbackStatus, BadgeVariant> = {
  closed: "success",
  new: "danger",
  planned: "info",
  reviewed: "warning",
};

function formatDate(value: string, locale: "en" | "ua"): string {
  try {
    return new Intl.DateTimeFormat(locale === "ua" ? "uk-UA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function AdminFeedbackPage() {
  const { locale, t } = useI18n();
  const { session } = useAuthSession();
  const accessToken = session?.access_token;
  const [feedback, setFeedback] = useState<AdminFeedbackItem[]>([]);
  const [filter, setFilter] = useState<FeedbackFilter>("all");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFeedback(): Promise<void> {
      if (!accessToken) {
        setLoading(false);
        setForbidden(true);
        return;
      }

      setLoading(true);
      setError(null);
      setForbidden(false);

      try {
        const items = await fetchAdminFeedbackViaApi({ accessToken });

        if (!cancelled) {
          setFeedback(items);
        }
      } catch (fetchError) {
        if (!cancelled) {
          const denied =
            fetchError instanceof AdminFeedbackApiError &&
            (fetchError.status === 401 || fetchError.status === 403);

          setError(t("admin.feedback.loadError"));
          setForbidden(denied);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFeedback();

    return () => {
      cancelled = true;
    };
  }, [accessToken, t]);

  const filteredFeedback = useMemo(() => {
    if (filter === "all") {
      return feedback;
    }

    return feedback.filter((item) => item.type === filter);
  }, [feedback, filter]);
  const newFeedbackCount = useMemo(
    () => feedback.filter((item) => item.status === "new").length,
    [feedback],
  );

  async function updateStatus(
    item: AdminFeedbackItem,
    status: SupabaseFeedbackStatus,
  ): Promise<void> {
    if (!accessToken || item.status === status || updatingId) {
      return;
    }

    setUpdatingId(item.id);
    setError(null);

    try {
      const updated = await updateAdminFeedbackStatusViaApi(item.id, status, {
        accessToken,
      });

      setFeedback((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } catch {
      setError(t("admin.feedback.updateError"));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AppShell>
      <Page>
        <PageHeader
          description={t("admin.feedback.description")}
          icon={MessageSquare}
          title={t("admin.feedback.title")}
          actions={
            <Badge variant={newFeedbackCount > 0 ? "danger" : "success"}>
              {t("admin.feedback.newCount").replace(
                "{count}",
                String(newFeedbackCount),
              )}
            </Badge>
          }
        />

        <PageSection>
          <Card className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {feedbackFilters.map((option) => {
                const active = filter === option.value;

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={active ? "primary" : "secondary"}
                    className="px-3 py-2 text-xs"
                    onClick={() => setFilter(option.value)}
                  >
                    {t(option.labelKey)}
                  </Button>
                );
              })}
            </div>

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {forbidden ? t("admin.feedback.forbidden") : error}
              </p>
            ) : null}

            {loading ? (
              <div className="rounded-xl bg-zinc-100/70 px-4 py-8 text-center text-sm text-zinc-500 dark:bg-zinc-900/55 dark:text-zinc-500">
                {t("common.loading")}...
              </div>
            ) : forbidden ? (
              <div className="rounded-xl bg-zinc-100/70 px-4 py-8 text-center text-sm text-zinc-600 dark:bg-zinc-900/55 dark:text-zinc-400">
                {t("admin.feedback.forbidden")}
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="rounded-xl bg-zinc-100/70 px-4 py-8 text-center text-sm text-zinc-600 dark:bg-zinc-900/55 dark:text-zinc-400">
                {t("admin.feedback.empty")}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
                    <thead>
                      <tr className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                        <th className="px-3 py-3">{t("admin.feedback.date")}</th>
                        <th className="px-3 py-3">{t("common.type")}</th>
                        <th className="px-3 py-3">{t("common.status")}</th>
                        <th className="px-3 py-3">{t("common.user")}</th>
                        <th className="px-3 py-3">
                          {t("admin.feedback.message")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {filteredFeedback.map((item) => (
                        <tr key={item.id} className="align-top">
                          <td className="whitespace-nowrap px-3 py-4 text-xs text-zinc-500 dark:text-zinc-500">
                            {formatDate(item.created_at, locale)}
                          </td>
                          <td className="px-3 py-4">
                            <Badge variant={typeBadgeVariants[item.type]}>
                              {t(typeLabelKeys[item.type])}
                            </Badge>
                          </td>
                          <td className="px-3 py-4">
                            <div className="grid gap-2">
                              <Badge variant={statusBadgeVariants[item.status]}>
                                {t(statusLabelKeys[item.status])}
                              </Badge>
                              <select
                                aria-label={t("common.status")}
                                className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-200/70 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-violet-500/40 dark:focus:ring-violet-500/20"
                                disabled={updatingId === item.id}
                                value={item.status}
                                onChange={(event) =>
                                  void updateStatus(
                                    item,
                                    event.target.value as SupabaseFeedbackStatus,
                                  )
                                }
                              >
                                {feedbackStatuses.map((status) => (
                                  <option key={status.value} value={status.value}>
                                    {t(status.labelKey)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="max-w-[13rem] px-3 py-4 text-xs text-zinc-500 dark:text-zinc-500">
                            <span className="break-all font-mono">
                              {item.user_id}
                            </span>
                          </td>
                          <td className="max-w-xl px-3 py-4 text-sm leading-6 text-zinc-800 dark:text-zinc-200">
                            <p className="whitespace-pre-wrap break-words">
                              {item.message}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 lg:hidden">
                  {filteredFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-zinc-100/70 p-3 ring-1 ring-zinc-200/75 dark:bg-zinc-900/55 dark:ring-zinc-800/75"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={typeBadgeVariants[item.type]}>
                          {t(typeLabelKeys[item.type])}
                        </Badge>
                        <Badge variant={statusBadgeVariants[item.status]}>
                          {t(statusLabelKeys[item.status])}
                        </Badge>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-800 dark:text-zinc-200">
                        {item.message}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                        <span>{formatDate(item.created_at, locale)}</span>
                        <span className="break-all font-mono">{item.user_id}</span>
                      </div>
                      <select
                        aria-label={t("common.status")}
                        className="mt-3 h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-800 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-200/70 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-violet-500/40 dark:focus:ring-violet-500/20"
                        disabled={updatingId === item.id}
                        value={item.status}
                        onChange={(event) =>
                          void updateStatus(
                            item,
                            event.target.value as SupabaseFeedbackStatus,
                          )
                        }
                      >
                        {feedbackStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {t(status.labelKey)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </PageSection>
      </Page>
    </AppShell>
  );
}
