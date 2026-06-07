"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/BrandMark";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  clearSupabaseBrowserAuthSession,
  getSupabaseBrowserAuthClient,
  isExpectedSupabaseSignedOutError,
} from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthSession();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (loading || !isAuthenticated) {
      return () => {
        cancelled = true;
      };
    }

    async function redirectIfSessionExists(): Promise<void> {
      try {
        const supabase = getSupabaseBrowserAuthClient();
        const { data } = await supabase.auth.getSession();

        if (!cancelled && data.session) {
          router.replace("/app");
        }
      } catch (error) {
        if (isExpectedSupabaseSignedOutError(error)) {
          const supabase = getSupabaseBrowserAuthClient();
          await clearSupabaseBrowserAuthSession(supabase);
        }

        // Stay on the login page if browser auth is unavailable or stale.
      }
    }

    void redirectIfSessionExists();

    return () => {
      cancelled = true;
    };
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
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(t("login.errorCredentials"));
        return;
      }

      router.replace("/app");
    } catch {
      setError(t("login.errorConfig"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-black dark:text-white">
      <Card className="w-full max-w-md p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            <BrandMark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {t("login.title")}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {t("login.subtitle")}
            </p>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t("common.email")}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("common.password")}
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-zinc-500 hover:text-violet-800 dark:text-zinc-500 dark:hover:text-violet-200"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
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

        <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-500">
          {t("login.newToOrvia")}{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
          >
            {t("common.createAccount")}
          </Link>
        </p>
      </Card>
    </main>
  );
}
