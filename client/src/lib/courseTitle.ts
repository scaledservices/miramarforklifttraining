import i18n from "@/i18n";

/** Course names come from the database in English. In Spanish mode show the
 *  official Spanish course title (from scripts/course-content*-es.ts);
 *  anything unknown is returned unchanged. */
const ES_COURSE_TITLES: Record<string, string> = {
  "Online Forklift Operator Certification": "Certificación en Línea para Operador de Montacargas",
  "Forklift Operator Certification": "Certificación de Operador de Montacargas",
  "Forklift Train the Trainer Certification": "Certificación Capacitar al Capacitador de Montacargas",
  "Aerial & Scissor Lift Operator Certification": "Certificación en Línea para Operador de Elevadores Aéreos y de Tijera",
  "Aerial & Scissor Lift Train the Trainer Certification": "Certificación Capacitar al Capacitador de Elevadores Aéreos y de Tijera",
};

export function courseTitle(title: string | null | undefined): string {
  if (!title) return title ?? "";
  if (!i18n.language?.startsWith("es")) return title;
  return ES_COURSE_TITLES[title.trim()] ?? title;
}
