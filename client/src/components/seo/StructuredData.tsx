import { brand } from "@shared/config/brand";

const BASE_URL = `https://${brand.domain}`;

export function organizationSchema(locale = "en"): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: BASE_URL,
    logo: `${BASE_URL}${brand.logo.favicon}`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: brand.support.phoneE164,
      contactType: "customer service",
      availableLanguage: ["English", "Spanish"],
    },
    sameAs: Object.values(brand.social).filter(Boolean),
    description: brand.description,
    inLanguage: locale === "es" ? "es" : "en",
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
  locale = "en"
): Record<string, unknown> {
  const prefix = `/${locale}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${prefix}${item.url}`,
    })),
  };
}

export function faqSchema(
  faqs: { question: string; answer: string }[],
  locale = "en"
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "es" ? "es" : "en",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function courseSchema(course: {
  name: string;
  description: string;
  provider?: string;
  url?: string;
  price?: number;
  duration?: string;
  locale?: string;
  image?: string;
}): Record<string, unknown> {
  const locale = course.locale || "en";
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.description,
    inLanguage: locale === "es" ? "es" : "en",
    provider: {
      "@type": "Organization",
      name: course.provider || brand.name,
      url: BASE_URL,
    },
    ...(course.url && { url: `${BASE_URL}/${locale}${course.url}` }),
    ...(course.image && {
      image: course.image.startsWith("http")
        ? course.image
        : `${BASE_URL}${course.image.replace(/\.jpe?g$/, ".webp")}`,
    }),
    ...(course.price !== undefined && {
      offers: {
        "@type": "Offer",
        price: course.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
    ...(course.duration && { timeRequired: course.duration }),
  };
}

export function localBusinessSchema(location: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  lat?: number;
  lng?: number;
  locale?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: location.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressLocality: location.city,
      addressRegion: location.state,
      postalCode: location.zip,
      addressCountry: "US",
    },
    telephone: location.phone,
    ...(location.lat &&
      location.lng && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: location.lat,
          longitude: location.lng,
        },
      }),
    url: BASE_URL,
    priceRange: "$$",
    inLanguage: location.locale || "en",
  };
}
