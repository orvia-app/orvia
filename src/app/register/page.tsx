"use client";
import { Input } from "@/components/ui/Field";


import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { BrandMark } from "@/components/BrandMark";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { trackBetaEvent } from "@/lib/analytics";
import { getSupabaseBrowserAuthClient } from "@/lib/supabase/auth";
import { getSignupOutcome, rememberSignupNotice } from "@/lib/signup-handoff";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthSession();
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/app");
    }
  }, [isAuthenticated, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || completed) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserAuthClient();
      trackBetaEvent("signup_started", {
        authenticated: false,
        locale,
      });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(t("register.error"));
        return;
      }

      const outcome = getSignupOutcome(data);
      if (outcome === "invalid") {
        setError(t("register.error"));
        return;
      }

      trackBetaEvent("signup_completed", {
        authenticated: false,
        locale,
      });
      setCompleted(true);
      setPassword("");
      if (outcome !== "authenticated") {
        rememberSignupNotice({ email, outcome });
        router.replace("/login");
      }
      // With confirmation disabled, AuthProvider receives SIGNED_IN and the
      // existing authenticated effect above redirects to /app.
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
              {t("register.title")}
            </h1>
            <p className="text-sm text-muted">
              {t("register.subtitle")}
            </p>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-muted"
            >
              {t("common.email")}
            </label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-muted"
            >
              {t("common.password")}
            </label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full"
              placeholder={t("register.passwordPlaceholder")}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          {completed ? (
            <p
              className="orvia-status mt-5 space-y-1"
              role="status"
            >
              {t("register.continuing")}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting || completed} className="w-full">
            {completed ? t("register.continuing") : submitting ? t("register.submitting") : t("register.submit")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {t("register.alreadyHaveAccount")}{" "}
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
