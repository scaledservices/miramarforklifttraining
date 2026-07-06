/**
 * Geo location utility for geo-adaptive experience.
 *
 * Miramar Forklift Training services CA and NV. Visitors outside that area
 * get an online-first hero. For now we don't call an external GeoIP API;
 * we extract the IP from the request and structure the code so a real
 * lookup can be dropped in later without touching callers.
 */

/** Miramar's service area states (two-letter US postal codes). */
export const SERVICE_AREA_STATES = new Set(["CA", "NV"]);

export interface RegionInfo {
  /** Two-letter US state code, or "" if undetermined. */
  state: string;
  /** True when the visitor is in CA or NV (Miramar's service area). */
  isServiceArea: boolean;
}

/**
 * Extract the client IP from an Express-style request, honouring the
 * `x-forwarded-for` header when present (Railway / proxies).
 * Returns the first public IP in the chain, or null if not determinable.
 */
export function getClientIp(req: import("express").Request): string | null {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0]?.trim();
    if (first && first.length > 0) return first;
  }
  // Express populates req.ip when trust proxy is configured.
  const ip = (req as any).ip as string | undefined;
  if (ip && ip.length > 0) return ip;

  // Fallback to raw socket address (dev / no proxy).
  const remoteAddress = (req as any).socket?.remoteAddress as string | undefined;
  if (remoteAddress && remoteAddress.length > 0) {
    // Strip IPv6 "::ffff:" prefix from IPv4-mapped addresses.
    return remoteAddress.replace(/^::ffff:/, "");
  }
  return null;
}

/**
 * Look up the US state for a given IP. Currently a stub that returns no
 * state — we keep the async signature so an external GeoIP provider can
 * be wired in later without changing callers.
 *
 * Future: call a free GeoIP API (e.g. ip-api.com, MaxMind GeoLite2) here.
 */
export async function lookupStateFromIp(ip: string): Promise<string> {
  // Structured stub: no external API calls in this iteration.
  // When integrating a real provider, keep the error-safe contract:
  //   – network failure → return "" (caller defaults to service area)
  //   – non-US IP → return "" (caller defaults to service area)
  void ip;
  return "";
}

/**
 * Determine the visitor's region from their IP address.
 *
 * Returns `{ state: "", isServiceArea: true }` when the IP can't be
 * determined or the lookup fails, so the default experience is the full
 * (in-service-area) one — never a degraded one due to a geolocation hiccup.
 */
export async function getRegionFromIp(
  ip: string | null,
): Promise<RegionInfo> {
  if (!ip) {
    return { state: "", isServiceArea: true };
  }

  const state = await lookupStateFromIp(ip).catch(() => "");
  if (!state) {
    return { state: "", isServiceArea: true };
  }

  const isServiceArea = SERVICE_AREA_STATES.has(state.toUpperCase());
  return { state: state.toUpperCase(), isServiceArea };
}
