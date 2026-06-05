"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/BrandMark";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowserAuthClient } from "@/lib/supabase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setSuccess(null);
    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserAuthClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError("Could not create an account with those details.");
        return;
      }

      setSuccess(
        "Account created. Check your email if confirmation is required, then log in.",
      );
      setPassword("");
    } catch {
      setError("Auth is not configured for this environment.");
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
              Create an Orvia account
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Start a workspace for capturing ideas, organizing context, and planning the day.
            </p>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email
            </label>
            <input
              id="register-email"
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
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
              placeholder="At least 8 characters"
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
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
          >
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
