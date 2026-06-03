import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader, PageSection } from "@/components/ui/Page";

const sections = [
  {
    title: "Overview",
    body: "This Privacy Policy describes how Orvia handles data during the early beta. Orvia is still evolving, and some features save data on this device while others save supported records to your account.",
  },
  {
    title: "Data You Provide",
    body: "You may create tasks, notes, captures, and activity through the product. Signed-in cloud-backed records are associated with your account. Signed-out and fallback records may remain in this browser.",
  },
  {
    title: "Local Data",
    body: "Some data remains in browser storage, including theme preference, onboarding state, command history, Labs data, and device recovery/cache data. Clearing browser storage or using Settings reset can remove local data.",
  },
  {
    title: "Cloud Data",
    body: "When signed in, supported tasks, notes, captures, and activities are stored with your Orvia account. Orvia uses account ownership checks and Supabase row-level security policies for supported cloud records.",
  },
  {
    title: "AI And Integrations",
    body: "Production AI and third-party integrations are not active unless clearly introduced later. Orvia does not currently send your workspace data to AI providers from the browser.",
  },
  {
    title: "Backups And Reset",
    body: "Create Backup exports supported workspace data saved on this device to an Orvia backup file. Local reset clears Orvia browser data only. Cloud account deletion/export controls are planned for a later backend phase.",
  },
  {
    title: "Contact",
    body: "For early beta privacy questions, use the support or invite channel through which you received access to Orvia.",
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <AppShell>
      <Page>
        <PageHeader
          title="Privacy Policy"
          description="Early beta privacy terms for Orvia."
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
    </AppShell>
  );
}
