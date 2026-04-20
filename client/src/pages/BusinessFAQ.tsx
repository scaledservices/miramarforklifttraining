import Hero from "@/components/sections/Hero";
import FAQSection from "@/components/sections/FAQSection";
import CTABand from "@/components/sections/CTABand";
import { useTranslation } from "react-i18next";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { faqItems } from "@/data/faq";

export default function BusinessFAQ() {
  const { t } = useTranslation();
  return (
    <>
      <SEOHead
        title={t("seo.businessFaq.title", { brand: brand.name })}
        description={t("seo.businessFaq.description", { brand: brand.name })}
        canonical="/business/faq"
      />
      <Hero
        image="/images/business-team.jpg"
        title="Frequently Asked Questions"
        subtitle="Find answers to common questions about our training programs, certifications, and business solutions."
      />

      <div className="bg-background">
        <FAQSection
          items={faqItems}
          title="General Questions"
          subtitle="Everything you need to know about forklift certification."
        />
      </div>

      <CTABand
        title="Still Have Questions?"
        subtitle="Our team is ready to help. Reach out and we will get back to you within one business day."
        primaryCta={{ label: "Contact Us", href: "/contact" }}
        secondaryCta={{ label: "View Programs", href: "/training-programs" }}
      />
    </>
  );
}
