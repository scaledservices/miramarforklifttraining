import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";

interface BlogTranslation {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
}

export const blogEs: Record<string, BlogTranslation> = {
  "osha-forklift-certification-requirements": {
    title: `Requisitos de Certificación de Montacargas de ${industry.regulatory.body}: Lo Que Necesita Saber en 2025`,
    excerpt: `Comprender los requisitos de certificación de montacargas de ${industry.regulatory.body} es esencial tanto para operadores como para empleadores. Conozca los estándares de capacitación, plazos de renovación y obligaciones de cumplimiento.`,
    category: "Certificación",
    readTime: "6 min de lectura",
  },
  "how-long-does-forklift-certification-take": {
    title: "¿Cuánto Tiempo Toma la Certificación de Montacargas? Desglose de Tiempos",
    excerpt: "¿Se pregunta cuánto tiempo toma obtener su certificación de montacargas? La respuesta depende del formato de capacitación que elija. Aquí hay un desglose completo de tiempos.",
    category: "Capacitación",
    readTime: "5 min de lectura",
  },
  "forklift-training-for-businesses": {
    title: "Soluciones de Capacitación de Montacargas para Empresas: Programas Internos vs. Externos",
    excerpt: "¿Decidiendo entre capacitación interna de montacargas o enviar empleados a un programa externo? Compare los costos, beneficios e implicaciones de cumplimiento de cada enfoque.",
    category: "Negocios",
    readTime: "5 min de lectura",
  },
  "types-of-forklifts-and-certifications": {
    title: "Tipos de Montacargas y Qué Certificaciones Necesita",
    excerpt: "No todos los montacargas son iguales, y tampoco las certificaciones. Conozca los diferentes tipos de vehículos industriales motorizados y qué programas de capacitación aplican a cada uno.",
    category: "Educación",
    readTime: "7 min de lectura",
  },
  "osha-forklift-recertification-guide": {
    title: `Recertificación de Montacargas ${industry.regulatory.body}: Cuándo y Cómo Renovar`,
    excerpt: `Las certificaciones de montacargas expiran cada 3 años. Conozca cuándo necesita recertificarse, qué provoca una recertificación temprana y si la renovación en línea o presencial es la adecuada para usted.`,
    category: "Certificación",
    readTime: "5 min de lectura",
  },
  "online-vs-in-person-forklift-training": {
    title: "Capacitación de Montacargas en Línea vs Presencial: ¿Cuál es la Adecuada para Usted?",
    excerpt: "Tanto la capacitación en línea como la presencial de montacargas tienen su lugar. Compare costo, tiempo, conveniencia y cumplimiento para decidir qué formato se ajusta a su situación.",
    category: "Capacitación",
    readTime: "6 min de lectura",
  },
  "forklift-certification-cost-2026": {
    title: "¿Cuánto Cuesta la Certificación de Montacargas en 2026?",
    excerpt: "Los costos de certificación de montacargas varían desde $59.99 hasta más de $500. Conozca qué determina el precio, qué tener en cuenta con los cargos ocultos y cómo obtener el mejor valor para su certificación.",
    category: "Precios",
    readTime: "6 min de lectura",
  },
};
