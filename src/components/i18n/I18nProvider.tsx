"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  isLocale,
  translations,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";
import { safeReadStorage, safeWriteStorage, STORAGE_KEYS } from "@/lib/storage";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const storedLocale = safeReadStorage<unknown>(
      STORAGE_KEYS.language,
      DEFAULT_LOCALE,
    );

    if (isLocale(storedLocale)) {
      setLocaleState(storedLocale);
      document.documentElement.lang = storedLocale === "ua" ? "uk" : "en";
    }
  }, []);

  function setLocale(nextLocale: Locale): void {
    setLocaleState(nextLocale);
    safeWriteStorage(STORAGE_KEYS.language, nextLocale);
    document.documentElement.lang = nextLocale === "ua" ? "uk" : "en";
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => translations[locale][key],
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}
