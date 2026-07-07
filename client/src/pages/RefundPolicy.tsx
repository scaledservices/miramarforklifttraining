import { Card, CardContent } from "@/components/ui/card";
import { ReceiptText, Phone, Mail } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
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
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8" data-testid="page-refund-policy">
      <div className="flex items-center gap-3 flex-wrap">
        <ReceiptText className="h-7 w-7 text-accent" />
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-refund-title">{t("refundPolicy.pageTitle")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t("refundPolicy.lastUpdated")}</p>

      <Card>
        <CardContent className="py-8 prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section data-testid="section-case-by-case">
            <p className="text-base text-foreground leading-relaxed">
              {t("refundPolicy.caseByCaseText", { phone: brand.support.phone, email: brand.support.email })}
            </p>
          </section>

          <section data-testid="section-contact" className="pt-4 border-t">
            <h2 className="text-lg font-semibold mb-3">{t("refundPolicy.contactTitle")}</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-dark shrink-0" />
                <a href={`tel:${brand.support.phoneTel}`} className="hover:text-brand-dark">
                  {brand.support.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-dark shrink-0" />
                <a href={`mailto:${brand.support.email}`} className="hover:text-brand-dark">
                  {brand.support.email}
                </a>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
