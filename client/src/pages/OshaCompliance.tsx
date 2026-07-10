import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import {
  ShieldCheck,
  BookOpen,
  ClipboardList,
  Users,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

// Stable ids keep data-testids locale-independent; all copy lives in
// oshaCompliance.* i18n keys (EN + ES).
const COMPLIANCE_POINTS = [
  { id: "knowledge-based-training", icon: BookOpen, titleKey: "oshaCompliance.point1Title", descKey: "oshaCompliance.point1Desc" },
  { id: "evaluation-and-testing", icon: ClipboardList, titleKey: "oshaCompliance.point2Title", descKey: "oshaCompliance.point2Desc" },
  { id: "employer-hands-on-evaluation", icon: Users, titleKey: "oshaCompliance.point3Title", descKey: "oshaCompliance.point3Desc" },
  { id: "refresher-training", icon: RefreshCw, titleKey: "oshaCompliance.point4Title", descKey: "oshaCompliance.point4Desc" },
] as const;

const TOPIC_COUNT = 22;

export default function OshaCompliance() {
  const { t } = useTranslation();
  const body = industry.regulatory.body;
  const standard = industry.regulatory.standard;

  return (
    <>
    <SEOHead
      title={t("seo.oshaCompliance.title", { body })}
      description={t("seo.oshaCompliance.description", { body, standard })}
      canonical="/osha-compliance"
    />
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8" data-testid="page-osha-compliance">
      <div className="flex items-center gap-3 flex-wrap">
        <ShieldCheck className="h-7 w-7 text-accent" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-osha-title">{t("oshaCompliance.title", { body })}</h1>
          <p className="text-muted-foreground mt-1">{t("oshaCompliance.subtitle")}</p>
        </div>
      </div>

      <Card data-testid="card-osha-overview">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="bg-green-600 border-green-600" data-testid="badge-osha-aligned">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {industry.regulatory.alignmentLabel.charAt(0).toUpperCase() + industry.regulatory.alignmentLabel.slice(1)}
            </Badge>
            <Badge variant="secondary" data-testid="badge-cfr-reference">{standard}</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("oshaCompliance.overview", { body, standard })}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" data-testid="text-compliance-heading">{t("oshaCompliance.howWeMeetHeading", { body })}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMPLIANCE_POINTS.map((point) => (
            <Card key={point.id} data-testid={`card-compliance-${point.id}`}>
              <CardContent className="py-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
                    <point.icon className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-sm">{t(point.titleKey, { body })}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(point.descKey, { body, standard, validity: industry.regulatory.certificationValidity })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card data-testid="card-training-topics">
        <CardHeader>
          <CardTitle className="text-lg">{t("oshaCompliance.topicsTitle", { body })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("oshaCompliance.topicsIntro", { standard })}
          </p>
          <div className="grid gap-2">
            {Array.from({ length: TOPIC_COUNT }, (_, i) => (
              <div key={i} className="flex items-start gap-2" data-testid={`topic-item-${i}`}>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{t(`oshaCompliance.topic${i + 1}`)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-three-part">
        <CardHeader>
          <CardTitle className="text-lg">{t("oshaCompliance.threePartTitle", { body })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("oshaCompliance.threePartIntro", { body })}
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="bg-green-600 border-green-600 shrink-0 mt-0.5">1</Badge>
              <div>
                <p className="font-semibold text-sm">{t("oshaCompliance.part1Title")}</p>
                <p className="text-sm text-muted-foreground">{t("oshaCompliance.part1Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">2</Badge>
              <div>
                <p className="font-semibold text-sm">{t("oshaCompliance.part2Title")}</p>
                <p className="text-sm text-muted-foreground">{t("oshaCompliance.part2Desc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="shrink-0 mt-0.5">3</Badge>
              <div>
                <p className="font-semibold text-sm">{t("oshaCompliance.part3Title")}</p>
                <p className="text-sm text-muted-foreground">{t("oshaCompliance.part3Desc")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-disclaimer">
        <CardContent className="py-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold">{t("oshaCompliance.disclaimerLabel")}</span>{" "}
            {t("oshaCompliance.disclaimerText", { body, standard, domain: brand.domain })}
          </p>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
