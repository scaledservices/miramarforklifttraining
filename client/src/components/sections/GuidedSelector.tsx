import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Monitor,
  Wrench,
  Users,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Star,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Step = "type" | "location";

interface TrainingOption {
  id: string;
  icon: typeof Monitor;
  titleKey: string;
  descKey: string;
  href: string;
  color: string;
  bgColor: string;
  recommended?: boolean;
  features: string[];
}

interface LocationOption {
  id: string;
  labelKey: string;
  href: string;
}

const locations: LocationOption[] = [
  { id: "san-diego", labelKey: "guidedSelector.sanDiego", href: "/locations/san-diego" },
];

export default function GuidedSelector() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("type");
  const [, navigate] = useLocation();

  const trainingOptions: TrainingOption[] = [
    {
      id: "online",
      icon: Monitor,
      titleKey: "guidedSelector.onlineTitle",
      descKey: "guidedSelector.onlineDesc",
      href: "/p/online-forklift-operator-training",
      color: "text-accent",
      bgColor: "bg-accent/10",
      recommended: true,
      features: [
        "guidedSelector.onlineFeature1",
        "guidedSelector.onlineFeature2",
        "guidedSelector.onlineFeature3",
      ],
    },
    {
      id: "hands-on",
      icon: Wrench,
      titleKey: "guidedSelector.handsOnTitle",
      descKey: "guidedSelector.handsOnDesc",
      href: "/hands-on-training",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      features: [
        "guidedSelector.handsOnFeature1",
        "guidedSelector.handsOnFeature2",
        "guidedSelector.handsOnFeature3",
      ],
    },
    {
      id: "team",
      icon: Users,
      titleKey: "guidedSelector.teamTitle",
      descKey: "guidedSelector.teamDesc",
      href: "/p/online-forklift-operator-training?seats=5",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      features: [
        "guidedSelector.teamFeature1",
        "guidedSelector.teamFeature2",
        "guidedSelector.teamFeature3",
      ],
    },
  ];

  function handleOptionClick(option: TrainingOption) {
    if (option.id === "hands-on") {
      setStep("location");
    } else {
      navigate(option.href);
    }
  }

  function handleLocationClick(loc: LocationOption) {
    navigate(loc.href);
  }

  return (
    <section className="py-16 md:py-20 bg-card" data-testid="guided-selector">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-accent text-sm font-semibold uppercase tracking-wider">
            {t("guidedSelector.sectionLabel")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
            {step === "type"
              ? t("guidedSelector.title")
              : t("guidedSelector.locationTitle")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {step === "type"
              ? t("guidedSelector.subtitle")
              : t("guidedSelector.locationSubtitle")}
          </p>
        </div>

        {step === "type" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {trainingOptions.map((option) => {
              const isRecommended = option.recommended;

              return (
                <button
                  key={option.id}
                  type="button"
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
                  onClick={() => handleOptionClick(option)}
                  data-testid={`selector-option-${option.id}`}
                  aria-label={t(option.titleKey)}
                >
                  <Card
                    className={`group relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg h-full ${
                      isRecommended
                        ? "border-2 border-accent shadow-md ring-1 ring-accent/20"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-1.5">
                        <Star className="w-3 h-3 fill-current" />
                        {t("common.mostPopular")}
                      </div>
                    )}
                    <CardContent className={`p-6 flex flex-col h-full ${isRecommended ? "pt-10" : ""}`}>
                      <div className={`w-14 h-14 rounded-xl ${option.bgColor} flex items-center justify-center mb-5`}>
                        <option.icon className={`w-7 h-7 ${option.color}`} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{t(option.titleKey)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                        {t(option.descKey)}
                      </p>

                      <ul className="space-y-2 mb-6 flex-1">
                        {option.features.map((featureKey) => (
                          <li key={featureKey} className="flex items-center gap-2 text-sm">
                            <CheckCircle className={`w-4 h-4 shrink-0 ${option.color}`} />
                            <span className="text-muted-foreground">{t(featureKey)}</span>
                          </li>
                        ))}
                      </ul>

                      <div
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                          isRecommended
                            ? "bg-accent text-accent-foreground"
                            : "border border-input bg-background hover:bg-accent/5"
                        }`}
                        data-testid={`selector-cta-${option.id}`}
                        aria-hidden="true"
                      >
                        {option.id === "hands-on"
                          ? t("guidedSelector.chooseLocation")
                          : option.id === "team"
                          ? t("cta.trainYourCrew")
                          : t("cta.getCertifiedNow")}
                        <ArrowRight className="w-4 h-4" />
                      </div>

                      {isRecommended && (
                        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3 text-accent" />
                          <span>{t("guidedSelector.startIn2Hours")}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {step === "location" && (
          <div className="max-w-3xl mx-auto">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded px-2 py-1"
              onClick={() => setStep("type")}
              data-testid="selector-back-to-type"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
                  onClick={() => handleLocationClick(loc)}
                  data-testid={`selector-location-${loc.id}`}
                  aria-label={t(loc.labelKey)}
                >
                  <Card className="group cursor-pointer border-border hover:border-accent hover:shadow-md transition-all duration-200 h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{t(loc.labelKey)}</h3>
                      <div
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-colors"
                        data-testid={`selector-location-cta-${loc.id}`}
                        aria-hidden="true"
                      >
                        {t("guidedSelector.viewTraining")}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>

            <div className="text-center mt-6">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent underline-offset-4 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded px-2 py-1"
                onClick={() => navigate("/request-onsite-training")}
                data-testid="selector-onsite-link"
              >
                {t("guidedSelector.needOnsiteTraining")}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
