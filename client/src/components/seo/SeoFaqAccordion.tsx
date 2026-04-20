import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface FaqItem {
  q: string;
  a: string;
}

interface SeoFaqAccordionProps {
  faqs: FaqItem[];
  heading?: string;
}

export default function SeoFaqAccordion({ faqs, heading = "Frequently Asked Questions" }: SeoFaqAccordionProps) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="py-8" data-testid="seo-faq">
      <h2 id="frequently-asked-questions" className="text-2xl font-bold mb-6 text-center">{heading}</h2>
      <Accordion type="single" collapsible className="max-w-3xl mx-auto">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left" data-testid={`faq-question-${i}`}>{faq.q}</AccordionTrigger>
            <AccordionContent data-testid={`faq-answer-${i}`}>
              <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
