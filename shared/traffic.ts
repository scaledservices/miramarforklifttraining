/**
 * Pure traffic-analytics rules shared by the tracker (client), the ingest
 * endpoint (server), the admin queries, and the one-time history cleanup.
 * Keep these in one place so "what counts as a real visit" never drifts.
 */

/** Go-live of training.miramarforklift.com on the new site (DNS switch day,
 * 2026-10-26, Pacific). Traffic before this was internal testing. */
export const SITE_LAUNCH_DATE = "2026-10-26";

/** Crawlers, link previewers, monitors, headless/automation browsers. */
export const BOT_UA_PATTERN =
  /(bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|httpclient|facebookexternalhit|whatsapp|telegram|discord|skype|embedly|quora link|bitlybot|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu|bytespider|gptbot|claudebot|perplexity|ccbot|amazonbot|applebot|hermes|playwright|puppeteer|selenium|phantomjs)/i;

export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua || ua.trim().length < 10) return true; // no/garbage UA is never a real browser
  return BOT_UA_PATTERN.test(ua);
}

/** Paths that are not "website traffic": staff tools, APIs, assets, and
 * one-time utility pages. */
export function isExcludedPath(path: string | null | undefined): boolean {
  if (!path) return true;
  const p = stripLocalePrefix(path).toLowerCase();
  return (
    p === "/admin" ||
    p.startsWith("/admin/") ||
    p.startsWith("/instructor/") ||
    p.startsWith("/api/") ||
    p.startsWith("/assets/")
  );
}

export function stripLocalePrefix(path: string): string {
  if (path === "/es") return "/";
  if (path.startsWith("/es/")) return path.slice(3);
  if (path === "/en") return "/";
  if (path.startsWith("/en/")) return path.slice(3);
  return path;
}

/** Miramar's three training cities (office locations). */
export const TRAFFIC_CITIES = [
  { slug: "san-diego", label: "San Diego" },
  { slug: "las-vegas", label: "Las Vegas" },
  { slug: "fresno", label: "Fresno" },
] as const;
export type TrafficCity = (typeof TRAFFIC_CITIES)[number]["slug"];

/** Which office a page belongs to: its location page, its per-city product
 * pages (".../standard-forklift-certification-las-vegas"), or a city slug
 * anywhere in the path. Null for pages that are not city-specific. */
export function cityForPath(path: string | null | undefined): TrafficCity | null {
  if (!path) return null;
  const p = stripLocalePrefix(path).toLowerCase();
  for (const c of TRAFFIC_CITIES) {
    if (p === `/locations/${c.slug}` || p.startsWith(`/locations/${c.slug}/`)) return c.slug;
    if (p.endsWith(`-${c.slug}`) || p.includes(`-${c.slug}/`) || p.includes(`/${c.slug}`)) return c.slug;
  }
  return null;
}

/** SQL fragment mirroring cityForPath for a `path` column, returning the
 * city slug or 'other'. Keep in sync with cityForPath (tested). */
export function citySqlCase(column = "path"): string {
  const parts = TRAFFIC_CITIES.map(
    (c) => `WHEN lower(${column}) LIKE '%${c.slug}%' THEN '${c.slug}'`,
  );
  return `CASE ${parts.join(" ")} ELSE 'other' END`;
}

/** Referrer -> source bucket. */
export function categorizeReferrerHost(referrer: string | null | undefined, siteHosts: string[] = []): string {
  if (!referrer) return "direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "other";
  }
  if (siteHosts.some((h) => host === h)) return "internal";
  if (host.endsWith("miramarforklift.com")) return host.startsWith("training.") ? "internal" : "miramarforklift.com";
  if (host.includes("chatgpt.") || host.includes("openai.") || host.includes("perplexity.") || host.includes("gemini.google") || host.includes("claude.ai") || host.includes("copilot.microsoft")) return "ai_assistant";
  if (host.includes("google.")) return "google";
  if (host.includes("bing.")) return "bing";
  if (host.includes("yahoo.")) return "yahoo";
  if (host.includes("duckduckgo.")) return "duckduckgo";
  if (host.includes("facebook.") || host === "fb.com" || host.endsWith(".fb.com")) return "facebook";
  if (host.includes("instagram.")) return "instagram";
  if (host.includes("linkedin.") || host === "lnkd.in") return "linkedin";
  if (host.includes("reddit.")) return "reddit";
  if (host === "t.co" || host.includes("twitter.") || host === "x.com") return "twitter";
  if (host.includes("tiktok.")) return "tiktok";
  if (host.includes("youtube.") || host === "youtu.be") return "youtube";
  if (host.includes("yelp.")) return "yelp";
  return "other";
}

/** "YYYY-MM-DD" in America/Los_Angeles for a Date. */
export function pacificDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export interface TrafficRange {
  from: string; // inclusive, YYYY-MM-DD Pacific
  to: string; // inclusive, YYYY-MM-DD Pacific
}

/** Resolve a preset or explicit dates into an inclusive Pacific date range.
 * Never starts before launch (pre-launch rows are testing). */
export function resolveTrafficRange(
  opts: { preset?: string | null; from?: string | null; to?: string | null },
  now: Date = new Date(),
): TrafficRange {
  const today = pacificDate(now);
  const shift = (days: number) => pacificDate(new Date(now.getTime() - days * 86400000));
  const isDate = (s?: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  let from: string;
  let to = today;
  switch (opts.preset) {
    case "today": from = today; break;
    case "yesterday": from = shift(1); to = shift(1); break;
    case "7d": from = shift(6); break;
    case "30d": from = shift(29); break;
    case "90d": from = shift(89); break;
    case "launch": from = SITE_LAUNCH_DATE; break;
    default:
      if (isDate(opts.from)) {
        from = opts.from!;
        if (isDate(opts.to)) to = opts.to!;
      } else {
        from = shift(29);
      }
  }
  if (from < SITE_LAUNCH_DATE) from = SITE_LAUNCH_DATE;
  if (to < from) to = from;
  return { from, to };
}

/** The previous period of equal length (for "vs previous" trend chips). */
export function previousRange(r: TrafficRange): TrafficRange {
  const day = 86400000;
  const f = Date.parse(`${r.from}T12:00:00Z`);
  const t = Date.parse(`${r.to}T12:00:00Z`);
  const len = Math.round((t - f) / day) + 1;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { from: iso(f - len * day), to: iso(f - day) };
}

/** Human device label from a user agent. */
export function deviceForUserAgent(ua: string | null | undefined): "mobile" | "tablet" | "desktop" {
  const s = ua || "";
  if (/ipad|tablet|kindle|silk|playbook/i.test(s) || (/android/i.test(s) && !/mobile/i.test(s))) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(s)) return "mobile";
  return "desktop";
}
