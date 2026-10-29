/**
 * Offline IP -> location lookup for website traffic (no external calls).
 * Data: DB-IP "IP to City Lite" (CC BY 4.0, https://db-ip.com), bundled via
 * the @ip-location-db/dbip-city-mmdb package. Databases load lazily on the
 * first lookup of each IP family and stay in memory (~65 MB each).
 */
import { createRequire } from "module";
import path from "path";

type GeoRecord = { city?: string; country_code?: string; state1?: string };
type Reader = { get(ip: string): GeoRecord | null };

const requireFromRoot = createRequire(path.join(process.cwd(), "package.json"));
const readers: Record<"v4" | "v6", Promise<Reader | null> | null> = { v4: null, v6: null };

function openReader(family: "v4" | "v6"): Promise<Reader | null> {
  if (!readers[family]) {
    readers[family] = (async () => {
      try {
        const mm: any = await import("maxmind");
        const open = mm.open || mm.default?.open;
        const file = requireFromRoot.resolve(
          `@ip-location-db/dbip-city-mmdb/dbip-city-ip${family}.mmdb`,
        );
        return (await open(file, { watchForUpdates: false })) as Reader;
      } catch (err) {
        console.warn(`[geo-ip] ${family} database unavailable:`, (err as Error).message);
        return null;
      }
    })();
  }
  return readers[family]!;
}

export interface GeoResult {
  country: string | null;
  region: string | null;
  city: string | null;
}

const EMPTY: GeoResult = { country: null, region: null, city: null };
const cache = new Map<string, GeoResult>();

function isPrivate(ip: string): boolean {
  return (
    /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(ip) ||
    ip === "::1" || /^f[cd]/i.test(ip) || /^fe80/i.test(ip)
  );
}

export async function lookupGeo(rawIp: string | null | undefined): Promise<GeoResult> {
  if (!rawIp) return EMPTY;
  const ip = rawIp.replace(/^::ffff:/, "").trim();
  if (!ip || isPrivate(ip)) return EMPTY;
  const hit = cache.get(ip);
  if (hit) return hit;
  const reader = await openReader(ip.includes(":") ? "v6" : "v4");
  let out = EMPTY;
  try {
    const r = reader?.get(ip);
    if (r) out = { country: r.country_code || null, region: r.state1 || null, city: r.city || null };
  } catch {}
  if (cache.size > 5000) cache.clear();
  cache.set(ip, out);
  return out;
}
