"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  getLocalUniversalSearchResults,
  getUniversalSearchGroupLabel,
  searchUniversalResults,
  UNIVERSAL_SEARCH_GROUPS,
  type UniversalSearchResult,
  type UniversalSearchResultType,
} from "@/lib/universal-search";

function groupResults(
  results: readonly UniversalSearchResult[],
): Record<UniversalSearchResultType, UniversalSearchResult[]> {
  return {
    entity: results.filter((result) => result.type === "entity"),
    activity: results.filter((result) => result.type === "activity"),
    memory: results.filter((result) => result.type === "memory"),
  };
}

function SearchResultCard({ result }: { result: UniversalSearchResult }) {
  const content = (
    <Card
      variant={result.type === "activity" ? "secondary" : "primary"}
      className="p-4 transition hover:bg-zinc-50 hover:ring-1 hover:ring-zinc-300 dark:hover:bg-zinc-900/70 dark:hover:ring-zinc-700 sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{result.badgeLabel}</Badge>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
            {result.groupLabel}
          </span>
          {result.contextLabels?.slice(0, 2).map((label) => (
            <span
              key={label}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
            >
              {label}
            </span>
          ))}
          {result.relatedCount ? (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
              Connected context
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-zinc-950 dark:text-white">
            {result.title}
          </h3>
          {result.subtitle ? (
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {result.subtitle}
            </p>
          ) : null}
          {result.excerpt && result.excerpt !== result.subtitle ? (
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
              {result.excerpt}
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allResults, setAllResults] = useState<UniversalSearchResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAllResults(getLocalUniversalSearchResults());
    setLoaded(true);
  }, []);

  const results = useMemo(
    () => searchUniversalResults(allResults, query),
    [allResults, query],
  );
  const groupedResults = useMemo(() => groupResults(results), [results]);
  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <AppShell>
      <main className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Search
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
              Search tasks, notes, finance, cars, activity, and connected
              context.
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
              placeholder="Search tasks, notes, timeline, context..."
              className="w-full rounded-2xl bg-white py-4 pl-12 pr-4 text-base text-zinc-950 shadow-sm shadow-zinc-950/[0.03] outline-none ring-1 ring-zinc-200/80 transition placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-300 dark:bg-zinc-950 dark:text-white dark:shadow-none dark:ring-zinc-800 dark:focus:ring-zinc-700"
            />
          </div>

          <div className="mt-8">
            {!loaded ? (
              <Card className="text-sm text-zinc-500 dark:text-zinc-400">
                Preparing local search index...
              </Card>
            ) : !hasQuery ? (
              <EmptyState
                title="Search your workspace"
                description="Start typing to find local entities, activity, and connected context."
              />
            ) : !hasResults ? (
              <EmptyState
                title="No results"
                description="Try another keyword or capture something new."
              />
            ) : (
              <div className="space-y-7">
                {UNIVERSAL_SEARCH_GROUPS.map((group) => {
                  const groupItems = groupedResults[group.key];

                  if (groupItems.length === 0) {
                    return null;
                  }

                  return (
                    <Section key={group.key}>
                      <SectionHeader
                        title={getUniversalSearchGroupLabel(group.key)}
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
