"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, Subscription, User } from "@supabase/supabase-js";

import {
  clearSupabaseBrowserAuthSession,
  getSupabaseBrowserAuthClient,
  isExpectedSupabaseSignedOutError,
  loadSupabaseBrowserAuthSession,
  reportUnexpectedSupabaseAuthError,
} from "@/lib/supabase/auth";
import { trackEmailConfirmedFromUrl } from "@/lib/analytics";
import { setMonitoringUserId } from "@/lib/monitoring/sentry-user";

type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type AuthSessionContextValue = {
  authError: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  session: Session | null;
  signOut: () => Promise<AuthActionResult>;
  user: User | null;
};

export const AuthSessionContext =
  createContext<AuthSessionContextValue | null>(null);

function isSignedOutSession(
  nextSession: Session | null,
  signedOutAccessToken: string | null,
): boolean {
  return (
    signedOutAccessToken !== null &&
    nextSession?.access_token === signedOutAccessToken
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const ignoredSignedOutAccessTokenRef = useRef<string | null>(null);

  function commitSession(nextSession: Session | null): void {
    if (isSignedOutSession(nextSession, ignoredSignedOutAccessTokenRef.current)) {
      sessionRef.current = null;
      setSession(null);
      setMonitoringUserId(null);
      return;
    }

    if (nextSession) {
      ignoredSignedOutAccessTokenRef.current = null;
    }

    sessionRef.current = nextSession;
    setSession(nextSession);
    setMonitoringUserId(nextSession?.user.id ?? null);
  }

  function commitSignedOutState(): void {
    commitSession(null);
    setAuthError(null);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    let subscription: Subscription | null = null;
    let initialLoadFailed = false;

    try {
      const supabase = getSupabaseBrowserAuthClient();

      function subscribeToAuthStateChanges(): void {
        if (subscription || cancelled) {
          return;
        }

        const { data } = supabase.auth.onAuthStateChange(
          (event, nextSession) => {
            if (cancelled || (event === "INITIAL_SESSION" && initialLoadFailed && !nextSession)) {
              return;
            }

            if (isSignedOutSession(
              nextSession,
              ignoredSignedOutAccessTokenRef.current,
            )) {
              commitSession(null);
              setAuthError(null);
              setLoading(false);
              return;
            }

            commitSession(nextSession);
            if (event === "SIGNED_IN") {
              trackEmailConfirmedFromUrl({
                authenticated: nextSession !== null,
              });
            }
            setAuthError(null);
            setLoading(false);
          },
        );

        subscription = data.subscription;
      }

      async function loadInitialSession(): Promise<void> {
        try {
          const sessionResult = await loadSupabaseBrowserAuthSession(supabase);

          if (cancelled) {
            return;
          }

          if (!sessionResult.ok) {
            initialLoadFailed = true;
            subscribeToAuthStateChanges();
            setAuthError(sessionResult.error);
            commitSession(null);
            setLoading(false);
            return;
          }

          setAuthError(null);
          commitSession(sessionResult.session);
          trackEmailConfirmedFromUrl({
            authenticated: sessionResult.session !== null,
          });
          setLoading(false);
          subscribeToAuthStateChanges();
        } catch (error) {
          if (cancelled) {
            return;
          }

          if (isExpectedSupabaseSignedOutError(error)) {
            await clearSupabaseBrowserAuthSession(supabase);
            if (cancelled) {
              return;
            }
            commitSignedOutState();
            subscribeToAuthStateChanges();
          } else {
            initialLoadFailed = true;
            subscribeToAuthStateChanges();
            reportUnexpectedSupabaseAuthError("initialize-provider", error);
            setAuthError("Could not load auth session.");
            commitSession(null);
            setLoading(false);
          }
        }
      }

      void loadInitialSession();

      return () => {
        cancelled = true;
        subscription?.unsubscribe();
      };
    } catch {
      setAuthError("Auth is not configured.");
      commitSession(null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    let supabase: ReturnType<typeof getSupabaseBrowserAuthClient> | undefined;
    try {
      supabase = getSupabaseBrowserAuthClient();
      const signedOutAccessToken = sessionRef.current?.access_token ?? null;

      ignoredSignedOutAccessTokenRef.current = signedOutAccessToken;
      commitSession(null);
      setAuthError(null);
      setLoading(false);

      const { error } = await supabase.auth.signOut();

      if (error) {
        await clearSupabaseBrowserAuthSession(supabase);
        commitSession(null);
        if (isExpectedSupabaseSignedOutError(error)) {
          return { ok: true };
        }
        reportUnexpectedSupabaseAuthError("sign-out", error);
        return { ok: false, error: "Could not sign out." };
      }

      setAuthError(null);
      return { ok: true };
    } catch (error) {
      if (supabase) {
        await clearSupabaseBrowserAuthSession(supabase);
      }
      commitSession(null);
      if (isExpectedSupabaseSignedOutError(error)) {
        return { ok: true };
      }
      reportUnexpectedSupabaseAuthError("sign-out", error);
      return { ok: false, error: "Could not sign out." };
    }
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      authError,
      isAuthenticated: session !== null,
      loading,
      session,
      signOut,
      user: session?.user ?? null,
    }),
    [authError, loading, session, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
