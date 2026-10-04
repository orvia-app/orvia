"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Input, Select } from "@/components/ui/Field";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));
const TIME_PATTERN = "(?:[01][0-9]|2[0-3]):[0-5][0-9]";
const POPOVER_HEIGHT = 100;
const POPOVER_WIDTH = 224;
const VIEWPORT_GAP = 8;

export function withSelectedTimePart(current: string, part: "hour" | "minute", selected: string, fallback: string): string {
  const valid = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(current) ? current : fallback;
  const [hour, minute] = valid.split(":");
  return part === "hour" ? `${selected}:${minute}` : `${hour}:${selected}`;
}

type Props = {
  id: string;
  label: string;
  value: string;
  fallback: string;
  disabled: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  onChange: (value: string) => void;
};

type Position = { top: number; left: number; width: number };

export function timePopoverPosition(rect: Pick<DOMRect, "top" | "bottom" | "left">, viewportWidth: number, viewportHeight: number): Position {
  const width = Math.min(POPOVER_WIDTH, viewportWidth - VIEWPORT_GAP * 2);
  const roomBelow = viewportHeight - rect.bottom - VIEWPORT_GAP;
  const top = roomBelow >= POPOVER_HEIGHT || roomBelow >= rect.top - VIEWPORT_GAP
    ? rect.bottom + 4 : rect.top - POPOVER_HEIGHT - 4;
  return {
    top: Math.max(VIEWPORT_GAP, Math.min(top, viewportHeight - POPOVER_HEIGHT - VIEWPORT_GAP)),
    left: Math.max(VIEWPORT_GAP, Math.min(rect.left, viewportWidth - width - VIEWPORT_GAP)),
    width,
  };
}

export function EventTimeField({ id, label, value, fallback, disabled, open, onOpen, onClose, onToggle, onChange }: Props) {
  const { t } = useI18n();
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusPickerRef = useRef(false);
  const [position, setPosition] = useState<Position | null>(null);
  const current = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value) ? value : fallback;
  const [hour, minute] = current.split(":");

  useLayoutEffect(() => {
    if (!open || disabled) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    function place() {
      if (!anchor) return;
      setPosition(timePopoverPosition(anchor.getBoundingClientRect(), window.innerWidth, window.innerHeight));
    }
    function dismiss(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !anchor?.contains(target) && !panelRef.current?.contains(target)) onClose();
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [disabled, onClose, open]);

  useEffect(() => {
    if (open && position && focusPickerRef.current) {
      focusPickerRef.current = false;
      hourRef.current?.focus();
    }
  }, [open, position]);

  const selector = open && !disabled && position && typeof document !== "undefined" && createPortal(
    <div ref={panelRef} id={`${id}-options`} role="group" aria-label={`${label}: ${t("event.chooseTime")}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); onClose(); buttonRef.current?.focus(); }
        if (event.key === "Tab" && event.shiftKey && event.target === hourRef.current) {
          event.preventDefault();
          buttonRef.current?.focus();
        }
        if (event.key === "Tab" && !event.shiftKey && event.target !== hourRef.current) {
          event.preventDefault();
          const button = buttonRef.current;
          const dialog = button?.closest<HTMLElement>("[role='dialog']");
          const focusable = dialog && Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])"));
          const next = focusable && button ? focusable[focusable.indexOf(button) + 1] : null;
          onClose();
          (next ?? button)?.focus();
        }
      }}
      className="fixed z-[80] grid grid-cols-[1fr_auto_1fr] items-end gap-2 rounded-lg border border-line bg-surface p-2.5 shadow-xl"
      style={position}>
      <label className="min-w-0 text-xs text-muted">{t("event.hour")}
        <Select ref={hourRef} value={hour} onChange={(event) => onChange(withSelectedTimePart(value, "hour", event.target.value, fallback))} className="mt-1 h-9 w-full py-1 text-sm tabular-nums" aria-label={`${label}: ${t("event.hour")}`}>
          {HOURS.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
      </label>
      <span aria-hidden className="pb-2 text-sm text-muted">:</span>
      <label className="min-w-0 text-xs text-muted">{t("event.minute")}
        <Select value={minute} onChange={(event) => onChange(withSelectedTimePart(value, "minute", event.target.value, fallback))} className="mt-1 h-9 w-full py-1 text-sm tabular-nums" aria-label={`${label}: ${t("event.minute")}`}>
          {MINUTES.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
      </label>
    </div>, document.body);

  return <div className="min-w-0 text-sm font-medium text-foreground">
    <label htmlFor={id}>{label}</label>
    <div ref={anchorRef} className="mt-1.5 flex min-w-0 gap-2">
      <Input id={id} type="text" inputMode="numeric" required pattern={TIME_PATTERN} maxLength={5} placeholder="HH:mm" autoComplete="off" value={value} disabled={disabled} onFocus={onOpen} onClick={() => { focusPickerRef.current = false; onOpen(); }} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 tabular-nums" />
      <button ref={buttonRef} type="button" disabled={disabled} aria-label={`${label}: ${t("event.chooseTime")}`} aria-haspopup="true" aria-expanded={open && !disabled} aria-controls={open && !disabled ? `${id}-options` : undefined} onClick={() => { focusPickerRef.current = !open; onToggle(); }} onKeyDown={(event) => { if (event.key === "Tab" && !event.shiftKey && open) { event.preventDefault(); hourRef.current?.focus(); } }} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Clock3 className="h-4 w-4" aria-hidden /></button>
    </div>
    {selector}
  </div>;
}
