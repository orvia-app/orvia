"use client";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader, PageSection } from "@/components/ui/Page";

const faqs = [
  {
    question: "What is Orvia?",
    answer:
      "Orvia is a personal operating system for capturing work, notes, inbox items, and activity so you can turn scattered context into action.",
  },
  {
    question: "How does Inbox work?",
    answer:
      "Inbox is the place to drop unstructured thoughts, requests, ideas, and reminders before you decide whether they should become tasks or notes.",
  },
  {
    question: "How do captures become tasks?",
    answer:
      "Open Inbox, review a capture, and choose Convert to Task. Orvia creates the task and keeps the capture processing explicit.",
  },
  {
    question: "What does saved on this device mean?",
    answer:
      "Some signed-out or offline data is stored in this browser. It is useful for quick capture, but it does not follow you across devices.",
  },
  {
    question: "What is cloud sync?",
    answer:
      "When signed in, supported tasks, notes, captures, and activity can be saved to your account. If sync is unavailable, Orvia may keep a device copy until you can retry.",
  },
  {
    question: "What data stays local?",
    answer:
      "Theme, onboarding state, command history, Labs modules, and some recovery/cache data remain on this device today.",
  },
  {
    question: "What is Timeline?",
    answer:
      "Timeline is your activity history for supported cloud-backed actions such as creating or updating tasks, notes, captures, and imports.",
  },
  {
    question: "How do backups work?",
    answer:
      "Create Backup downloads an Orvia backup file for supported workspace data saved on this device. Restore is planned and is not available yet.",
  },
  {
    question: "How do I reset local data?",
    answer:
      "Go to Settings, then Local data reset. This clears Orvia data stored in this browser only and does not delete cloud records.",
  },
  {
    question: "How do I contact support?",
    answer:
      "During early beta, contact support through the channel where you received your Orvia invite.",
  },
] as const;

export default function HelpCenterPage() {
  return (
    <AppShell>
      <Page>
        <PageHeader
          title="Help Center"
          description="Answers for the current Orvia beta experience."
        />

        <PageSection>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.question} className="p-5">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {faq.question}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {faq.answer}
                </p>
              </Card>
            ))}
          </div>
        </PageSection>
      </Page>
    </AppShell>
  );
}
