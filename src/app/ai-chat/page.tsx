"use client";
import { Textarea } from "@/components/ui/Field";


import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Brain, Loader2, Send } from "lucide-react";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { TranslationKey } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  translationKey?: TranslationKey;
};

const THINKING_MS = 800;
const quickPrompts = ["assistant.promptDay", "assistant.promptForgot", "assistant.promptPriority", "assistant.promptCars", "assistant.promptLearning", "assistant.promptFinance"] as const;
function deterministicAssistantReply(text: string): TranslationKey {
  const input = text.toLowerCase();
  if (/day|today|день|сьогодні/.test(input)) return "assistant.replyDay";
  if (/task|priorit|завдан|зосеред/.test(input)) return "assistant.replyTasks";
  if (/finance|money|фінанс|грош/.test(input)) return "assistant.replyFinance";
  if (/car|авто/.test(input)) return "assistant.replyCars";
  if (/learn|course|навчан|курс/.test(input)) return "assistant.replyLearning";
  return "assistant.replyDefault";
}

export default function AiChatPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: "", translationKey: "assistant.welcome" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, busy]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback((raw: string): boolean => {
    const text = raw.trim();
    if (!text || busyRef.current) return false;

    busyRef.current = true;
    setBusy(true);

    const userId = `${Date.now()}-u`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: text },
    ]);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const reply = deterministicAssistantReply(text);
      const aid = `${Date.now()}-a`;
      setMessages((prev) => [
        ...prev,
        { id: aid, role: "assistant", content: "", translationKey: reply },
      ]);
      setBusy(false);
      busyRef.current = false;
      timeoutRef.current = null;
    }, THINKING_MS);

    return true;
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sendMessage(input)) {
      setInput("");
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (sendMessage(input)) {
        setInput("");
      }
    }
  }

  function handleChip(text: string) {
    sendMessage(text);
  }

  return (
    <AppShell>
      <div className="flex min-h-[70vh] flex-col px-4 py-6 sm:min-h-[75vh] sm:p-10">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-subtle text-foreground ring-1 ring-line">
              <Brain className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("assistant.title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
                {t("assistant.description")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {quickPrompts.map((label) => (
              <button
                key={t(label)}
                type="button"
                disabled={busy}
                onClick={() => handleChip(t(label))}
                className="cursor-pointer rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-line transition hover:bg-zinc-50 hover:text-zinc-950 hover:ring-zinc-300 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:ring-zinc-700 sm:text-sm"
              >
                {t(label)}
              </button>
            ))}
          </div>

          <Card className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <div
              ref={scrollRef}
              className="app-scrollbar min-h-[280px] flex-1 space-y-4 overflow-y-auto p-4 sm:min-h-[320px] sm:p-6"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user" ? "flex justify-end" : "flex justify-start"
                  }
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] break-words rounded-xl rounded-br-md bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-white shadow-zinc-950/10 sm:text-[15px] dark:bg-zinc-100 dark:text-zinc-950"
                        : "max-w-[85%] break-words rounded-xl rounded-bl-md bg-subtle px-4 py-3 text-sm leading-relaxed text-foreground sm:text-[15px]"
                    }
                  >
                    {m.translationKey ? t(m.translationKey) : m.content}
                  </div>
                </div>
              ))}

              {busy ? (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] items-center gap-2 rounded-xl rounded-bl-md bg-subtle px-4 py-3 text-sm text-muted">
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin text-zinc-500"
                      aria-hidden
                    />
                    <span>{t("assistant.thinking")}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-subtle p-4 ring-1 ring-inset ring-line sm:p-6">
              <form
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                onSubmit={handleSubmit}
              >
                <label className="sr-only" htmlFor="chat-input">
                  {t("assistant.message")}
                </label>
                <Textarea
                  id="chat-input"
                  name="message"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("assistant.placeholder")}
                  disabled={busy}
                  className="min-h-[2.75rem] flex-1"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:min-w-[5.5rem]"
                >
                  <Send className="h-4 w-4 sm:hidden" aria-hidden />
                  <span>{t("assistant.send")}</span>
                </button>
              </form>
              <p className="mt-2 text-center text-[11px] text-zinc-500 sm:text-left dark:text-zinc-600">
                {t("assistant.hint")}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
