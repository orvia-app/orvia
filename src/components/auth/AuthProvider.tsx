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
} from "@/lib/supabase/auth";

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
      return;
    }

    if (nextSession) {
      ignoredSignedOutAccessTokenRef.current = null;
    }

    sessionRef.current = nextSession;
    setSession(nextSession);
  }

  function commitSignedOutState(): void {
    commitSession(null);
    setAuthError(null);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    let subscription: Subscription | null = null;

    try {
      const supabase = getSupabaseBrowserAuthClient();

      function subscribeToAuthStateChanges(): void {
        if (subscription || cancelled) {
          return;
        }

        const { data } = supabase.auth.onAuthStateChange(
          (_event, nextSession) => {
            if (cancelled) {
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
            setAuthError(null);
            setLoading(false);
          },
        );

        subscription = data.subscription;
      }

      async function loadInitialSession(): Promise<void> {
        try {
          const { error: initializeError } = await supabase.auth.initialize();

          if (cancelled) {
            return;
          }

          if (initializeError) {
            if (isExpectedSupabaseSignedOutError(initializeError)) {
              await clearSupabaseBrowserAuthSession(supabase);
              commitSignedOutState();
              subscribeToAuthStateChanges();
            } else {
              setAuthError("Could not load auth session.");
              commitSession(null);
              setLoading(false);
            }

            return;
          }

          const { data: sessionData, error } =
            await supabase.auth.getSession();

          if (cancelled) {
            return;
          }

          if (error) {
            if (isExpectedSupabaseSignedOutError(error)) {
              await clearSupabaseBrowserAuthSession(supabase);
              commitSignedOutState();
              subscribeToAuthStateChanges();
            } else {
              setAuthError("Could not load auth session.");
              commitSession(null);
              setLoading(false);
            }

            return;
          }

          setAuthError(null);
          commitSession(sessionData.session ?? null);
          setLoading(false);
          subscribeToAuthStateChanges();
        } catch (error) {
          if (cancelled) {
            return;
          }

          if (isExpectedSupabaseSignedOutError(error)) {
            await clearSupabaseBrowserAuthSession(supabase);
            commitSignedOutState();
            subscribeToAuthStateChanges();
          } else {
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
    try {
      const supabase = getSupabaseBrowserAuthClient();
      const signedOutAccessToken = sessionRef.current?.access_token ?? null;

      ignoredSignedOutAccessTokenRef.current = signedOutAccessToken;
      commitSession(null);
      setAuthError(null);
      setLoading(false);

      const { error } = await supabase.auth.signOut();

      if (error) {
        await clearSupabaseBrowserAuthSession(supabase);
        commitSession(null);
        return { ok: false, error: "Could not sign out." };
      }

      let nextSession: Session | null = null;

      try {
        const { data } = await supabase.auth.getSession();
        nextSession = data.session ?? null;
      } catch (error) {
        if (isExpectedSupabaseSignedOutError(error)) {
          await clearSupabaseBrowserAuthSession(supabase);
          commitSignedOutState();
          return { ok: true };
        }

        throw error;
      }

      if (isSignedOutSession(nextSession, signedOutAccessToken)) {
        await clearSupabaseBrowserAuthSession(supabase);
        commitSession(null);
      } else {
        commitSession(nextSession);
      }

      setAuthError(null);
      return { ok: true };
    } catch {
      commitSession(null);
      return { ok: false, error: "Auth is not configured." };
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
