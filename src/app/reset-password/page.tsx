"use client";
import { Input } from "@/components/ui/Field";


import { useState, type FormEvent } from "react";
import Link from "next/link";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
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
    <main className="orvia-auth">
      <Card className="orvia-auth-panel">
        <LocaleSwitcher />
        <Link
          href="/"
          className="mb-5 inline-flex text-sm font-medium text-muted transition hover:text-foreground hover:text-foreground"
        >
          {t("auth.backToLanding")}
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-foreground">
            <BrandMark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {t("reset.title")}
            </h1>
            <p className="text-sm text-muted">
              {t("reset.subtitle")}
            </p>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="reset-password"
              className="block text-sm font-medium text-muted"
            >
              {t("reset.newPassword")}
            </label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full"
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
              className="orvia-status mt-5 space-y-1"
              role="status"
            >
              {success}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t("reset.submitting") : t("reset.submit")}
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted">
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-zinc-950 dark:hover:text-white"
          >
            {t("login.submit")}
          </Link>
          <Link
            href="/app"
            className="font-medium text-foreground hover:text-zinc-950 dark:hover:text-white"
          >
            {t("reset.goDashboard")}
          </Link>
        </div>
      </Card>
    </main>
  );
}
