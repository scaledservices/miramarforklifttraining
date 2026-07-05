import { brand } from "@shared/config/brand";

/**
 * Absolute base URL for canonical/hreflang/OG/JSON-LD URLs.
 *
 * The training site is served from the `training.` subdomain, while
 * `brand.domain` is the apex domain (also used for email addresses and the
 * separate WordPress company site). Emitting apex-domain canonicals would
 * point search engines at the wrong site, so build the training URL here.
 *
 * `VITE_SITE_URL` (mirroring the server's `SITE_URL` env var) can override
 * this per environment, e.g. on staging.
 */
const envSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();

export const SITE_URL: string = envSiteUrl
  ? envSiteUrl.replace(/\/+$/, "")
  : `https://training.${brand.domain}`;
