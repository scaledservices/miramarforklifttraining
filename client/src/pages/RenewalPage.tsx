import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, RefreshCw, Building2, Wrench, Monitor, Shield, AlertCircle } from "lucide-react";

export default function RenewalPage() {
  const { t } = useTranslation();

  return (
    <>
      <SEOHead
        title={t("renewal.seoTitle", { brand: brand.name, defaultValue: `Forklift Recertification & Renewal | ${brand.name}` })}
        description={t("renewal.seoDesc", { defaultValue: "OSHA forklift recertification and renewal training. Fast, affordable options for experienced operators and companies with turnover." })}
        canonical="/renewal"
      />

      <section className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <RefreshCw className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4" data-testid="text-renewal-title">
            {t("renewal.title", { defaultValue: "Forklift Recertification & Renewal" })}
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            {t("renewal.subtitle", { defaultValue: "Has your forklift certification expired? Need to renew for new employees? We make recertification fast, affordable, and OSHA-aligned." })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/request-quote">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8" data-testid="button-renewal-quote">
                {t("renewal.getQuoteCta", { defaultValue: "Get a Renewal Quote" })}
              </Button>
            </Link>
            <a href={`tel:${brand.support.phoneTel}`}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8" data-testid="button-renewal-call">
                {t("renewal.callCta", { defaultValue: `Call ${brand.support.phone}` })}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <section className="py-8 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: t("renewal.trust1", { defaultValue: "OSHA-Aligned" }) },
              { icon: Clock, label: t("renewal.trust2", { defaultValue: "Same-Day Certification" }) },
              { icon: CheckCircle, label: t("renewal.trust3", { defaultValue: "Experienced Instructors" }) },
              { icon: RefreshCw, label: t("renewal.trust4", { defaultValue: "Fast Renewal Process" }) },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2">
                <item.icon className="w-6 h-6 text-accent" />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-when-renew-title">
              {t("renewal.whenTitle", { defaultValue: "When Do You Need to Recertify?" })}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("renewal.whenDesc", { defaultValue: "OSHA requires forklift operator evaluation every 3 years. But recertification may be needed sooner if you change equipment, have a safety incident, or are observed operating unsafely." })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="p-6">
                <AlertCircle className="h-8 w-8 text-orange-500 mb-3" />
                <h3 className="font-bold text-lg mb-2">{t("renewal.reason3Year", { defaultValue: "3-Year Renewal" })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("renewal.reason3YearDesc", { defaultValue: "OSHA requires a formal evaluation of forklift operators at least every 3 years. If your certification is approaching 3 years old, it is time to renew." })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <AlertCircle className="h-8 w-8 text-orange-500 mb-3" />
                <h3 className="font-bold text-lg mb-2">{t("renewal.reasonNewEquipment", { defaultValue: "New Equipment" })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("renewal.reasonNewEquipmentDesc", { defaultValue: "If you are switching to a different type of forklift (for example, from a sit-down to a reach truck), you need training and evaluation on the new equipment class." })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <AlertCircle className="h-8 w-8 text-orange-500 mb-3" />
                <h3 className="font-bold text-lg mb-2">{t("renewal.reasonIncident", { defaultValue: "After an Incident" })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("renewal.reasonIncidentDesc", { defaultValue: "If a forklift operator is involved in a near-miss, accident, or is observed operating unsafely, recertification training is required before returning to the equipment." })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <AlertCircle className="h-8 w-8 text-orange-500 mb-3" />
                <h3 className="font-bold text-lg mb-2">{t("renewal.reasonTurnover", { defaultValue: "Employee Turnover" })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("renewal.reasonTurnoverDesc", { defaultValue: "If you have new employees who need certification, or existing staff whose certs are expiring, we can handle both at the same time with onsite or in-person training." })}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("renewal.pathsTitle", { defaultValue: "Choose Your Renewal Path" })}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("renewal.pathsDesc", { defaultValue: "Three ways to get recertified. Pick the one that fits your situation." })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-accent shadow-md">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center mb-5">
                  <Building2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("renewal.path1Title", { defaultValue: "Onsite / Company" })}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("renewal.path1Desc", { defaultValue: "We come to your facility. Best for companies with 2 or more operators who need renewal. Train on the equipment you actually use." })}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-accent" /><span className="text-muted-foreground">{t("renewal.path1F1", { defaultValue: "From $200-280 per person" })}</span></li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-accent" /><span className="text-muted-foreground">{t("renewal.path1F2", { defaultValue: "Volume discounts for 5+" })}</span></li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-accent" /><span className="text-muted-foreground">{t("renewal.path1F3", { defaultValue: "Train-the-Trainer for 10+" })}</span></li>
                </ul>
                <Link href="/request-quote">
                  <Button className="w-full bg-accent text-accent-foreground" data-testid="button-renewal-path1">
                    {t("renewal.getQuoteCta", { defaultValue: "Get a Renewal Quote" })}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-5">
                  <Wrench className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("renewal.path2Title", { defaultValue: "Hands-On at Our Location" })}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("renewal.path2Desc", { defaultValue: "Come to our facility in San Diego, Las Vegas, or Fresno. Best for individuals or small groups." })}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /><span className="text-muted-foreground">{t("renewal.path2F1", { defaultValue: "From $200-300 per person" })}</span></li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /><span className="text-muted-foreground">{t("renewal.path2F2", { defaultValue: "Same-day certification" })}</span></li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /><span className="text-muted-foreground">{t("renewal.path2F3", { defaultValue: "3 locations" })}</span></li>
                </ul>
                <Link href="/in-person-training">
                  <Button variant="outline" className="w-full" data-testid="button-renewal-path2">
                    {t("renewal.bookClass", { defaultValue: "Book a Class" })}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Monitor className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t("renewal.path3Title", { defaultValue: "Online Renewal" })}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("renewal.path3Desc", { defaultValue: "For experienced operators who just need the classroom portion. Self-paced, 1-2 hours, certificate upon completion." })}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-accent" /><span className="text-muted-foreground">{t("renewal.path3F1", { defaultValue: "From $45-59 per seat" })}</span></li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-accent" /><span className="text-muted-foreground">{t("renewal.path3F2", { defaultValue: "1-2 hours, self-paced" })}</span></li>
                  <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 text-accent" /><span className="text-muted-foreground">{t("renewal.path3F3", { defaultValue: "Instant certificate" })}</span></li>
                </ul>
                <Link href="/p/online-forklift-operator-training">
                  <Button variant="outline" className="w-full" data-testid="button-renewal-path3">
                    {t("renewal.viewOnline", { defaultValue: "View Online Course" })}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t("renewal.readyTitle", { defaultValue: "Ready to Get Recertified?" })}</h2>
          <p className="text-blue-100 text-lg mb-8">
            {t("renewal.readyDesc", { defaultValue: "Call us or request a quote. We will help you figure out the fastest, most affordable way to get your operators back to compliance." })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={`tel:${brand.support.phoneTel}`}>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                {t("renewal.callCta", { defaultValue: `Call ${brand.support.phone}` })}
              </Button>
            </a>
            <Link href="/request-quote">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                {t("renewal.getQuoteCta", { defaultValue: "Get a Renewal Quote" })}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
