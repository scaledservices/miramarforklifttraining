import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import NotFound from "@/pages/not-found";
import SEOHead from "@/components/seo/SEOHead";
import SeoHero from "@/components/seo/SeoHero";
import SeoTrustSignals from "@/components/seo/SeoTrustSignals";
import SeoBodySections from "@/components/seo/SeoBodySections";
import SeoFaqAccordion from "@/components/seo/SeoFaqAccordion";
import SeoCta from "@/components/seo/SeoCta";
import SeoRelatedPages from "@/components/seo/SeoRelatedPages";
import SeoBreadcrumb from "@/components/seo/SeoBreadcrumb";
import SeoStickyCta from "@/components/seo/SeoStickyCta";
import SeoHubLinks from "@/components/seo/SeoHubLinks";
import { industry } from "@shared/config/industry";
import { faqSchema, breadcrumbSchema, courseSchema } from "@/components/seo/StructuredData";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import type { SeoPage } from "@shared/schema";

const MONEY_TEMPLATES = ["TEMPLATE_COURSE", "TEMPLATE_PRICING", "TEMPLATE_NEAR_ME_HUB"];
const KNOWLEDGE_TEMPLATES = ["TEMPLATE_PILLAR", "TEMPLATE_KNOWLEDGE_ARTICLE"];

export default function SeoPageRenderer() {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params["0"] || params.slug || "";
  const locale = useCurrentLocale();

  const { data, isLoading, error } = useQuery<{ page: SeoPage & { enCounterpartSlug?: string } }>({
    queryKey: ["/api/seo/pages", slug, locale],
    queryFn: () => fetch(`/api/seo/pages/${slug}?locale=${locale}`).then(r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!slug,
    retry: false,
  });

  const { data: relatedData } = useQuery<{ related: any[]; nearby: any[]; hubLinks: any[] }>({
    queryKey: ["/api/seo/related", slug, locale],
    queryFn: () => fetch(`/api/seo/related/${slug}?locale=${locale}`).then(r => r.json()),
    enabled: !!data?.page,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.page) {
    return <NotFound />;
  }

  const page = data.page;
  const isMoneyPage = MONEY_TEMPLATES.includes(page.templateKey);
  const isKnowledge = KNOWLEDGE_TEMPLATES.includes(page.templateKey);
  const faqs = (page.faqJson as Array<{ q: string; a: string }>) || [];
  const bodySections = (page.bodySections as any[]) || [];
  const internalLinks = (page.internalLinks as Array<{ label: string; href: string }>) || [];
  const breadcrumbItems = buildBreadcrumb(page, t);

  const jsonLdItems: Record<string, unknown>[] = [];
  if (faqs.length > 0) {
    jsonLdItems.push(faqSchema(faqs.map(f => ({ question: f.q, answer: f.a })), locale));
  }
  if (breadcrumbItems.length > 0) {
    jsonLdItems.push(breadcrumbSchema(breadcrumbItems.map(b => ({ name: b.label, url: b.href || "" })), locale));
  }
  if (page.templateKey === "TEMPLATE_COURSE") {
    jsonLdItems.push(courseSchema({
      name: page.heroH1,
      description: page.metaDescription,
      price: 59.99,
      locale,
    }));
  }

  const pageSlug = page.canonicalSlug || page.slug;
  const canonicalPath = (page.locale === "es" || locale === "es")
    ? (page.enCounterpartSlug ? `/${page.enCounterpartSlug}` : `/${pageSlug}`)
    : `/${pageSlug}`;

  if (isKnowledge) {
    return (
      <>
        <SEOHead
          title={page.title}
          description={page.metaDescription}
          canonical={canonicalPath}
          ogImage={page.ogImagePath || undefined}
          jsonLd={jsonLdItems}
        />
        <div className="max-w-7xl mx-auto px-4" data-testid="seo-page">
          <SeoBreadcrumb items={breadcrumbItems} />
        </div>

        <SeoHero
          h1={page.heroH1}
          subtitle={page.heroSubtitle}
          ctaText={t("seoPage.startCertification")}
          ctaHref="/online-forklift-certification"
          secondaryCtaText={page.templateKey === "TEMPLATE_PILLAR" ? t("seoPage.viewAllPrograms") : undefined}
          secondaryCtaHref={page.templateKey === "TEMPLATE_PILLAR" ? "/training-programs" : undefined}
        />

        <div className="max-w-4xl mx-auto px-4 py-12">
          {page.introParagraph && (
            <p className="text-lg text-muted-foreground leading-relaxed mb-8" data-testid="seo-intro">
              {page.introParagraph}
            </p>
          )}

          <TableOfContents sections={bodySections} faqs={faqs} />

          <div className="space-y-10 mt-10">
            <SeoBodySections sections={bodySections} />
            <SeoFaqAccordion faqs={faqs} />
          </div>

          {internalLinks.length > 0 && (
            <RelatedArticles links={internalLinks} isPillar={page.templateKey === "TEMPLATE_PILLAR"} />
          )}

          {relatedData?.hubLinks && relatedData.hubLinks.length > 0 && (
            <div className="mt-10">
              <SeoHubLinks links={relatedData.hubLinks} />
            </div>
          )}

          {relatedData && (relatedData.related?.length > 0 || relatedData.nearby?.length > 0) && (
            <div className="mt-10">
              <SeoRelatedPages
                pages={relatedData.related || []}
                nearbyPages={relatedData.nearby || []}
                heading={page.templateKey === "TEMPLATE_PILLAR" ? t("seoPage.articlesInGuide") : t("seoPage.relatedArticles")}
              />
            </div>
          )}
        </div>

        <NextStepCta />

        <div className="max-w-5xl mx-auto px-4 pb-12">
          <SeoCta />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={page.title}
        description={page.metaDescription}
        canonical={canonicalPath}
        ogImage={page.ogImagePath || undefined}
        jsonLd={jsonLdItems}
      />
      <div className="max-w-7xl mx-auto px-4" data-testid="seo-page">
        <SeoBreadcrumb items={breadcrumbItems} />
      </div>

      <SeoHero
        h1={page.heroH1}
        subtitle={page.heroSubtitle}
        ctaText={t("seoPage.startCertification")}
        ctaHref="/online-forklift-certification"
        secondaryCtaText={t("seoPage.crewEmployerTraining")}
        secondaryCtaHref="/group-forklift-training"
      />

      <SeoTrustSignals />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className={isMoneyPage ? "grid lg:grid-cols-[1fr_320px] gap-12" : ""}>
          <div className="space-y-10">
            {page.introParagraph && (
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="seo-intro">
                {page.introParagraph}
              </p>
            )}
            <SeoBodySections sections={bodySections} />
            <SeoFaqAccordion faqs={faqs} />

            {relatedData?.hubLinks && relatedData.hubLinks.length > 0 && (
              <SeoHubLinks links={relatedData.hubLinks} />
            )}

            {relatedData && (
              <SeoRelatedPages
                pages={relatedData.related || []}
                nearbyPages={relatedData.nearby || []}
                heading={page.state ? t("seoPage.moreStateLocations", { state: page.state }) : page.templateKey === "TEMPLATE_NEAR_ME_HUB" ? t("seoPage.browseByState") : t("seoPage.relatedTrainingPages")}
              />
            )}
          </div>
          {isMoneyPage && <SeoStickyCta />}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        <SeoCta />
      </div>
    </>
  );
}

function TableOfContents({ sections, faqs }: { sections: any[]; faqs: any[] }) {
  const { t } = useTranslation();
  const headings = sections.filter(s => s.heading).map(s => s.heading as string);
  if (faqs.length > 0) headings.push(t("seoPage.faq"));
  if (headings.length < 3) return null;

  return (
    <nav className="bg-muted/50 dark:bg-muted/20 border rounded-lg p-6 mb-8" aria-label={t("seoPageExtra.tableOfContents")} data-testid="toc">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold">{t("seoPage.inThisArticle")}</h2>
      </div>
      <ol className="space-y-2 list-decimal list-inside">
        {headings.map((h, i) => {
          const id = h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          return (
            <li key={i}>
              <a
                href={`#${id}`}
                className="text-accent hover:underline"
                data-testid={`toc-link-${i}`}
              >
                {h}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function RelatedArticles({ links, isPillar }: { links: Array<{ label: string; href: string }>; isPillar: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="mt-12 border-t pt-8" data-testid="related-articles">
      <h2 className="text-2xl font-bold mb-6">{isPillar ? t("seoPage.exploreThisTopic") : t("seoPage.relatedArticles")}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {links.map((link, i) => (
          <a
            key={i}
            href={link.href}
            className="flex items-center gap-2 p-3 rounded-lg border hover:border-accent hover:bg-accent/5 transition-colors group"
            data-testid={`related-link-${i}`}
          >
            <ArrowRight className="h-4 w-4 text-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function NextStepCta() {
  const { t } = useTranslation();
  return (
    <div className="bg-brand-dark text-white py-12" data-testid="next-step-cta">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">{t("seoPage.readyToGetCertified")}</h2>
        <p className="text-white/80 mb-6 max-w-2xl mx-auto">
          {t("seoPage.readyToGetCertifiedDesc", { body: industry.regulatory.body })}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/online-forklift-certification"
            className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
            data-testid="cta-certification"
          >
            {t("seoPage.startCertification")}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="/forklift-certification-cost"
            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/10 transition-colors"
            data-testid="cta-cost"
          >
            {t("seoPage.learnAboutPricing")}
          </a>
        </div>
      </div>
    </div>
  );
}

function buildBreadcrumb(page: SeoPage, t: (key: string) => string): Array<{ label: string; href?: string }> {
  const items: Array<{ label: string; href?: string }> = [];

  if (page.state && page.city) {
    items.push({ label: t("seoPage.breadcrumbNearMe"), href: "/forklift-certification-near-me" });
    items.push({ label: page.state, href: `/forklift-certification-${page.state.toLowerCase().replace(/\s+/g, "-")}` });
    items.push({ label: page.city });
  } else if (page.state) {
    items.push({ label: t("seoPage.breadcrumbNearMe"), href: "/forklift-certification-near-me" });
    items.push({ label: page.state });
  } else if (page.industry) {
    items.push({ label: t("seoPage.breadcrumbPrograms"), href: "/training-programs" });
    items.push({ label: page.industry });
  } else if (page.equipmentType) {
    items.push({ label: t("seoPage.breadcrumbPrograms"), href: "/training-programs" });
    items.push({ label: page.equipmentType });
  } else if (page.templateKey === "TEMPLATE_PILLAR" || page.templateKey === "TEMPLATE_KNOWLEDGE_ARTICLE") {
    items.push({ label: t("seoPage.breadcrumbKnowledge"), href: "/forklift-certification-faq" });
    items.push({ label: page.heroH1 });
  } else {
    items.push({ label: page.heroH1 });
  }

  return items;
}
