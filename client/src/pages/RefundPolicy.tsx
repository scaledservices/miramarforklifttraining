import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEOHead from "@/components/seo/SEOHead";
import { ReceiptText, AlertTriangle } from "lucide-react";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { useTranslation } from "react-i18next";

export default function RefundPolicy() {
  const { t } = useTranslation();
  return (
    <>
    <SEOHead
      title={t("refundPolicy.seoTitle")}
      description={t("refundPolicy.seoDescription")}
      canonical="/refund-policy"
      noindex
    />
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8" data-testid="page-refund-policy">
      <div className="flex items-center gap-3 flex-wrap">
        <ReceiptText className="h-7 w-7 text-accent" />
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-refund-title">{t("refundPolicy.pageTitle")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t("refundPolicy.lastUpdated")}</p>

      <Card className="border-destructive/30">
        <CardContent className="py-6 flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-destructive" data-testid="text-revocation-warning">
              {t("refundPolicy.warningTitle")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.warningText").replace(/<\/?[0-9]+>/g, "")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6 prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section data-testid="section-eligibility">
            <h2 className="text-lg font-semibold">{t("refundPolicy.section1Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.section1Text")}
            </p>
          </section>

          <section data-testid="section-post-certification">
            <h2 className="text-lg font-semibold">{t("refundPolicy.section2Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.section2Text")}
            </p>
          </section>

          <section data-testid="section-process">
            <h2 className="text-lg font-semibold">{t("refundPolicy.section3Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.section3Text", { email: brand.support.email })}
            </p>
          </section>

          <section data-testid="section-wallet-cards">
            <h2 className="text-lg font-semibold">{t("refundPolicy.section4Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.section4Text")}
            </p>
          </section>

          <section data-testid="section-group-purchases">
            <h2 className="text-lg font-semibold">{t("refundPolicy.section5Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.section5Text")}
            </p>
          </section>

          <section data-testid="section-training-deposits">
            <h2 className="text-lg font-semibold">{t("refundPolicy.depositTitle")}</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("refundPolicy.depositText1")}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("refundPolicy.depositText2")}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("refundPolicy.depositText3")}
              </p>
            </div>
          </section>

          <section data-testid="section-exceptions">
            <h2 className="text-lg font-semibold">{t("refundPolicy.section6Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.section6Text", { body: industry.regulatory.body })}
            </p>
          </section>

          <section data-testid="section-contact">
            <h2 className="text-lg font-semibold">{t("refundPolicy.section7Title")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("refundPolicy.section7Text", { email: brand.support.email })}
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
