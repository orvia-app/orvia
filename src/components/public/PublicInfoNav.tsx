"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { TranslationKey } from "@/lib/i18n";

const publicInfoLinks: {
  href: string;
  labelKey: TranslationKey;
}[] = [
  { href: "/legal/terms", labelKey: "landing.terms" },
  { href: "/legal/privacy", labelKey: "landing.privacy" },
  { href: "/help-center", labelKey: "landing.help" },
];

export function PublicInfoNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("settings.helpLegal")}
      className="flex flex-wrap gap-2 rounded-xl bg-surface p-2 ring-1 ring-line"
    >
      {publicInfoLinks.map((link) => {
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "inline-flex h-9 items-center rounded-xl bg-violet-50 px-3 text-sm font-medium text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25"
                : "inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-zinc-50 hover:text-foreground dark:hover:bg-zinc-950/50 hover:text-foreground"
            }
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
