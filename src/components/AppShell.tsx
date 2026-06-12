"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Car,
  CheckSquare,
  ChevronDown,
  CircleDot,
  FileText,
  House,
  Inbox,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Plus,
  Settings,
  Search,
  Sun,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { CommandCenter } from "@/components/command-palette/CommandCenter";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import { useI18n } from "@/components/i18n/I18nProvider";
import { QuickCapture } from "@/components/quick-capture/QuickCapture";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import type { TranslationKey } from "@/lib/i18n";

type NavItem = {
  labelKey: TranslationKey;
  href: string;
  icon: LucideIcon;
};

const focusNavItems: NavItem[] = [
  { labelKey: "common.dashboard", href: "/app", icon: House },
  { labelKey: "common.today", href: "/app/today", icon: CalendarDays },
];

const workflowNavItems: NavItem[] = [
  { labelKey: "common.inbox", href: "/app/inbox", icon: Inbox },
  { labelKey: "common.tasks", href: "/app/tasks", icon: CheckSquare },
  { labelKey: "common.notes", href: "/app/notes", icon: FileText },
  { labelKey: "common.search", href: "/app/search", icon: Search },
  { labelKey: "common.timeline", href: "/app/timeline", icon: CircleDot },
];

const settingsNavItems: NavItem[] = [
  { labelKey: "common.settings", href: "/app/settings", icon: Settings },
];

const labsNavItems: NavItem[] = [
  { labelKey: "nav.cars", href: "/app/cars", icon: Car },
  { labelKey: "nav.finance", href: "/app/finance", icon: Wallet },
  { labelKey: "nav.automation", href: "/app/automation", icon: Zap },
];

const navItems: NavItem[] = [
  ...focusNavItems,
  ...workflowNavItems,
  ...settingsNavItems,
  ...labsNavItems,
];

const themeOptions: {
  value: Theme;
  labelKey: TranslationKey;
  icon: LucideIcon;
}[] = [
  { value: "dark", labelKey: "nav.dark", icon: Moon },
  { value: "light", labelKey: "nav.light", icon: Sun },
  { value: "system", labelKey: "nav.systemTheme", icon: Monitor },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ThemeSwitcher() {
  const { hydrated, theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        {t("nav.theme")}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {themeOptions.map(({ value, labelKey, icon: Icon }) => {
          const active = hydrated && theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={
                active
                  ? "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-violet-200/80 bg-violet-50 px-2 py-2 text-center text-[11px] font-medium text-violet-800 shadow-sm shadow-violet-950/[0.025] dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200 dark:shadow-none"
                  : "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-2 py-2 text-center text-[11px] font-medium text-zinc-600 transition hover:border-violet-200/70 hover:bg-white hover:text-violet-800 dark:text-zinc-400 dark:hover:border-violet-500/20 dark:hover:bg-zinc-900/70 dark:hover:text-violet-200"
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t(labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        {t("settings.language")}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {(["en", "ua"] as const).map((option) => {
          const active = locale === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setLocale(option)}
              className={
                active
                  ? "flex cursor-pointer items-center justify-center rounded-lg border border-violet-200/80 bg-violet-50 px-2 py-2 text-center text-[11px] font-semibold text-violet-800 shadow-sm shadow-violet-950/[0.025] dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200 dark:shadow-none"
                  : "flex cursor-pointer items-center justify-center rounded-lg border border-transparent px-2 py-2 text-center text-[11px] font-medium text-zinc-600 transition hover:border-violet-200/70 hover:bg-white hover:text-violet-800 dark:text-zinc-400 dark:hover:border-violet-500/20 dark:hover:bg-zinc-900/70 dark:hover:text-violet-200"
              }
            >
              {option === "en" ? "EN" : "UA"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NavSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
      {children}
    </p>
  );
}

function NavLinkItem({
  active,
  href,
  icon: Icon,
  labelKey,
  minHeight = false,
  refCallback,
}: NavItem & {
  active: boolean;
  minHeight?: boolean;
  refCallback?: (element: HTMLAnchorElement | null) => void;
}) {
  const { t } = useI18n();
  const linkClassName = active
    ? [
        "group flex cursor-pointer items-center gap-3 rounded-xl border border-violet-200/80 bg-violet-50 px-3 text-sm font-medium text-violet-950 shadow-sm shadow-violet-950/[0.025] dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100 dark:shadow-none",
        minHeight ? "min-h-11" : "py-2",
      ].join(" ")
    : [
        "group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-zinc-600 transition hover:border-violet-200/70 hover:bg-white hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-violet-500/20 dark:hover:bg-zinc-900/70 dark:hover:text-white",
        minHeight ? "min-h-11" : "py-2",
      ].join(" ");
  const iconClassName = active
    ? "h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300"
    : "h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-violet-700 dark:text-zinc-500 dark:group-hover:text-violet-300";

  return (
    <Link
      href={href}
      ref={refCallback}
      className={linkClassName}
    >
      <Icon className={iconClassName} aria-hidden />
      <span>{t(labelKey)}</span>
    </Link>
  );
}

function FeedbackLink({
  mobile = false,
  onClick,
}: {
  mobile?: boolean;
  onClick?: () => void;
}) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left",
        "group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-zinc-500 transition hover:border-violet-200/70 hover:bg-white hover:text-zinc-950 dark:text-zinc-500 dark:hover:border-violet-500/20 dark:hover:bg-zinc-900/70 dark:hover:text-white",
        mobile ? "min-h-11" : "py-2",
      ].join(" ")}
    >
      <MessageSquare
        className="h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-violet-700 dark:text-zinc-500 dark:group-hover:text-violet-300"
        aria-hidden
      />
      <span>{t("common.feedback")}</span>
    </button>
  );
}

function LabsNavSection({
  mobile = false,
  open,
  pathname,
  setOpen,
  setRef,
}: {
  mobile?: boolean;
  open: boolean;
  pathname: string;
  setOpen: (open: boolean) => void;
  setRef?: (href: string, element: HTMLAnchorElement | null) => void;
}) {
  const { t } = useI18n();

  return (
    <div className={mobile ? "mt-3" : "mt-2"}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={
          mobile
            ? "flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl px-3 text-left text-sm font-medium text-zinc-600 hover:bg-white hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900/70 dark:hover:text-white"
            : "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-white hover:text-zinc-950 dark:text-zinc-500 dark:hover:bg-zinc-900/70 dark:hover:text-white"
        }
      >
        <span>
          {t("nav.labs")}
          <span className="ml-2 align-middle text-[10px] font-normal text-zinc-400 dark:text-zinc-600">
            {t("nav.experimental")}
          </span>
        </span>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 transition",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open ? (
        <div className={mobile ? "mt-1 grid gap-1" : "mt-1 grid gap-1"}>
          {labsNavItems.map(({ labelKey, href, icon }) => (
            <NavLinkItem
              key={href}
              active={isNavActive(pathname, href)}
              href={href}
              icon={icon}
              labelKey={labelKey}
              minHeight={mobile}
              refCallback={
                setRef ? (element) => setRef(href, element) : undefined
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AuthStatus() {
  const { authError, isAuthenticated, loading, signOut, user } =
    useAuthSession();
  const { t } = useI18n();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut(): Promise<void> {
    if (signingOut) {
      return;
    }

    setSignOutError(null);
    setSigningOut(true);

    try {
      const result = await signOut();

      if (!result.ok) {
        setSignOutError(result.error);
      }
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white/65 px-2.5 py-2 text-[11px] text-zinc-500 ring-1 ring-zinc-200/70 dark:bg-zinc-900/45 dark:text-zinc-500 dark:ring-zinc-800/70">
        {t("auth.checkingAccount")}
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="rounded-lg bg-white/65 px-2.5 py-2 ring-1 ring-zinc-200/70 dark:bg-zinc-900/45 dark:ring-zinc-800/70">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
              {user?.email ?? t("auth.signedIn")}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-zinc-500 dark:text-zinc-500">
              {t("auth.accountActive")}
            </p>
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            className="shrink-0 text-[11px] font-medium text-zinc-500 hover:text-violet-700 disabled:cursor-wait disabled:text-zinc-400 dark:text-zinc-500 dark:hover:text-violet-300 dark:disabled:text-zinc-600"
          >
            {signingOut ? t("auth.signingOut") : t("common.signOut")}
          </button>
        </div>
        {signOutError ? (
          <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
            {signOutError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/60 px-3 py-3 ring-1 ring-zinc-200/75 dark:bg-zinc-900/35 dark:ring-zinc-800/75">
      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
        {t("auth.createWorkspace")}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-zinc-500 dark:text-zinc-500">
        {t("auth.syncAcrossDevices")}
      </p>
      <div className="mt-3 grid gap-2">
        <Link
          href="/login"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-violet-800 px-2 text-[11px] font-medium text-white shadow-sm shadow-violet-950/10 hover:bg-violet-700 dark:bg-violet-600/85 dark:hover:bg-violet-600"
        >
          {t("common.signIn")}
        </Link>
        <Link
          href="/register"
          className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/80 hover:bg-white hover:text-violet-800 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-violet-200"
        >
          {t("common.createAccount")}
        </Link>
      </div>
      {authError ? (
        <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">
          {authError}
        </p>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, session } = useAuthSession();
  const { t } = useI18n();
  const navItemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [desktopLabsOpen, setDesktopLabsOpen] = useState(false);
  const [mobileLabsOpen, setMobileLabsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const labsActive = labsNavItems.some((item) => isNavActive(pathname, item.href));
  const desktopLabsVisible = desktopLabsOpen || labsActive;
  const mobileLabsVisible = mobileLabsOpen || labsActive;
  const isAppRoute = pathname === "/app" || pathname.startsWith("/app/");

  const openQuickCapture = useCallback((): void => {
    setMobileMenuOpen(false);
    setQuickCaptureOpen(true);
  }, []);

  useEffect(() => {
    const activeItem = navItems.find((item) => isNavActive(pathname, item.href));
    const activeElement = activeItem
      ? navItemRefs.current[activeItem.href]
      : null;

    activeElement?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!loading && !isAuthenticated && isAppRoute) {
      router.replace("/login");
    }
  }, [isAppRoute, isAuthenticated, loading, router]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const isQuickCaptureShortcut =
        event.key.toLowerCase() === "k" &&
        event.shiftKey &&
        (event.metaKey || event.ctrlKey);

      if (!isQuickCaptureShortcut) {
        return;
      }

      event.preventDefault();
      openQuickCapture();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openQuickCapture]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 text-zinc-950 dark:bg-zinc-950 dark:text-white">
        <div className="rounded-2xl bg-white/85 px-5 py-4 text-sm text-zinc-600 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/75 dark:bg-zinc-900/70 dark:text-zinc-400 dark:ring-zinc-800/75">
          {t("auth.checkingAccount")}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.11),transparent_30rem),linear-gradient(180deg,#fafafa_0%,#f4f4f5_100%)] px-4 py-10 text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_30rem),linear-gradient(180deg,#18181b_0%,#09090b_100%)] dark:text-white">
        <div className="w-full max-w-md rounded-2xl bg-white/90 p-6 text-center shadow-sm shadow-zinc-950/[0.04] ring-1 ring-zinc-200/75 dark:bg-zinc-900/75 dark:ring-zinc-800/75">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25">
            <BrandMark className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {t("auth.signInToContinue")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t("auth.appPreviewAfterSignIn")}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-800 px-4 text-sm font-medium text-white shadow-sm shadow-violet-950/10 transition hover:bg-violet-700 dark:bg-violet-600/85 dark:hover:bg-violet-600"
            >
              {t("common.signIn")}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 transition hover:bg-violet-50/70 hover:text-violet-800 hover:ring-violet-200/70 dark:bg-zinc-950/60 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
            >
              {t("common.createAccount")}
            </Link>
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-medium text-zinc-500 hover:text-violet-800 dark:text-zinc-500 dark:hover:text-violet-200"
          >
            {t("auth.backToLanding")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <CommandCenter />
      <QuickCapture
        accessToken={session?.access_token}
        ownerId={session?.user.id}
        onOpenChange={setQuickCaptureOpen}
        open={quickCaptureOpen}
      />
      <FeedbackDialog
        accessToken={session?.access_token}
        onOpenChange={setFeedbackOpen}
        open={feedbackOpen}
        source="app_shell"
      />

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-zinc-50/95 dark:border-zinc-800/80 dark:bg-zinc-950 lg:flex">
        <div className="flex shrink-0 items-center gap-3 px-5 pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-800 shadow-sm shadow-violet-950/[0.03] dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 dark:shadow-none">
            <BrandMark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
              Orvia
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
              {t("app.tagline")}
            </p>
          </div>
        </div>

        <nav
          className="app-scrollbar app-scrollbar-quiet mt-7 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 pb-4"
          aria-label={t("nav.main")}
        >
                  {focusNavItems.map(({ labelKey, href, icon }) => (
            <NavLinkItem
              key={href}
              active={isNavActive(pathname, href)}
              href={href}
              icon={icon}
                      labelKey={labelKey}
              refCallback={(element) => {
                navItemRefs.current[href] = element;
              }}
            />
          ))}

          <NavSectionLabel>{t("nav.workflow")}</NavSectionLabel>
                    {workflowNavItems.map(({ labelKey, href, icon }) => (
            <NavLinkItem
              key={href}
              active={isNavActive(pathname, href)}
              href={href}
              icon={icon}
                        labelKey={labelKey}
              refCallback={(element) => {
                navItemRefs.current[href] = element;
              }}
            />
          ))}

          <NavSectionLabel>{t("nav.system")}</NavSectionLabel>
                      {settingsNavItems.map(({ labelKey, href, icon }) => (
            <NavLinkItem
              key={href}
              active={isNavActive(pathname, href)}
              href={href}
              icon={icon}
                          labelKey={labelKey}
              refCallback={(element) => {
                navItemRefs.current[href] = element;
              }}
            />
          ))}
          <FeedbackLink onClick={() => setFeedbackOpen(true)} />

          <LabsNavSection
            open={desktopLabsVisible}
            pathname={pathname}
            setOpen={setDesktopLabsOpen}
            setRef={(href, element) => {
              navItemRefs.current[href] = element;
            }}
          />
        </nav>

        <div className="shrink-0 border-t border-zinc-200/80 bg-zinc-50/95 px-5 pb-5 pt-4 dark:border-zinc-800/80 dark:bg-zinc-950">
          <button
            type="button"
            onClick={openQuickCapture}
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-3 py-2.5 text-sm font-medium text-white shadow-sm shadow-violet-950/15 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:bg-violet-600/85 dark:text-white dark:shadow-none dark:hover:bg-violet-600 dark:focus-visible:ring-violet-400"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("common.capture")}
          </button>
          <div className="mb-3">
            <AuthStatus />
          </div>
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <ThemeSwitcher />
        </div>
      </aside>

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950">
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/90 px-4 py-3 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/90 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-800 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/20">
                <BrandMark className="h-4.5 w-4.5" />
              </span>
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                {t("common.orvia")}
              </p>
            </div>
            <button
              type="button"
              aria-label={t("nav.openNavigation")}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-zinc-700 ring-1 ring-zinc-200/80 hover:bg-white hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-violet-300 dark:focus-visible:ring-violet-400"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div
            className="fixed inset-0 z-50 bg-zinc-950/45 backdrop-blur-sm dark:bg-black/65 lg:hidden"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setMobileMenuOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={t("nav.navigationMenu")}
              className="app-scrollbar ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto bg-zinc-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl shadow-zinc-950/20 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:shadow-black/40 dark:ring-zinc-800"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
                    <BrandMark className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                      Orvia
                    </p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-500">
                      {t("app.tagline")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t("common.close")}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-600 ring-1 ring-zinc-200/80 hover:bg-white hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-violet-300 dark:focus-visible:ring-violet-400"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <nav className="mt-6 grid gap-1" aria-label={t("nav.mobileMain")}>
                    {focusNavItems.map(({ labelKey, href, icon }) => (
                  <NavLinkItem
                    key={href}
                    active={isNavActive(pathname, href)}
                    href={href}
                    icon={icon}
                        labelKey={labelKey}
                    minHeight
                  />
                ))}

                <NavSectionLabel>{t("nav.workflow")}</NavSectionLabel>
                    {workflowNavItems.map(({ labelKey, href, icon }) => (
                  <NavLinkItem
                    key={href}
                    active={isNavActive(pathname, href)}
                    href={href}
                    icon={icon}
                        labelKey={labelKey}
                    minHeight
                  />
                ))}

                <NavSectionLabel>{t("nav.system")}</NavSectionLabel>
                    {settingsNavItems.map(({ labelKey, href, icon }) => (
                  <NavLinkItem
                    key={href}
                    active={isNavActive(pathname, href)}
                    href={href}
                    icon={icon}
                        labelKey={labelKey}
                    minHeight
                  />
                ))}
                <FeedbackLink
                  mobile
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setFeedbackOpen(true);
                  }}
                />

                <LabsNavSection
                  mobile
                  open={mobileLabsVisible}
                  pathname={pathname}
                  setOpen={setMobileLabsOpen}
                />
              </nav>

              <div className="mt-6 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={openQuickCapture}
                  className="mb-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-800 px-3 text-sm font-medium text-white shadow-sm shadow-violet-950/15 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:bg-violet-600/85 dark:text-white dark:shadow-none dark:hover:bg-violet-600 dark:focus-visible:ring-violet-400"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("common.capture")}
                </button>
                <div className="mb-4">
                  <AuthStatus />
                </div>
                <div className="mb-4">
                  <LanguageSwitcher />
                </div>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        ) : null}

        <main className="app-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
        <button
          type="button"
          onClick={openQuickCapture}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-800 px-4 text-sm font-medium text-white shadow-lg shadow-violet-950/20 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:bg-violet-600/85 dark:text-white dark:shadow-black/30 dark:hover:bg-violet-600 dark:focus-visible:ring-violet-400 lg:hidden"
          aria-label={t("nav.openQuickCapture")}
        >
          <Plus className="h-5 w-5" aria-hidden />
          {t("common.capture")}
        </button>
      </div>
    </div>
  );
}
