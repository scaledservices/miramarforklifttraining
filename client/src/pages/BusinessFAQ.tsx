import Hero from "@/components/sections/Hero";
import FAQSection from "@/components/sections/FAQSection";
import CTABand from "@/components/sections/CTABand";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { faqItems } from "@/data/faq";

export default function BusinessFAQ() {
  const { t, i18n } = useTranslation();
  const isEs = i18n.language.startsWith("es");
  return (
    <>
      <SEOHead
        title={t("seo.businessFaq.title", { brand: brand.name })}
        description={t("seo.businessFaq.description", { brand: brand.name })}
        canonical="/business/faq"
      />
      <Hero
        image="/images/business-team.jpg"
        title={t("faqPage.title", { defaultValue: "Frequently Asked Questions" })}
        subtitle={t("businessFaqPage.heroSubtitle", { defaultValue: isEs ? "Encuentre respuestas a preguntas comunes sobre nuestros programas de capacitación, certificaciones y soluciones para empresas." : "Find answers to common questions about our training programs, certifications, and business solutions." })}
      />

      <div className="bg-background">
        <FAQSection
          items={faqItems}
          title={t("businessFaqPage.generalTitle", { defaultValue: isEs ? "Preguntas generales" : "General Questions" })}
          subtitle={t("businessFaqPage.generalSubtitle", { defaultValue: isEs ? "Todo lo que necesita saber sobre la certificación de montacargas." : "Everything you need to know about forklift certification." })}
        />
      </div>

      <CTABand
        title={t("faqPage.stillHaveQuestions", { defaultValue: "Still Have Questions?" })}
        subtitle={t("businessFaqPage.ctaSubtitle", { defaultValue: isEs ? "Nuestro equipo está listo para ayudarle. Comuníquese con nosotros y le responderemos dentro de un día hábil." : "Our team is ready to help. Reach out and we will get back to you within one business day." })}
        primaryCta={{ label: t("cta.contactUs", { defaultValue: "Contact Us" }), href: "/contact" }}
        secondaryCta={{ label: t("blog.viewPrograms", { defaultValue: "View Programs" }), href: "/training-programs" }}
      />
    </>
  );
}
