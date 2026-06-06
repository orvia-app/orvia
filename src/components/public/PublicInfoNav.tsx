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
      className="flex flex-wrap gap-2 rounded-2xl bg-white/80 p-2 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/75 dark:bg-zinc-900/70 dark:ring-zinc-800/75"
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
                : "inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-violet-700 dark:text-zinc-400 dark:hover:bg-zinc-950/50 dark:hover:text-violet-200"
            }
          >
            {t(link.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
