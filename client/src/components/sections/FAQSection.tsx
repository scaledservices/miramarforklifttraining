import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FAQItem } from "@/data/faq";

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
  maxItems?: number;
}

export default function FAQSection({ items, title, subtitle, maxItems }: FAQSectionProps) {
  const { t } = useTranslation();
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const displayTitle = title || t("faqSection.defaultTitle");

  return (
    <section className="py-16 md:py-20" data-testid="faq-section">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{displayTitle}</h2>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>

        <Accordion type="single" collapsible className="w-full">
          {displayItems.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`} data-testid={`faq-item-${index}`}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
