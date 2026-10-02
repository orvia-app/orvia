"use client";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
import { usePresence } from "@/components/ui/usePresence";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UserRound,
  LogOut,
  CalendarDays,
  ChartNoAxesColumn,
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
  ShieldCheck,
  Sun,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ActionPopover } from "@/components/ui/ActionPopover";
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
  { labelKey: "common.calendar", href: "/app/calendar", icon: CalendarDays },
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

const adminNavItems: NavItem[] = [
  { labelKey: "admin.analytics.nav", href: "/app/admin/analytics", icon: ChartNoAxesColumn },
  { labelKey: "admin.feedback.nav", href: "/app/admin/feedback", icon: ShieldCheck },
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
  ...adminNavItems,
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
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
        {t("nav.theme")}
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {themeOptions.map(({ value, labelKey, icon: Icon }) => {
          const active = hydrated && theme === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => setTheme(value)}
              className={
                active
                  ? "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-violet-200/80 bg-violet-50 px-2 py-2 text-center text-[11px] font-medium text-violet-800 shadow-violet-950/[0.025] dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200 dark:shadow-none"
                  : "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-transparent px-2 py-2 text-center text-[11px] font-medium text-muted transition hover:border-line hover:bg-white hover:text-foreground hover:border-line dark:hover:bg-zinc-900/70 hover:text-foreground"
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
    <div
      aria-label={t("settings.language")}
      className="inline-grid grid-cols-2 rounded-full bg-subtle p-0.5 ring-1 ring-line"
      role="group"
    >
        {(["en", "ua"] as const).map((option) => {
          const active = locale === option;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => setLocale(option)}
              className={
                active
                  ? "flex h-6 cursor-pointer items-center justify-center rounded-full bg-white px-2 text-[10px] font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-200 dark:shadow-none"
                  : "flex h-6 cursor-pointer items-center justify-center rounded-full px-2 text-[10px] font-medium text-muted transition hover:text-foreground hover:text-foreground"
              }
            >
              {option === "en" ? "EN" : "UA"}
            </button>
          );
        })}
    </div>
  );
}

function NavSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-muted">
        {children}
      </p>
      <span className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800/80" />
    </div>
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
  const linkClassName = `orvia-nav group ${minHeight ? "min-h-11" : ""}`;
  const iconClassName = "h-4 w-4 shrink-0";

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
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
        "group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 text-sm font-medium text-muted transition hover:border-zinc-200/80 hover:bg-white/80 hover:text-zinc-950 dark:hover:border-zinc-800/90 dark:hover:bg-zinc-900/75 dark:hover:text-white dark:hover:shadow-none",
        mobile ? "min-h-11" : "py-2.5",
      ].join(" ")}
    >
      <MessageSquare
        className="h-4 w-4 shrink-0 text-muted transition group-hover:text-foreground dark:group-hover:text-foreground"
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
            ? "flex min-h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-transparent px-3 text-left text-sm font-medium text-muted transition hover:border-zinc-200/80 hover:bg-white/80 hover:text-zinc-950 dark:hover:border-zinc-800/90 dark:hover:bg-zinc-900/75 dark:hover:text-white"
            : "flex w-full cursor-pointer items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:border-zinc-200/80 hover:bg-white/80 hover:text-zinc-950 dark:hover:border-zinc-800/90 dark:hover:bg-zinc-900/75 dark:hover:text-white"
        }
      >
        <span>
          {t("nav.labs")}
          <span className="ml-2 align-middle text-[10px] font-normal text-zinc-400 dark:text-muted">
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
      <div className="rounded-lg bg-surface px-2.5 py-2 text-[11px] text-muted ring-1 ring-line">
        {t("auth.checkingAccount")}
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <ActionPopover label={t("common.account")} align="start" trigger={<>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"><UserRound className="h-4 w-4" aria-hidden /></span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-muted">{t("common.account")}</span><span className="block truncate text-sm font-medium" title={user?.email}>{user?.email ?? t("auth.signedIn")}</span></span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      </>}>
        {() => <>
          <div className="border-b border-line px-3 py-2"><p className="break-all text-sm font-medium">{user?.email}</p><p className="mt-1 text-xs text-muted">{t("auth.accountActive")}</p></div>
          <Link href="/app/settings" className="orvia-menu-action"><Settings className="h-4 w-4" aria-hidden />{t("common.settings")}</Link>
          <button type="button" className="orvia-menu-action" disabled={signingOut} onClick={handleSignOut}><LogOut className="h-4 w-4" aria-hidden />{signingOut ? t("auth.signingOut") : t("common.signOut")}</button>
          {signOutError ? <p role="alert" className="px-3 py-2 text-xs text-[var(--danger)]">{t("auth.signOutError")}</p> : null}
        </>}
      </ActionPopover>
    );
  }

  return (
    <div className="rounded-xl bg-surface px-3 py-3 ring-1 ring-line">
      <p className="text-xs font-semibold text-foreground">
        {t("auth.createWorkspace")}
      </p>
      <p className="mt-1 text-[11px] leading-4 text-muted">
        {t("auth.syncAcrossDevices")}
      </p>
      <div className="mt-3 grid gap-2">
        <Link
          href="/login"
          className="orvia-button orvia-button-primary h-8"
        >
          {t("common.signIn")}
        </Link>
        <Link
          href="/register"
          className="inline-flex h-8 items-center justify-center rounded-lg px-2 text-[11px] font-medium text-muted ring-1 ring-line hover:bg-white hover:text-foreground dark:hover:bg-zinc-900 hover:text-foreground"
        >
          {t("common.createAccount")}
        </Link>
      </div>
      {authError ? (
        <p className="mt-1.5 text-[11px] text-muted">
          {t("auth.sessionUnavailable")}
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
  const { present: overlayPresent, closing: overlayClosing } = usePresence(mobileMenuOpen);
  const mobileDialogRef = useDialogFocus(mobileMenuOpen);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [desktopLabsOpen, setDesktopLabsOpen] = useState(false);
  const [mobileLabsOpen, setMobileLabsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [adminNavigationVisible, setAdminNavigationVisible] = useState(false);
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
      if (event.key === "Escape" && !event.defaultPrevented && !mobileDialogRef.current?.querySelector('.orvia-popover[data-presence="entered"]')) {
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
    let cancelled = false;

    if (!session?.access_token) {
      setAdminNavigationVisible(false);
      return () => {
        cancelled = true;
      };
    }

    const accessToken = session.access_token;

    async function checkAdminAccess(): Promise<void> {
      try {
        const response = await fetch("/api/admin/feedback?probe=1", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!cancelled) {
          setAdminNavigationVisible(response.ok);
        }
      } catch {
        if (!cancelled) {
          setAdminNavigationVisible(false);
        }
      }
    }

    void checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [session?.access_token]);

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
      <div className="flex min-h-screen items-center justify-center bg-subtle px-4 text-foreground">
        <div className="rounded-xl bg-surface px-5 py-4 text-sm text-muted ring-1 ring-line">
          {t("auth.checkingAccount")}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 text-foreground dark:bg-canvas">
        <div className="w-full max-w-md rounded-xl bg-surface p-6 text-center ring-1 ring-line">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25">
            <BrandMark className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
            {t("auth.signInToContinue")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t("auth.appPreviewAfterSignIn")}
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              className="orvia-button orvia-button-primary h-10"
            >
              {t("common.signIn")}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-surface px-4 text-sm font-medium text-zinc-700 ring-1 ring-line transition hover:bg-hover hover:text-foreground hover:border-line dark:text-zinc-200 hover:bg-hover hover:text-foreground hover:border-line"
            >
              {t("common.createAccount")}
            </Link>
          </div>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-medium text-muted hover:text-foreground hover:text-foreground"
          >
            {t("auth.backToLanding")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-white">
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

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-zinc-50/95 dark:border-zinc-800/80 dark:bg-zinc-950 lg:flex">
        <div className="flex shrink-0 items-center gap-3 px-5 pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-800 shadow-violet-950/[0.03] dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 dark:shadow-none">
            <BrandMark className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-foreground">
              Orvia
            </p>
            <p className="text-[11px] text-muted">
              {t("app.tagline")}
            </p>
          </div>
        </div>

        <div className="relative z-40 mx-4 mt-4 shrink-0"><AuthStatus /></div>

        <nav
          className="app-scrollbar app-scrollbar-quiet mt-5 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-4 pb-4"
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

          {adminNavigationVisible ? (
            <>
              <NavSectionLabel>{t("common.admin")}</NavSectionLabel>
              {adminNavItems.map(({ labelKey, href, icon }) => (
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
            </>
          ) : null}

          <LabsNavSection
            open={desktopLabsVisible}
            pathname={pathname}
            setOpen={setDesktopLabsOpen}
            setRef={(href, element) => {
              navItemRefs.current[href] = element;
            }}
          />
        </nav>

        <div className="shrink-0 border-t border-line bg-sidebar px-4 pb-5 pt-4">
          <button
            type="button"
            onClick={openQuickCapture}
            className="orvia-button orvia-button-primary mb-3 w-full"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("nav.quickCapture")}
          </button>
          <div className="mb-3 flex items-center justify-between"><span className="text-xs text-muted">{t("settings.language")}</span><LanguageSwitcher /></div>
          <ThemeSwitcher />
        </div>
      </aside>

      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-canvas">
        <header className="sticky top-0 z-30 border-b border-line bg-subtle px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-800 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/20">
                <BrandMark className="h-4.5 w-4.5" />
              </span>
              <p className="truncate text-sm font-semibold text-foreground">
                {t("common.orvia")}
              </p>
            </div>
            <button
              type="button"
              aria-label={t("nav.openNavigation")}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted ring-1 ring-line hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:hover:bg-zinc-900 hover:text-foreground dark:focus-visible:ring-violet-400"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {overlayPresent ? (
          <div
            data-presence={overlayClosing ? "exiting" : "entered"}
            inert={overlayClosing}
            className="fixed inset-0 z-50 bg-zinc-950/45 dark:bg-black/65 lg:hidden"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setMobileMenuOpen(false);
              }
            }}
          >
            <div
              ref={mobileDialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={t("nav.navigationMenu")}
              className="orvia-dialog rounded-none app-scrollbar ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto bg-subtle px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-2xl shadow-zinc-950/20 ring-1 ring-line dark:shadow-black/40"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-200/70 bg-violet-50 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200">
                    <BrandMark className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      Orvia
                    </p>
                    <p className="text-[11px] leading-4 text-muted">
                      {t("app.tagline")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t("common.close")}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted ring-1 ring-line hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 dark:hover:bg-zinc-900 hover:text-foreground dark:focus-visible:ring-violet-400"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              <div className="relative z-40 mt-4"><AuthStatus /></div>
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

                {adminNavigationVisible ? (
                  <>
                    <NavSectionLabel>{t("common.admin")}</NavSectionLabel>
                    {adminNavItems.map(({ labelKey, href, icon }) => (
                      <NavLinkItem
                        key={href}
                        active={isNavActive(pathname, href)}
                        href={href}
                        icon={icon}
                        labelKey={labelKey}
                        minHeight
                      />
                    ))}
                  </>
                ) : null}

                <LabsNavSection
                  mobile
                  open={mobileLabsVisible}
                  pathname={pathname}
                  setOpen={setMobileLabsOpen}
                />
              </nav>

              <div className="mt-5 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={openQuickCapture}
                  className="orvia-button orvia-button-primary mb-4 min-h-11 w-full"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {t("nav.quickCapture")}
                </button>
                <div className="mb-4 flex items-center justify-between"><span className="text-xs text-muted">{t("settings.language")}</span><LanguageSwitcher /></div>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        ) : null}

        <main className="app-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-5 lg:pb-0">
          {children}
        </main>
        <div className="shrink-0 border-t border-line bg-sidebar px-2 pt-1 pb-[calc(.25rem+env(safe-area-inset-bottom))] lg:hidden">
          <nav className="grid grid-cols-5 gap-1" aria-label={t("nav.mobileMain")}>
            {[
              focusNavItems[0], focusNavItems[1],
            ].map(({ href, labelKey, icon: Icon }, index) => <Link key={href} href={href} aria-label={t(labelKey)} aria-current={isNavActive(pathname, href) ? "page" : undefined} className="orvia-mobile-tab"><Icon className="h-5 w-5" aria-hidden /><span aria-hidden>{t(index === 0 ? "nav.mobileDashboard" : labelKey)}</span></Link>)}
            <button type="button" onClick={openQuickCapture} className="orvia-mobile-tab orvia-mobile-capture" aria-label={t("nav.openQuickCapture")}><Plus className="h-5 w-5" aria-hidden /><span aria-hidden>{t("nav.mobileCapture")}</span></button>
            {[focusNavItems[2], workflowNavItems[0]].map(({ href, labelKey, icon: Icon }) => <Link key={href} href={href} aria-label={t(labelKey)} aria-current={isNavActive(pathname, href) ? "page" : undefined} className="orvia-mobile-tab"><Icon className="h-5 w-5" aria-hidden /><span aria-hidden>{t(labelKey)}</span></Link>)}
          </nav>
        </div>
      </div>
    </div>
  );
}
