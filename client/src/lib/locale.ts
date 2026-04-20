import i18n from "@/i18n";

export type Locale = "en" | "es";
export const SUPPORTED_LOCALES: Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";

const EN_TO_ES_SLUGS: Record<string, string> = {
  "/": "/",
  "/online-forklift-certification": "/certificacion-de-montacargas-en-linea",
  "/training-programs": "/programas-de-capacitacion",
  "/online-training": "/capacitacion-en-linea",
  "/hands-on-training": "/capacitacion-practica",
  "/train-the-trainer": "/capacitar-al-capacitador",
  "/business": "/empresas",
  "/business/products": "/empresas/productos",
  "/business/faq": "/empresas/preguntas-frecuentes",
  "/documentation": "/documentacion",
  "/support": "/soporte",
  "/contact": "/contacto",
  "/locations": "/ubicaciones",
  "/locations/san-diego": "/ubicaciones/san-diego",
  "/request-onsite-training": "/solicitar-capacitacion-presencial",
  "/book-training": "/reservar-capacitacion",
  "/blog": "/blog",
  "/cart": "/carrito",
  "/checkout": "/pago",
  "/login": "/iniciar-sesion",
  "/register": "/crear-cuenta",
  "/reset-password": "/restablecer-contrasena",
  "/accept-invite": "/aceptar-invitacion",
  "/become-an-instructor": "/convertirse-en-instructor",
  "/dashboard": "/panel",
  "/terms": "/terminos",
  "/privacy": "/privacidad",
  "/refund-policy": "/politica-de-reembolso",
  "/osha-compliance": "/cumplimiento-osha",
  "/group": "/equipo",
  "/group/members": "/equipo/miembros",
  "/group/seats": "/equipo/asientos",
  "/group/progress": "/equipo/progreso",
  "/group/certifications": "/equipo/certificaciones",
  "/forklift-certification-cost": "/costo-certificacion-montacargas",
  "/forklift-certification-near-me": "/certificacion-montacargas-cerca-de-mi",
  "/forklift-certification-verification": "/verificacion-certificacion-montacargas",
  "/osha-forklift-training": "/requisitos-osha-montacargas",
  "/group-forklift-training": "/capacitacion-grupal-montacargas",
  "/onsite-forklift-training": "/capacitacion-montacargas-en-sitio",
  "/forklift-certification-wallet-card": "/tarjeta-billetera-montacargas",
  "/certifications": "/certificaciones",
  "/verify": "/verificar",
};

const ES_TO_EN_SLUGS: Record<string, string> = {};
for (const [en, es] of Object.entries(EN_TO_ES_SLUGS)) {
  ES_TO_EN_SLUGS[es] = en;
}

export function getAlternateLocalePath(currentPath: string, targetLocale: Locale): string {
  const { locale: currentLocale, path: basePath } = parseLocalePath(currentPath);

  let enPath: string;
  if (currentLocale === "es") {
    enPath = resolveSegments(basePath, ES_TO_EN_SLUGS);
  } else {
    enPath = basePath;
  }

  if (targetLocale === "en") {
    return `/${targetLocale}${enPath === "/" ? "" : enPath}`;
  }

  const esPath = translateSegments(enPath, EN_TO_ES_SLUGS);
  return `/${targetLocale}${esPath === "/" ? "" : esPath}`;
}

export function parseLocalePath(path: string): { locale: Locale; path: string } {
  const match = path.match(/^\/(en|es)(\/.*)?$/);
  if (match) {
    const locale = match[1] as Locale;
    const rest = match[2] || "/";
    return { locale, path: rest };
  }
  return { locale: DEFAULT_LOCALE, path: path || "/" };
}

export function getCurrentLocale(): Locale {
  const lang = i18n.language;
  if (lang === "es") return "es";
  return "en";
}

export function localePath(path: string, locale?: Locale): string {
  const l = locale || getCurrentLocale();
  if (path.startsWith("/api/") || path.startsWith("/api")) return path;

  const cleanPath = path.replace(/^\/(en|es)/, "") || "/";

  if (l === "es") {
    const esSlug = translateSegments(cleanPath, EN_TO_ES_SLUGS);
    return `/es${esSlug === "/" ? "" : esSlug}`;
  }

  return `/${l}${cleanPath === "/" ? "" : cleanPath}`;
}

export function getEnglishPath(esPath: string): string {
  return ES_TO_EN_SLUGS[esPath] || esPath;
}

export function getSpanishPath(enPath: string): string {
  return EN_TO_ES_SLUGS[enPath] || enPath;
}

function resolveSegments(path: string, lookup: Record<string, string>): string {
  if (lookup[path]) return lookup[path];

  const segments = path.split("/");
  for (let i = segments.length - 1; i >= 1; i--) {
    const prefix = segments.slice(0, i).join("/") || "/";
    const match = lookup[prefix];
    if (match) {
      const tail = segments.slice(i).join("/");
      return match === "/" ? `/${tail}` : `${match}/${tail}`;
    }
  }
  return path;
}

function translateSegments(path: string, lookup: Record<string, string>): string {
  if (lookup[path]) return lookup[path];

  const segments = path.split("/");
  for (let i = segments.length - 1; i >= 1; i--) {
    const prefix = segments.slice(0, i).join("/") || "/";
    const match = lookup[prefix];
    if (match) {
      const tail = segments.slice(i).join("/");
      return match === "/" ? `/${tail}` : `${match}/${tail}`;
    }
  }
  return path;
}

export function resolveRouteFromLocale(localizedPath: string): string {
  return resolveSegments(localizedPath, ES_TO_EN_SLUGS);
}

const LOCALE_STORAGE_KEY = "preferred_locale";

export function getStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {}
  return null;
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
}
