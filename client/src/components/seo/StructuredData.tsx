import { brand } from "@shared/config/brand";
import { getAllLocations } from "@shared/config/locations";
import { SITE_URL } from "./siteUrl";

const BASE_URL = SITE_URL;

export function organizationSchema(locale = "en"): Record<string, unknown> {
  const sameAs = Object.values(brand.social).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: BASE_URL,
    logo: `${BASE_URL}${brand.logo.full}`,
    telephone: brand.support.phoneE164,
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.address.street,
      addressLocality: brand.address.city,
      addressRegion: brand.address.state,
      postalCode: brand.address.zip,
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: brand.support.phoneE164,
      contactType: "customer service",
      availableLanguage: ["English", "Spanish"],
    },
    ...(sameAs.length > 0 && { sameAs }),
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
        // schema.org expects price as a string; numbers trigger warnings in
        // Google's structured-data validation.
        price: course.price.toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        category: "Paid",
        ...(course.url && { url: `${BASE_URL}/${locale}${course.url}` }),
      },
    }),
    // Google requires hasCourseInstance for Course rich-result eligibility.
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: course.url?.includes("online") ? "Online" : "Onsite",
      ...(course.duration && { courseWorkload: course.duration }),
    },
    ...(course.duration && { timeRequired: course.duration }),
  };
}

/** Parses hours strings like "Mon–Fri: 7:00 AM – 5:00 PM" into an OpeningHoursSpecification. */
function parseOpeningHours(hours: string): Record<string, unknown> | undefined {
  if (!/mon/i.test(hours) || !/fri/i.test(hours)) return undefined;
  const m = hours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–—-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return undefined;
  const to24 = (h: string, min: string, ampm: string) => {
    let hh = parseInt(h, 10) % 12;
    if (/pm/i.test(ampm)) hh += 12;
    return `${String(hh).padStart(2, "0")}:${min}`;
  };
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: to24(m[1], m[2], m[3]),
    closes: to24(m[4], m[5], m[6]),
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
  /** Optional extras. When omitted, they are enriched from shared/config/locations by city/state match. */
  slug?: string;
  url?: string;
  image?: string;
  hours?: string;
  areaServed?: string[];
  description?: string;
}): Record<string, unknown> {
  // Enrich from the canonical location config when the caller only passes NAP basics.
  const known = getAllLocations().find(
    (l) =>
      (location.slug && l.slug === location.slug) ||
      (l.address.city === location.city && l.address.state === location.state)
  );

  // Callers sometimes pass the full one-line address; keep streetAddress to just the street.
  const streetAddress = location.address.includes(`, ${location.city}`)
    ? location.address.split(`, ${location.city}`)[0]
    : location.address;

  const localePrefix = location.locale === "es" ? "es" : "en";
  const slug = location.slug || known?.slug;
  const pageUrl =
    location.url || (slug ? `${BASE_URL}/${localePrefix}/locations/${slug}` : BASE_URL);
  const hours = location.hours || known?.hours;
  const openingHours = hours ? parseOpeningHours(hours) : undefined;
  const image = location.image || known?.heroImage;
  const areaServed =
    location.areaServed && location.areaServed.length > 0
      ? location.areaServed
      : [`${location.city}, ${location.state}`];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${pageUrl}#business`,
    name: location.name,
    address: {
      "@type": "PostalAddress",
      streetAddress,
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
    ...(openingHours && { openingHoursSpecification: openingHours }),
    areaServed: areaServed.map((name) => ({ "@type": "City", name })),
    ...(image && {
      image: image.startsWith("http") ? image : `${BASE_URL}${image}`,
    }),
    ...(location.description && { description: location.description }),
    url: pageUrl,
    parentOrganization: {
      "@type": "Organization",
      name: brand.name,
      url: BASE_URL,
    },
    priceRange: "$$",
    inLanguage: location.locale || "en",
  };
}

/**
 * LocalBusiness + serviceArea schema for onsite service-area pages
 * (cities we travel to, not physical facilities — NAP is the HQ address).
 */
export function serviceAreaSchema(area: {
  slug: string;
  city: string;
  state: string;
  stateAbbrev?: string;
  description?: string;
  locale?: string;
  services?: { title: string; description: string }[];
  nearbyAreas?: string[];
}): Record<string, unknown> {
  const localePrefix = area.locale === "es" ? "es" : "en";
  const pageUrl = `${BASE_URL}/${localePrefix}/service-areas/${area.slug}`;
  const served = [
    { "@type": "City", name: area.city, addressRegion: area.stateAbbrev || area.state },
    ...(area.nearbyAreas || []).map((name) => ({
      "@type": "City",
      name,
      addressRegion: area.stateAbbrev || area.state,
    })),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${pageUrl}#business`,
    name: brand.name,
    ...(area.description && { description: area.description }),
    url: pageUrl,
    telephone: brand.support.phoneE164,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.address.street,
      addressLocality: brand.address.city,
      addressRegion: brand.address.state,
      postalCode: brand.address.zip,
      addressCountry: "US",
    },
    areaServed: served,
    serviceType: "Onsite Forklift Training",
    ...(area.services &&
      area.services.length > 0 && {
        hasOfferingCatalog: {
          "@type": "OfferCatalog",
          name: "Onsite Forklift Certification Programs",
          itemListElement: area.services.map((item) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: item.title,
              description: item.description,
            },
          })),
        },
      }),
    inLanguage: area.locale === "es" ? "es" : "en",
  };
}
