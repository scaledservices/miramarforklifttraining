import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { isAdminRole } from "@shared/roles";
import { brand } from "@shared/config/brand";

const SITE_URL = process.env.SITE_URL || `https://${brand.domain}`;

const STATIC_MARKETING_PAGES = [
  "/",
  "/online-forklift-certification",
  "/training-programs",
  "/online-training",
  "/hands-on-training",
  "/train-the-trainer",
  "/business",
  "/business/products",
  "/business/faq",
  "/documentation",
  "/contact",
  "/support",
  "/locations",
  "/request-quote",
  "/osha-compliance",
  "/locations/southern-california",
  "/locations/central-california",
  "/locations/southern-nevada",
  "/locations/san-diego",
  "/locations/las-vegas",
  "/locations/fresno",
  "/service-areas",
  "/service-areas/los-angeles",
  "/service-areas/bakersfield",
  "/service-areas/hayward",
  "/renewal",
  "/faq",
  "/verify",
];

const EN_TO_ES_STATIC_SLUGS: Record<string, string> = {
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
  "/contact": "/contacto",
  "/support": "/soporte",
  "/locations": "/ubicaciones",
  "/osha-compliance": "/cumplimiento-osha",
  "/locations/southern-california": "/ubicaciones/sur-de-california",
  "/locations/central-california": "/ubicaciones/centro-de-california",
  "/locations/southern-nevada": "/ubicaciones/sur-de-nevada",
  "/locations/san-diego": "/ubicaciones/san-diego",
  "/locations/las-vegas": "/ubicaciones/las-vegas",
  "/locations/fresno": "/ubicaciones/fresno",
  // Routes below keep the same slug in Spanish (see client/src/lib/locale.ts),
  // except /verify which is localized to /verificar.
  "/service-areas": "/service-areas",
  "/service-areas/los-angeles": "/service-areas/los-angeles",
  "/service-areas/bakersfield": "/service-areas/bakersfield",
  "/service-areas/hayward": "/service-areas/hayward",
  "/renewal": "/renewal",
  "/faq": "/faq",
  "/verify": "/verificar",
};

const ES_TO_EN_SEO_SLUGS: Record<string, string> = {
  "certificacion-de-montacargas-en-linea": "online-forklift-certification",
  "costo-certificacion-montacargas": "forklift-certification-cost",
  "certificacion-montacargas-cerca-de-mi": "forklift-certification-near-me",
  "verificacion-certificacion-montacargas": "forklift-certification-verification",
  "requisitos-osha-montacargas": "osha-forklift-training",
  "capacitacion-grupal-montacargas": "group-forklift-training",
  "capacitacion-montacargas-en-sitio": "onsite-forklift-training",
  "tarjeta-billetera-montacargas": "forklift-certification-wallet-card",
};

const EN_TO_ES_SEO_SLUGS: Record<string, string> = {};
for (const [es, en] of Object.entries(ES_TO_EN_SEO_SLUGS)) {
  EN_TO_ES_SEO_SLUGS[en] = es;
}

const NOINDEX_PATHS = [
  "/terms",
  "/privacy",
  "/refund-policy",
];

const DISALLOWED_PATHS_EN = [
  "/admin",
  "/dashboard",
  "/group",
  "/login",
  "/register",
  "/reset-password",
  "/accept-invite",
  "/become-an-instructor",
  "/api/",
  "/course/",
  "/order-cert-card/",
  "/certifications/",
  "/order-confirmation/",
  "/cart",
  "/checkout",
];
const DISALLOWED_PATHS_ES = [
  "/panel",
  "/equipo",
  "/iniciar-sesion",
  "/crear-cuenta",
  "/restablecer-contrasena",
  "/aceptar-invitacion",
  "/convertirse-en-instructor",
  "/carrito",
  "/pago",
];

const REDIRECT_MAP: Record<string, string> = {
  "osha-forklift-certification": "/online-forklift-certification",
  "forklift-license": "/online-forklift-certification",
  "forklift-training": "/online-forklift-certification",
  "certificacion-montacargas": "/es/certificacion-de-montacargas-en-linea",
  "licencia-montacargas": "/es/certificacion-de-montacargas-en-linea",
  "capacitacion-montacargas": "/es/certificacion-de-montacargas-en-linea",
};

export function registerSeoRoutes(app: Express) {
  for (const [slug, target] of Object.entries(REDIRECT_MAP)) {
    app.get(`/${slug}`, (_req: Request, res: Response) => {
      res.redirect(301, target);
    });
  }

  app.get("/robots.txt", (_req: Request, res: Response) => {
    const lines = [
      "User-agent: *",
      "Allow: /",
      "",
      ...DISALLOWED_PATHS_EN.flatMap(p => [
        `Disallow: ${p}`,
        `Disallow: /en${p}`,
        `Disallow: /es${p}`,
      ]),
      ...DISALLOWED_PATHS_ES.map(p => `Disallow: /es${p}`),
      "",
      `Sitemap: ${SITE_URL}/sitemap.xml`,
    ];
    res.type("text/plain").send(lines.join("\n"));
  });

  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const enSeoPages = await storage.listPublishedSeoPages("en");
      const esSeoPages = await storage.listPublishedSeoPages("es");

      const urls: string[] = [];

      for (const page of STATIC_MARKETING_PAGES) {
        const enPath = page === "/" ? "" : page;
        const esSlug = EN_TO_ES_STATIC_SLUGS[page];
        const esPath = esSlug === "/" ? "" : (esSlug || enPath);
        const enLoc = `${SITE_URL}/en${enPath}`;
        const esLoc = `${SITE_URL}/es${esPath}`;
        const priority = page === "/" ? "1.0" : page === "/online-forklift-certification" ? "0.9" : "0.7";

        urls.push(buildUrlEntry(enLoc, esLoc, priority, "weekly"));
      }

      for (const page of enSeoPages) {
        if (page.canonicalSlug && page.canonicalSlug !== page.slug) continue;
        if (REDIRECT_MAP[page.slug]) continue;
        const enLoc = `${SITE_URL}/en/${page.slug}`;
        const priority = getPriority(page.templateKey);
        const changefreq = page.templateKey.includes("LOCATION") ? "monthly" : "weekly";
        const lastmod = page.updatedAt ? new Date(page.updatedAt).toISOString().split("T")[0] : undefined;

        const knownEsSlug = EN_TO_ES_SEO_SLUGS[page.slug];
        const esCounterpart = knownEsSlug
          ? esSeoPages.find(ep => ep.slug === knownEsSlug)
          : esSeoPages.find(ep =>
              ep.canonicalSlug === page.slug
              || (ep.templateKey === page.templateKey && ep.state === page.state && ep.city === page.city && page.state)
            );

        if (esCounterpart) {
          const esLoc = `${SITE_URL}/es/${esCounterpart.slug}`;
          urls.push(buildUrlEntry(enLoc, esLoc, priority, changefreq, lastmod));
        } else {
          urls.push(buildEnOnlyUrlEntry(enLoc, priority, changefreq, lastmod));
        }
      }

      for (const page of esSeoPages) {
        if (page.canonicalSlug && page.canonicalSlug !== page.slug) continue;
        const knownEnSlug2 = ES_TO_EN_SEO_SLUGS[page.slug];
        const hasEnCounterpart = !!knownEnSlug2
          || enSeoPages.some(ep => ep.slug === page.canonicalSlug || (ep.templateKey === page.templateKey && ep.state === page.state && ep.city === page.city && page.state));
        if (hasEnCounterpart) continue;

        const esLoc = `${SITE_URL}/es/${page.slug}`;
        const priority = getPriority(page.templateKey);
        const changefreq = page.templateKey.includes("LOCATION") ? "monthly" : "weekly";
        const lastmod = page.updatedAt ? new Date(page.updatedAt).toISOString().split("T")[0] : undefined;

        urls.push(buildEsOnlyUrlEntry(esLoc, priority, changefreq, lastmod));
      }

      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...urls,
        "</urlset>",
      ].join("\n");

      res.type("application/xml").send(xml);
    } catch (error) {
      console.error("[SEO] Sitemap error:", error);
      res.status(500).type("text/plain").send("Error generating sitemap");
    }
  });

  app.get("/api/seo/pages/:slug", async (req: Request, res: Response) => {
    try {
      const locale = (req.query.locale as string) || "en";
      let page = await storage.getSeoPageBySlug(req.params.slug, locale);
      if (!page && locale === "es") {
        const esSlug = EN_TO_ES_SEO_SLUGS[req.params.slug];
        if (esSlug) {
          page = await storage.getSeoPageBySlug(esSlug, "es");
        }
      }
      if (!page || !page.published) {
        return res.status(404).json({ error: "Page not found" });
      }
      let enCounterpartSlug: string | undefined;
      if (locale === "es") {
        const canonicalSlug = page.canonicalSlug || page.slug;
        const knownEnSlug = ES_TO_EN_SEO_SLUGS[canonicalSlug];
        if (knownEnSlug) {
          enCounterpartSlug = knownEnSlug;
        } else {
          const enPages = await storage.getSeoPagesByTemplate(page.templateKey, "en");
          const enCounterpart =
            enPages.find(p => p.slug === canonicalSlug) ||
            (page.state && page.city
              ? enPages.find(p => p.state === page.state && p.city === page.city)
              : page.state
                ? enPages.find(p => p.state === page.state && !p.city)
                : null
            ) ||
            (page.industry ? enPages.find(p => p.industry === page.industry) : null) ||
            (page.equipmentType ? enPages.find(p => p.equipmentType === page.equipmentType) : null);
          if (enCounterpart) {
            enCounterpartSlug = enCounterpart.canonicalSlug || enCounterpart.slug;
          }
        }
      }
      return res.json({ page: { ...page, enCounterpartSlug } });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/seo/related/:slug", async (req: Request, res: Response) => {
    try {
      const locale = (req.query.locale as string) || "en";
      let page = await storage.getSeoPageBySlug(req.params.slug, locale);
      if (!page && locale === "es") {
        const esSlug = EN_TO_ES_SEO_SLUGS[req.params.slug];
        if (esSlug) {
          page = await storage.getSeoPageBySlug(esSlug, "es");
        }
      }
      if (!page) return res.json({ related: [], nearby: [], hubLinks: [] });

      const result = await buildRelatedLinks(page, locale);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/seo-pages", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || !isAdminRole(user.role)) return res.status(403).json({ error: "Forbidden" });

    try {
      const pages = await storage.listAllSeoPages();
      return res.json({ pages });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/seo-health", async (req: Request, res: Response) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || !isAdminRole(user.role)) return res.status(403).json({ error: "Forbidden" });

    try {
      const pages = await storage.listAllSeoPages();
      const published = pages.filter(p => p.published);
      const unpublished = pages.filter(p => !p.published);
      const missingTitle = pages.filter(p => !p.title || p.title.length < 10);
      const missingMeta = pages.filter(p => !p.metaDescription || p.metaDescription.length < 20);
      const missingH1 = pages.filter(p => !p.heroH1);

      const missingCanonical = pages.filter(p => !p.canonicalSlug);
      const selfCanonical = pages.filter(p => p.canonicalSlug === p.slug);

      const titleMap = new Map<string, string[]>();
      for (const p of pages) {
        const existing = titleMap.get(p.title) || [];
        existing.push(p.slug);
        titleMap.set(p.title, existing);
      }
      const duplicateTitles = Array.from(titleMap.entries())
        .filter(([_, slugs]) => slugs.length > 1)
        .map(([title, slugs]) => ({ title: title.substring(0, 60), slugs }));

      const metaMap = new Map<string, string[]>();
      for (const p of pages) {
        const existing = metaMap.get(p.metaDescription) || [];
        existing.push(p.slug);
        metaMap.set(p.metaDescription, existing);
      }
      const duplicateMetas = Array.from(metaMap.entries())
        .filter(([_, slugs]) => slugs.length > 1)
        .map(([meta, slugs]) => ({ meta: meta.substring(0, 60), slugs }));

      const canonicalSlugs = pages.filter(p => p.canonicalSlug).map(p => p.canonicalSlug);
      const dupes = canonicalSlugs.filter((s, i) => canonicalSlugs.indexOf(s) !== i);

      const templateCounts: Record<string, number> = {};
      for (const p of published) {
        templateCounts[p.templateKey] = (templateCounts[p.templateKey] || 0) + 1;
      }

      const sitemapSlugs = published
        .filter(p => !p.canonicalSlug || p.canonicalSlug === p.slug)
        .filter(p => !REDIRECT_MAP[p.slug])
        .map(p => p.slug);

      const nonIndexableSlugs = NOINDEX_PATHS.map(p => p.replace("/", ""));

      const sitemapNonIndexable = sitemapSlugs.filter(s => nonIndexableSlugs.includes(s));

      const thinContent = pages.filter(p => {
        const bodyLen = JSON.stringify(p.bodySections || []).length;
        const introLen = (p.introParagraph || "").length;
        return bodyLen + introLen < 500;
      });

      const localeCounts: Record<string, number> = {};
      for (const p of pages) {
        localeCounts[p.locale] = (localeCounts[p.locale] || 0) + 1;
      }

      return res.json({
        total: pages.length,
        published: published.length,
        unpublished: unpublished.length,
        missingTitle: missingTitle.length,
        missingMeta: missingMeta.length,
        missingH1: missingH1.length,
        missingCanonical: missingCanonical.length,
        selfCanonical: selfCanonical.length,
        duplicateCanonicals: dupes.length,
        duplicateTitles,
        duplicateMetas: duplicateMetas.length,
        thinContent: thinContent.length,
        thinContentSlugs: thinContent.slice(0, 10).map(p => p.slug),
        sitemapNonIndexable,
        templateCounts,
        localeCounts,
        redirectCount: Object.keys(REDIRECT_MAP).length,
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

function buildUrlEntry(enLoc: string, esLoc: string, priority: string, changefreq: string, lastmod?: string): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(enLoc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enLoc)}" />`,
    `    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(esLoc)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enLoc)}" />`,
    "  </url>",
    "  <url>",
    `    <loc>${escapeXml(esLoc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enLoc)}" />`,
    `    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(esLoc)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enLoc)}" />`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

function buildEnOnlyUrlEntry(enLoc: string, priority: string, changefreq: string, lastmod?: string): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(enLoc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(enLoc)}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(enLoc)}" />`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

function buildEsOnlyUrlEntry(esLoc: string, priority: string, changefreq: string, lastmod?: string): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(esLoc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    `    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(esLoc)}" />`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

function getPriority(templateKey: string): string {
  switch (templateKey) {
    case "TEMPLATE_COURSE": return "0.9";
    case "TEMPLATE_PRICING":
    case "TEMPLATE_NEAR_ME_HUB":
    case "TEMPLATE_PILLAR": return "0.8";
    case "TEMPLATE_KNOWLEDGE_ARTICLE":
    case "TEMPLATE_LOCATION_STATE": return "0.6";
    case "TEMPLATE_LOCATION_CITY": return "0.5";
    default: return "0.6";
  }
}

async function buildRelatedLinks(page: any, locale: string) {
  const related: any[] = [];
  const nearby: any[] = [];
  const hubLinks: any[] = [];

  hubLinks.push({
    slug: "online-forklift-certification",
    label: locale === "es" ? "Certifícate en Línea — $59.99" : "Get Certified Online — $59.99",
    type: "cta",
    isExternal: false,
  });

  if (page.templateKey === "TEMPLATE_LOCATION_CITY") {
    if (page.state) {
      const stateSlug = `forklift-certification-${page.state.toLowerCase().replace(/\s+/g, "-")}`;
      hubLinks.push({ slug: stateSlug, label: `All ${page.state} Locations`, type: "state" });
    }
    hubLinks.push({ slug: "forklift-certification-near-me", label: locale === "es" ? "Certificación Cerca de Mí" : "Forklift Certification Near Me", type: "hub" });

    if (page.state) {
      const stateCities = await storage.getSeoPagesByTemplate("TEMPLATE_LOCATION_CITY", locale);
      const sameSt = stateCities
        .filter(p => p.state === page.state && p.slug !== page.slug && p.published)
        .slice(0, 6)
        .map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1, city: p.city, state: p.state }));
      nearby.push(...sameSt);

      if (page.state) {
        const statePage = await storage.getSeoPageBySlug(
          `forklift-certification-${page.state.toLowerCase().replace(/\s+/g, "-")}`, locale
        );
        if (statePage && statePage.published) {
          related.push({ slug: statePage.slug, title: statePage.title, heroH1: statePage.heroH1, state: statePage.state });
        }
      }
    }
  } else if (page.templateKey === "TEMPLATE_LOCATION_STATE") {
    hubLinks.push({ slug: "forklift-certification-near-me", label: locale === "es" ? "Certificación Cerca de Mí" : "Forklift Certification Near Me", type: "hub" });

    const stateCities = await storage.getSeoPagesByTemplate("TEMPLATE_LOCATION_CITY", locale);
    const citiesInState = stateCities
      .filter(p => p.state === page.state && p.published)
      .slice(0, 10)
      .map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1, city: p.city, state: p.state }));
    related.push(...citiesInState);
  } else if (page.templateKey === "TEMPLATE_NEAR_ME_HUB") {
    const states = await storage.getSeoPagesByTemplate("TEMPLATE_LOCATION_STATE", locale);
    const topStates = states
      .filter(p => p.published)
      .slice(0, 10)
      .map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1, state: p.state }));
    related.push(...topStates);

    const cities = await storage.getSeoPagesByTemplate("TEMPLATE_LOCATION_CITY", locale);
    const topCities = cities
      .filter(p => p.published)
      .slice(0, 10)
      .map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1, city: p.city, state: p.state }));
    nearby.push(...topCities);
  } else if (page.templateKey === "TEMPLATE_PILLAR") {
    const articles = await storage.getSeoPagesByTemplate("TEMPLATE_KNOWLEDGE_ARTICLE", locale);
    const linkedSlugs = ((page.internalLinks as any[]) || []).map((l: any) => l.href?.replace(/^\//, "")).filter(Boolean);
    const linkedArticles = articles.filter(p => linkedSlugs.includes(p.slug) && p.published).slice(0, 15);
    related.push(...linkedArticles.map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1 })));

    const otherPillars = await storage.getSeoPagesByTemplate("TEMPLATE_PILLAR", locale);
    const otherP = otherPillars.filter(p => p.slug !== page.slug && p.published).slice(0, 3);
    hubLinks.push(...otherP.map(p => ({ slug: p.slug, label: p.heroH1, type: "pillar" })));
    hubLinks.push({ slug: "forklift-certification-cost", label: locale === "es" ? "Costo de Certificación" : "Certification Cost", type: "money" });
  } else if (page.templateKey === "TEMPLATE_KNOWLEDGE_ARTICLE") {
    const linkedSlugs = ((page.internalLinks as any[]) || []).map((l: any) => l.href?.replace(/^\//, "")).filter(Boolean);
    const allPages = await storage.listPublishedSeoPages(locale);
    const linkedPages = allPages.filter(p => linkedSlugs.includes(p.slug)).slice(0, 6);
    related.push(...linkedPages.map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1 })));

    const pillars = await storage.getSeoPagesByTemplate("TEMPLATE_PILLAR", locale);
    hubLinks.push(...pillars.filter(p => p.published).slice(0, 4).map(p => ({ slug: p.slug, label: p.heroH1, type: "pillar" })));
  } else if (["TEMPLATE_COURSE", "TEMPLATE_PRICING", "TEMPLATE_OSHA_COMPLIANCE", "TEMPLATE_GROUP_TRAINING", "TEMPLATE_GUIDE"].includes(page.templateKey)) {
    const states = await storage.getSeoPagesByTemplate("TEMPLATE_LOCATION_STATE", locale);
    related.push(...states.filter(p => p.published).slice(0, 10)
      .map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1, state: p.state })));

    const cities = await storage.getSeoPagesByTemplate("TEMPLATE_LOCATION_CITY", locale);
    nearby.push(...cities.filter(p => p.published).slice(0, 10)
      .map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1, city: p.city, state: p.state })));

    hubLinks.push({ slug: "forklift-certification-near-me", label: locale === "es" ? "Capacitación Cerca de Mí" : "Find Training Near Me", type: "hub" });
    hubLinks.push({ slug: "forklift-certification-cost", label: locale === "es" ? "Costo de Certificación" : "Certification Cost", type: "money" });
    hubLinks.push({ slug: "group-forklift-training", label: locale === "es" ? "Capacitación Grupal" : "Group & Employer Training", type: "money" });
  } else {
    const sameTemplate = await storage.getSeoPagesByTemplate(page.templateKey, locale);
    related.push(...sameTemplate
      .filter(p => p.slug !== page.slug && p.published)
      .slice(0, 12)
      .map(p => ({ slug: p.slug, title: p.title, heroH1: p.heroH1, city: p.city, state: p.state })));
  }

  return { related, nearby, hubLinks };
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
