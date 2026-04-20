import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/seo/SEOHead";
import { Shield } from "lucide-react";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();
  return (
    <>
    <SEOHead
      title={t("privacy.seoTitle")}
      description={t("privacy.seoDescription")}
      canonical="/privacy"
      noindex
    />
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8" data-testid="page-privacy">
      <div className="flex items-center gap-3 flex-wrap">
        <Shield className="h-7 w-7 text-accent" />
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-privacy-title">{t("privacy.pageTitle")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>

      <Card>
        <CardContent className="py-6 prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section data-testid="section-overview">
            <h2 className="text-lg font-semibold">{t("privacy.section1Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section1Text", { domain: brand.domain })}
            </p>
          </section>

          <section data-testid="section-information-collected">
            <h2 className="text-lg font-semibold">{t("privacy.section2Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section2Text")}
            </p>
          </section>

          <section data-testid="section-how-used">
            <h2 className="text-lg font-semibold">{t("privacy.section3Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section3Text")}
            </p>
          </section>

          <section data-testid="section-sharing">
            <h2 className="text-lg font-semibold">{t("privacy.section4Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section4Text")}
            </p>
          </section>

          <section data-testid="section-security">
            <h2 className="text-lg font-semibold">{t("privacy.section5Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section5Text")}
            </p>
          </section>

          <section data-testid="section-retention">
            <h2 className="text-lg font-semibold">{t("privacy.section6Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section6Text", { body: industry.regulatory.body })}
            </p>
          </section>

          <section data-testid="section-cookies">
            <h2 className="text-lg font-semibold">{t("privacy.section7Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section7Text")}
            </p>
          </section>

          <section data-testid="section-rights">
            <h2 className="text-lg font-semibold">{t("privacy.section8Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section8Text")}
            </p>
          </section>

          <section data-testid="section-children">
            <h2 className="text-lg font-semibold">{t("privacy.section9Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section9Text")}
            </p>
          </section>

          <section data-testid="section-changes">
            <h2 className="text-lg font-semibold">{t("privacy.section10Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section10Text")}
            </p>
          </section>

          <section data-testid="section-contact">
            <h2 className="text-lg font-semibold">{t("privacy.section11Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("privacy.section11Text", { email: brand.support.email })}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
