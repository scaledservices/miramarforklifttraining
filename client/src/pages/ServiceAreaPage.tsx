import { Link } from "wouter";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@//components/seo/SEOHead";
import { faqSchema, breadcrumbSchema } from "@//components/seo/StructuredData";
import { getServiceAreaCity, getAllServiceAreaCities } from "@//data/serviceAreas";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@//components/ui/accordion";
import { Card, CardContent } from "@//components/ui/card";
import { Button } from "@//components/ui/button";
import { Badge } from "@//components/ui/badge";
import {
  CheckCircle,
  MapPin,
  Clock,
  Shield,
  Award,
  Users,
  Truck,
  ClipboardList,
  Building2,
  ArrowRight,
  Phone,
} from "lucide-react";

interface ServiceAreaPageProps {
  city: string;
}

export default function ServiceAreaPage({ city: slug }: ServiceAreaPageProps) {
  const area = getServiceAreaCity(slug);

  if (!area) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Service Area Not Found</h1>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const BASE_URL = `https://${brand.domain}`;
  const canonicalPath = `/service-areas/${slug}`;

  // LocalBusiness schema with serviceArea — NOT physical NAP
  const localBusinessWithServiceArea = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand.name,
    description: `Onsite forklift training in ${area.city}, ${area.state}. ${industry.regulatory.body}-aligned certification at your facility.`,
    url: `${BASE_URL}${canonicalPath}`,
    telephone: brand.support.phoneE164,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.address.street,
      addressLocality: brand.address.city,
      addressRegion: brand.address.state,
      postalCode: brand.address.zip,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: area.city,
      addressRegion: area.stateAbbrev,
    },
    serviceType: "Onsite Forklift Training",
    hasOfferingCatalog: {
      "@type": "OfferCatalog",
      name: "Onsite Forklift Certification Programs",
      itemListElement: area.whatsIncluded.map((item) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: item.title,
          description: item.description,
        },
      })),
    },
  };

  const breadcrumbs = breadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Service Areas", url: "/service-areas" },
      { name: area.city, url: canonicalPath },
    ],
    "en"
  );

  const faqs = faqSchema(area.faqs, "en");

  return (
    <>
      <SEOHead
        title={area.seo.title}
        description={area.seo.description}
        canonical={canonicalPath}
        jsonLd={[localBusinessWithServiceArea, breadcrumbs, faqs]}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-forklift.jpg')] bg-cover bg-center opacity-15" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
              <MapPin className="w-3 h-3 mr-1" /> {area.region}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 drop-shadow-md">
              {area.heroHeadline}
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl">
              {area.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/request-quote">
                <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="hero-primary-cta">
                  Request a Quote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href={`tel:${brand.support.phoneTel}`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="hero-phone-cta">
                  <Phone className="w-4 h-4 mr-2" />
                  {brand.support.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Intro + Service Area Description */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Onsite Forklift Training in {area.city} — We Come to You
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {area.intro}
                </p>
              </div>

              {/* Industries Served */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  Industries We Serve in {area.city}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {area.industriesServed.map((ind) => (
                    <div key={ind} className="flex items-start gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Onsite */}
              <div className="bg-card border border-border rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold tracking-tight mb-4">
                  {area.whyOnsite.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {area.whyOnsite.description}
                </p>
              </div>
            </div>

            {/* Sidebar: Service Area + Quick Info */}
            <div>
              <Card className="border-border sticky top-20" data-testid="service-area-info-card">
                <CardContent className="p-0">
                  <div className="relative h-40 rounded-t-lg overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h3 className="font-bold text-lg text-white drop-shadow-md">{brand.name}</h3>
                      <p className="text-sm text-blue-100">Onsite Training — {area.city}, {area.stateAbbrev}</p>
                    </div>
                  </div>
                </CardContent>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Service Area</p>
                      <p className="text-sm text-muted-foreground">{area.city}, {area.state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <a href={`tel:${brand.support.phoneTel}`} className="text-sm text-accent hover:underline">{brand.support.phone}</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Scheduling</p>
                      <p className="text-sm text-muted-foreground">Mon–Fri: 7:00 AM – 5:00 PM<br />Flexible shifts & weekends available</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Languages</p>
                      <p className="text-sm text-muted-foreground">English & Spanish</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span>{industry.regulatory.body}-aligned certification</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span>Same-day certification cards</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span>Train on your equipment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span>Volume discounts (5+ operators)</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/request-quote">
                      <Button className="w-full bg-accent text-accent-foreground" data-testid="button-request-quote">
                        Request a Quote
                      </Button>
                    </Link>
                    <a href={`tel:${brand.support.phoneTel}`}>
                      <Button variant="outline" className="w-full" data-testid="button-call">
                        Call {brand.support.phone}
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 md:py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent text-sm font-semibold uppercase tracking-wider">What's Included</span>
            <h2 className="text-3xl font-bold mt-2 mb-4 tracking-tight">
              Onsite Forklift Certification — {area.city}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything your operators need to meet {industry.regulatory.body} requirements, delivered at your facility.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {area.whatsIncluded.map((item) => {
              const icons = [
                <ClipboardList key="0" className="w-7 h-7 text-accent" />,
                <Truck key="1" className="w-7 h-7 text-accent" />,
                <Shield key="2" className="w-7 h-7 text-accent" />,
                <Award key="3" className="w-7 h-7 text-accent" />,
                <CheckCircle key="4" className="w-7 h-7 text-accent" />,
                <Users key="5" className="w-7 h-7 text-accent" />,
              ];
              const idx = area.whatsIncluded.indexOf(item);
              return (
                <Card key={item.title} className="border-border">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                      {icons[idx % icons.length]}
                    </div>
                    <h3 className="font-bold text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Areas Served */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Areas We Serve Near {area.city}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide onsite forklift training throughout {area.region} and surrounding communities.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {area.nearbyAreas.map((area_name) => (
              <Badge
                key={area_name}
                variant="secondary"
                className="px-4 py-2 text-sm bg-muted text-muted-foreground border border-border"
              >
                <MapPin className="w-3 h-3 mr-1.5 text-accent" />
                {area_name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-card border-y border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Onsite Forklift Training {area.city} — FAQs
            </h2>
            <p className="text-muted-foreground">
              Common questions about onsite certification at your facility.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {area.faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-sm font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Other Service Areas */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-3">Other Service Areas</h2>
            <p className="text-muted-foreground">We also provide onsite forklift training in these locations:</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {getAllServiceAreaCities()
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <Link key={c.slug} href={`/service-areas/${c.slug}`}>
                  <Button variant="outline" className="gap-2" data-testid={`link-service-area-${c.slug}`}>
                    <MapPin className="w-4 h-4 text-accent" />
                    {c.city}, {c.stateAbbrev}
                  </Button>
                </Link>
              ))}
            <Link href="/locations">
              <Button variant="ghost" className="gap-2">
                <Building2 className="w-4 h-4" />
                View Training Facilities
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-gradient-to-r from-primary to-[hsl(210,85%,22%)] py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            {area.ctaTitle}
          </h2>
          <p className="text-base text-white/80 mb-8 max-w-2xl mx-auto">
            {area.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/request-quote">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground border-accent-border"
                data-testid="cta-band-primary"
              >
                Request a Quote
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href={`tel:${brand.support.phoneTel}`}>
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/5">
                <Phone className="w-4 h-4 mr-2" />
                {brand.support.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
