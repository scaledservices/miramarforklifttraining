import { useTranslation } from "react-i18next";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import SEOHead from "@/components/seo/SEOHead";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MapPin, Clock, Phone, Users, Award, Shield } from "lucide-react";

const COURSE_KEYS = [
  { key: "standard", price: 200, slug: "standard-forklift-certification-san-diego", equipmentKeys: ["counterbalanceForklift"] },
  { key: "reachForklift", price: 280, slug: "reach-forklift-training-san-diego", equipmentKeys: ["counterbalanceForklift", "reachTruck"] },
  { key: "orderPickerForklift", price: 280, slug: "order-picker-forklift-training-san-diego", equipmentKeys: ["counterbalanceForklift", "orderPicker"] },
  { key: "forkliftScissorEpj", price: 300, slug: "forklift-scissor-lift-epj-certification-san-diego", equipmentKeys: ["counterbalanceForklift", "scissorLift", "electricPalletJack"] },
  { key: "fullMultiEquipment", price: 350, slug: "complete-equipment-certification-san-diego", equipmentKeys: ["counterbalanceForklift", "reachTruck", "orderPicker", "scissorLift", "electricPalletJack"] },
  { key: "scissorAerial", price: 280, slug: "scissor-aerial-boom-lift-certification-san-diego", equipmentKeys: ["scissorLift", "aerialBoomLift"] },
] as const;

export default function InPersonTraining() {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead
        title={t("inPerson.seoTitle", { brand: brand.name })}
        description={t("inPerson.seoDesc", { brand: brand.name, body: industry.regulatory.body })}
        canonical="/in-person-training"
      />

      <Hero
        image="/images/hero-forklift.jpg"
        title={t("inPerson.heroTitle")}
        subtitle={t("inPerson.heroSubtitle")}
        primaryCta={{ label: t("home.bookTrainingCta"), href: "/book-training" }}
        secondaryCta={{ label: t("inPerson.callUs"), href: `tel:${brand.support.phoneTel}` }}
        badges={[t("hero.oshaAlignedTraining"), t("hero.sameDayCertification")]}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3" data-testid="text-course-catalog-title">{t("inPerson.catalogTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("inPerson.catalogSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSE_KEYS.map((course) => (
              <Card key={course.key} className="border-border hover:shadow-md transition-shadow" data-testid={`card-course-${course.key}`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-lg font-bold mb-1">{t(`inPerson.course.${course.key}.name`)}</h3>
                  <p className="text-2xl font-bold text-accent mb-3">${course.price}<span className="text-sm font-normal text-muted-foreground"> / {t("inPerson.perPerson")}</span></p>
                  <div className="text-sm text-muted-foreground mb-3 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {t(`inPerson.course.${course.key}.duration`)}
                  </div>
                  <div className="space-y-1.5 flex-1 mb-4">
                    {course.equipmentKeys.map((eqKey) => (
                      <div key={eqKey} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span className="text-muted-foreground">{t(`requestQuote.eq.${eqKey}`)}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={`/book-training/${course.slug}`}>
                    <Button variant="outline" className="w-full" data-testid={`button-book-${course.key}`}>
                      {t("home.bookTrainingCta")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link href="/request-quote" className="text-sm text-accent hover:underline" data-testid="link-large-group-quote">
              {t("home.largeGroupLink")}
            </Link>
          </div>

          <div className="mt-8 text-center">
            <Card className="border-accent/30 bg-accent/5 max-w-2xl mx-auto">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-bold mb-2">{t("inPerson.trainTheTrainerTitle")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("inPerson.trainTheTrainerDesc")}</p>
                <Link href="/train-the-trainer">
                  <Button variant="outline" data-testid="button-train-trainer">{t("inPerson.learnMoreTrainer")}</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">{t("inPerson.facilityTitle")}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("inPerson.address")}</p>
                    <p className="text-sm text-muted-foreground">{brand.address.full}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("inPerson.hours")}</p>
                    <p className="text-sm text-muted-foreground">{t("inPerson.hoursDetail")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("inPerson.phone")}</p>
                    <a href={`tel:${brand.support.phoneTel}`} className="text-sm text-accent hover:underline" data-testid="link-phone">{brand.support.phone}</a>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold mt-8 mb-4">{t("inPerson.equipmentAvailable")}</h3>
              <div className="grid grid-cols-2 gap-2">
                {industry.equipmentTypes.map((eq) => (
                  <div key={eq} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="text-muted-foreground">{eq}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">{t("inPerson.whoIsThisFor")}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("inPerson.forOperators")}</p>
                    <p className="text-sm text-muted-foreground">{t("inPerson.forOperatorsDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("inPerson.forRenewals")}</p>
                    <p className="text-sm text-muted-foreground">{t("inPerson.forRenewalsDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t("inPerson.forCompanies")}</p>
                    <p className="text-sm text-muted-foreground">{t("inPerson.forCompaniesDesc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABand
        title={t("inPerson.ctaTitle")}
        subtitle={t("inPerson.ctaSubtitle")}
        primaryCta={{ label: t("home.bookTrainingCta"), href: "/book-training" }}
        secondaryCta={{ label: t("inPerson.callUs"), href: `tel:${brand.support.phoneTel}` }}
      />
    </>
  );
}
