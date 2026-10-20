import { useTranslation } from "react-i18next";
import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { getLocation } from "@shared/config/locations";
import { localBusinessSchema } from "@/components/seo/StructuredData";
import { MapPin, Phone, Clock, Globe, CheckCircle, Award, Users, Shield, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import OptimizedImage from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface LocationPageProps {
  location: string;
}

export default function LocationPage({ location: slug }: LocationPageProps) {
  const { t, i18n } = useTranslation();
  const loc = getLocation(slug);

  if (!loc) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("location.notFoundTitle")}</h1>
        <Link href="/locations">
          <Button data-testid="button-back-locations">{t("location.viewAllLocations")}</Button>
        </Link>
      </div>
    );
  }

  if (!loc.active) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6">
        <SEOHead
          title={`${(i18n.language.startsWith("es") && loc.es ? loc.es.seo : loc.seo).title} | ${brand.name}`}
          description={(i18n.language.startsWith("es") && loc.es ? loc.es.seo : loc.seo).description}
        />
        <Construction className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-3xl font-bold" data-testid="text-coming-soon-title">{t("location.comingSoonTitle", { city: loc.city })}</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("location.comingSoonDesc", { city: loc.city, brand: brand.name })}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/locations">
            <Button variant="outline" data-testid="button-back-locations">{t("location.viewAllLocations")}</Button>
          </Link>
          <Link href="/request-quote">
            <Button className="bg-accent text-accent-foreground" data-testid="button-request-quote">{t("location.requestQuoteCta")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const slugToI18n: Record<string, string> = {
    "san-diego": "location.sd",
    "las-vegas": "location.lv",
    "fresno": "location.fr",
  };
  const i18nPrefix = slugToI18n[slug] || `location.${slug.replace(/-/g, "")}`;
  const isEs = i18n.language.startsWith("es");
  const L = (en: string, es: string) => (isEs ? es : en);
  const seo = isEs && loc.es ? loc.es.seo : loc.seo;
  const equipmentTypes = isEs && loc.es ? loc.es.equipmentTypes : loc.equipmentTypes;
  const hours = isEs && loc.es ? loc.es.hours : loc.hours;
  const pricingNameEs: Record<string, string> = {
    standard: "Montacargas Estándar",
    scissorAerial: "Elevador de Tijera + Aéreo",
    reachForklift: "Reach Truck + Montacargas",
    orderPickerForklift: "Order Picker + Montacargas",
    forkliftScissorEpj: "Montacargas + Elevador de Tijera + EPJ",
    fullMultiEquipment: "Multiequipo Completo",
  };

  return (
    <>
      <SEOHead
        title={t(`${i18nPrefix}.seoTitle`, { brand: brand.name, defaultValue: `${seo.title} | ${brand.name}` })}
        description={t(`${i18nPrefix}.seoDesc`, { brand: brand.name, body: industry.regulatory.body, defaultValue: seo.description })}
        canonical={`/locations/${slug}`}
        jsonLd={[localBusinessSchema({
          name: brand.name,
          address: loc.address.full,
          city: loc.address.city,
          state: loc.address.state,
          zip: loc.address.zip,
          phone: loc.phone,
          locale: i18n.language,
        })]}
      />

      <Hero
        image={loc.heroImage}
        title={t(`${i18nPrefix}.heroTitle`, { brand: brand.name, defaultValue: seo.title })}
        subtitle={t(`${i18nPrefix}.heroSubtitle`, { body: industry.regulatory.body, defaultValue: seo.description })}
        primaryCta={{ label: t(`${i18nPrefix}.bookTraining`, { defaultValue: t("location.bookTrainingDefault") }), href: "/in-person-training" }}
        secondaryCta={{ label: t(`${i18nPrefix}.requestQuote`, { defaultValue: t("location.requestQuoteDefault") }), href: "/request-quote" }}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4" data-testid="text-about-title">
                  {t(`${i18nPrefix}.aboutTitle`, { defaultValue: t("location.aboutTitleGeneric", { city: loc.city, defaultValue: L(`About Our ${loc.city} Training Center`, `Acerca de Nuestro Centro de Capacitación en ${loc.city}`) }) })}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(`${i18nPrefix}.aboutDesc`, { brand: brand.name, body: industry.regulatory.body, address: loc.address.full, defaultValue: t("location.aboutDescGeneric", { brand: brand.name, city: loc.city, defaultValue: L(`${brand.name} offers forklift training in ${loc.city}.`, `${brand.name} ofrece capacitación de montacargas en ${loc.city}.`) }) })}
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t(`${i18nPrefix}.equipmentTitle`, { defaultValue: t("location.equipmentTitleDefault") })}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {equipmentTypes.map((eq) => (
                    <div key={eq} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-brand-green shrink-0" />
                      <span>{eq}</span>
                    </div>
                  ))}
                </div>
              </div>

              {loc.supportsInPerson && (
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4" data-testid="text-pricing-title">
                    {t(`${i18nPrefix}.pricingTitle`, { defaultValue: t("location.pricingTitleDefault", { defaultValue: "Pricing" }) })}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(brand.pricing.inPerson).map(([courseKey, course]) => (
                      <div key={course.name} className="flex items-center justify-between bg-card border rounded-lg px-4 py-3">
                        <span className="text-sm font-medium">{t(`location.pricingNames.${courseKey}`, { defaultValue: L(course.name, pricingNameEs[courseKey] ?? course.name) })}</span>
                        <span className="text-sm font-bold text-brand-orange">${course.price}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("location.pricingNote", { defaultValue: "Prices vary by equipment type and group size. Volume discounts available for 5+ trainees. Call for a custom quote." })}
                  </p>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {t(`${i18nPrefix}.whyChooseTitle`, { defaultValue: t("location.whyChooseTitleDefault") })}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Shield, title: t(`${i18nPrefix}.why1Title`, { defaultValue: L("OSHA-Aligned Curriculum", t("location.oshaAligned", { body: industry.regulatory.body })) }), desc: t(`${i18nPrefix}.why1Desc`, { body: industry.regulatory.body, defaultValue: t("location.why1DescGeneric", { body: industry.regulatory.body, defaultValue: L(`All courses meet ${industry.regulatory.body} requirements`, `Todos los cursos cumplen con los requisitos de ${industry.regulatory.body}`) }) }) },
                    { icon: Award, title: t(`${i18nPrefix}.why2Title`, { defaultValue: t("location.why2TitleGeneric", { defaultValue: L("Experienced Instructors", "Instructores con Experiencia") }) }), desc: t(`${i18nPrefix}.why2Desc`, { defaultValue: L("10+ years of training experience", t("location.tenYearsExp")) }) },
                    { icon: Users, title: t(`${i18nPrefix}.why3Title`, { defaultValue: t("location.why3TitleGeneric", { defaultValue: L("Bilingual Training", "Capacitación Bilingüe") }) }), desc: t(`${i18nPrefix}.why3Desc`, { defaultValue: t("location.why3DescGeneric", { defaultValue: L("English and Spanish instruction available", "Instrucción disponible en inglés y español") }) }) },
                    { icon: Clock, title: t(`${i18nPrefix}.why4Title`, { defaultValue: L("Same-Day Certification", t("location.sameDayCert")) }), desc: t(`${i18nPrefix}.why4Desc`, { defaultValue: t("location.why4DescGeneric", { defaultValue: L("Walk out with your certification card the same day", "Sal con tu tarjeta de certificación el mismo día") }) }) },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <item.icon className="h-5 w-5 text-brand-dark shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Card className="border-border sticky top-20" data-testid="location-info-card">
                <CardContent className="p-0">
                  <div className="relative h-40 rounded-t-lg overflow-hidden">
                    <OptimizedImage src={loc.heroImage} alt={loc.displayName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/20 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h3 className="font-bold text-lg text-white drop-shadow-md">{brand.name}</h3>
                      <p className="text-sm text-white/80">{loc.displayName}</p>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("location.addressLabel")}</p>
                      <p className="text-sm text-muted-foreground">{loc.address.full}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("location.phoneLabel")}</p>
                      <a href={`tel:${loc.phoneTel}`} className="text-sm text-brand-orange font-medium hover:underline" data-testid="link-phone">{loc.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("location.hoursLabel")}</p>
                      <p className="text-sm text-muted-foreground">{hours}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-brand-dark shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("location.languagesLabel")}</p>
                      <p className="text-sm text-muted-foreground">{t("location.languagesList")}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("location.sameDayCert")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("location.oshaAligned", { body: industry.regulatory.body })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green" />
                      <span>{t("location.tenYearsExp")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/in-person-training">
                      <Button className="w-full bg-accent text-accent-foreground" data-testid="button-view-courses">
                        {t("location.viewCourses")}
                      </Button>
                    </Link>
                    <Link href="/request-quote">
                      <Button variant="outline" className="w-full" data-testid="button-get-quote">
                        {t("location.requestQuoteDefault")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <CTABand
        title={t(`${i18nPrefix}.ctaTitle`, { defaultValue: t("location.ctaTitleGeneric", { city: loc.city, defaultValue: L(`Ready to Train in ${loc.city}?`, `¿Listo para capacitarte en ${loc.city}?`) }) })}
        subtitle={t(`${i18nPrefix}.ctaSubtitle`, { defaultValue: t("location.ctaSubtitleGeneric", { city: loc.city, defaultValue: L(`Contact us today to schedule your training in ${loc.city}.`, `Contáctanos hoy para programar tu capacitación en ${loc.city}.`) }) })}
        primaryCta={{ label: t(`${i18nPrefix}.bookTraining`, { defaultValue: t("location.bookTrainingDefault") }), href: "/in-person-training" }}
        secondaryCta={{ label: t(`${i18nPrefix}.requestQuote`, { defaultValue: t("location.requestQuoteDefault") }), href: "/request-quote" }}
      />
    </>
  );
}
