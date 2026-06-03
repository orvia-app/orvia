"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  ListChecks,
  Search,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/BrandMark";

const workflow = [
  {
    title: "Capture",
    description: "Drop tasks, notes, ideas, and reminders into one inbox.",
  },
  {
    title: "Organize",
    description: "Turn captures into tasks and notes without losing context.",
  },
  {
    title: "Prioritize",
    description: "Today highlights the work that deserves attention first.",
  },
  {
    title: "Recall",
    description: "Search and Timeline help you recover what changed and why.",
  },
] as const;

const problemPoints = [
  "Tasks spread across tools, messages, and memory.",
  "Notes hold context but rarely turn into action.",
  "Inbox items get captured once and forgotten later.",
  "Most productivity tools store information without helping you choose what matters next.",
] as const;

const audiences = [
  "Founders",
  "Product managers",
  "Freelancers / consultants",
  "Operators",
  "Knowledge workers managing many projects",
] as const;

const previewCards = [
  {
    icon: Inbox,
    label: "Inbox capture",
    title: "Research customer onboarding flow",
    description: "Captured now, ready to become a task or note later.",
  },
  {
    icon: ListChecks,
    label: "Today priority",
    title: "Do this first",
    description: "Prepare the launch checklist before the afternoon review.",
  },
  {
    icon: Search,
    label: "Search result",
    title: "Found in tasks, notes, and captures",
    description: "Recover the detail without remembering where it started.",
  },
  {
    icon: Clock3,
    label: "Timeline event",
    title: "Task created from Inbox",
    description: "Your activity history keeps the chain of context visible.",
  },
] as const;

export default function LandingPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleWaitlistSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.11),transparent_34rem),linear-gradient(180deg,#fafafa_0%,#f4f4f5_48%,#fafafa_100%)] text-zinc-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_32rem),linear-gradient(180deg,#18181b_0%,#09090b_52%,#18181b_100%)] dark:text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-950 dark:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-800 shadow-sm shadow-zinc-950/[0.04] ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-violet-200 dark:ring-zinc-800">
              <BrandMark className="h-5 w-5" />
            </span>
            Orvia
          </Link>
          <span className="hidden rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25 sm:inline-flex">
            Private Beta
          </span>
        </div>

        <nav
          aria-label="Landing navigation"
          className="flex items-center gap-2 text-sm"
        >
          <Link
            href="/login"
            className="rounded-full px-3 py-2 font-medium text-zinc-600 transition hover:bg-white/70 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-zinc-950 px-4 py-2 font-medium text-white shadow-sm shadow-zinc-950/10 transition hover:bg-violet-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-violet-100"
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-violet-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Private beta in progress
          </div>
          <h1 className="mt-6 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl lg:text-6xl">
            Capture tasks, notes, and ideas. Know what to do next.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 dark:text-zinc-300 sm:text-lg">
            Orvia helps you turn scattered tasks, notes, captures, and activity
            into a clear daily focus so your next action is always obvious.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#waitlist"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-800 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-950/10 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-violet-600 dark:hover:bg-violet-500 dark:focus-visible:ring-offset-zinc-950"
            >
              Notify me when beta opens
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </a>
            <a
              href="#demo-flow"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-zinc-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 transition hover:bg-violet-50/70 hover:text-violet-800 hover:ring-violet-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-zinc-950/70 dark:text-zinc-100 dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/20 dark:focus-visible:ring-offset-zinc-950"
            >
              View demo flow
            </a>
          </div>
        </div>

        <div
          id="demo-flow"
          className="rounded-[1.75rem] border border-zinc-200/75 bg-white/80 p-3 shadow-xl shadow-zinc-950/[0.07] dark:border-zinc-800/75 dark:bg-zinc-950/55 dark:shadow-black/30"
        >
          <div className="rounded-[1.35rem] border border-zinc-200/70 bg-zinc-50/80 p-4 dark:border-zinc-800/70 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between border-b border-zinc-200/75 pb-4 dark:border-zinc-800/75">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                  Daily focus
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  What needs attention
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
                3 active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {previewCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.label}
                    className="rounded-2xl bg-white p-4 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/70 dark:bg-zinc-950/75 dark:ring-zinc-800/80"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-200/70 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/20">
                        <Icon className="h-4.5 w-4.5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                          {card.label}
                        </p>
                        <h3 className="mt-1 text-sm font-semibold text-zinc-950 dark:text-white">
                          {card.title}
                        </h3>
                        <p className="mt-1 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200/75 bg-white/62 dark:border-zinc-800/75 dark:bg-zinc-950/35">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
              The problem
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Work gets scattered faster than tools can organize it.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {problemPoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl bg-zinc-50/90 p-4 text-sm leading-6 text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-zinc-900/55 dark:text-zinc-300 dark:ring-zinc-800/75"
              >
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
            The workflow
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Capture, organize, prioritize, recall.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Orvia is built around a simple loop that turns loose context into
            visible action.
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {workflow.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl bg-white/85 p-5 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/75 dark:bg-zinc-900/60 dark:ring-zinc-800/75"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-sm font-semibold text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-2xl bg-zinc-950 p-6 text-white shadow-lg shadow-zinc-950/10 dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800">
          <p className="text-sm font-medium uppercase tracking-wide text-violet-200">
            Who it is for
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            People carrying too much context.
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Built for people who carry too much context and need a clearer next
            action.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {audiences.map((audience) => (
            <div
              key={audience}
              className="flex items-center gap-3 rounded-2xl bg-white/85 p-4 text-sm font-medium text-zinc-800 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/75 dark:bg-zinc-900/60 dark:text-zinc-100 dark:ring-zinc-800/75"
            >
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-300"
                aria-hidden
              />
              {audience}
            </div>
          ))}
        </div>
      </section>

      <section
        id="waitlist"
        className="border-t border-zinc-200/75 bg-white/70 dark:border-zinc-800/75 dark:bg-zinc-950/35"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
              Private beta
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Help shape Orvia before public launch.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Orvia is currently preparing for private beta. Tell us you are
              interested, or create an account to try the current preview today.
            </p>
          </div>

          <form
            onSubmit={handleWaitlistSubmit}
            className="rounded-2xl bg-white/90 p-5 shadow-sm shadow-zinc-950/[0.035] ring-1 ring-zinc-200/75 dark:bg-zinc-900/70 dark:ring-zinc-800/75"
          >
            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="h-11 rounded-xl bg-zinc-50 px-3 text-sm text-zinc-950 outline-none ring-1 ring-zinc-200/80 transition placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-300 dark:bg-zinc-950/70 dark:text-white dark:ring-zinc-800 dark:focus:ring-violet-500/50"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Role or what you do
                  <span className="font-normal text-zinc-500"> optional</span>
                </span>
                <input
                  type="text"
                  name="role"
                  placeholder="Founder, PM, freelancer, operator..."
                  className="h-11 rounded-xl bg-zinc-50 px-3 text-sm text-zinc-950 outline-none ring-1 ring-zinc-200/80 transition placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-300 dark:bg-zinc-950/70 dark:text-white dark:ring-zinc-800 dark:focus:ring-violet-500/50"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-violet-800 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-950/10 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-violet-600 dark:hover:bg-violet-500 dark:focus-visible:ring-offset-zinc-900"
            >
              Notify me when beta opens
            </button>
            <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
              This preview form does not submit yet. Create an account to try
              Orvia today.
            </p>
            {submitted ? (
              <p
                role="status"
                className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 ring-1 ring-violet-200/80 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/25"
              >
                Thanks. Waitlist collection will be connected soon. For now,
                create an account to try the current preview.
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Orvia - private beta in progress.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/legal/terms" className="hover:text-zinc-950 dark:hover:text-white">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-zinc-950 dark:hover:text-white">
            Privacy
          </Link>
          <Link href="/help-center" className="hover:text-zinc-950 dark:hover:text-white">
            Help Center
          </Link>
          <Link href="/login" className="hover:text-zinc-950 dark:hover:text-white">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-zinc-950 dark:hover:text-white">
            Create account
          </Link>
        </div>
      </footer>
    </main>
  );
}
