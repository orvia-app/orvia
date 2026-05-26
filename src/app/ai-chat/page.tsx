"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Loader2, Send } from "lucide-react";

import { AppShell } from "@/components/AppShell";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

const INITIAL_ASSISTANT =
  "Hi, I'm your Archflow assistant. I can help plan your day, sort tasks, summarize notes, and spot what you might forget.";

const THINKING_MS = 800;

const quickPrompts = [
  "Plan my day",
  "What did I forget?",
  "What should I prioritize?",
  "Check cars",
  "Learning progress",
  "Finance summary",
] as const;

function fakeAssistantReply(userText: string): string {
  const t = userText.toLowerCase();

  if (t.includes("day") || t.includes("today")) {
    return "For today, try a three-block rhythm: deep work first, then meetings or errands, then a short review to capture loose ends. Block 25 minutes on your hardest task before noon, and leave one buffer slot for surprises so the plan stays realistic.";
  }
  if (t.includes("task")) {
    return "Prioritize by impact and deadlines: list everything, score impact 1–3 and urgency 1–3, then tackle top-right items first. Split anything over 90 minutes into substeps so momentum stays visible—small wins keep the stack moving.";
  }
  if (t.includes("finance") || t.includes("money")) {
    return "Quick finance snapshot: confirm cash runway for the next 30–60 days, list three largest recurring expenses, and flag any subscriptions you have not used in 30 days. If investments are in play, keep contributions steady and revisit allocation quarterly rather than reacting weekly.";
  }
  if (t.includes("car") || t.includes("infiniti") || t.includes("audi")) {
    return "Vehicle maintenance check: note mileage, next oil or service interval, tire pressure seasonally, and brake feel on every long drive. Set reminders for registration and insurance renewals so nothing slips when life gets busy.";
  }
  if (t.includes("learn") || t.includes("course") || t.includes("devops")) {
    return "Learning progress: anchor on one outcome per week (for example, a working container build or a CI pipeline diagram). Spend 70% of time building, 30% reading—ship a tiny artifact each session so Archflow can track real momentum, not just hours logged.";
  }

  return "I'm here to help you steer Archflow: capture what matters, trim noise, and turn scattered inputs into a calm plan. Tell me what you're trying to finish this week, and we can break it into the next three concrete moves.";
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: INITIAL_ASSISTANT },
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
      const reply = fakeAssistantReply(text);
      const aid = `${Date.now()}-a`;
      setMessages((prev) => [
        ...prev,
        { id: aid, role: "assistant", content: reply },
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
      <div className="relative flex min-h-[70vh] flex-col overflow-hidden p-6 sm:min-h-[75vh] sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(139,92,246,0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(139,92,246,0.12),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            AI Chat
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
            Ask your Archflow workspace anything.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {quickPrompts.map((label) => (
              <button
                key={label}
                type="button"
                disabled={busy}
                onClick={() => handleChip(label)}
                className="cursor-pointer rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300 dark:hover:border-violet-500/30 dark:hover:bg-zinc-900 dark:hover:text-white sm:text-sm"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-950/90 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] dark:backdrop-blur-sm">
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
                        ? "max-w-[85%] rounded-2xl rounded-br-md border border-violet-500/25 bg-gradient-to-br from-violet-600/90 to-fuchsia-700/80 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-violet-950/30 sm:text-[15px]"
                        : "max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800 sm:text-[15px] dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {busy ? (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-md border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin text-violet-600 dark:text-violet-400"
                      aria-hidden
                    />
                    <span>Thinking…</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800/90 dark:bg-black/30 sm:p-6">
              <form
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                onSubmit={handleSubmit}
              >
                <label className="sr-only" htmlFor="chat-input">
                  Message
                </label>
                <textarea
                  id="chat-input"
                  name="message"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Archflow anything..."
                  disabled={busy}
                  className="min-h-[2.75rem] flex-1 resize-y rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-50 dark:border-zinc-800 dark:bg-black/60 dark:text-white dark:focus:border-violet-500/35 dark:focus:ring-violet-500/15 sm:text-[15px]"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white sm:min-w-[5.5rem]"
                >
                  <Send className="h-4 w-4 sm:hidden" aria-hidden />
                  <span>Send</span>
                </button>
              </form>
              <p className="mt-2 text-center text-[11px] text-zinc-600 sm:text-left dark:text-zinc-600">
                Enter to send · Shift+Enter for a new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
