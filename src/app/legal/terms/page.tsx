import { Card } from "@/components/ui/Card";
import { Page, PageHeader, PageSection } from "@/components/ui/Page";

const sections = [
  {
    title: "Beta Product",
    body: "Orvia is an early beta product. Features may change, and some surfaces are intentionally marked as planned or coming soon.",
  },
  {
    title: "Your Responsibility",
    body: "You are responsible for the information you enter into Orvia and for reviewing tasks, notes, captures, and recommendations before acting on them.",
  },
  {
    title: "No Professional Advice",
    body: "Orvia is a productivity tool. It does not provide medical, legal, financial, tax, or professional advice.",
  },
  {
    title: "Accounts And Access",
    body: "You should keep your account credentials secure. Signed-out local data may be accessible to anyone using the same browser profile.",
  },
  {
    title: "Backups",
    body: "Orvia provides local backup export for supported data. You are responsible for storing backup files securely. Restore functionality is planned but not currently available.",
  },
  {
    title: "Availability",
    body: "Orvia may be unavailable or change during beta. Do not rely on Orvia as the only copy of critical information.",
  },
  {
    title: "Contact",
    body: "For beta access, support, or terms questions, use the contact channel where you received your Orvia invite.",
  },
] as const;

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Page>
        <PageHeader
          title="Terms of Service"
          description="Lightweight terms for the current Orvia beta."
        />

        <PageSection>
          <Card className="space-y-6 p-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {section.body}
                </p>
              </section>
            ))}
          </Card>
        </PageSection>
      </Page>
    </main>
  );
}
