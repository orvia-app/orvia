import { AppShell } from "@/components/AppShell";

const automations = [
  { title: "Telegram Bot", description: "Bridge updates and commands." },
  { title: "Scheduled Workflows", description: "Run routines on a cadence." },
  { title: "AI Reminders", description: "Context-aware nudges." },
];

export default function AutomationPage() {
  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Automation
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
            Connect tools and let the system work in the background.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {automations.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  {item.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.description}
                </p>
                <span className="mt-6 inline-flex w-fit rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Coming soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
