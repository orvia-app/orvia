"use client";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return <main className="mx-auto w-full max-w-2xl px-4 py-10">
    <LocaleSwitcher />
    <h1 className="text-2xl font-semibold">{t("error.title")}</h1>
    <p role="alert" className="my-4 text-muted">{t("error.description")}</p>
    <Button onClick={reset}>{t("error.retry")}</Button>
  </main>;
}
