"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { PublicInfoNav } from "@/components/public/PublicInfoNav";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader, PageSection } from "@/components/ui/Page";
import type { TranslationKey } from "@/lib/i18n";

const faqs: {
  answerKey: TranslationKey;
  questionKey: TranslationKey;
}[] = [
  {
    questionKey: "help.whatIs.question",
    answerKey: "help.whatIs.answer",
  },
  {
    questionKey: "help.inbox.question",
    answerKey: "help.inbox.answer",
  },
  {
    questionKey: "help.captures.question",
    answerKey: "help.captures.answer",
  },
  {
    questionKey: "help.device.question",
    answerKey: "help.device.answer",
  },
  {
    questionKey: "help.sync.question",
    answerKey: "help.sync.answer",
  },
  {
    questionKey: "help.local.question",
    answerKey: "help.local.answer",
  },
  {
    questionKey: "help.timeline.question",
    answerKey: "help.timeline.answer",
  },
  {
    questionKey: "help.backups.question",
    answerKey: "help.backups.answer",
  },
  {
    questionKey: "help.reset.question",
    answerKey: "help.reset.answer",
  },
  {
    questionKey: "help.support.question",
    answerKey: "help.support.answer",
  },
];

export default function HelpCenterPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Page>
        <PageHeader
          title={t("help.title")}
          description={t("help.description")}
        />

        <PageSection className="space-y-4">
          <PublicInfoNav />

          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.questionKey} className="p-5">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {t(faq.questionKey)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {t(faq.answerKey)}
                </p>
              </Card>
            ))}
          </div>
        </PageSection>
      </Page>
    </main>
  );
}
