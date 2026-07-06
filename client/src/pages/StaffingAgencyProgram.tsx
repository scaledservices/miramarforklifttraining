import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import SEOHead from "@/components/seo/SEOHead";
import { breadcrumbSchema, faqSchema } from "@/components/seo/StructuredData";
import { brand } from "@shared/config/brand";
import { SITE_URL } from "@/components/seo/siteUrl";
import { Phone, ArrowRight, Check, Users, Clock, Shield, CreditCard, LayoutDashboard } from "lucide-react";

// PLACEHOLDER — content patched in by subsequent calls
export default function StaffingAgencyProgram() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const isEs = locale === "es";

  const breadcrumbs = breadcrumbSchema(
    [
      { name: isEs ? "Inicio" : "Home", url: "/" },
      { name: isEs ? "Programa para Agencias" : "Staffing Agency Program", url: "/staffing-agency-program" },
    ],
    locale
  );

  const faqs = [
    {
      question: isEs
        ? "Cuanto tarda la certificacion de un operador temporal?"
        : "How fast can a temp operator get certified?",
      answer: isEs
        ? "La certificacion en linea se completa en unas 2 horas. La capacitacion practica presencial se completa en un dia. Con prioridad de reservacion, podemos programar sus temps en 24 horas."
        : "Online certification takes about 2 hours. In-person hands-on training is completed in one day. With priority booking, we can schedule your temps within 24 hours.",
    },
    {
      question: isEs
        ? "Pueden facturarnos con terminos net-30?"
        : "Can we get net-30 invoicing?",
      answer: isEs
        ? "Si. Las agencias aprobadas reciben facturacion mensual con terminos net-30. El proceso de aprobacion toma 1-2 dias habiles."
        : "Yes. Approved agencies receive monthly invoicing with net-30 terms. The approval process takes 1-2 business days.",
    },
    {
      question: isEs
        ? "Que tipos de montacargas cubren en la certificacion?"
        : "What forklift types do you certify?",
      answer: isEs
        ? "Certificamos operadores en montacargas sentados, contrapesados, reach trucks, order pickers y camiones electricos de pie. Cubrimos las clases I-VI de OSHA."
        : "We certify operators on sit-down, counterbalance, reach trucks, order pickers, and electric stand-up trucks. We cover OSHA Classes I-VI.",
    },
    {
      question: isEs
        ? "Como funcionan los descuentos por volumen?"
        : "How do volume discounts work?",
      answer: isEs
        ? "1-5 temps al mes pagan tarifa estandar. 6-15 temps reciben 15% de descuento. 16 o mas reciben 25% de descuento. Los descuentos se aplican automaticamente cada mes."
        : "1-5 temps per month pay standard rates. 6-15 temps get 15% off. 16+ temps get 25% off. Discounts are applied automatically each month.",
    },
    {
      question: isEs
        ? "Pueden compartir certificaciones directamente con nuestros clientes?"
        : "Can you share certifications directly with our clients?",
      answer: isEs
        ? "Si. Cada certificado tiene un enlace de verificacion compartible. Usted o sus clientes pueden verificar la certificacion de un operador en cualquier momento."
        : "Yes. Each certificate has a shareable verification link. You or your clients can verify an operator's certification at any time.",
    },
    {
      question: isEs
        ? "Que pasa si un operador temporal necesita recertificacion?"
        : "What if a temp operator needs recertification?",
      answer: isEs
        ? "Las certificaciones son validas por 3 anos. Ofrecemos recertificacion con la misma prioridad de reservacion y precios con descuento."
        : "Certifications are valid for 3 years. We offer recertification with the same priority booking and discounted pricing.",
    },
  ];

  const faqStructuredData = faqSchema(faqs, locale);

  const serviceSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isEs
      ? "Programa de Certificacion para Agencias de Personal"
      : "Forklift Certification Program for Staffing Agencies",
    serviceType: "Forklift Operator Certification",
    provider: {
      "@type": "Organization",
      name: brand.name,
      url: SITE_URL,
      telephone: brand.support.phoneE164,
    },
    audience: {
      "@type": "BusinessAudience",
      name: "Staffing Agencies",
    },
    areaServed: ["San Diego, CA", "Las Vegas, NV", "Fresno, CA"],
    description: isEs
      ? "Certificacion rapida de montacargas para agencias de personal temporal. Reservacion prioritaria, precios por volumen, certificados digitales y facturacion net-30."
      : "Fast forklift certification for temp staffing agencies. Priority booking, volume pricing, digital certificates, and net-30 invoicing.",
    offers: [
      {
        "@type": "Offer",
        name: "Standard (1-5 temps)",
        priceCurrency: "USD",
        description: "Standard rates for 1-5 temps per month",
      },
      {
        "@type": "Offer",
        name: "Volume (6-15 temps)",
        priceCurrency: "USD",
        description: "15% discount for 6-15 temps per month",
      },
      {
        "@type": "Offer",
        name: "High Volume (16+ temps)",
        priceCurrency: "USD",
        description: "25% discount for 16+ temps per month",
      },
    ],
  };

  return (
    <div>
      <SEOHead
        title={isEs
          ? "Certificacion de Montacargas para Agencias de Personal | Miramar"
          : "Forklift Certification for Staffing Agencies — Fast, Reliable, OSHA-Compliant"}
        description={isEs
          ? "Certifique a sus trabajadores temporales en 24 horas. Reservacion prioritaria, descuentos por volumen, certificados digitales y facturacion net-30. Agencias de personal en San Diego, Las Vegas y Fresno."
          : "Get your temps certified in 24 hours. Priority scheduling, volume pricing, digital records, net-30 invoicing. For staffing agencies in San Diego, Las Vegas, and Fresno."}
        canonical="/staffing-agency-program"
        jsonLd={[breadcrumbs, faqStructuredData, serviceSchema]}
      />
      <div data-testid="staffing-agency-program-page">
        {/* Hero */}
        <section className="bg-gradient-to-br from-brand-dark to-[hsl(10,22%,17%)] text-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <span className="inline-flex items-center gap-1.5 bg-white/10 text-white border border-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
              <Users className="w-3 h-3" /> {isEs ? "Programa para Agencias" : "Staffing Agency Program"}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              {isEs
                ? "Certificacion de Montacargas para Agencias de Personal — Rapida, Confiable y Cumple con OSHA"
                : "Forklift Certification for Staffing Agencies — Fast, Reliable, OSHA-Compliant"}
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              {isEs
                ? "Certifique a sus trabajadores temporales en 24 horas"
                : "Get your temps certified in 24 hours"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/request-quote?ref=staffing-agency">
                <button className="bg-accent text-accent-foreground border border-accent-border rounded-md font-medium px-6 py-3 text-base inline-flex items-center gap-2 hover:opacity-90 transition" data-testid="cta-hero-register">
                  {isEs ? "Registre Su Agencia" : "Register Your Agency"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href={`tel:${brand.support.phoneTel}`}>
                <button className="bg-white/10 text-white border border-white/20 rounded-md font-medium px-6 py-3 text-base inline-flex items-center gap-2 hover:bg-white/15 transition">
                  <Phone className="w-4 h-4" />
                  {brand.support.phone}
                </button>
              </a>
            </div>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Problem */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-red-100 text-red-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">!</span>
                <h2 className="text-xl md:text-2xl font-bold text-red-900">
                  {isEs ? "El Problema" : "The Problem"}
                </h2>
              </div>
              <p className="text-red-800 text-lg leading-relaxed">
                {isEs
                  ? "Su cliente necesita un operador de montacargas certificado manana. Su trabajador temporal no tiene certificacion. Usted pierde la colocacion."
                  : "Your client needs a certified forklift operator tomorrow. Your temp doesn't have cert. You lose the placement."}
              </p>
            </div>
            {/* Solution */}
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  <Check className="w-4 h-4" />
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-brand-dark">
                  {isEs ? "La Solucion" : "The Solution"}
                </h2>
              </div>
              <p className="text-brand-dark text-lg leading-relaxed">
                {isEs
                  ? "El programa de agencias de Miramar — reservacion prioritaria, precios por volumen, registros digitales y certificacion el mismo dia."
                  : "Miramar's staffing agency program — priority scheduling, volume pricing, digital records, same-day certs."}
              </p>
            </div>
          </div>
        </section>

        {/* Program Benefits */}
        <section className="bg-card border-y border-border py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {isEs ? "Beneficios del Programa" : "Program Benefits"}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {isEs
                  ? "Todo lo que su agencia necesita para certificar trabajadores temporales rapidamente."
                  : "Everything your agency needs to certify temps quickly and reliably."}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Clock className="w-6 h-6" />,
                  title: isEs ? "Reservacion Prioritaria" : "Priority Booking",
                  desc: isEs
                    ? "Cupos del dia siguiente para sus trabajadores temporales. No espere semanas."
                    : "Next-day slots for your temps. Don't wait weeks for an opening.",
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: isEs ? "Descuentos por Volumen" : "Volume Discounts",
                  desc: isEs
                    ? "Hasta 25% de descuento para agencias con 10+ temps al mes."
                    : "Up to 25% off for agencies certifying 10+ temps per month.",
                },
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: isEs ? "Certificados Digitales" : "Digital Certificates",
                  desc: isEs
                    ? "Enlaces de verificacion compartibles para sus clientes. Compruebe certificaciones al instante."
                    : "Shareable verification links for your clients. Prove certification instantly.",
                },
                {
                  icon: <LayoutDashboard className="w-6 h-6" />,
                  title: isEs ? "Panel de Gestion Grupal" : "Group Management Dashboard",
                  desc: isEs
                    ? "Vea todos sus temps, certificaciones y estados de cumplimiento en un solo lugar."
                    : "See all your temps, certifications, and compliance status in one place.",
                },
                {
                  icon: <CreditCard className="w-6 h-6" />,
                  title: isEs ? "Facturacion Net-30" : "Net-30 Invoicing",
                  desc: isEs
                    ? "Facturacion mensual con terminos net-30 para agencias aprobadas. Sin pagos por certificado."
                    : "Monthly invoicing with net-30 terms for approved agencies. No per-cert payments.",
                },
                {
                  icon: <Check className="w-6 h-6" />,
                  title: isEs ? "Cumplimiento OSHA" : "OSHA-Compliant",
                  desc: isEs
                    ? "Todas las certificaciones cumplen con 29 CFR 1910.178 de OSHA. Validas por 3 anos."
                    : "All certifications meet OSHA 29 CFR 1910.178. Valid for 3 years.",
                },
              ].map((benefit, i) => (
                <div key={i} className="bg-background border border-border rounded-lg p-6">
                  <div className="bg-accent/10 text-accent-foreground w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {isEs ? "Como Funciona" : "How It Works"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isEs
                ? "Cuatro pasos simples para certificar a sus trabajadores temporales."
                : "Four simple steps to get your temps certified."}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: isEs ? "Registre Su Agencia" : "Register Your Agency",
                desc: isEs
                  ? "Complete el formulario de registro. Aprobacion en 1-2 dias habiles."
                  : "Fill out the registration form. Approval in 1-2 business days.",
              },
              {
                step: "2",
                title: isEs ? "Suba Su Lista de Temps" : "Upload Your Temp Roster",
                desc: isEs
                  ? "Suba la lista de trabajadores temporales que necesitan certificacion."
                  : "Upload the list of temps that need certification.",
              },
              {
                step: "3",
                title: isEs ? "Los Certificamos" : "We Certify Them",
                desc: isEs
                  ? "Entrenamiento en linea o presencial. Certificacion el mismo dia."
                  : "Online or in-person training. Same-day certification.",
              },
              {
                step: "4",
                title: isEs ? "Comparta los Certificados" : "Share Digital Certs",
                desc: isEs
                  ? "Comparta enlaces de verificacion con sus clientes. Listo para trabajar."
                  : "Share verification links with your clients. Ready to work.",
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-card border border-border rounded-lg p-6 h-full">
                  <div className="bg-accent text-accent-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-muted-foreground">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="bg-card border-y border-border py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {isEs ? "Precios por Volumen" : "Volume Pricing"}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {isEs
                  ? "Mientras mas temps certifique, mas ahorra. Descuentos automaticos cada mes."
                  : "The more temps you certify, the more you save. Discounts applied automatically each month."}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tier 1 */}
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <h3 className="text-lg font-bold mb-2">
                  {isEs ? "Estandar" : "Standard"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isEs ? "1-5 temps al mes" : "1-5 temps per month"}
                </p>
                <div className="text-3xl font-bold mb-2">
                  {isEs ? "Tarifa Estandar" : "Standard Rates"}
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Reservacion prioritaria" : "Priority booking"}</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Certificados digitales" : "Digital certificates"}</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Panel de gestion" : "Management dashboard"}</li>
                </ul>
              </div>
              {/* Tier 2 - Featured */}
              <div className="bg-background border-2 border-accent rounded-lg p-6 text-center relative md:scale-105">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {isEs ? "Mas Popular" : "Most Popular"}
                </span>
                <h3 className="text-lg font-bold mb-2">
                  {isEs ? "Volumen" : "Volume"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isEs ? "6-15 temps al mes" : "6-15 temps per month"}
                </p>
                <div className="text-3xl font-bold mb-2 text-accent-foreground">
                  15% {isEs ? "de descuento" : "off"}
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Todo lo de Estandar" : "Everything in Standard"}</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Facturacion net-30" : "Net-30 invoicing"}</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Soporte dedicado" : "Dedicated support"}</li>
                </ul>
              </div>
              {/* Tier 3 */}
              <div className="bg-background border border-border rounded-lg p-6 text-center">
                <h3 className="text-lg font-bold mb-2">
                  {isEs ? "Alto Volumen" : "High Volume"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isEs ? "16+ temps al mes" : "16+ temps per month"}
                </p>
                <div className="text-3xl font-bold mb-2 text-accent-foreground">
                  25% {isEs ? "de descuento" : "off"}
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Todo lo de Volumen" : "Everything in Volume"}</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Capacitacion en su sitio" : "On-site training"}</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 mt-0.5 text-accent-foreground flex-shrink-0" /> {isEs ? "Gerente de cuenta" : "Account manager"}</li>
                </ul>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              {isEs
                ? "Terminos net-30 disponibles para agencias aprobadas. Contactenos para mas informacion."
                : "Net-30 terms available for approved agencies. Contact us to learn more."}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {isEs ? "Preguntas Frecuentes" : "Frequently Asked Questions"}
            </h2>
            <p className="text-muted-foreground">
              {isEs
                ? "Preguntas comunes sobre nuestro programa para agencias de personal."
                : "Common questions about our staffing agency program."}
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-card border border-border rounded-lg p-5 group" data-testid={`faq-item-${i}`}>
                <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <span className="text-muted-foreground ml-2 transition-transform group-open:rotate-180">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Testimonial Placeholder — hidden until real testimonials exist */}
        {false && (
          <section className="bg-card border-y border-border py-16">
            <div className="max-w-3xl mx-auto px-4 text-center">
              <blockquote className="text-xl font-medium text-brand-dark italic">
                {"{{testimonial_quote}}"}
              </blockquote>
              <p className="mt-4 text-muted-foreground">{"{{testimonial_author}}"}</p>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)] text-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {isEs ? "Registre Su Agencia Hoy" : "Register Your Agency Today"}
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              {isEs
                ? "Empiece a certificar sus trabajadores temporales en 24 horas. Sin costo de registro."
                : "Start certifying your temps in 24 hours. No registration fee."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/request-quote?ref=staffing-agency">
                <button className="bg-accent text-accent-foreground border border-accent-border rounded-md font-medium px-6 py-3 text-base inline-flex items-center gap-2 hover:opacity-90 transition" data-testid="cta-final-register">
                  {isEs ? "Registre Su Agencia" : "Register Your Agency"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href={`tel:${brand.support.phoneTel}`}>
                <button className="bg-white/10 text-white border border-white/20 rounded-md font-medium px-6 py-3 text-base inline-flex items-center gap-2 hover:bg-white/15 transition">
                  <Phone className="w-4 h-4" />
                  {brand.support.phone}
                </button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
