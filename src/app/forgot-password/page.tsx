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

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
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
    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserAuthClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

      if (resetError) {
        setError(t("forgot.sendError"));
        return;
      }

      setSuccess(t("forgot.success"));
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
              {t("forgot.title")}
            </h1>
            <p className="text-sm text-muted">
              {t("forgot.subtitle")}
            </p>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="forgot-password-email"
              className="block text-sm font-medium text-muted"
            >
              {t("common.email")}
            </label>
            <Input
              id="forgot-password-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full"
              placeholder="you@example.com"
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
            {submitting ? t("forgot.submitting") : t("forgot.submit")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {t("forgot.remembered")}{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-zinc-950 dark:hover:text-white"
          >
            {t("login.submit")}
          </Link>
        </p>
      </Card>
    </main>
  );
}
