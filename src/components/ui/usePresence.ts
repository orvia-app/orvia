"use client";

import { useEffect, useState } from "react";

/** Keep an exiting overlay mounted briefly; reduced motion closes immediately. */
export function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMounted(false);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), 160);
    return () => window.clearTimeout(timer);
  }, [open]);
  return { present: open || mounted, closing: !open };
}
