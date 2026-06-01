"use client";

import { useEffect, useState } from "react";
import { CircleDot } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
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
      <main className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-800 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none">
              <CircleDot className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Timeline
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                Activity feed from your recorded task, note, and import events.
              </p>
            </div>
          </div>

          <div className="mt-10">
            {!loaded ? (
              <Section>
                <SectionHeader
                  title="Activity"
                  subtitle="Loading your activity timeline."
                />
              </Section>
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
                title="Your activity timeline is empty."
                description="Create, update, or delete tasks and notes to add activity here."
              />
            ) : (
              <Section>
                <SectionHeader
                  title="Activity"
                  subtitle={`${events.length} event${
                    events.length === 1 ? "" : "s"
                  }`}
                />
                <div className="space-y-3">
                  {events.map((event) => (
                    <TimelineEventCard key={event.id} event={event} />
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
