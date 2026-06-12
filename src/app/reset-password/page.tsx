"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/BrandMark";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowserAuthClient } from "@/lib/supabase/auth";

const PASSWORD_MIN_LENGTH = 8;

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(
        t("reset.passwordMin").replace(
          "{count}",
          String(PASSWORD_MIN_LENGTH),
        ),
      );
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserAuthClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(t("reset.updateError"));
        return;
      }

      setPassword("");
      setSuccess(t("reset.success"));
    } catch {
      setError(t("login.errorConfig"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-black dark:text-white">
      <Card className="w-full max-w-md p-6 sm:p-7">
        <Link
          href="/"
          className="mb-5 inline-flex text-sm font-medium text-zinc-500 transition hover:text-violet-800 dark:text-zinc-500 dark:hover:text-violet-200"
        >
          {t("auth.backToLanding")}
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            <BrandMark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {t("reset.title")}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {t("reset.subtitle")}
            </p>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="reset-password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t("reset.newPassword")}
            </label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
              placeholder={t("reset.placeholder").replace(
                "{count}",
                String(PASSWORD_MIN_LENGTH),
              )}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p
              className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
              role="status"
            >
              {success}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t("reset.submitting") : t("reset.submit")}
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-500">
          <Link
            href="/login"
            className="font-medium text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
          >
            {t("login.submit")}
          </Link>
          <Link
            href="/app"
            className="font-medium text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
          >
            {t("reset.goDashboard")}
          </Link>
        </div>
      </Card>
    </main>
  );
}
