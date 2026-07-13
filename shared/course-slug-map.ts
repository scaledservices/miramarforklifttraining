/**
 * Maps English course slugs to their Spanish equivalents.
 *
 * The database stores EN and ES courses as separate records with different
 * slugs. When a user checks out in Spanish mode (locale="es"), we need to
 * enroll them in the Spanish version of the course.
 *
 * The catalog always references the EN slug (the "canonical" product slug).
 * This map translates that EN slug to the ES course slug at checkout time.
 */
export const EN_TO_ES_SLUG_MAP: Record<string, string> = {
  // Forklift Operator Certification
  "online-forklift-operator-certification": "certificacion-operador-montacargas-en-linea",
  "online-forklift-operator-training": "certificacion-operador-montacargas-en-linea",

  // Aerial & Scissor Lift Certification
  "online-aerial-scissor-lift-certification": "certificacion-elevadores-aereos-tijera-en-linea",

  // Forklift Train the Trainer
  "online-forklift-train-the-trainer": "certificacion-capacitar-capacitador-montacargas-en-linea",

  // Forklift Train the Trainer Combo (Inc. Kit)
  "online-forklift-train-the-trainer-combo": "certificacion-capacitar-capacitador-montacargas-combo-en-linea",

  // Aerial & Scissor Lift Train the Trainer
  "online-aerial-train-the-trainer": "certificacion-capacitar-capacitador-elevadores-aereos-en-linea",

  // Aerial & Scissor Lift Train the Trainer Combo (Inc. Kit)
  "online-aerial-train-the-trainer-combo": "certificacion-capacitar-capacitador-elevadores-aereos-combo-en-linea",
};

/**
 * Resolve a course slug to the correct language variant.
 * If locale is "es" and a mapping exists, returns the ES slug.
 * Otherwise returns the original slug unchanged.
 */
export function resolveCourseSlug(slug: string, locale?: string): string {
  if (locale === "es" && EN_TO_ES_SLUG_MAP[slug]) {
    return EN_TO_ES_SLUG_MAP[slug];
  }
  return slug;
}
