"use client";

import { useContext } from "react";

import { AuthSessionContext } from "@/components/auth/AuthProvider";

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthProvider.");
  }

  return context;
}
