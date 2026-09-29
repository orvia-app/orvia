"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
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
    titleKey: "legal.privacy.monitoringTitle",
    bodyKey: "legal.privacy.monitoringBody",
  },
  {
    titleKey: "legal.privacy.feedbackTitle",
    bodyKey: "legal.privacy.feedbackBody",
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
    <main className="min-h-screen bg-subtle text-foreground">
      <Page>
        <LocaleSwitcher />
        <PageHeader
          title={t("legal.privacyTitle")}
          description={t("legal.privacyDescription")}
        />

        <PageSection className="space-y-4">
          <PublicInfoNav />
          <p className="text-sm text-muted">{t("legal.lastUpdated")}</p>

          <Card variant="ghost" className="mx-auto max-w-[720px] space-y-8 px-0 py-6">
            {sections.map((section) => (
              <section key={section.titleKey}>
                <h2 className="text-base font-semibold text-foreground">
                  {t(section.titleKey)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
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
