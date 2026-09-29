"use client";

import { useEffect, useState } from "react";
import { ChartNoAxesColumn } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader, PageSection, PageSectionHeader } from "@/components/ui/Page";
import { AdminAnalyticsApiError, fetchAdminAnalytics } from "@/lib/admin-analytics-api";
import { analyticsConversionNames, betaAnalyticsEventNames, conversionPercent, type AnalyticsReport } from "@/lib/analytics-contract";

export default function AdminAnalyticsPage() {
  const { t, locale } = useI18n();
  const { session } = useAuthSession();
  const accessToken = session?.access_token;
  const userId = session?.user.id;
  const [days, setDays] = useState<7 | 30>(7);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ userId: string; days: number; report: AnalyticsReport } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  // Never render an earlier account's report while a new authorization is pending.
  const report = result && result.userId === userId && result.days === days ? result.report : null;
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let cancelled = false;
    setResult(null);
    setState(accessToken ? "loading" : "denied");
    if (accessToken && userId) {
      void fetchAdminAnalytics(accessToken, days, controller.signal).then((nextReport) => {
        if (!cancelled) { setResult({ userId, days, report: nextReport }); setState("ready"); }
      }).catch((error: unknown) => {
        if (!cancelled) setState(error instanceof AdminAnalyticsApiError && (error.status === 401 || error.status === 403) ? "denied" : "error");
      }).finally(() => clearTimeout(timeout));
    }
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [accessToken, userId, days, revision]);
  const max = report ? Math.max(1, ...Object.values(report.counts)) : 1;
  const number = new Intl.NumberFormat(locale === "ua" ? "uk-UA" : "en-US");
  return (
    <AppShell><Page>
      <PageHeader title={t("admin.analytics.title")} description={t("admin.analytics.description")} icon={ChartNoAxesColumn} actions={
        <><Button type="button" variant={days === 7 ? "primary" : "secondary"} aria-pressed={days === 7} onClick={() => setDays(7)}>{t("admin.analytics.days7")}</Button>
          <Button type="button" variant={days === 30 ? "primary" : "secondary"} aria-pressed={days === 30} onClick={() => setDays(30)}>{t("admin.analytics.days30")}</Button>
          <Button type="button" variant="secondary" onClick={() => setRevision((value) => value + 1)}>{t("admin.analytics.refresh")}</Button></>
      } />
      {!report && <Card className="mt-6" role="status">{t(state === "denied" ? "admin.analytics.denied" : state === "error" ? "admin.analytics.error" : "admin.analytics.loading")}</Card>}
      {report && <>
        {Object.values(report.counts).every((count) => count === 0) && <Card className="mt-6" role="status">{t("admin.analytics.empty")}</Card>}
        <PageSection><PageSectionHeader title={t("admin.analytics.funnel")} description={t("admin.analytics.countNote")} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {betaAnalyticsEventNames.map((name) => <Card key={name}>
              <p className="text-sm text-muted">{t(`admin.analytics.${name}`)}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{number.format(report.counts[name])}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded bg-subtle" aria-hidden="true"><div className="h-full rounded bg-accent" style={{ width: `${report.counts[name] / max * 100}%` }} /></div>
            </Card>)}
          </div>
        </PageSection>
        <PageSection><PageSectionHeader title={t("admin.analytics.conversions")} description={t("admin.analytics.conversionNote")} />
          <div className="grid gap-3 sm:grid-cols-3">{analyticsConversionNames.map((name) => {
            const { numerator, denominator } = report.conversions[name];
            const percent = conversionPercent(numerator, denominator);
            return <Card key={name}><h3 className="text-sm font-medium">{t(`admin.analytics.conversion.${name}`)}</h3><p className="mt-2 text-2xl font-semibold">{percent === null ? "—" : `${number.format(percent)}%`}</p><p className="mt-1 text-sm text-muted">{number.format(numerator)} / {number.format(denominator)}</p></Card>;
          })}</div>
        </PageSection>
        <PageSection><PageSectionHeader title={t("admin.analytics.daily")} />
          <Card><ul className="space-y-2">{report.daily.map((day) => <li key={day.date} className="flex items-center gap-3 text-sm tabular-nums">
            <time className="w-24 shrink-0" dateTime={day.date}>{day.date}</time>
            <div className="h-2 flex-1 rounded bg-subtle" aria-hidden="true"><div className="h-full rounded bg-accent" style={{ width: `${day.count / Math.max(1, ...report.daily.map((item) => item.count)) * 100}%` }} /></div>
            <span className="w-12 text-right">{number.format(day.count)}</span>
          </li>)}</ul></Card>
        </PageSection>
      </>}
    </Page></AppShell>
  );
}
