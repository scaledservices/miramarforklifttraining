import { Monitor, BookOpen, Award, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Monitor,
      step: "01",
      title: t("howItWorks.step1Title"),
      description: t("howItWorks.step1Desc"),
    },
    {
      icon: BookOpen,
      step: "02",
      title: t("howItWorks.step2Title"),
      description: t("howItWorks.step2Desc"),
    },
    {
      icon: Award,
      step: "03",
      title: t("howItWorks.step3Title"),
      description: t("howItWorks.step3Desc"),
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background" data-testid="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">{t("howItWorks.sectionLabel")}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
            {t("howItWorks.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("howItWorks.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative flex flex-col items-center text-center p-6 rounded-lg"
              data-testid={`step-${item.step}`}
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -right-4 z-10">
                  <ArrowRight className="w-8 h-8 text-border" />
                </div>
              )}
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider mb-2">{t("howItWorks.stepLabel", { number: item.step })}</span>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="button-start-online">
            <Link href="/p/online-forklift-operator-training">
              {t("cta.getCertifiedNow")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" data-testid="button-view-programs">
            <Link href="/training-programs">
              {t("cta.viewAllPrograms")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
