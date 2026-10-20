import { industry } from "@shared/config/industry";

export interface FAQItem {
  /** Stable, language-independent identifier. */
  id: string;
  question: string;
  answer: string;
  /** Spanish translation of `question`. */
  questionEs: string;
  /** Spanish translation of `answer`. */
  answerEs: string;
  category: "general" | "online" | "hands-on" | "business" | "certification";
  /** Natural-language (AEO) question used for the conversational FAQ schema. */
  conversational?: boolean;
}

/** FAQ item resolved to a single language. */
export interface LocalizedFAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQItem["category"];
  conversational?: boolean;
}

const body = industry.regulatory.body;
const standard = industry.regulatory.standard;

export const faqItems: FAQItem[] = [
  {
    id: "required",
    question: `Is forklift certification required by ${body}?`,
    answer: `Yes. Under ${body} standard ${standard}, all powered industrial truck operators must be trained and certified before operating equipment in the workplace. Employers are responsible for ensuring compliance, and failure to do so can result in significant fines.`,
    questionEs: `¿${body} exige la certificación de montacargas?`,
    answerEs: `Sí. Según el estándar ${standard} de ${body}, todos los operadores de vehículos industriales motorizados deben estar capacitados y certificados antes de operar equipos en el lugar de trabajo. Los empleadores son responsables de garantizar el cumplimiento, y no hacerlo puede resultar en multas significativas.`,
    category: "general",
  },
  {
    id: "validity",
    question: "How long is a forklift certification valid?",
    answer: `${body} requires forklift operator certification to be renewed every ${industry.regulatory.certificationValidity}. However, refresher training may be required sooner if an operator is involved in an accident, observed operating unsafely, assigned to a different type of equipment, or if workplace conditions change significantly.`,
    questionEs: "¿Por cuánto tiempo es válida una certificación de montacargas?",
    answerEs: `${body} exige que la certificación de operador de montacargas se renueve cada 3 años. Sin embargo, puede requerirse una capacitación de actualización antes si el operador se ve involucrado en un accidente, es observado operando de manera insegura, es asignado a un tipo de equipo diferente o si las condiciones del lugar de trabajo cambian significativamente.`,
    category: "certification",
  },
  {
    id: "fully-online",
    question: "Can I complete forklift certification entirely online?",
    answer: `Our online program covers the formal instruction portion of ${body}-required training. Depending on your employer's requirements and your state's regulations, a hands-on practical evaluation may also be needed. Many employers accept online training combined with an in-house practical evaluation conducted by a qualified person.`,
    questionEs: "¿Puedo completar la certificación de montacargas totalmente en línea?",
    answerEs: `Nuestro programa en línea cubre la porción de instrucción formal de la capacitación requerida por ${body}. Según los requisitos de tu empleador y las regulaciones de tu estado, también puede ser necesaria una evaluación práctica presencial. Muchos empleadores aceptan la capacitación en línea combinada con una evaluación práctica interna realizada por una persona calificada.`,
    category: "online",
  },
  {
    id: "online-coverage",
    question: "What does the online training cover?",
    answer: `Our online training covers all ${body}-required formal instruction topics including equipment types and operating principles, load handling and stability, workplace hazard recognition, pre-operation inspection procedures, refueling and battery charging safety, and pedestrian safety. You will complete interactive modules and a final assessment.`,
    questionEs: "¿Qué cubre la capacitación en línea?",
    answerEs: `Nuestra capacitación en línea cubre todos los temas de instrucción formal requeridos por ${body}, incluidos los tipos de equipos y principios de operación, el manejo y la estabilidad de la carga, el reconocimiento de peligros en el lugar de trabajo, los procedimientos de inspección previa a la operación, la seguridad en el reabastecimiento de combustible y la carga de baterías, y la seguridad de los peatones. Completarás módulos interactivos y una evaluación final.`,
    category: "online",
  },
  {
    id: "online-certificate",
    question: "Do I receive a certificate after completing online training?",
    answer: "Yes. Upon successfully completing the online training and passing the final assessment, you will receive a printable certificate of completion immediately. This serves as documentation of your formal instruction training.",
    questionEs: "¿Recibo un certificado después de completar la capacitación en línea?",
    answerEs: "Sí. Al completar con éxito la capacitación en línea y aprobar la evaluación final, recibirás de inmediato un certificado de finalización imprimible. Este sirve como documentación de tu capacitación de instrucción formal.",
    category: "online",
  },
  {
    id: "locations",
    question: "Where are your hands-on training locations?",
    answer: "We currently offer hands-on forklift training at three locations: San Diego, California; Las Vegas, Nevada; and Fresno, California. Our training facilities are equipped with multiple types of powered industrial trucks for comprehensive practical training.",
    questionEs: "¿Dónde están sus ubicaciones de capacitación presencial?",
    answerEs: "Actualmente ofrecemos capacitación presencial de montacargas en tres ubicaciones: San Diego, California; Las Vegas, Nevada; y Fresno, California. Nuestras instalaciones de capacitación están equipadas con varios tipos de vehículos industriales motorizados para una capacitación práctica completa.",
    category: "hands-on",
  },
  {
    id: "equipment-types",
    question: "What types of equipment do you offer training on?",
    answer: "We offer certification on sit-down counterbalance forklifts (LPG), reach trucks, order pickers, electric pallet jacks (EPJ), scissor lifts, and aerial/boom lifts. Our Complete Equipment Certification Bundle allows you to get certified on multiple equipment types in a single program.",
    questionEs: "¿En qué tipos de equipos ofrecen capacitación?",
    answerEs: "Ofrecemos certificación en montacargas de contrapeso con asiento (LPG), montacargas de alcance, recogepedidos, transpaletas eléctricas (EPJ), plataformas elevadoras de tijera y elevadores aéreos de pluma. Nuestro Paquete de Certificación de Equipo Completo te permite certificarte en varios tipos de equipos en un solo programa.",
    category: "hands-on",
  },
  {
    id: "hands-on-duration",
    question: "How long does hands-on training take?",
    answer: "Most single-equipment hands-on certification programs are completed in one day (approximately 6-8 hours). Our Complete Equipment Certification Bundle, which covers multiple equipment types, takes 2-3 days to complete.",
    questionEs: "¿Cuánto dura la capacitación presencial?",
    answerEs: "La mayoría de los programas de certificación presencial para un solo equipo se completan en un día (aproximadamente 6-8 horas). Nuestro Paquete de Certificación de Equipo Completo, que cubre varios tipos de equipos, toma 2-3 días en completarse.",
    category: "hands-on",
  },
  {
    id: "in-house",
    question: "Can I train my own employees in-house?",
    answer: "Yes. If you have a certified trainer on staff, you can conduct forklift training in-house using our Training Certification Kit. If you do not have a certified trainer, we offer a Train the Trainer program that qualifies your employees to train and certify operators at your facility.",
    questionEs: "¿Puedo capacitar a mis propios empleados internamente?",
    answerEs: "Sí. Si cuenta con un capacitador certificado en su personal, puede impartir la capacitación de montacargas internamente con nuestro Kit de Certificación de Capacitación. Si no cuenta con un capacitador certificado, ofrecemos un programa de Capacitación de Instructores (Train the Trainer) que califica a sus empleados para capacitar y certificar operadores en sus instalaciones.",
    category: "business",
  },
  {
    id: "ttt-included",
    question: "What is included in the Train the Trainer program?",
    answer: `Our Train the Trainer program is a full-day (8-hour) intensive course that covers ${body} training requirements, proper evaluation techniques, hands-on instruction methods, and program administration. Upon completion, you will be authorized to train and certify forklift operators at your workplace.`,
    questionEs: "¿Qué incluye el programa de Capacitación de Instructores (Train the Trainer)?",
    answerEs: `Nuestro programa de Capacitación de Instructores es un curso intensivo de un día completo (8 horas) que cubre los requisitos de capacitación de ${body}, las técnicas de evaluación adecuadas, los métodos de instrucción práctica y la administración del programa. Al completarlo, quedará autorizado para capacitar y certificar operadores de montacargas en su lugar de trabajo.`,
    category: "business",
  },
  {
    id: "group-discounts",
    question: "Do you offer group discounts for businesses?",
    answer: "Yes, we offer volume pricing for businesses training multiple operators. Contact our team to discuss group rates and customized training programs for your organization.",
    questionEs: "¿Ofrecen descuentos grupales para empresas?",
    answerEs: "Sí, ofrecemos precios por volumen para empresas que capacitan a varios operadores. Comuníquese con nuestro equipo para conversar sobre tarifas grupales y programas de capacitación personalizados para su organización.",
    category: "business",
  },
  {
    id: "cards",
    question: "What are the certification cards?",
    answer: "Our certification cards are professional, wallet-sized, laminated cards that provide portable proof of an operator's forklift training and certification. They include the operator's name, certification date, equipment types, and trainer information. Cards are available for $12 each.",
    questionEs: "¿Qué son las tarjetas de certificación?",
    answerEs: "Nuestras tarjetas de certificación son tarjetas profesionales, laminadas y de tamaño billetera que brindan una prueba portátil de la capacitación y certificación de montacargas de un operador. Incluyen el nombre del operador, la fecha de certificación, los tipos de equipos y la información del capacitador. Las tarjetas están disponibles por $12 cada una.",
    category: "certification",
  },
  {
    id: "nationwide",
    question: "Is your training accepted nationwide?",
    answer: `Our training programs are aligned with ${body} standards, which are federal requirements applicable across all 50 states. Employers nationwide generally accept ${industry.regulatory.alignmentLabel} forklift certification. However, some states or employers may have additional requirements beyond federal ${body} standards.`,
    questionEs: "¿Su capacitación es aceptada en todo el país?",
    answerEs: `Nuestros programas de capacitación están alineados con los estándares de ${body}, que son requisitos federales aplicables en los 50 estados. Los empleadores de todo el país generalmente aceptan la certificación de montacargas alineada con ${body}. Sin embargo, algunos estados o empleadores pueden tener requisitos adicionales más allá de los estándares federales de ${body}.`,
    category: "general",
  },
  {
    id: "fail-assessment",
    question: "What if I fail the assessment?",
    answer: "Our online training includes unlimited retakes of the final assessment at no additional charge. For hands-on training, our instructors work with you during the practical exercises to ensure you develop the skills needed to pass the evaluation. Additional practice time is provided if needed.",
    questionEs: "¿Qué pasa si no apruebo la evaluación?",
    answerEs: "Nuestra capacitación en línea incluye reintentos ilimitados de la evaluación final sin costo adicional. En la capacitación presencial, nuestros instructores trabajan contigo durante los ejercicios prácticos para asegurar que desarrolles las habilidades necesarias para aprobar la evaluación. Si es necesario, se ofrece tiempo de práctica adicional.",
    category: "general",
  },

  // ─── CONVERSATIONAL / AEO-STYLE FAQ (for voice search & AI overviews) ───
  {
    id: "cost",
    conversational: true,
    question: "How much does forklift certification cost?",
    answer: "Online forklift certification costs $45 to $59 per person depending on group size. Hands-on training at our facility costs $280 to $650 per person depending on equipment type. Onsite training at your facility is custom-quoted with volume discounts for 5 or more. Train the Trainer certification is $750.",
    questionEs: "¿Cuánto cuesta la certificación de montacargas?",
    answerEs: "La certificación de montacargas en línea cuesta de $45 a $59 por persona, según el tamaño del grupo. La capacitación presencial en nuestras instalaciones cuesta de $280 a $650 por persona, según el tipo de equipo. La capacitación en sus instalaciones se cotiza de forma personalizada, con descuentos por volumen para 5 o más personas. La certificación de Capacitación de Instructores (Train the Trainer) cuesta $750.",
    category: "general",
  },
  {
    id: "time-to-certify",
    conversational: true,
    question: "How long does it take to get forklift certified?",
    answer: "Online certification takes 1 to 2 hours to complete at your own pace. Hands-on training at our facility takes 3 to 4 hours for beginners or 1.5 to 2 hours for experienced operators. Same-day certification is available for all hands-on courses.",
    questionEs: "¿Cuánto tiempo toma obtener la certificación de montacargas?",
    answerEs: "La certificación en línea toma de 1 a 2 horas, a tu propio ritmo. La capacitación presencial en nuestras instalaciones toma de 3 a 4 horas para principiantes o de 1.5 a 2 horas para operadores con experiencia. La certificación el mismo día está disponible para todos los cursos presenciales.",
    category: "general",
  },
  {
    id: "online-valid",
    conversational: true,
    question: "Is online forklift certification valid?",
    answer: "Yes, online forklift certification covers the formal classroom instruction required by OSHA. However, OSHA also requires a hands-on practical evaluation. Many employers complete this evaluation in-house. If you need a full certification including hands-on evaluation, we offer that at our facilities in San Diego, Las Vegas, and Fresno, or we can come to your site.",
    questionEs: "¿Es válida la certificación de montacargas en línea?",
    answerEs: "Sí, la certificación de montacargas en línea cubre la instrucción formal en aula requerida por OSHA. Sin embargo, OSHA también requiere una evaluación práctica presencial. Muchos empleadores realizan esta evaluación internamente. Si necesitas una certificación completa que incluya la evaluación práctica, la ofrecemos en nuestras instalaciones de San Diego, Las Vegas y Fresno, o podemos ir a tu ubicación.",
    category: "certification",
  },
  {
    id: "renew",
    conversational: true,
    question: "Do I need to renew my forklift certification?",
    answer: "Yes, OSHA requires forklift operator evaluation every 3 years. You may also need recertification sooner if you switch to a different type of equipment, are involved in an accident or near-miss, or are observed operating unsafely. We offer fast renewal options including online, hands-on, and onsite training.",
    questionEs: "¿Necesito renovar mi certificación de montacargas?",
    answerEs: "Sí, OSHA requiere la evaluación del operador de montacargas cada 3 años. También puedes necesitar recertificarte antes si cambias a un tipo de equipo diferente, te ves involucrado en un accidente o casi accidente, o eres observado operando de manera insegura. Ofrecemos opciones de renovación rápidas, incluida la capacitación en línea, presencial y en sus instalaciones.",
    category: "certification",
  },
  {
    id: "onsite",
    conversational: true,
    question: "Can you train forklift operators at my workplace?",
    answer: "Yes, we offer onsite training where we come to your facility. This is often the best option for companies with 2 or more operators. You train on the equipment you actually use, and pricing starts at $200 to $280 per person with volume discounts for groups of 5 or more.",
    questionEs: "¿Pueden capacitar a operadores de montacargas en mi lugar de trabajo?",
    answerEs: "Sí, ofrecemos capacitación en sus instalaciones, donde vamos a su ubicación. Esta suele ser la mejor opción para empresas con 2 o más operadores. Sus operadores se capacitan en el equipo que realmente usan, y los precios comienzan entre $200 y $280 por persona, con descuentos por volumen para grupos de 5 o más.",
    category: "business",
  },
  {
    id: "ttt-what",
    conversational: true,
    question: "What is train the trainer for forklift certification?",
    answer: "Train the Trainer is a program that certifies you to train and evaluate your own forklift operators in-house. It costs $750 and takes 2 to 4 hours. This is a good option for companies with 10 or more employees who need ongoing training, since you can certify new hires yourself instead of bringing in outside trainers each time.",
    questionEs: "¿Qué es la Capacitación de Instructores (Train the Trainer) para la certificación de montacargas?",
    answerEs: "La Capacitación de Instructores (Train the Trainer) es un programa que lo certifica para capacitar y evaluar internamente a sus propios operadores de montacargas. Cuesta $750 y toma de 2 a 4 horas. Es una buena opción para empresas con 10 o más empleados que necesitan capacitación continua, ya que puede certificar usted mismo a los nuevos empleados en lugar de contratar capacitadores externos cada vez.",
    category: "business",
  },
];

/** Resolve FAQ items to one language ("es*" gives Spanish, anything else English). */
export function localizeFaq(items: FAQItem[], lang: string | undefined): LocalizedFAQItem[] {
  const es = !!lang && lang.startsWith("es");
  return items.map((item) => ({
    id: item.id,
    question: es ? item.questionEs : item.question,
    answer: es ? item.answerEs : item.answer,
    category: item.category,
    conversational: item.conversational,
  }));
}

export function getFAQsByCategory(category: FAQItem["category"]): FAQItem[] {
  return faqItems.filter((faq) => faq.category === category);
}
