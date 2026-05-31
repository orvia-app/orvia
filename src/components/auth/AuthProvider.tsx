"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseBrowserAuthClient } from "@/lib/supabase/auth";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    try {
      const supabase = getSupabaseBrowserAuthClient();
      const { data } = supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          setSession(nextSession);
          setAuthError(null);
          setLoading(false);
        },
      );

      void supabase.auth.getSession().then(({ data: sessionData, error }) => {
        if (cancelled) {
          return;
        }

        if (error) {
          setAuthError("Could not load auth session.");
          setSession(null);
        } else {
          setAuthError(null);
          setSession(sessionData.session ?? null);
        }

        setLoading(false);
      });

      return () => {
        cancelled = true;
        data.subscription.unsubscribe();
      };
    } catch {
      setAuthError("Auth is not configured.");
      setSession(null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async (): Promise<AuthActionResult> => {
    try {
      const supabase = getSupabaseBrowserAuthClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { ok: false, error: "Could not sign out." };
      }

      setSession(null);
      setAuthError(null);
      return { ok: true };
    } catch {
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
