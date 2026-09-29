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
import { createAuthenticatedAnalyticsTransport } from "@/lib/analytics-transport";
import { trackBetaEvent } from "@/lib/analytics";
import { getSupabaseBrowserAuthClient } from "@/lib/supabase/auth";
import { consumeSignupNotice, type SignupNotice } from "@/lib/signup-handoff";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthSession();
  const { locale, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupNotice, setSignupNotice] = useState<SignupNotice | null>(null);

  useEffect(() => {
    const notice = consumeSignupNotice();
    if (notice) {
      setEmail(notice.email);
      setSignupNotice(notice);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/app");
    }
  }, [isAuthenticated, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserAuthClient();
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(t("login.errorCredentials"));
        return;
      }

      trackBetaEvent("login_completed", {
        authenticated: true,
        locale,
      }, createAuthenticatedAnalyticsTransport(data.session?.access_token));
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
              {t("login.title")}
            </h1>
            <p className="text-sm text-muted">
              {t("login.subtitle")}
            </p>
          </div>
        </div>

        {signupNotice ? (
          <div role="status" className="orvia-status mt-5 space-y-1">
            <p className="font-semibold">{t(signupNotice.outcome === "confirmation" ? "register.success" : "login.signupCheckTitle")}</p>
            <p className="[overflow-wrap:anywhere]">{t(signupNotice.outcome === "confirmation" ? "login.signupConfirmation" : "login.signupCheck").replace("{email}", signupNotice.email)}</p>
            <p>{t("login.signupNext")}</p>
          </div>
        ) : null}

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-muted"
            >
              {t("common.email")}
            </label>
            <Input
              id="login-email"
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
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-muted"
              >
                {t("common.password")}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-muted hover:text-foreground hover:text-foreground"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full"
              placeholder={t("common.password")}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {t("login.newToOrvia")}{" "}
          <Link
            href="/register"
            className="font-medium text-foreground hover:text-zinc-950 dark:hover:text-white"
          >
            {t("common.createAccount")}
          </Link>
        </p>
      </Card>
    </main>
  );
}
