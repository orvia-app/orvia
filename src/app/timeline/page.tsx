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
import { fetchActivitiesViaApi } from "@/lib/activities-api";
import {
  createTimelineEventsFromActivities,
  type TimelineEvent,
} from "@/lib/timeline";

export default function TimelinePage() {
  const { loading: authLoading, session } = useAuthSession();
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
        setLoadError("Could not load your activity timeline.");
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
  }, [accessToken, authLoading]);

  return (
    <AppShell>
      <Page>
        <PageHeader
          title="Timeline"
          description="Activity history of tasks, notes, captures, and imports."
        />

          <div className="mt-7">
            {!loaded ? (
              <PageSection className="mt-0">
                <PageSectionHeader
                  title="Activity"
                  description="Loading your activity timeline."
                />
              </PageSection>
            ) : !accessToken ? (
              <EmptyState
                title="Timeline is available after sign in"
                description="Sign in to view your recorded task, note, and import activity."
              />
            ) : loadError ? (
              <EmptyState
                title="Timeline could not load"
                description={loadError}
              />
            ) : events.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Create tasks, notes, or captures to start building your timeline."
              />
            ) : (
              <PageSection className="mt-0">
                <PageSectionHeader
                  title="Activity"
                  description={`${events.length} event${
                    events.length === 1 ? "" : "s"
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
