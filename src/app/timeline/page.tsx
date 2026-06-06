"use client";

import { useEffect, useState } from "react";
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

export default function TimelinePage() {
  const { loading: authLoading, session } = useAuthSession();
  const { t } = useI18n();
  const accessToken = session?.access_token;
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

        setEvents(createTimelineEventsFromActivities(activities));
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
                    events.length === 1
                      ? t("common.event")
                      : t("common.events")
                  }`}
                />
                <div className="space-y-3">
                  {events.map((event) => (
                    <TimelineEventCard key={event.id} event={event} />
                  ))}
                </div>
              </PageSection>
            )}
          </div>
      </Page>
    </AppShell>
  );
}
