import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Monitor, Wrench, GraduationCap, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProgramCards() {
  const { t } = useTranslation();

  const programs = [
    {
      icon: Monitor,
      title: t("programCards.onlineTitle"),
      description: t("programCards.onlineDesc"),
      href: "/p/online-forklift-operator-training",
      cta: t("cta.startOnlineTraining"),
      color: "text-brand-dark",
      bgColor: "bg-primary/15",
    },
    {
      icon: Wrench,
      title: t("programCards.handsOnTitle"),
      description: t("programCards.handsOnDesc"),
      href: "/hands-on-training",
      cta: t("cta.viewHandsOnTraining"),
      color: "text-brand-dark",
      bgColor: "bg-primary/15",
    },
    {
      icon: GraduationCap,
      title: t("programCards.trainerTitle"),
      description: t("programCards.trainerDesc"),
      href: "/train-the-trainer",
      cta: t("cta.learnMore"),
      color: "text-brand-dark",
      bgColor: "bg-primary/15",
    },
    {
      icon: Building2,
      title: t("trainingPrograms.businessProducts"),
      description: t("trainingPrograms.businessProductsDesc"),
      href: "/business",
      cta: t("nav.forBusiness"),
      color: "text-brand-dark",
      bgColor: "bg-primary/15",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-card" data-testid="program-cards">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("programCards.sectionLabel")}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
            {t("programCards.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("programCards.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((program) => (
            <Card key={program.href} className="group hover-elevate border-border" data-testid={`card-program-${program.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="p-6 flex flex-col h-full">
                <div className={`w-12 h-12 rounded-lg ${program.bgColor} flex items-center justify-center mb-4`}>
                  <program.icon className={`w-6 h-6 ${program.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{program.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{program.description}</p>
                <Link href={program.href}>
                  <Button variant="outline" size="sm" className="w-full" data-testid={`button-program-${program.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {program.cta}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
