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
};
