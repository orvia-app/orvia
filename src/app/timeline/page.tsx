"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Page,
  PageHeader,
  PageSection,
  PageSectionHeader,
} from "@/components/ui/Page";
import { TimelineEventCard } from "@/components/timeline/TimelineEventCard";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { fetchActivitiesViaApi } from "@/lib/activities-api";
import {
  createTimelineEventsFromActivities,
  type TimelineEvent,
} from "@/lib/timeline";
import type { Locale, TranslationKey } from "@/lib/i18n";

type TimelineGroupKey = "today" | "yesterday" | "earlier";

type TimelineGroup = {
  key: TimelineGroupKey;
  titleKey: TranslationKey;
  events: TimelineEvent[];
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getTimelineGroupKey(timestamp: string, now = new Date()): TimelineGroupKey {
  const eventDate = new Date(timestamp);

  if (Number.isNaN(eventDate.getTime())) {
    return "earlier";
  }

  const todayStart = startOfLocalDay(now);
  const eventStart = startOfLocalDay(eventDate);
  const dayDifference = Math.floor(
    (todayStart.getTime() - eventStart.getTime()) / 86_400_000,
  );

  if (dayDifference === 0) {
    return "today";
  }

  if (dayDifference === 1) {
    return "yesterday";
  }

  return "earlier";
}

function createTimelineGroups(events: readonly TimelineEvent[]): TimelineGroup[] {
  const groups: Record<TimelineGroupKey, TimelineEvent[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const event of events) {
    groups[getTimelineGroupKey(event.timestamp)].push(event);
  }

  const orderedGroups: TimelineGroup[] = [
    {
      key: "today",
      titleKey: "timeline.groupToday",
      events: groups.today,
    },
    {
      key: "yesterday",
      titleKey: "timeline.groupYesterday",
      events: groups.yesterday,
    },
    {
      key: "earlier",
      titleKey: "timeline.groupEarlier",
      events: groups.earlier,
    },
  ];

  return orderedGroups.filter((group) => group.events.length > 0);
}

function formatTimelineTimestamp(
  timestamp: string,
  locale: Locale,
  groupKey: TimelineGroupKey,
): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localeCode = locale === "ua" ? "uk-UA" : "en-US";

  if (groupKey === "today" || groupKey === "yesterday") {
    return new Intl.DateTimeFormat(localeCode, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(localeCode, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

export default function TimelinePage() {
  const { loading: authLoading, session } = useAuthSession();
  const { locale, t } = useI18n();
  const accessToken = session?.access_token;
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const timelineGroups = useMemo(() => createTimelineGroups(events), [events]);

  useEffect(() => {
    let cancelled = false;

    async function loadTimelineEvents(): Promise<void> {
      if (!accessToken) {
        setEvents([]);
        setLoadError(null);
        setLoaded(true);
        return;
      }

      try {
        const activities = await fetchActivitiesViaApi({ accessToken });

        if (cancelled) {
          return;
        }

        setEvents(createTimelineEventsFromActivities(activities, t));
        setLoadError(null);
      } catch {
        if (cancelled) {
          return;
        }

        setEvents([]);
        setLoadError(t("timeline.loadError"));
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    setLoaded(false);

    if (authLoading) {
      return () => {
        cancelled = true;
      };
    }

    void loadTimelineEvents();

    return () => {
      cancelled = true;
    };
  }, [accessToken, authLoading, t]);

  return (
    <AppShell>
      <Page>
        <PageHeader
          title={t("timeline.title")}
          description={t("timeline.description")}
        />

        <div className="mt-7">
          {!loaded ? (
            <PageSection className="mt-0">
              <PageSectionHeader
                title={t("timeline.activity")}
                description={t("timeline.loadingDescription")}
              />
            </PageSection>
          ) : !accessToken ? (
            <EmptyState
              title={t("timeline.signInTitle")}
              description={t("timeline.signInDescription")}
            />
          ) : loadError ? (
            <EmptyState
              title={t("timeline.loadErrorTitle")}
              description={loadError}
            />
          ) : events.length === 0 ? (
            <EmptyState
              title={t("timeline.emptyTitle")}
              description={t("timeline.emptyDescription")}
            />
          ) : (
            <PageSection className="mt-0">
              <PageSectionHeader
                title={t("timeline.activity")}
                description={`${events.length} ${
                  events.length === 1 ? t("common.event") : t("common.events")
                }`}
              />
              <div className="space-y-7">
                {timelineGroups.map((group) => (
                  <section key={group.key} aria-labelledby={`timeline-${group.key}`}>
                    <h2
                      id={`timeline-${group.key}`}
                      className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-500"
                    >
                      {t(group.titleKey)}
                    </h2>
                    <div className="space-y-3">
                      {group.events.map((event) => (
                        <TimelineEventCard
                          key={event.id}
                          event={event}
                          timestampLabel={formatTimelineTimestamp(
                            event.timestamp,
                            locale,
                            group.key,
                          )}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </PageSection>
          )}
        </div>
      </Page>
    </AppShell>
  );
}
