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
    titleKey: "legal.terms.betaTitle",
    bodyKey: "legal.terms.betaBody",
  },
  {
    titleKey: "legal.terms.responsibilityTitle",
    bodyKey: "legal.terms.responsibilityBody",
  },
  {
    titleKey: "legal.terms.noAdviceTitle",
    bodyKey: "legal.terms.noAdviceBody",
  },
  {
    titleKey: "legal.terms.accountsTitle",
    bodyKey: "legal.terms.accountsBody",
  },
  {
    titleKey: "legal.terms.backupsTitle",
    bodyKey: "legal.terms.backupsBody",
  },
  {
    titleKey: "legal.terms.availabilityTitle",
    bodyKey: "legal.terms.availabilityBody",
  },
  {
    titleKey: "legal.terms.contactTitle",
    bodyKey: "legal.terms.contactBody",
  },
];

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-subtle text-foreground">
      <Page>
        <LocaleSwitcher />
        <PageHeader
          title={t("legal.termsTitle")}
          description={t("legal.termsDescription")}
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
