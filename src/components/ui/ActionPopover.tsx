"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { usePresence } from "@/components/ui/usePresence";

type ActionPopoverProps = {
  label: string;
  trigger?: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
};

/** Non-modal disclosure: native Tab order, Escape, outside dismissal, restored trigger. */
export function ActionPopover({ label, trigger, children, align = "end" }: ActionPopoverProps) {
  const [open, setOpen] = useState(false);
  const { present, closing } = usePresence(open);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  function close() {
    setOpen(false);
    button.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('a[href],button:not([disabled])')?.focus());
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  return <div ref={root} className={`relative ${trigger ? "w-full" : "shrink-0"}`} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }} onBlur={(event) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={button} type="button" className={trigger ? "orvia-account-trigger" : "orvia-icon-button"} aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      {trigger ?? <MoreHorizontal className="h-5 w-5" aria-hidden />}
    </button>
    {present && <div ref={panel} id={id} role="region" aria-label={label} inert={closing} data-presence={closing ? "exiting" : "entered"} className={`orvia-popover ${align === "start" ? "left-0" : "right-0"}`}>
      {children(close)}
    </div>}
  </div>;
}
