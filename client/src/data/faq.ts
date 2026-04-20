import { industry } from "@shared/config/industry";

export interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "online" | "hands-on" | "business" | "certification";
}

export const faqItems: FAQItem[] = [
  {
    question: `Is forklift certification required by ${industry.regulatory.body}?`,
    answer: `Yes. Under ${industry.regulatory.body} standard ${industry.regulatory.standard}, all powered industrial truck operators must be trained and certified before operating equipment in the workplace. Employers are responsible for ensuring compliance, and failure to do so can result in significant fines.`,
    category: "general",
  },
  {
    question: "How long is a forklift certification valid?",
    answer: `${industry.regulatory.body} requires forklift operator certification to be renewed every ${industry.regulatory.certificationValidity}. However, refresher training may be required sooner if an operator is involved in an accident, observed operating unsafely, assigned to a different type of equipment, or if workplace conditions change significantly.`,
    category: "certification",
  },
  {
    question: "Can I complete forklift certification entirely online?",
    answer: `Our online program covers the formal instruction portion of ${industry.regulatory.body}-required training. Depending on your employer's requirements and your state's regulations, a hands-on practical evaluation may also be needed. Many employers accept online training combined with an in-house practical evaluation conducted by a qualified person.`,
    category: "online",
  },
  {
    question: "What does the online training cover?",
    answer: `Our online training covers all ${industry.regulatory.body}-required formal instruction topics including equipment types and operating principles, load handling and stability, workplace hazard recognition, pre-operation inspection procedures, refueling and battery charging safety, and pedestrian safety. You will complete interactive modules and a final assessment.`,
    category: "online",
  },
  {
    question: "Do I receive a certificate after completing online training?",
    answer: "Yes. Upon successfully completing the online training and passing the final assessment, you will receive a printable certificate of completion immediately. This serves as documentation of your formal instruction training.",
    category: "online",
  },
  {
    question: "Where are your hands-on training locations?",
    answer: "We currently offer hands-on forklift training at two locations: San Diego, California and Las Vegas, Nevada. Our training facilities are equipped with multiple types of powered industrial trucks for comprehensive practical training.",
    category: "hands-on",
  },
  {
    question: "What types of equipment do you offer training on?",
    answer: "We offer certification on sit-down counterbalance forklifts (LPG), reach trucks, order pickers, electric pallet jacks (EPJ), scissor lifts, and aerial/boom lifts. Our Complete Equipment Certification Bundle allows you to get certified on multiple equipment types in a single program.",
    category: "hands-on",
  },
  {
    question: "How long does hands-on training take?",
    answer: "Most single-equipment hands-on certification programs are completed in one day (approximately 6-8 hours). Our Complete Equipment Certification Bundle, which covers multiple equipment types, takes 2-3 days to complete.",
    category: "hands-on",
  },
  {
    question: "Can I train my own employees in-house?",
    answer: "Yes. If you have a certified trainer on staff, you can conduct forklift training in-house using our Training Certification Kit. If you do not have a certified trainer, we offer a Train the Trainer program that qualifies your employees to train and certify operators at your facility.",
    category: "business",
  },
  {
    question: "What is included in the Train the Trainer program?",
    answer: `Our Train the Trainer program is a full-day (8-hour) intensive course that covers ${industry.regulatory.body} training requirements, proper evaluation techniques, hands-on instruction methods, and program administration. Upon completion, you will be authorized to train and certify forklift operators at your workplace.`,
    category: "business",
  },
  {
    question: "Do you offer group discounts for businesses?",
    answer: "Yes, we offer volume pricing for businesses training multiple operators. Contact our team to discuss group rates and customized training programs for your organization.",
    category: "business",
  },
  {
    question: "What are the certification cards?",
    answer: "Our certification cards are professional, wallet-sized, laminated cards that provide portable proof of an operator's forklift training and certification. They include the operator's name, certification date, equipment types, and trainer information. Cards are available for $12 each.",
    category: "certification",
  },
  {
    question: "Is your training accepted nationwide?",
    answer: `Our training programs are aligned with ${industry.regulatory.body} standards, which are federal requirements applicable across all 50 states. Employers nationwide generally accept ${industry.regulatory.alignmentLabel} forklift certification. However, some states or employers may have additional requirements beyond federal ${industry.regulatory.body} standards.`,
    category: "general",
  },
  {
    question: "What if I fail the assessment?",
    answer: "Our online training includes unlimited retakes of the final assessment at no additional charge. For hands-on training, our instructors work with you during the practical exercises to ensure you develop the skills needed to pass the evaluation. Additional practice time is provided if needed.",
    category: "general",
  },
];

export function getFAQsByCategory(category: FAQItem["category"]): FAQItem[] {
  return faqItems.filter((faq) => faq.category === category);
}
