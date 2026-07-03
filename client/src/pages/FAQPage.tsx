import { useTranslation } from "react-i18next";
import { useState } from "react";
import SEOHead from "@/components/seo/SEOHead";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import { faqItems, type FAQItem } from "@/data/faq";
import { faqSchema } from "@/components/seo/StructuredData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronDown, Search, Phone } from "lucide-react";

const CATEGORIES: { value: FAQItem["category"] | "all"; label: string }[] = [
  { value: "all", label: "All Questions" },
  { value: "general", label: "General" },
  { value: "certification", label: "Certification" },
  { value: "online", label: "Online Training" },
  { value: "hands-on", label: "Hands-On Training" },
  { value: "business", label: "For Businesses" },
];

// Conversational FAQ items specifically for the AEO schema block
const conversationalFAQs = faqItems.filter((f) =>
  [
    "How much does forklift certification cost?",
    "How long does it take to get forklift certified?",
    "Is online forklift certification valid?",
    "Do I need to renew my forklift certification?",
    "Can you train forklift operators at my workplace?",
    "What is train the trainer for forklift certification?",
  ].includes(f.question)
);

export default function FAQPage() {
  const { t, i18n } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<FAQItem["category"] | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFAQs = faqItems.filter((faq) => {
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      searchTerm === "" ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Classic long-tail FAQ schema (all items)
  const classicSchema = faqSchema(faqItems, i18n.language);

  // Conversational/AEO schema (natural-language questions for AI overviews)
  const conversationalSchema = faqSchema(conversationalFAQs, i18n.language);

  return (
    <>
      <SEOHead
        title={t("faqPage.seoTitle", { brand: brand.name, defaultValue: `Frequently Asked Questions | ${brand.name}` })}
        description={t("faqPage.seoDesc", { defaultValue: "Answers to common questions about forklift certification, training options, pricing, renewal, and OSHA requirements." })}
        canonical="/faq"
        jsonLd={[classicSchema, conversationalSchema]}
      />

      <section className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-faq-title">
            {t("faqPage.title", { defaultValue: "Frequently Asked Questions" })}
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            {t("faqPage.subtitle", { defaultValue: `Everything you need to know about forklift certification, training options, pricing, and ${industry.regulatory.body} requirements.` })}
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("faqPage.searchPlaceholder", { defaultValue: "Search questions..." })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-lg bg-white text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-accent"
              data-testid="input-faq-search"
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setActiveCategory(cat.value); setOpenIndex(0); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid={`button-faq-category-${cat.value}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("faqPage.noResults", { defaultValue: "No questions match your search. Try a different term or call us with your question." })}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, i) => (
                <Card key={i} className="overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4"
                    data-testid={`button-faq-toggle-${i}`}
                  >
                    <h3 className="font-semibold text-foreground">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                  </button>
                  {openIndex === i && (
                    <CardContent className="px-5 pb-5 pt-0">
                      <p className="text-muted-foreground leading-relaxed" data-testid={`text-faq-answer-${i}`}>
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">{t("faqPage.stillHaveQuestions", { defaultValue: "Still Have Questions?" })}</h2>
          <p className="text-blue-100 mb-6">
            {t("faqPage.stillHaveQuestionsDesc", { defaultValue: "We are here to help. Call us and we will answer any questions you have about training, certification, or pricing." })}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={`tel:${brand.support.phoneTel}`}>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
                <Phone className="w-4 h-4 mr-2" />
                {brand.support.phone}
              </Button>
            </a>
            <Link href="/request-quote">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                {t("faqPage.requestQuote", { defaultValue: "Request a Quote" })}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
