"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return <div role="group" aria-label={t("settings.language")} className="mb-5 flex justify-end gap-1">
    {(["en", "ua"] as const).map(option => <button
      key={option}
      type="button"
      aria-pressed={locale === option}
      onClick={() => setLocale(option)}
      className="min-h-9 rounded-lg px-3 text-sm text-muted hover:bg-hover aria-pressed:bg-accent-soft aria-pressed:text-accent focus-visible:outline-2 focus-visible:outline-accent"
    >{option === "en" ? "EN" : "UA"}</button>)}
  </div>;
}
