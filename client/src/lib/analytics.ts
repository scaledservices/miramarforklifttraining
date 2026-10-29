/**
 * Analytics tracking module.
 *
 * Tracks basic funnel events for the Miramar training site:
 * - page_view: any page load
 * - cta_click: any CTA button click (with the CTA's destination/label)
 * - quote_submit: quote form submission (with leadSource)
 * - checkout_contact: checkout contact page viewed
 *
 * Design decisions:
 * - Uses Google Analytics 4 (gtag) if MEASUREMENT_ID is set in env.
 * - Falls back to console.debug in development.
 * - Does NOT collect PII (no names, emails, phones).
 * - leadSource attribution is handled separately in RequestQuote.tsx
 *   via URL ?ref= param capture → server-side storage in
 *   onsiteTrainingRequests.leadSource column.
 */

import { trackEvent as recordEvent } from "@/lib/tracker";

type EventName = "page_view" | "cta_click" | "checkout_start" | "lead_submit" | "checkout_contact" | "booking_started" | "booking_step_reached" | "booking_completed" | "quote_started" | "quote_submitted" | "purchase";

type EventProperties = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: EventProperties) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

function initGA(): void {
  if (initialized || !MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;

  // Load gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    (window.dataLayer as unknown[]).push(args);
  };
  window.gtag("js", new Date().toISOString());
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  initialized = true;
}

export function trackEvent(name: EventName, properties?: EventProperties): void {
  // Dev mode: log to console
  if (import.meta.env.DEV) {
    console.debug(`[analytics] ${name}`, properties);
  }

  // Always record in our own analytics (admin Traffic page).
  if (typeof window !== "undefined" && name !== "page_view") {
    const revenue = Number(properties?.revenue ?? properties?.total_price);
    recordEvent(name, window.location.pathname, {
      metadata: properties || {},
      revenue: Number.isFinite(revenue) && revenue > 0 ? revenue : undefined,
      leadSource: typeof properties?.lead_source === "string" ? properties.lead_source : undefined,
      ctaLabel: typeof properties?.cta_label === "string" ? properties.cta_label : undefined,
      ctaDestination: typeof properties?.cta_destination === "string" ? properties.cta_destination : undefined,
    });
  }

  // Also send to GA4 if configured
  if (MEASUREMENT_ID && typeof window !== "undefined") {
    if (!initialized) initGA();
    if (window.gtag) {
      window.gtag("event", name, properties || {});
    }
  }
}

/**
 * Track a page view. Call this on route changes.
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent("page_view", { page_path: path, page_title: title });
}

/**
 * Track a CTA click. Called when a user clicks a primary action button.
 */
export function trackCTAClick(ctaLabel: string, destination: string): void {
  trackEvent("cta_click", { cta_label: ctaLabel, cta_destination: destination });
}

/**
 * Track a quote form submission. Called after successful API response.
 */
export function trackLeadSubmit(leadSource: string, location?: string): void {
  trackEvent("lead_submit", { lead_source: leadSource, training_location: location });
}

/**
 * Track the checkout contact page being viewed.
 */
export function trackCheckoutContact(): void {
  trackEvent("checkout_contact", {});
}
