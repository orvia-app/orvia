"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useI18n } from "@/components/i18n/I18nProvider";
import { PublicInfoNav } from "@/components/public/PublicInfoNav";

export default function NotFound() {
  const { t } = useI18n();
  return <main className="mx-auto w-full max-w-2xl px-4 py-10">
    <LocaleSwitcher />
    <PublicInfoNav />
    <h1 className="mt-10 text-2xl font-semibold">{t("notFound.title")}</h1>
    <p className="mt-3 text-muted">{t("notFound.description")}</p>
    <Link href="/" className="orvia-button orvia-button-primary mt-6">{t("notFound.home")}</Link>
  </main>;
}
