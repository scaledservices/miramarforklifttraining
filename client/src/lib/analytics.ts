type EventName = "page_view" | "cta_click" | "checkout_start" | "lead_submit";

type EventProperties = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: EventName, properties?: EventProperties): void {
  if (import.meta.env.DEV) {
    console.debug(`[analytics] ${name}`, properties);
  }
}
