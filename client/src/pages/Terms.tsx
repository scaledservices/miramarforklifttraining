import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/seo/SEOHead";
import { FileText } from "lucide-react";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();
  return (
    <>
    <SEOHead
      title={t("terms.seoTitle")}
      description={t("terms.seoDescription")}
      canonical="/terms"
      noindex
    />
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8" data-testid="page-terms">
      <div className="flex items-center gap-3 flex-wrap">
        <FileText className="h-7 w-7 text-accent" />
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-terms-title">{t("terms.pageTitle")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t("terms.lastUpdated")}</p>

      <Card>
        <CardContent className="py-6 prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section data-testid="section-acceptance">
            <h2 className="text-lg font-semibold">{t("terms.section1Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section1Text", { domain: brand.domain })}
            </p>
          </section>

          <section data-testid="section-services">
            <h2 className="text-lg font-semibold">{t("terms.section2Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section2Text", { domain: brand.domain, body: industry.regulatory.body, standard: industry.regulatory.standard })}
            </p>
          </section>

          <section data-testid="section-accounts">
            <h2 className="text-lg font-semibold">{t("terms.section3Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section3Text")}
            </p>
          </section>

          <section data-testid="section-training">
            <h2 className="text-lg font-semibold">{t("terms.section4Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section4Text")}
            </p>
          </section>

          <section data-testid="section-payment">
            <h2 className="text-lg font-semibold">{t("terms.section5Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section5Text")}
            </p>
          </section>

          <section data-testid="section-ip">
            <h2 className="text-lg font-semibold">{t("terms.section6Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section6Text", { domain: brand.domain })}
            </p>
          </section>

          <section data-testid="section-liability">
            <h2 className="text-lg font-semibold">{t("terms.section7Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section7Text", { domain: brand.domain })}
            </p>
          </section>

          <section data-testid="section-revocation">
            <h2 className="text-lg font-semibold">{t("terms.section8Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section8Text")}
            </p>
          </section>

          <section data-testid="section-governing-law">
            <h2 className="text-lg font-semibold">{t("terms.section9Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section9Text")}
            </p>
          </section>

          <section data-testid="section-changes">
            <h2 className="text-lg font-semibold">{t("terms.section10Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section10Text")}
            </p>
          </section>

          <section data-testid="section-contact">
            <h2 className="text-lg font-semibold">{t("terms.section11Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("terms.section11Text", { email: brand.support.email })}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
