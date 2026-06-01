"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  createUnifiedSearchResults,
  getUnifiedSearchCounts,
  groupUnifiedSearchResults,
  loadUnifiedSearchDataset,
  searchUnifiedResults,
  UNIFIED_SEARCH_GROUPS,
  type UnifiedSearchCounts,
  type UnifiedSearchResult,
} from "@/lib/unified-search";

function SearchResultCard({ result }: { result: UnifiedSearchResult }) {
  const content = (
    <Card
      variant={result.type === "timeline" ? "secondary" : "primary"}
      className="p-4 transition hover:bg-zinc-50 hover:ring-1 hover:ring-zinc-300 dark:hover:bg-zinc-900/70 dark:hover:ring-zinc-700 sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.source}</Badge>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
            {result.createdAt ? result.createdAt.slice(0, 10) : "Local"}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-zinc-950 dark:text-white">
            {result.title}
          </h3>
          {result.description ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {result.description}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );

  if (!result.href) {
    return content;
  }

  return (
    <Link href={result.href} className="block cursor-pointer">
      {content}
    </Link>
  );
}

function SearchGuidance({ counts }: { counts: UnifiedSearchCounts | null }) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="Search your workspace"
        description="Find tasks, notes, inbox captures, and timeline events with local deterministic search."
      />

      {counts ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {UNIFIED_SEARCH_GROUPS.map((group) => (
            <Card key={group.key} variant="secondary" className="p-4">
              <p className="text-2xl font-semibold text-zinc-950 dark:text-white">
                {counts[group.key]}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-500">
                {group.label}
              </p>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function SearchPage() {
  const { session } = useAuthSession();
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState<UnifiedSearchResult[]>([]);
  const [counts, setCounts] = useState<UnifiedSearchCounts | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSearchIndex(): Promise<void> {
      setLoaded(false);

      try {
        const dataset = await loadUnifiedSearchDataset({
          accessToken: session?.access_token,
        });

        if (!active) {
          return;
        }

        setAllResults(createUnifiedSearchResults(dataset));
        setCounts(getUnifiedSearchCounts(dataset));
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void loadSearchIndex();

    return () => {
      active = false;
    };
  }, [session?.access_token]);

  const results = useMemo(
    () => searchUnifiedResults(allResults, query),
    [allResults, query],
  );
  const groupedResults = useMemo(
    () => groupUnifiedSearchResults(results),
    [results],
  );
  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <AppShell>
      <main className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Search
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
              Search tasks, notes, inbox captures, and timeline events.
            </p>
          </div>

          <div className="relative mt-8">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, notes, inbox, timeline..."
              className="w-full rounded-2xl bg-white py-4 pl-12 pr-4 text-base text-zinc-950 shadow-sm shadow-zinc-950/[0.03] outline-none ring-1 ring-zinc-200/80 transition placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-300 dark:bg-zinc-950 dark:text-white dark:shadow-none dark:ring-zinc-800 dark:focus:ring-zinc-700"
            />
          </div>

          <div className="mt-8">
            {!loaded ? (
              <Card className="text-sm text-zinc-500 dark:text-zinc-400">
                Preparing local search index...
              </Card>
            ) : !hasQuery ? (
              <SearchGuidance counts={counts} />
            ) : !hasResults ? (
              <EmptyState
                title="No results found"
                description="Try another keyword or capture something new."
              />
            ) : (
              <div className="space-y-7">
                {UNIFIED_SEARCH_GROUPS.map((group) => {
                  const groupItems = groupedResults[group.key];

                  if (groupItems.length === 0) {
                    return null;
                  }

                  return (
                    <Section key={group.key}>
                      <SectionHeader
                        title={group.label}
                        subtitle={`${groupItems.length} result${
                          groupItems.length === 1 ? "" : "s"
                        }`}
                      />
                      <div className="space-y-2.5">
                        {groupItems.map((result) => (
                          <SearchResultCard key={result.id} result={result} />
                        ))}
                      </div>
                    </Section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
