"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { PublicInfoNav } from "@/components/public/PublicInfoNav";
import { Card } from "@/components/ui/Card";
import { Page, PageHeader, PageSection } from "@/components/ui/Page";
import type { TranslationKey } from "@/lib/i18n";

const sections: {
  bodyKey: TranslationKey;
  titleKey: TranslationKey;
}[] = [
  {
    titleKey: "legal.privacy.overviewTitle",
    bodyKey: "legal.privacy.overviewBody",
  },
  {
    titleKey: "legal.privacy.dataTitle",
    bodyKey: "legal.privacy.dataBody",
  },
  {
    titleKey: "legal.privacy.localTitle",
    bodyKey: "legal.privacy.localBody",
  },
  {
    titleKey: "legal.privacy.cloudTitle",
    bodyKey: "legal.privacy.cloudBody",
  },
  {
    titleKey: "legal.privacy.aiTitle",
    bodyKey: "legal.privacy.aiBody",
  },
  {
    titleKey: "legal.privacy.backupsTitle",
    bodyKey: "legal.privacy.backupsBody",
  },
  {
    titleKey: "legal.privacy.contactTitle",
    bodyKey: "legal.privacy.contactBody",
  },
];

export default function PrivacyPolicyPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <Page>
        <PageHeader
          title={t("legal.privacyTitle")}
          description={t("legal.privacyDescription")}
        />

        <PageSection className="space-y-4">
          <PublicInfoNav />

          <Card className="space-y-6 p-6">
            {sections.map((section) => (
              <section key={section.titleKey}>
                <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                  {t(section.titleKey)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {t(section.bodyKey)}
                </p>
              </section>
            ))}
          </Card>
        </PageSection>
      </Page>
    </main>
  );
}
