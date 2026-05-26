"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Brain, Loader2, Send } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

const INITIAL_ASSISTANT =
  "This local preview shows how Archflow can become a contextual workspace assistant. Responses are deterministic until the server-side AI layer exists.";

const THINKING_MS = 800;

const quickPrompts = [
  "Plan my day",
  "What did I forget?",
  "What should I prioritize?",
  "Check cars",
  "Learning progress",
  "Finance summary",
] as const;

function deterministicAssistantReply(userText: string): string {
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

    return "Use Archflow as your operating layer: capture the loose input, turn it into a task or note, then use Search, Timeline, and Memory Preview to keep the context visible.";
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
      const reply = deterministicAssistantReply(text);
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
      <div className="flex min-h-[70vh] flex-col px-4 py-6 sm:min-h-[75vh] sm:p-10">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800">
              <Brain className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Assistant
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                A local deterministic preview of the future workspace command
                layer.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {quickPrompts.map((label) => (
              <button
                key={label}
                type="button"
                disabled={busy}
                onClick={() => handleChip(label)}
                className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm shadow-zinc-950/[0.02] ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 hover:text-zinc-950 hover:ring-zinc-300 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-950/80 dark:text-zinc-300 dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white dark:hover:ring-zinc-700 sm:text-sm"
              >
                {label}
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
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-zinc-950 px-4 py-3 text-sm leading-relaxed text-white shadow-sm shadow-zinc-950/10 sm:text-[15px] dark:bg-zinc-100 dark:text-zinc-950"
                        : "max-w-[85%] rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-zinc-800 sm:text-[15px] dark:bg-zinc-900/80 dark:text-zinc-200"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {busy ? (
                <div className="flex justify-start">
                  <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400">
                    <Loader2
                      className="h-4 w-4 shrink-0 animate-spin text-zinc-500"
                      aria-hidden
                    />
                    <span>Thinking…</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-zinc-50/80 p-4 ring-1 ring-inset ring-zinc-200/70 dark:bg-black/30 dark:ring-zinc-800/70 sm:p-6">
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
                  placeholder="Ask about your local workspace preview..."
                  disabled={busy}
                  className="min-h-[2.75rem] flex-1 resize-y rounded-xl bg-white px-4 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 outline-none ring-1 ring-zinc-200/80 transition focus:ring-2 focus:ring-zinc-300 disabled:opacity-50 dark:bg-black/60 dark:text-white dark:ring-zinc-800 dark:focus:ring-zinc-700 sm:text-[15px]"
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
              <p className="mt-2 text-center text-[11px] text-zinc-500 sm:text-left dark:text-zinc-600">
                Local preview · Enter to send · Shift+Enter for a new line
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
