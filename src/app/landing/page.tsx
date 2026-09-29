"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  ListChecks,
  Monitor,
  Moon,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { trackBetaEventOnce } from "@/lib/analytics";
import type { TranslationKey } from "@/lib/i18n";

const workflow: {
  descriptionKey: TranslationKey;
  titleKey: TranslationKey;
}[] = [
  {
    titleKey: "landing.workflowCapture",
    descriptionKey: "landing.workflowCaptureDescription",
  },
  {
    titleKey: "landing.workflowOrganize",
    descriptionKey: "landing.workflowOrganizeDescription",
  },
  {
    titleKey: "landing.workflowPrioritize",
    descriptionKey: "landing.workflowPrioritizeDescription",
  },
  {
    titleKey: "landing.workflowRecall",
    descriptionKey: "landing.workflowRecallDescription",
  },
] as const;

const problemPoints = [
  "landing.problem1",
  "landing.problem2",
  "landing.problem3",
  "landing.problem4",
] as const;

const audiences = [
  "landing.audienceFounders",
  "landing.audienceProductManagers",
  "landing.audienceFreelancers",
  "landing.audienceOperators",
  "landing.audienceKnowledgeWorkers",
] as const;

const previewCards = [
  {
    icon: Inbox,
    labelKey: "landing.previewInboxLabel",
    titleKey: "landing.previewInboxTitle",
    descriptionKey: "landing.previewInboxDescription",
  },
  {
    icon: ListChecks,
    labelKey: "landing.previewTodayLabel",
    titleKey: "landing.previewTodayTitle",
    descriptionKey: "landing.previewTodayDescription",
  },
  {
    icon: Search,
    labelKey: "landing.previewSearchLabel",
    titleKey: "landing.previewSearchTitle",
    descriptionKey: "landing.previewSearchDescription",
  },
  {
    icon: Clock3,
    labelKey: "landing.previewTimelineLabel",
    titleKey: "landing.previewTimelineTitle",
    descriptionKey: "landing.previewTimelineDescription",
  },
] as const;

const landingThemeOptions: {
  icon: LucideIcon;
  labelKey: TranslationKey;
  value: Theme;
}[] = [
  { icon: Sun, labelKey: "nav.light", value: "light" },
  { icon: Moon, labelKey: "nav.dark", value: "dark" },
  { icon: Monitor, labelKey: "nav.systemTheme", value: "system" },
];

export default function LandingPage() {
  const { locale, setLocale, t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuthSession();
  const { hydrated, theme, setTheme } = useTheme();
  const mobileThemeValue = hydrated ? theme : "system";
  const mobileThemeOption =
    landingThemeOptions.find((option) => option.value === mobileThemeValue) ??
    landingThemeOptions[2];
  const MobileThemeIcon = mobileThemeOption.icon;
  const nextMobileTheme: Theme =
    mobileThemeValue === "light"
      ? "dark"
      : mobileThemeValue === "dark"
        ? "system"
        : "light";

  useEffect(() => {
    if (authLoading) {
      return;
    }

    trackBetaEventOnce("landing_view", {
      authenticated: isAuthenticated,
      locale,
    });
  }, [authLoading, isAuthenticated, locale]);

  return (
    <main className="min-h-screen bg-canvas text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-2.5 py-3 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground sm:gap-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-violet-800 ring-1 ring-line dark:text-violet-200 sm:h-9 sm:w-9 sm:rounded-xl">
              <BrandMark className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </span>
            <span className="hidden sm:inline">{t("common.orvia")}</span>
          </Link>
          <span className="hidden rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25 sm:inline-flex">
            {t("landing.privateBeta")}
          </span>
        </div>

        <nav
          aria-label={t("landing.navigation")}
          className="flex min-w-0 flex-1 items-center justify-end gap-1 text-xs sm:gap-2 sm:text-sm"
        >
          <div className="flex h-8 shrink-0 items-center gap-0.5 rounded-full bg-surface p-0.5 ring-1 ring-line sm:h-auto sm:gap-1 sm:p-1">
            {(["en", "ua"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocale(option)}
                className={
                  locale === option
                    ? "rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold leading-5 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200 sm:px-2.5 sm:py-1 sm:text-xs sm:leading-normal"
                    : "rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-5 text-muted transition hover:text-foreground hover:text-foreground sm:px-2.5 sm:py-1 sm:text-xs sm:leading-normal"
                }
              >
                {option === "en" ? "EN" : "UA"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTheme(nextMobileTheme)}
            aria-label={t(mobileThemeOption.labelKey)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted ring-1 ring-line transition hover:text-foreground hover:text-foreground sm:hidden"
          >
            <MobileThemeIcon className="h-3.5 w-3.5" aria-hidden />
          </button>
          <div className="hidden items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-line sm:flex">
            {landingThemeOptions.map(({ icon: Icon, labelKey, value }) => {
              const active = hydrated && theme === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-label={t(labelKey)}
                  className={
                    active
                      ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200"
                      : "inline-flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:text-foreground hover:text-foreground"
                  }
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </button>
              );
            })}
          </div>
          <Link
            href="/login"
            className="shrink-0 rounded-full px-1 py-1.5 text-[11px] font-medium leading-none text-muted transition hover:bg-white/70 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white sm:px-3 sm:py-2 sm:text-sm sm:leading-normal"
          >
            {t("common.signIn")}
          </Link>
          <Link
            href="/register"
            className="orvia-button orvia-button-primary h-8 whitespace-nowrap sm:h-auto"
          >
            {t("common.createAccount")}
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-7 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("landing.heroBadge")}
          </div>
          <h1 className="mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("landing.headline")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {t("landing.subheadline")}
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:gap-3">
            <a
              href="/register"
              className="orvia-button orvia-button-primary h-10 sm:h-11"
            >
              {t("landing.notify")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </a>
            <a
              href="#demo-flow"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-surface px-4 text-sm font-semibold text-foreground ring-1 ring-line transition hover:bg-hover hover:text-foreground hover:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 sm:h-11 sm:px-5 hover:bg-hover hover:text-foreground hover:border-line dark:focus-visible:ring-offset-zinc-950"
            >
              {t("landing.viewDemo")}
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5 sm:p-7">
          <div className="">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
              {t("dashboard.eyebrow")}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {t("landing.whatNeedsAttention")}
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
                {t("landing.activeCount")}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {previewCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.labelKey}
                    className="border-b border-line py-4 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-200/70 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/20">
                        <Icon className="h-4.5 w-4.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted">
                          {t(card.labelKey)}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-foreground">
                          {t(card.titleKey)}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-muted">
                          {t(card.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
              {t("landing.problemEyebrow")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("landing.problemTitle")}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {problemPoints.map((pointKey) => (
              <div
                key={pointKey}
                className="border-t border-line py-4 text-sm leading-6 text-muted"
              >
                {t(pointKey)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="demo-flow"
        className="mx-auto max-w-6xl scroll-mt-8 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
            {t("landing.workflowEyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("landing.workflowTitle")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {t("landing.workflowDescription")}
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {workflow.map((step, index) => (
            <div
              key={step.titleKey}
              className="border-t border-line py-5 pr-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {t(step.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {t(step.descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-xl bg-zinc-950 p-6 text-white shadow-lg shadow-zinc-950/10 dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800">
          <p className="text-sm font-medium uppercase tracking-wide text-violet-200">
            {t("landing.whoEyebrow")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            {t("landing.whoTitle")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            {t("landing.whoDescription")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {audiences.map((audienceKey) => (
            <div
              key={audienceKey}
              className="flex items-center gap-3 border-b border-line py-4 text-sm font-medium text-foreground"
            >
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300"
                aria-hidden
              />
              {t(audienceKey)}
            </div>
          ))}
        </div>
      </section>

      <section
        id="private-beta"
        className="border-t border-line bg-surface"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
              {t("landing.privateBeta")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("landing.betaTitle")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              {t("landing.betaDescription")}
            </p>
          </div>

          <div className="rounded-xl bg-surface p-5 ring-1 ring-line">
            <p className="text-sm leading-6 text-muted">
              {t("landing.betaCtaDescription")}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="orvia-button orvia-button-primary h-11"
              >
                {t("landing.joinPrivateBeta")}
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-subtle px-5 text-sm font-semibold text-foreground ring-1 ring-line transition hover:bg-hover hover:text-foreground hover:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:bg-hover hover:text-foreground hover:border-line dark:focus-visible:ring-offset-zinc-900"
              >
                {t("common.signIn")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{t("landing.footer")}</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/legal/terms" className="hover:text-zinc-950 dark:hover:text-white">
            {t("landing.terms")}
          </Link>
          <Link href="/legal/privacy" className="hover:text-zinc-950 dark:hover:text-white">
            {t("landing.privacy")}
          </Link>
          <Link href="/help-center" className="hover:text-zinc-950 dark:hover:text-white">
            {t("landing.help")}
          </Link>
          <Link href="/login" className="hover:text-zinc-950 dark:hover:text-white">
            {t("common.signIn")}
          </Link>
          <Link href="/register" className="hover:text-zinc-950 dark:hover:text-white">
            {t("common.createAccount")}
          </Link>
        </div>
      </footer>
    </main>
  );
}
