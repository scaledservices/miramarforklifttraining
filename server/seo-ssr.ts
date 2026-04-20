import { Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import type { SeoPage } from "@shared/schema";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";

const SITE_URL = process.env.SITE_URL || `https://${brand.domain}`;
const SITE_NAME = brand.name;
const DEFAULT_OG_IMAGE = brand.og.defaultImage;

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
  "/request-onsite-training": "/solicitar-capacitacion-presencial",
  "/osha-compliance": "/cumplimiento-osha",
  "/locations/southern-california": "/ubicaciones/sur-de-california",
  "/locations/central-california": "/ubicaciones/centro-de-california",
  "/locations/southern-nevada": "/ubicaciones/sur-de-nevada",
  "/locations/san-diego": "/ubicaciones/san-diego",
  "/locations/las-vegas": "/ubicaciones/las-vegas",
  "/locations/fresno": "/ubicaciones/fresno",
  "/blog": "/blog",
  "/terms": "/terminos",
  "/privacy": "/privacidad",
  "/refund-policy": "/politica-de-reembolso",
};

const ES_TO_EN_STATIC_SLUGS: Record<string, string> = {};
for (const [en, es] of Object.entries(EN_TO_ES_STATIC_SLUGS)) {
  ES_TO_EN_STATIC_SLUGS[es] = en;
}

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

const STATIC_SEO_ROUTES = new Set([
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
  "/request-onsite-training",
  "/osha-compliance",
  "/blog",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/locations/southern-california",
  "/locations/central-california",
  "/locations/southern-nevada",
  "/locations/san-diego",
  "/locations/las-vegas",
  "/locations/fresno",
]);

const SSR_EXCLUDED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/group",
  "/login",
  "/register",
  "/reset-password",
  "/accept-invite",
  "/become-an-instructor",
  "/course/",
  "/order-cert-card/",
  "/certifications/",
  "/order-confirmation/",
  "/cart",
  "/checkout",
  "/panel",
  "/equipo",
  "/iniciar-sesion",
  "/crear-cuenta",
  "/restablecer-contrasena",
  "/aceptar-invitacion",
  "/convertirse-en-instructor",
  "/carrito",
  "/pago",
  "/api/",
  "/assets/",
  "/src/",
  "/node_modules/",
  "/@",
  "/vite-hmr",
  "/__vite",
  "/favicon",
];

function parseLocaleFromPath(reqPath: string): { locale: string; internalPath: string } {
  const match = reqPath.match(/^\/(en|es)(\/.*)?$/);
  if (match) {
    const locale = match[1];
    const rest = match[2] || "/";
    if (locale === "es") {
      const enPath = ES_TO_EN_STATIC_SLUGS[rest];
      return { locale, internalPath: enPath || rest };
    }
    return { locale, internalPath: rest };
  }
  return { locale: "en", internalPath: reqPath };
}

function shouldSSR(reqPath: string): boolean {
  if (reqPath.includes(".")) return false;

  const { internalPath } = parseLocaleFromPath(reqPath);

  for (const prefix of SSR_EXCLUDED_PREFIXES) {
    if (internalPath.startsWith(prefix)) return false;
  }
  return true;
}

function buildHreflangTags(enUrl: string, esUrl: string): string {
  return `<link rel="alternate" hreflang="en" href="${enUrl}" />
    <link rel="alternate" hreflang="es" href="${esUrl}" />
    <link rel="alternate" hreflang="x-default" href="${enUrl}" />`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let _viteDevServer: any = null;

export function setViteDevServer(vite: any) {
  _viteDevServer = vite;
}

let _prodManifestCssLinks: string | null = null;

const CLIENT_ENTRY = "src/main.tsx";

function collectEntryCss(manifest: Record<string, any>, key: string, visited = new Set<string>()): string[] {
  if (visited.has(key)) return [];
  visited.add(key);
  const entry = manifest[key];
  if (!entry) return [];
  const css: string[] = [];
  if (entry.css) css.push(...entry.css);
  if (entry.imports) {
    for (const imp of entry.imports) {
      css.push(...collectEntryCss(manifest, imp, visited));
    }
  }
  return css;
}

function getProdCssLinks(): string {
  if (_prodManifestCssLinks !== null) return _prodManifestCssLinks;

  _prodManifestCssLinks = "";
  try {
    const manifestPath = path.resolve(__dirname, "public", ".vite", "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const cssFiles = new Set<string>(collectEntryCss(manifest, CLIENT_ENTRY));
      if (cssFiles.size > 0) {
        const tags = Array.from(cssFiles).map(
          (href) => `<link rel="preload" as="style" href="/${href}" />\n    <link rel="stylesheet" href="/${href}" />`
        );
        _prodManifestCssLinks = tags.join("\n    ");
      }
    }
  } catch (err) {
    console.error("[SSR] Failed to read Vite manifest for CSS:", err);
  }
  return _prodManifestCssLinks;
}

function getSsrCssInjection(existingHead: string): string {
  if (process.env.NODE_ENV === "production") {
    return getProdCssLinks();
  }
  if (existingHead.includes('/src/index.css')) return "";
  return `<link rel="stylesheet" href="/src/index.css" />`;
}

const THEME_INIT_SCRIPT = `<script>try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}</script>`;

const CRITICAL_CSS = `<style>
      :root{--fc-bg:#ffffff;--fc-fg:#1e2a3a;--fc-font:'Montserrat',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
      .dark{--fc-bg:#141c26;--fc-fg:#eff2f5}
      html,body{margin:0;padding:0;background-color:var(--fc-bg);color:var(--fc-fg);font-family:var(--fc-font);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
      #root{opacity:0;min-height:100vh}
      .hydrated #root{opacity:1;transition:opacity .12s ease-in}
    </style>`;

async function getBaseTemplate(url: string): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    const distIndexPath = path.resolve(__dirname, "public", "index.html");
    return fs.readFileSync(distIndexPath, "utf-8");
  }

  const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");
  let template = fs.readFileSync(clientTemplate, "utf-8");
  if (_viteDevServer) {
    template = await _viteDevServer.transformIndexHtml(url, template);
  }
  return template;
}

function injectSeoIntoTemplate(
  template: string,
  opts: {
    title: string;
    metaDescription: string;
    canonical: string;
    ogImage: string;
    jsonLdItems: Record<string, unknown>[];
    bodyHtml: string;
    locale: string;
    enUrl: string;
    esUrl: string;
    noindex?: boolean;
  }
): string {
  const fullTitle = opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} | ${SITE_NAME}`;
  const ogLocale = opts.locale === "es" ? "es_ES" : "en_US";
  const ogLocaleAlt = opts.locale === "es" ? "en_US" : "es_ES";

  const seoHeadTags = `
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(opts.metaDescription)}" />
    ${opts.noindex ? '<meta name="robots" content="noindex, follow" />' : ""}
    <link rel="canonical" href="${opts.canonical}" />
    ${buildHreflangTags(opts.enUrl, opts.esUrl)}
    <meta property="og:title" content="${escapeHtml(fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(opts.metaDescription)}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${opts.ogImage}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:url" content="${opts.canonical}" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta property="og:locale:alternate" content="${ogLocaleAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(opts.metaDescription)}" />
    <meta name="twitter:image" content="${opts.ogImage}" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta name="theme-color" content="#1a3a5c" />
    ${opts.jsonLdItems.map(item => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join("\n    ")}`;

  let html = template;

  html = html.replace(/<html([^>]*)>/, (match, attrs) => {
    const cleanedAttrs = attrs.replace(/\s*lang="[^"]*"/g, "");
    return `<html${cleanedAttrs} lang="${opts.locale}">`;
  });

  const headOpenIdx = html.indexOf("<head");
  const headCloseTag = "</head>";
  const headCloseIdx = html.lastIndexOf(headCloseTag);
  if (headOpenIdx !== -1 && headCloseIdx !== -1) {
    const headEndOfOpen = html.indexOf(">", headOpenIdx) + 1;
    const headOpen = html.substring(headOpenIdx, headEndOfOpen);
    let headBody = html.substring(headEndOfOpen, headCloseIdx);
    const beforeHead = html.substring(0, headOpenIdx);
    const afterHead = html.substring(headCloseIdx);
    const cssInjection = getSsrCssInjection(headBody);

    const scriptBlocks: string[] = [];
    headBody = headBody.replace(/<script[\s\S]*?<\/script>/g, (match) => {
      if (match.includes('localStorage.getItem("theme")')) {
        return "";
      }
      const placeholder = `<!--SCRIPT_PLACEHOLDER_${scriptBlocks.length}-->`;
      scriptBlocks.push(match);
      return placeholder;
    });

    headBody = headBody.replace(/<title>[^<]*<\/title>/, "");
    headBody = headBody.replace(/<meta\s+name="description"[^>]*\/?\s*>/, "");
    headBody = headBody.replace(/<meta\s+property="og:[^"]*"[^>]*\/?\s*>/g, "");
    headBody = headBody.replace(/<meta\s+name="twitter:[^"]*"[^>]*\/?\s*>/g, "");

    const nonScriptHead = headBody.replace(/<!--SCRIPT_PLACEHOLDER_\d+-->/g, "").trim();
    const scriptTags = scriptBlocks.join("\n    ");

    const hasCriticalCss = nonScriptHead.includes("--fc-bg");
    const criticalBlock = hasCriticalCss ? "" : CRITICAL_CSS + "\n    ";

    html = beforeHead + headOpen + "\n    " +
      THEME_INIT_SCRIPT + "\n    " +
      criticalBlock +
      (cssInjection ? cssInjection + "\n    " : "") +
      nonScriptHead + "\n    " +
      seoHeadTags + "\n    " +
      scriptTags + "\n  " +
      afterHead;
  }

  html = html.replace(
    /<div\s+id=["']root["']\s*>\s*<\/div>/,
    `<div id="root">${opts.bodyHtml}</div>`
  );

  return html;
}

function buildJsonLd(page: SeoPage, locale: string): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];

  items.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}${brand.logo.full}`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: brand.support.phoneE164,
      contactType: "customer service",
      availableLanguage: ["English", "Spanish"],
    },
    description: brand.description,
    inLanguage: locale,
  });

  const breadcrumbItems = buildBreadcrumbItems(page);
  if (breadcrumbItems.length > 0) {
    items.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url ? `${SITE_URL}/${locale}${item.url}` : undefined,
      })),
    });
  }

  const faqs = (page.faqJson as Array<{ q: string; a: string }>) || [];
  if (faqs.length > 0) {
    items.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: faqs.map(faq => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  if (page.templateKey === "TEMPLATE_COURSE") {
    items.push({
      "@context": "https://schema.org",
      "@type": "Course",
      name: page.heroH1,
      description: page.metaDescription,
      inLanguage: locale,
      provider: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
      offers: {
        "@type": "Offer",
        price: 59.99,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    });
  }

  return items;
}

function buildBreadcrumbItems(page: SeoPage): Array<{ name: string; url?: string }> {
  const items: Array<{ name: string; url?: string }> = [];
  items.push({ name: "Home", url: "/" });

  if (page.state && page.city) {
    items.push({ name: "Forklift Certification Near Me", url: "/forklift-certification-near-me" });
    items.push({ name: page.state, url: `/forklift-certification-${page.state.toLowerCase().replace(/\s+/g, "-")}` });
    items.push({ name: page.city });
  } else if (page.state) {
    items.push({ name: "Forklift Certification Near Me", url: "/forklift-certification-near-me" });
    items.push({ name: page.state });
  } else if (page.industry) {
    items.push({ name: "Training Programs", url: "/training-programs" });
    items.push({ name: page.industry });
  } else if (page.equipmentType) {
    items.push({ name: "Training Programs", url: "/training-programs" });
    items.push({ name: page.equipmentType });
  } else if (page.templateKey === "TEMPLATE_PILLAR" || page.templateKey === "TEMPLATE_KNOWLEDGE_ARTICLE") {
    items.push({ name: "Knowledge Center", url: "/forklift-certification-faq" });
    items.push({ name: page.heroH1 });
  } else {
    items.push({ name: page.heroH1 });
  }

  return items;
}

function headingId(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderBodySectionsHtml(sections: any[]): string {
  if (!sections || sections.length === 0) return "";

  return sections.map(section => {
    const hId = section.heading ? ` id="${headingId(section.heading)}"` : "";
    switch (section.type) {
      case "rich_text":
        return `<div${hId}>${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}${section.content || ""}</div>`;
      case "icon_list":
        return `<div${hId}>${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}<ul>${(section.items || []).map((item: string) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
      case "step_list":
        return `<div${hId}>${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}<ol>${(section.steps || []).map((step: any) => `<li><strong>${escapeHtml(step.title)}</strong>: ${escapeHtml(step.description)}</li>`).join("")}</ol></div>`;
      case "callout":
        return `<aside>${section.heading ? `<h3>${escapeHtml(section.heading)}</h3>` : ""}${section.content ? `<p>${escapeHtml(section.content)}</p>` : ""}</aside>`;
      case "comparison_table":
        return `<div${hId}>${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}<table><thead><tr><th>Feature</th><th>${brand.name}</th><th>Others</th></tr></thead><tbody>${(section.columns || []).map((col: any) => `<tr><td>${escapeHtml(col.label)}</td><td>${escapeHtml(col.ours || "✓")}</td><td>${escapeHtml(col.others || "—")}</td></tr>`).join("")}</tbody></table></div>`;
      case "testimonial":
        return `<blockquote>${section.quote ? `<p>"${escapeHtml(section.quote)}"</p>` : ""}${section.author ? `<cite>— ${escapeHtml(section.author)}</cite>` : ""}</blockquote>`;
      default:
        return section.content ? `<div>${section.content}</div>` : "";
    }
  }).join("\n");
}

function renderFaqHtml(faqs: Array<{ q: string; a: string }>): string {
  if (!faqs || faqs.length === 0) return "";
  return `<section><h2>Frequently Asked Questions</h2>${faqs.map(faq =>
    `<details><summary>${escapeHtml(faq.q)}</summary><p>${escapeHtml(faq.a)}</p></details>`
  ).join("")}</section>`;
}

function buildTableOfContents(sections: any[], faqs: any[]): string {
  const headings: string[] = [];
  for (const s of sections) {
    if (s.heading) headings.push(s.heading);
  }
  if (faqs.length > 0) headings.push("Frequently Asked Questions");
  if (headings.length < 3) return "";
  return `<nav aria-label="Table of Contents"><h2>In This Article</h2><ol>${headings.map(h => {
    const id = h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<li><a href="#${id}">${escapeHtml(h)}</a></li>`;
  }).join("")}</ol></nav>`;
}

function renderInternalLinks(links: any[]): string {
  if (!links || links.length === 0) return "";
  return `<nav aria-label="Related articles"><h2>Related Articles</h2><ul>${links.map((l: any) =>
    `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`
  ).join("")}</ul></nav>`;
}

function buildSeoPageBodyHtml(page: SeoPage): string {
  const faqs = (page.faqJson as Array<{ q: string; a: string }>) || [];
  const bodySections = (page.bodySections as any[]) || [];
  const internalLinks = (page.internalLinks as any[]) || [];
  const isKnowledge = page.templateKey === "TEMPLATE_PILLAR" || page.templateKey === "TEMPLATE_KNOWLEDGE_ARTICLE";

  return `
    <nav aria-label="breadcrumb">${buildBreadcrumbItems(page).map((item, i, arr) =>
      item.url && i < arr.length - 1
        ? `<a href="${item.url}">${escapeHtml(item.name)}</a> › `
        : `<span>${escapeHtml(item.name)}</span>`
    ).join("")}</nav>
    <header>
      <h1>${escapeHtml(page.heroH1)}</h1>
      ${page.heroSubtitle ? `<p>${escapeHtml(page.heroSubtitle)}</p>` : ""}
      <a href="/online-forklift-certification">Start Certification — $59.99</a>
    </header>
    ${!isKnowledge ? `<section><div><span>${industry.regulatory.body}-Compliant</span> · <span>${industry.regulatory.standard}</span> · <span>Certificate Included</span> · <span>Same-Day Certification</span> · <span>$59.99</span></div></section>` : ""}
    ${page.introParagraph ? `<p>${escapeHtml(page.introParagraph)}</p>` : ""}
    ${isKnowledge ? buildTableOfContents(bodySections, faqs) : ""}
    ${renderBodySectionsHtml(bodySections)}
    ${renderFaqHtml(faqs)}
    ${isKnowledge ? renderInternalLinks(internalLinks) : ""}
    <section>
      <h2>${isKnowledge ? "Ready to Get Certified?" : "Get Certified Today"}</h2>
      <p>Complete your ${industry.regulatory.body}-compliant forklift certification online. Same-day certification available.</p>
      <a href="/online-forklift-certification">Start Certification — $59.99</a>
      ${isKnowledge ? `<a href="/forklift-certification-cost">Learn About Pricing</a>` : ""}
    </section>`;
}

const STATIC_PAGE_META: Record<string, { title: string; description: string; h1: string; bodyHtml: string; jsonLd?: Record<string, unknown>[]; noindex?: boolean }> = {
  "/": {
    title: `${brand.name} | ${industry.regulatory.body}-Aligned Forklift Training & Certification`,
    description: `Get your forklift certification online or at our training facilities. ${industry.regulatory.body}-aligned programs with same-day certification available. Starting at $59.99.`,
    h1: `${industry.regulatory.body}-Aligned Forklift Training & Certification`,
    bodyHtml: `<p>Get your forklift certification online or at our training facilities. ${industry.regulatory.body}-aligned programs with same-day certification available. Starting at $59.99.</p>
      <ul><li>Online certification — complete at your own pace</li><li>Same-day certification upon passing</li><li>${industry.regulatory.body}-compliant training (${industry.regulatory.standard})</li><li>Digital certificate with QR verification</li></ul>
      <p><a href="/online-forklift-certification">Start Certification — $59.99</a></p>`,
  },
  "/online-forklift-certification": {
    title: `Online Forklift Certification — ${industry.regulatory.body}-Compliant Training | $59.99`,
    description: `Complete your forklift operator certification online. ${industry.regulatory.body}-compliant training with same-day certification. Includes digital certificate with QR verification.`,
    h1: "Online Forklift Certification",
    bodyHtml: `<p>Complete your forklift operator certification online with our ${industry.regulatory.body}-compliant training program. Our comprehensive 8-module course covers all topics required by ${industry.regulatory.standard}, including pre-operation inspections, load handling, stability, pedestrian safety, and workplace hazards.</p>
      <h2>What's Included</h2>
      <ul><li>8-module ${industry.regulatory.body}-compliant training course</li><li>Final certification exam (up to 3 attempts)</li><li>Digital certificate with QR verification code</li><li>Employer documentation packet</li><li>Lifetime access to course materials</li></ul>
      <h2>How It Works</h2>
      <ol><li>Sign up and purchase the course for $59.99</li><li>Complete 8 training modules at your own pace</li><li>Pass the final exam with 80% or higher</li><li>Download your certificate immediately</li><li>Your employer completes the hands-on evaluation</li></ol>
      <p><a href="/online-forklift-certification">Start Certification — $59.99</a></p>`,
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Online Forklift Operator Certification",
      description: `${industry.regulatory.body}-compliant online forklift operator certification training. Complete at your own pace with same-day certification.`,
      provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      offers: { "@type": "Offer", price: 59.99, priceCurrency: "USD", availability: "https://schema.org/InStock" },
    }],
  },
  "/training-programs": {
    title: `Forklift Training Programs — Online & In-Person | ${brand.name}`,
    description: `Explore our forklift training programs: online certification, in-person training, and train-the-trainer programs. ${industry.regulatory.body}-compliant with flexible scheduling.`,
    h1: "Forklift Training Programs",
    bodyHtml: `<p>Explore our forklift training programs designed to meet ${industry.regulatory.body} requirements. Whether you prefer online learning or hands-on instruction, we have a program for you.</p>
      <ul><li>Online Certification — Self-paced, $59.99</li><li>In-Person Training — Hands-on instruction at our facilities</li><li>Train-the-Trainer — Become a certified forklift instructor</li><li>Group Training — Volume pricing for businesses</li></ul>`,
  },
  "/online-training": {
    title: `Online Forklift Training — Self-Paced Certification | ${brand.name}`,
    description: `Complete your forklift training online at your own pace. ${industry.regulatory.body}-compliant curriculum with same-day certification available.`,
    h1: "Online Forklift Training",
    bodyHtml: `<p>Complete your forklift training online at your own pace. Our ${industry.regulatory.body}-compliant curriculum covers all required topics and provides same-day certification upon successful completion.</p>`,
  },
  "/hands-on-training": {
    title: `Hands-On Forklift Training — In-Person Certification | ${brand.name}`,
    description: `In-person forklift training at our facilities. Hands-on instruction with ${industry.regulatory.body}-compliant certification. Locations in San Diego, Las Vegas, and Fresno.`,
    h1: "Hands-On Forklift Training",
    bodyHtml: `<p>In-person forklift training at our facilities in San Diego, Las Vegas, and Fresno. Get hands-on instruction with ${industry.regulatory.body}-compliant certification.</p>`,
  },
  "/train-the-trainer": {
    title: `Forklift Train-the-Trainer Program | ${brand.name}`,
    description: `Become a certified forklift trainer. Our train-the-trainer program equips you to teach ${industry.regulatory.body}-compliant forklift safety courses at your organization.`,
    h1: "Forklift Train-the-Trainer Program",
    bodyHtml: `<p>Become a certified forklift trainer with our comprehensive train-the-trainer program. Equip yourself to teach ${industry.regulatory.body}-compliant forklift safety courses at your organization.</p>`,
  },
  "/business": {
    title: `Business Forklift Training Solutions | ${brand.name}`,
    description: "Enterprise forklift certification solutions. Volume pricing, compliance tracking, and dedicated support for businesses with 5+ operators.",
    h1: "Business Forklift Training Solutions",
    bodyHtml: `<p>Enterprise forklift certification solutions for businesses of all sizes. Get volume pricing, compliance tracking, and dedicated support for your team.</p>`,
  },
  "/business/products": {
    title: `Business Training Products & Pricing | ${brand.name}`,
    description: "Explore our business training products: group certification, compliance bundles, and enterprise solutions for forklift operator training.",
    h1: "Business Training Products & Pricing",
    bodyHtml: `<p>Explore our business training products including group certification programs, compliance bundles, and enterprise solutions for forklift operator training.</p>`,
  },
  "/business/faq": {
    title: `Business Training FAQ | ${brand.name}`,
    description: "Frequently asked questions about our business forklift training solutions, volume pricing, and enterprise features.",
    h1: "Business Training FAQ",
    bodyHtml: `<p>Find answers to frequently asked questions about our business forklift training solutions, volume pricing, and enterprise features.</p>`,
  },
  "/documentation": {
    title: `Training Documentation & Resources | ${brand.name}`,
    description: `Access forklift training documentation, employer evaluation forms, compliance checklists, and ${industry.regulatory.body} reference materials.`,
    h1: "Training Documentation & Resources",
    bodyHtml: `<p>Access forklift training documentation, employer evaluation forms, compliance checklists, and ${industry.regulatory.body} reference materials to support your certification process.</p>`,
  },
  "/contact": {
    title: `Contact Us | ${brand.name}`,
    description: `Contact ${brand.name} for questions about forklift certification, business training, or technical support. Call ${brand.support.phone}.`,
    h1: "Contact Us",
    bodyHtml: `<p>Contact ${brand.name} for questions about forklift certification, business training, or technical support. Call us at ${brand.support.phone} or use the contact form below.</p>`,
  },
  "/osha-compliance": {
    title: `${industry.regulatory.body} Forklift Compliance Guide — ${industry.regulatory.standard} | ${brand.name}`,
    description: `Comprehensive guide to ${industry.regulatory.body} forklift compliance requirements under ${industry.regulatory.standard}. Training obligations, penalties, and how to stay compliant.`,
    h1: `${industry.regulatory.body} Forklift Compliance Guide`,
    bodyHtml: `<p>Comprehensive guide to ${industry.regulatory.body} forklift compliance requirements under ${industry.regulatory.standard}. Understand your training obligations, potential penalties, and how to stay compliant.</p>
      <h2>Key ${industry.regulatory.body} Requirements</h2>
      <ul><li>All forklift operators must be trained and certified</li><li>Training must cover topics specified in ${industry.regulatory.standard}(l)</li><li>Operators must be re-evaluated at least every ${industry.regulatory.certificationValidity}</li><li>Employers must provide training at no cost to employees</li></ul>`,
  },
  "/blog": {
    title: `Forklift Safety Blog — Training Tips & Industry News | ${brand.name}`,
    description: `Stay up to date with forklift safety tips, industry news, ${industry.regulatory.body} updates, and training best practices from ${brand.name}.`,
    h1: "Forklift Safety Blog",
    bodyHtml: `<p>Stay up to date with forklift safety tips, industry news, ${industry.regulatory.body} updates, and training best practices from ${brand.name}.</p>`,
  },
  "/terms": {
    title: `Terms of Service | ${brand.name}`,
    description: `Terms of service for ${brand.name} forklift training and certification platform.`,
    h1: "Terms of Service",
    bodyHtml: `<p>These terms of service govern your use of the ${brand.name} forklift training and certification platform.</p>`,
    noindex: true,
  },
  "/privacy": {
    title: `Privacy Policy | ${brand.name}`,
    description: `Privacy policy for ${brand.name}. Learn how we collect, use, and protect your personal information.`,
    h1: "Privacy Policy",
    bodyHtml: `<p>This privacy policy explains how ${brand.name} collects, uses, and protects your personal information.</p>`,
    noindex: true,
  },
  "/refund-policy": {
    title: `Refund Policy | ${brand.name}`,
    description: `Refund and cancellation policy for ${brand.name} training courses and certification products.`,
    h1: "Refund Policy",
    bodyHtml: `<p>Our refund and cancellation policy for ${brand.name} training courses and certification products.</p>`,
    noindex: true,
  },
  "/support": {
    title: `Support & Contact | ${brand.name}`,
    description: `Get help from ${brand.name}. Contact our support team for questions about forklift certification, training, or technical issues. Call ${brand.support.phone}.`,
    h1: "Support & Contact",
    bodyHtml: `<p>Get instant help from our AI assistant or contact the ${brand.name} team. We're here to help with pricing, certification questions, ${industry.regulatory.body} requirements, and more.</p>`,
  },
  "/locations": {
    title: `On-Site Training Locations | ${brand.name}`,
    description: `Book on-site forklift certification training across Southern California, Central California, and Southern Nevada. ${industry.regulatory.body}-aligned hands-on instruction at your facility.`,
    h1: "On-Site Training Locations",
    bodyHtml: `<p>Book on-site forklift certification training across Southern California, Central California, and Southern Nevada. ${industry.regulatory.body}-aligned hands-on instruction at your facility.</p>`,
  },
  "/request-onsite-training": {
    title: `Request On-Site Forklift Training | ${brand.name}`,
    description: `Request on-site forklift certification training at your facility. ${industry.regulatory.body}-aligned programs for groups of any size. Get a quote today.`,
    h1: "Request On-Site Forklift Training",
    bodyHtml: `<p>Request on-site forklift certification training at your facility. We come to you — ${industry.regulatory.body}-aligned programs for groups of any size.</p>`,
  },
  "/locations/southern-california": {
    title: `On-Site Forklift Training in Southern California | ${brand.name}`,
    description: `${brand.name} provides on-site forklift certification training throughout Southern California. ${industry.regulatory.body}-aligned hands-on training in San Diego, Los Angeles, Orange County, and the Inland Empire.`,
    h1: "On-Site Forklift Training in Southern California",
    bodyHtml: `<p>${brand.name} provides on-site forklift certification training throughout Southern California including San Diego, Los Angeles, Orange County, and the Inland Empire.</p>`,
  },
  "/locations/central-california": {
    title: `On-Site Forklift Training in Central California | ${brand.name}`,
    description: `${brand.name} brings professional on-site forklift certification to the Central Valley. ${industry.regulatory.body}-aligned training in Fresno, Bakersfield, Visalia, and surrounding areas.`,
    h1: "On-Site Forklift Training in Central California",
    bodyHtml: `<p>${brand.name} brings professional on-site forklift certification to the Central Valley including Fresno, Bakersfield, and Visalia.</p>`,
  },
  "/locations/southern-nevada": {
    title: `On-Site Forklift Training in Southern Nevada | ${brand.name}`,
    description: `${brand.name} provides on-site forklift certification throughout the Las Vegas metro area. ${industry.regulatory.body}-aligned training in Las Vegas, Henderson, and North Las Vegas.`,
    h1: "On-Site Forklift Training in Southern Nevada",
    bodyHtml: `<p>${brand.name} provides on-site forklift certification throughout the Las Vegas metro area including Henderson and North Las Vegas.</p>`,
  },
  "/locations/san-diego": {
    title: `Forklift Training in San Diego | ${brand.name}`,
    description: `Get certified at our San Diego training facility. Hands-on ${industry.regulatory.body}-aligned forklift certification with same-day results available.`,
    h1: "Forklift Training in San Diego",
    bodyHtml: `<p>Our San Diego training facility offers comprehensive hands-on forklift certification programs. Training available in English and Spanish.</p>`,
  },
  "/locations/las-vegas": {
    title: `Forklift Training in Las Vegas | ${brand.name}`,
    description: `Get certified at our Las Vegas training facility. Full range of ${industry.regulatory.body}-aligned operator certifications and Train the Trainer programs.`,
    h1: "Forklift Training in Las Vegas",
    bodyHtml: `<p>Our Las Vegas training facility offers a full range of forklift certification programs including operator certifications and Train the Trainer courses.</p>`,
  },
  "/locations/fresno": {
    title: `Forklift Training in Fresno | ${brand.name}`,
    description: `Get certified at our Fresno, CA training location. ${industry.regulatory.body}-aligned hands-on forklift operator certification with same-day results.`,
    h1: "Forklift Training in Fresno",
    bodyHtml: `<p>Our Fresno training location brings professional forklift certification to Central California. Training available in English and Spanish.</p>`,
  },
};

const STATIC_PAGE_META_ES: Record<string, { title: string; description: string; h1: string; bodyHtml: string; jsonLd?: Record<string, unknown>[]; noindex?: boolean }> = {
  "/": {
    title: `${brand.name} | Capacitación y Certificación de Montacargas Alineada con ${industry.regulatory.body}`,
    description: `Obtén tu certificación de montacargas en línea o en nuestras instalaciones. Programas alineados con ${industry.regulatory.body} con certificación el mismo día. Desde $59.99.`,
    h1: `Capacitación y Certificación de Montacargas Alineada con ${industry.regulatory.body}`,
    bodyHtml: `<p>Obtén tu certificación de montacargas en línea o en nuestras instalaciones. Programas alineados con ${industry.regulatory.body} con certificación el mismo día. Desde $59.99.</p>
      <ul><li>Certificación en línea — completa a tu propio ritmo</li><li>Certificación el mismo día al aprobar</li><li>Capacitación conforme a ${industry.regulatory.body} (${industry.regulatory.standard})</li><li>Certificado digital con verificación QR</li></ul>`,
  },
  "/online-forklift-certification": {
    title: `Certificación de Montacargas en Línea — Capacitación Conforme a ${industry.regulatory.body} | $59.99`,
    description: `Completa tu certificación de operador de montacargas en línea. Capacitación conforme a ${industry.regulatory.body} con certificación el mismo día. Incluye certificado digital con verificación QR.`,
    h1: "Certificación de Montacargas en Línea",
    bodyHtml: `<p>Completa tu certificación de operador de montacargas en línea con nuestro programa de capacitación conforme a ${industry.regulatory.body}.</p>`,
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Certificación de Operador de Montacargas en Línea",
      description: `Capacitación de certificación de operador de montacargas en línea conforme a ${industry.regulatory.body}. Completa a tu ritmo con certificación el mismo día.`,
      inLanguage: "es",
      provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      offers: { "@type": "Offer", price: 59.99, priceCurrency: "USD", availability: "https://schema.org/InStock" },
    }],
  },
  "/training-programs": {
    title: `Programas de Capacitación de Montacargas — En Línea y Presencial | ${brand.name}`,
    description: `Explora nuestros programas de capacitación de montacargas: certificación en línea, capacitación presencial y programas de formador de formadores. Conforme a ${industry.regulatory.body}.`,
    h1: "Programas de Capacitación de Montacargas",
    bodyHtml: `<p>Explora nuestros programas de capacitación de montacargas diseñados para cumplir los requisitos de ${industry.regulatory.body}.</p>`,
  },
  "/online-training": {
    title: `Capacitación de Montacargas en Línea — Certificación a Tu Ritmo | ${brand.name}`,
    description: `Completa tu capacitación de montacargas en línea a tu propio ritmo. Currículo conforme a ${industry.regulatory.body} con certificación el mismo día.`,
    h1: "Capacitación de Montacargas en Línea",
    bodyHtml: `<p>Completa tu capacitación de montacargas en línea a tu propio ritmo.</p>`,
  },
  "/hands-on-training": {
    title: `Capacitación Práctica de Montacargas — Certificación Presencial | ${brand.name}`,
    description: `Capacitación presencial de montacargas en nuestras instalaciones. Instrucción práctica con certificación conforme a ${industry.regulatory.body}.`,
    h1: "Capacitación Práctica de Montacargas",
    bodyHtml: `<p>Capacitación presencial de montacargas en nuestras instalaciones.</p>`,
  },
  "/train-the-trainer": {
    title: `Programa Capacitar al Capacitador de Montacargas | ${brand.name}`,
    description: `Conviértete en capacitador certificado de montacargas. Nuestro programa te prepara para enseñar cursos de seguridad conforme a ${industry.regulatory.body}.`,
    h1: "Programa Capacitar al Capacitador de Montacargas",
    bodyHtml: `<p>Conviértete en capacitador certificado de montacargas con nuestro programa integral.</p>`,
  },
  "/business": {
    title: `Soluciones de Capacitación de Montacargas para Empresas | ${brand.name}`,
    description: "Soluciones empresariales de certificación de montacargas. Precios por volumen, seguimiento de cumplimiento y soporte dedicado.",
    h1: "Soluciones de Capacitación para Empresas",
    bodyHtml: `<p>Soluciones empresariales de certificación de montacargas para empresas de todos los tamaños.</p>`,
  },
  "/business/products": {
    title: `Productos y Precios de Capacitación Empresarial | ${brand.name}`,
    description: "Explora nuestros productos de capacitación empresarial: certificación grupal, paquetes de cumplimiento y soluciones empresariales.",
    h1: "Productos y Precios de Capacitación Empresarial",
    bodyHtml: `<p>Explora nuestros productos de capacitación empresarial.</p>`,
  },
  "/business/faq": {
    title: `Preguntas Frecuentes de Capacitación Empresarial | ${brand.name}`,
    description: "Preguntas frecuentes sobre nuestras soluciones de capacitación empresarial de montacargas, precios por volumen y funciones empresariales.",
    h1: "Preguntas Frecuentes de Capacitación Empresarial",
    bodyHtml: `<p>Encuentra respuestas a preguntas frecuentes sobre nuestras soluciones de capacitación empresarial.</p>`,
  },
  "/documentation": {
    title: `Documentación y Recursos de Capacitación | ${brand.name}`,
    description: `Accede a documentación de capacitación de montacargas, formularios de evaluación, listas de cumplimiento y materiales de referencia de ${industry.regulatory.body}.`,
    h1: "Documentación y Recursos de Capacitación",
    bodyHtml: `<p>Accede a documentación de capacitación de montacargas y materiales de referencia.</p>`,
  },
  "/contact": {
    title: `Contáctenos | ${brand.name}`,
    description: `Contacta a ${brand.name} para preguntas sobre certificación de montacargas, capacitación empresarial o soporte técnico. Llama al ${brand.support.phone}.`,
    h1: "Contáctenos",
    bodyHtml: `<p>Contacta a ${brand.name} para preguntas sobre certificación de montacargas. Llámanos al ${brand.support.phone}.</p>`,
  },
  "/osha-compliance": {
    title: `Guía de Cumplimiento ${industry.regulatory.body} para Montacargas — ${industry.regulatory.standard} | ${brand.name}`,
    description: `Guía completa de requisitos de cumplimiento ${industry.regulatory.body} para montacargas bajo ${industry.regulatory.standard}. Obligaciones de capacitación y cómo cumplir.`,
    h1: `Guía de Cumplimiento ${industry.regulatory.body} para Montacargas`,
    bodyHtml: `<p>Guía completa de requisitos de cumplimiento ${industry.regulatory.body} para montacargas.</p>`,
  },
  "/blog": {
    title: `Blog de Seguridad de Montacargas — Consejos y Noticias | ${brand.name}`,
    description: `Mantente al día con consejos de seguridad de montacargas, noticias de la industria y mejores prácticas de capacitación de ${brand.name}.`,
    h1: "Blog de Seguridad de Montacargas",
    bodyHtml: `<p>Mantente al día con consejos de seguridad de montacargas y noticias de la industria.</p>`,
  },
  "/terms": {
    title: `Términos de Servicio | ${brand.name}`,
    description: `Términos de servicio de la plataforma de capacitación y certificación de montacargas ${brand.name}.`,
    h1: "Términos de Servicio",
    bodyHtml: `<p>Estos términos de servicio rigen el uso de la plataforma ${brand.name}.</p>`,
    noindex: true,
  },
  "/privacy": {
    title: `Política de Privacidad | ${brand.name}`,
    description: `Política de privacidad de ${brand.name}. Conoce cómo recopilamos, usamos y protegemos tu información personal.`,
    h1: "Política de Privacidad",
    bodyHtml: `<p>Esta política de privacidad explica cómo ${brand.name} recopila, usa y protege tu información personal.</p>`,
    noindex: true,
  },
  "/refund-policy": {
    title: `Política de Reembolso | ${brand.name}`,
    description: `Política de reembolso y cancelación de cursos de capacitación y productos de certificación de ${brand.name}.`,
    h1: "Política de Reembolso",
    bodyHtml: `<p>Nuestra política de reembolso y cancelación para cursos de capacitación y productos de certificación.</p>`,
    noindex: true,
  },
  "/support": {
    title: `Soporte y Contacto | ${brand.name}`,
    description: `Obtén ayuda de ${brand.name}. Contacta a nuestro equipo de soporte para preguntas sobre certificación de montacargas, capacitación o problemas técnicos. Llama al ${brand.support.phone}.`,
    h1: "Soporte y Contacto",
    bodyHtml: `<p>Obtén ayuda instantánea de nuestro asistente de IA o contacta al equipo de ${brand.name}. Estamos aquí para ayudarte con precios, preguntas de certificación, requisitos de ${industry.regulatory.body} y más.</p>`,
  },
  "/locations": {
    title: `Ubicaciones de Capacitación Presencial | ${brand.name}`,
    description: `Reserva capacitación presencial de certificación de montacargas en el sur de California, centro de California y sur de Nevada. Instrucción práctica alineada con ${industry.regulatory.body}.`,
    h1: "Ubicaciones de Capacitación Presencial",
    bodyHtml: `<p>Reserva capacitación presencial de certificación de montacargas en el sur de California, centro de California y sur de Nevada.</p>`,
  },
  "/request-onsite-training": {
    title: `Solicitar Capacitación Presencial de Montacargas | ${brand.name}`,
    description: `Solicita capacitación presencial de certificación de montacargas en tu instalación. Programas alineados con ${industry.regulatory.body} para grupos de cualquier tamaño.`,
    h1: "Solicitar Capacitación Presencial",
    bodyHtml: `<p>Solicita capacitación presencial de certificación de montacargas en tu instalación. Vamos a ti — programas alineados con ${industry.regulatory.body} para grupos de cualquier tamaño.</p>`,
  },
  "/locations/southern-california": {
    title: `Capacitación Presencial de Montacargas en el Sur de California | ${brand.name}`,
    description: `${brand.name} ofrece capacitación presencial de certificación de montacargas en el sur de California. Capacitación alineada con ${industry.regulatory.body} en San Diego, Los Ángeles, Orange County y el Inland Empire.`,
    h1: "Capacitación Presencial de Montacargas en el Sur de California",
    bodyHtml: `<p>${brand.name} ofrece capacitación presencial de certificación de montacargas en el sur de California incluyendo San Diego, Los Ángeles, Orange County y el Inland Empire.</p>`,
  },
  "/locations/central-california": {
    title: `Capacitación Presencial de Montacargas en el Centro de California | ${brand.name}`,
    description: `${brand.name} lleva certificación profesional de montacargas al Valle Central. Capacitación alineada con ${industry.regulatory.body} en Fresno, Bakersfield, Visalia y áreas circundantes.`,
    h1: "Capacitación Presencial de Montacargas en el Centro de California",
    bodyHtml: `<p>${brand.name} lleva certificación profesional de montacargas al Valle Central incluyendo Fresno, Bakersfield y Visalia.</p>`,
  },
  "/locations/southern-nevada": {
    title: `Capacitación Presencial de Montacargas en el Sur de Nevada | ${brand.name}`,
    description: `${brand.name} ofrece certificación de montacargas presencial en el área metropolitana de Las Vegas. Capacitación alineada con ${industry.regulatory.body} en Las Vegas, Henderson y North Las Vegas.`,
    h1: "Capacitación Presencial de Montacargas en el Sur de Nevada",
    bodyHtml: `<p>${brand.name} ofrece certificación de montacargas presencial en el área metropolitana de Las Vegas incluyendo Henderson y North Las Vegas.</p>`,
  },
  "/locations/san-diego": {
    title: `Capacitación de Montacargas en San Diego | ${brand.name}`,
    description: `Certifícate en nuestras instalaciones de capacitación en San Diego. Certificación práctica de montacargas alineada con ${industry.regulatory.body} con resultados el mismo día.`,
    h1: "Capacitación de Montacargas en San Diego",
    bodyHtml: `<p>Nuestras instalaciones de capacitación en San Diego ofrecen programas completos de certificación práctica de montacargas. Capacitación disponible en inglés y español.</p>`,
  },
  "/locations/las-vegas": {
    title: `Capacitación de Montacargas en Las Vegas | ${brand.name}`,
    description: `Certifícate en nuestras instalaciones de capacitación en Las Vegas. Certificaciones de operador alineadas con ${industry.regulatory.body} y programas de capacitar al capacitador.`,
    h1: "Capacitación de Montacargas en Las Vegas",
    bodyHtml: `<p>Nuestras instalaciones en Las Vegas ofrecen una gama completa de programas de certificación de montacargas incluyendo certificaciones de operador y cursos de capacitar al capacitador.</p>`,
  },
  "/locations/fresno": {
    title: `Capacitación de Montacargas en Fresno | ${brand.name}`,
    description: `Certifícate en nuestra ubicación de capacitación en Fresno, CA. Certificación práctica de operador de montacargas alineada con ${industry.regulatory.body} con resultados el mismo día.`,
    h1: "Capacitación de Montacargas en Fresno",
    bodyHtml: `<p>Nuestra ubicación de capacitación en Fresno lleva certificación profesional de montacargas al centro de California. Capacitación disponible en inglés y español.</p>`,
  },
};

function getStaticAlternateUrl(internalPath: string, locale: string): string {
  if (locale === "es") {
    const esSlug = EN_TO_ES_STATIC_SLUGS[internalPath];
    return `${SITE_URL}/es${esSlug === "/" ? "" : (esSlug || internalPath)}`;
  }
  return `${SITE_URL}/en${internalPath === "/" ? "" : internalPath}`;
}

export function registerSsrMiddleware(app: Express) {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const reqPath = req.path;

    if (req.method !== "GET") return next();
    if (!shouldSSR(reqPath)) return next();

    try {
      const template = await getBaseTemplate(req.originalUrl);
      const { locale, internalPath } = parseLocaleFromPath(reqPath);

      if (internalPath === "/" || STATIC_SEO_ROUTES.has(internalPath)) {
        const metaMap = locale === "es" ? STATIC_PAGE_META_ES : STATIC_PAGE_META;
        const meta = metaMap[internalPath] || STATIC_PAGE_META[internalPath];
        if (meta) {
          const enUrl = getStaticAlternateUrl(internalPath, "en");
          const esUrl = getStaticAlternateUrl(internalPath, "es");
          const canonicalUrl = locale === "es" ? esUrl : enUrl;

          const orgJsonLd = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}${brand.logo.full}`,
            contactPoint: {
              "@type": "ContactPoint",
              telephone: brand.support.phoneE164,
              contactType: "customer service",
              availableLanguage: ["English", "Spanish"],
            },
            description: brand.description,
            inLanguage: locale,
          };

          const bodyContent = `<h1>${escapeHtml(meta.h1)}</h1>\n${meta.bodyHtml}`;

          const html = injectSeoIntoTemplate(template, {
            title: meta.title,
            metaDescription: meta.description,
            canonical: canonicalUrl,
            ogImage: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
            jsonLdItems: [orgJsonLd, ...(meta.jsonLd || [])],
            bodyHtml: bodyContent,
            locale,
            enUrl,
            esUrl,
            noindex: meta.noindex,
          });

          res.set({
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=300, s-maxage=600",
            "X-SSR": "true",
          });
          return res.status(200).send(html);
        }
      }

      const slug = internalPath.startsWith("/") ? internalPath.slice(1) : internalPath;
      if (!slug) return next();

      const page = await storage.getSeoPageBySlug(slug, locale);
      if (!page || !page.published) return next();

      const canonicalSlug = page.canonicalSlug || page.slug;
      const canonicalUrl = `${SITE_URL}/${locale}/${canonicalSlug}`;

      let enUrl: string;
      let esUrl: string;
      if (locale === "es") {
        const knownEnSlug = ES_TO_EN_SEO_SLUGS[canonicalSlug];
        if (knownEnSlug) {
          enUrl = `${SITE_URL}/en/${knownEnSlug}`;
        } else {
          const enCounterpart = await storage.getSeoPageBySlug(canonicalSlug, "en")
            || (page.state && page.city
              ? (await storage.getSeoPagesByTemplate(page.templateKey, "en")).find(p => p.state === page.state && p.city === page.city)
              : page.state
                ? (await storage.getSeoPagesByTemplate(page.templateKey, "en")).find(p => p.state === page.state && !p.city)
                : null);
          enUrl = enCounterpart ? `${SITE_URL}/en/${enCounterpart.canonicalSlug || enCounterpart.slug}` : `${SITE_URL}/en`;
        }
        esUrl = `${SITE_URL}/es/${canonicalSlug}`;
      } else {
        const knownEsSlug = EN_TO_ES_SEO_SLUGS[canonicalSlug];
        if (knownEsSlug) {
          esUrl = `${SITE_URL}/es/${knownEsSlug}`;
        } else {
          const esCounterpart = (page.state && page.city
            ? (await storage.getSeoPagesByTemplate(page.templateKey, "es")).find(p => p.state === page.state && p.city === page.city)
            : page.state
              ? (await storage.getSeoPagesByTemplate(page.templateKey, "es")).find(p => p.state === page.state && !p.city)
              : null);
          esUrl = esCounterpart ? `${SITE_URL}/es/${esCounterpart.canonicalSlug || esCounterpart.slug}` : `${SITE_URL}/es`;
        }
        enUrl = `${SITE_URL}/en/${canonicalSlug}`;
      }
      const ogImageUrl = page.ogImagePath
        ? (page.ogImagePath.startsWith("http") ? page.ogImagePath : `${SITE_URL}${page.ogImagePath}`)
        : `${SITE_URL}${DEFAULT_OG_IMAGE}`;

      const html = injectSeoIntoTemplate(template, {
        title: page.title,
        metaDescription: page.metaDescription,
        canonical: canonicalUrl,
        ogImage: ogImageUrl,
        jsonLdItems: buildJsonLd(page, locale),
        bodyHtml: buildSeoPageBodyHtml(page),
        locale,
        enUrl,
        esUrl,
      });

      res.set({
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "X-SSR": "true",
      });
      return res.status(200).send(html);
    } catch (error) {
      console.error("[SSR] Error rendering page:", reqPath, error);
      return next();
    }
  });
}
