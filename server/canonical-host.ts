import type { Request, Response, NextFunction } from "express";

/**
 * Old Railway production host that Google indexed before the custom domain
 * went live. Requests that arrive with exactly this Host are 301'd to the
 * canonical domain with path + query preserved. Every other host (staging
 * *.up.railway.app, localhost, the canonical domain itself) is untouched.
 */
export const LEGACY_PRODUCTION_HOST = "miramarforklifttraining-production.up.railway.app";
export const CANONICAL_ORIGIN = "https://training.miramarforklift.com";

/** Health-check paths are never redirected (Railway / uptime probes). */
export const HOST_REDIRECT_EXEMPT_PATHS = new Set(["/health", "/healthz", "/api/health"]);

function normalizeHost(host: string | undefined): string {
  return (host || "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/** Returns the redirect target, or null when the request must pass through. */
export function resolveCanonicalHostRedirect(host: string | undefined, originalUrl: string): string | null {
  if (normalizeHost(host) !== LEGACY_PRODUCTION_HOST) return null;
  const url = originalUrl && originalUrl.startsWith("/") ? originalUrl : `/${originalUrl || ""}`;
  const pathOnly = url.split("?")[0].replace(/\/+$/, "") || "/";
  if (HOST_REDIRECT_EXEMPT_PATHS.has(pathOnly.toLowerCase())) return null;
  return `${CANONICAL_ORIGIN}${url}`;
}

export function canonicalHostMiddleware(req: Request, res: Response, next: NextFunction) {
  const target = resolveCanonicalHostRedirect(req.headers.host, req.originalUrl || req.url);
  if (!target) return next();
  // 301 for GET/HEAD (what crawlers use); 308 keeps method + body for others.
  const status = req.method === "GET" || req.method === "HEAD" ? 301 : 308;
  res.redirect(status, target);
}
