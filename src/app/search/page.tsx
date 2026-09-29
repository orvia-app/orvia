"use client";
import { Input } from "@/components/ui/Field";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, CheckSquare, FileText, Inbox, Clock3 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Page,
  PageHeader,
  PageSection,
  PageSectionHeader,
} from "@/components/ui/Page";
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
import type { TranslationKey } from "@/lib/i18n";

function groupLabelKey(groupKey: UnifiedSearchResult["type"]): TranslationKey {
  switch (groupKey) {
    case "task":
      return "search.groupTasks";
    case "note":
      return "search.groupNotes";
    case "inbox":
      return "search.groupInbox";
    case "timeline":
      return "search.groupTimeline";
  }
}

function sourceLabelKey(source: string): TranslationKey {
  switch (source) {
    case "Cloud task":
      return "search.sourceCloudTask";
    case "Local fallback task":
      return "search.sourceLocalFallbackTask";
    case "Local task":
      return "search.sourceLocalTask";
    case "Cloud note":
      return "search.sourceCloudNote";
    case "Local fallback note":
      return "search.sourceLocalFallbackNote";
    case "Local note":
      return "search.sourceLocalNote";
    case "Cloud inbox":
      return "search.sourceCloudInbox";
    case "Local fallback":
      return "search.sourceLocalFallback";
    case "Local inbox":
      return "search.sourceLocalInbox";
    case "Activity":
      return "search.sourceActivity";
    default:
      return "search.sourceActivity";
  }
}

function SearchResultCard({
  result,
  t,
}: {
  result: UnifiedSearchResult;
  t: (key: TranslationKey) => string;
}) {
  const Icon = { task: CheckSquare, note: FileText, inbox: Inbox, timeline: Clock3 }[result.type];
  const content = (
    <Card
      variant="row"
      className={`orvia-item px-3 py-4 ${result.href ? "orvia-interactive" : ""}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-1 rounded-lg bg-subtle p-2 text-muted"><Icon className="h-4 w-4" aria-hidden /></span>
        <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted">{t(sourceLabelKey(result.source))}</span>
          <span className="text-xs font-medium text-muted">
            {result.createdAt ? result.createdAt.slice(0, 10) : t("search.local")}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="[overflow-wrap:anywhere] text-[15px] font-semibold text-foreground">
            {result.title}
          </h3>
          {result.description ? (
            <p className="mt-1 [overflow-wrap:anywhere] text-sm leading-6 text-muted">
              {result.description}
            </p>
          ) : null}
        </div>
        </div>
        {result.href && <ArrowUpRight className="mt-2 h-4 w-4 shrink-0 text-muted" aria-hidden />}
      </div>
    </Card>
  );

  if (!result.href) {
    return content;
  }

  return (
    <Link href={result.href} className="block rounded-lg focus-visible:outline-offset-2">
      {content}
    </Link>
  );
}

function SearchGuidance({
  counts,
  t,
}: {
  counts: UnifiedSearchCounts | null;
  t: (key: TranslationKey) => string;
}) {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={Search}
        title={t("search.guidanceTitle")}
        description={t("search.guidanceDescription")}
      />

      {counts ? (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {UNIFIED_SEARCH_GROUPS.map((group) => (
            <Card key={group.key} variant="ghost" className="flex items-baseline gap-2 p-0">
              <p className="text-base font-semibold text-foreground">
                {counts[group.key]}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">
                {t(groupLabelKey(group.key))}
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
  const { t } = useI18n();
  const accessToken = session?.access_token;
  const ownerId = session?.user.id;
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
          accessToken,
          ownerId,
          translateTimeline: t,
        });

        if (!active) {
          return;
        }

        setAllResults(createUnifiedSearchResults(dataset, t));
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
  }, [accessToken, ownerId, t]);

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
      <Page>
        <PageHeader
          title={t("search.title")}
          description={t("search.description")}
        />

          <Card
            variant="ghost"
            className="mt-5 p-3 text-sm text-muted"
          >
            {accessToken
              ? t("search.accountMessage")
              : t("search.deviceMessage")}
          </Card>

          <div className="relative mt-7">
            <Search
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-violet-600 dark:text-violet-300"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("common.search")}
              className="orvia-search-field w-full pl-12"
            />
          </div>

          <div className="mt-7">
            {!loaded ? (
              <Card variant="ghost" role="status" className="orvia-item flex items-center gap-3 text-sm text-muted">
                <Search className="h-4 w-4 animate-pulse" aria-hidden />
                {t("search.preparing")}
              </Card>
            ) : !hasQuery ? (
              <SearchGuidance counts={counts} t={t} />
            ) : !hasResults ? (
              <EmptyState
                icon={Search}
                title={t("search.noResults")}
                description={t("search.noResultsDescription")}
              />
            ) : (
              <div className="space-y-7">
                {UNIFIED_SEARCH_GROUPS.map((group) => {
                  const groupItems = groupedResults[group.key];

                  if (groupItems.length === 0) {
                    return null;
                  }

                  return (
                    <PageSection key={group.key} className="mt-0">
                      <PageSectionHeader
                        title={t(groupLabelKey(group.key))}
                        description={t("common.resultCount").replace("{count}", String(groupItems.length))}
                      />
                      <div className="space-y-2.5">
                        {groupItems.map((result) => (
                          <SearchResultCard
                            key={result.id}
                            result={result}
                            t={t}
                          />
                        ))}
                      </div>
                    </PageSection>
                  );
                })}
              </div>
            )}
          </div>
      </Page>
    </AppShell>
  );
}
