import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BookOpen, ClipboardCheck, UserCheck, Users, Presentation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const documentDefs = [
  { id: "osha-rules-regulations", titleKey: "docs.docOshaTitle", descKey: "docs.docOshaDesc", icon: FileText, catKey: "docs.catCompliance" },
  { id: "sample-test", titleKey: "docs.docSampleTestTitle", descKey: "docs.docSampleTestDesc", icon: BookOpen, catKey: "docs.catTraining" },
  { id: "pre-operation-checklist", titleKey: "docs.docChecklistTitle", descKey: "docs.docChecklistDesc", icon: ClipboardCheck, catKey: "docs.catForms" },
  { id: "performance-evaluation", titleKey: "docs.docPerformanceTitle", descKey: "docs.docPerformanceDesc", icon: ClipboardCheck, catKey: "docs.catForms" },
  { id: "operator-permit", titleKey: "docs.docPermitTitle", descKey: "docs.docPermitDesc", icon: UserCheck, catKey: "docs.catForms" },
  { id: "attendance-sheet", titleKey: "docs.docAttendanceTitle", descKey: "docs.docAttendanceDesc", icon: Users, catKey: "docs.catForms" },
  { id: "site-presentation", titleKey: "docs.docPresentationTitle", descKey: "docs.docPresentationDesc", icon: Presentation, catKey: "docs.catTraining" },
];

export default function Documentation() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const interpVars = { body: industry.regulatory.body, standard: industry.regulatory.standard };

  const handleDownload = async (docId: string) => {
    const locale = i18n.language === "es" ? "es" : "en";
    try {
      const resp = await fetch(`/api/documents/${docId}/download?locale=${locale}`);
      if (!resp.ok) throw new Error(t("groupCertsExtra.downloadFailed"));
      const isFallback = resp.headers.get("X-Locale-Fallback") === "true";
      if (isFallback) {
        toast({
          title: t("documents.fallbackTitle", "English version"),
          description: t("documents.fallbackDescription", "This document is not yet available in your language. The English version has been provided."),
        });
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const disposition = resp.headers.get("Content-Disposition");
      const filename = disposition?.match(/filename="?(.+?)"?$/)?.[1] || `${docId}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      const link = document.createElement("a");
      link.href = `/api/documents/${docId}/download?locale=${locale}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <SEOHead
        title={t("seo.documentation.title", { brand: brand.name })}
        description={t("seo.documentation.description", { brand: brand.name, body: industry.regulatory.body })}
        canonical="/documentation"
      />
      <Hero
        image="/images/certification-success.jpg"
        title={t("docs.heroTitle")}
        subtitle={t("docs.heroSubtitle")}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 mb-12">
            {documentDefs.map((doc) => (
              <Card key={doc.id} className="border-border hover-elevate" data-testid={`doc-${doc.id}`}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <doc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm">{t(doc.titleKey, interpVars)}</h3>
                      <span className="text-xs text-muted-foreground">({t(doc.catKey)})</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t(doc.descKey, interpVars)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc.id)}
                    data-testid={`button-download-${doc.id}`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {t("docs.download")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTABand
        title={t("docs.ctaTitle")}
        subtitle={t("docs.ctaSubtitle")}
        primaryCta={{ label: t("docs.ctaButton"), href: "/contact" }}
      />
    </>
  );
}
