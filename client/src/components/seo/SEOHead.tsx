import { Helmet } from "react-helmet-async";
import { brand } from "@shared/config/brand";
import { useCurrentLocale } from "@/hooks/useLocaleLocation";
import { getAlternateLocalePath } from "@/lib/locale";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
}

const DEFAULT_OG_IMAGE = brand.og.defaultImage;
const SITE_NAME = brand.name;
const BASE_URL = `https://${brand.domain}`;

export default function SEOHead({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  const locale = useCurrentLocale();
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const ogImageUrl = ogImage
    ? ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`
    : `${BASE_URL}${DEFAULT_OG_IMAGE}`;

  const hasCanonical = !!canonical;
  let canonicalUrl = "";
  let enUrl = "";
  let esUrl = "";

  if (hasCanonical) {
    const rawPath = canonical!;
    const enInternalPath = `/en${rawPath === "/" ? "" : rawPath}`;
    const enPath = getAlternateLocalePath(enInternalPath, "en");
    const esPath = getAlternateLocalePath(enInternalPath, "es");
    const currentLocalePath = locale === "es" ? esPath : enPath;
    canonicalUrl = `${BASE_URL}${currentLocalePath}`;
    enUrl = `${BASE_URL}${enPath}`;
    esUrl = `${BASE_URL}${esPath}`;
  }

  return (
    <Helmet>
      <html lang={locale} />
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex, follow" />}
      {hasCanonical && <link rel="canonical" href={canonicalUrl} />}

      {hasCanonical && <link rel="alternate" hrefLang="en" href={enUrl} />}
      {hasCanonical && <link rel="alternate" hrefLang="es" href={esUrl} />}
      {hasCanonical && <link rel="alternate" hrefLang="x-default" href={enUrl} />}

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      {hasCanonical && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:locale" content={locale === "es" ? "es_ES" : "en_US"} />
      <meta property="og:locale:alternate" content={locale === "es" ? "en_US" : "es_ES"} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImageUrl} />

      {jsonLd?.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
