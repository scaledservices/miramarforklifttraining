import { Express, Request, Response } from "express";
import { pool } from "../db";
import { requireRole } from "../routes/middleware";
import { storage } from "../storage";
import { getClientIp } from "../geo";
import { lookupGeo } from "../geo-ip";
import {
  isBotUserAgent,
  isExcludedPath,
  stripLocalePrefix,
  categorizeReferrerHost,
  citySqlCase,
  resolveTrafficRange,
  previousRange,
  deviceForUserAgent,
  TRAFFIC_CITIES,
  BOT_UA_PATTERN,
  type TrafficRange,
} from "@shared/traffic";

// ─── Ingest helpers ────────────────────────────────────────────────

const STAFF_ROLES = new Set(["admin", "super_admin", "instructor"]);
const roleCache = new Map<number, { role: string; at: number }>();

async function isStaffSession(req: Request): Promise<boolean> {
  const userId = (req.session as any)?.userId as number | undefined;
  if (!userId) return false;
  const hit = roleCache.get(userId);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return STAFF_ROLES.has(hit.role);
  try {
    const user = await storage.getUser(userId);
    const role = (user as any)?.role || "individual";
    roleCache.set(userId, { role, at: Date.now() });
    return STAFF_ROLES.has(role);
  } catch {
    return false;
  }
}

function extractLocale(path: string): string {
  const match = path.match(/^\/(en|es)(\/|$)/);
  return match ? match[1] : "en";
}

function siteHosts(req: Request): string[] {
  const hosts = new Set<string>();
  if (req.hostname) hosts.add(req.hostname.toLowerCase());
  for (const u of [process.env.SITE_URL, process.env.VITE_SITE_URL]) {
    try { if (u) hosts.add(new URL(u).hostname.toLowerCase()); } catch {}
  }
  return Array.from(hosts);
}

const str = (v: unknown, max = 200): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

/** Reasons a hit is not counted as website traffic. */
async function skipReason(req: Request, path: string | null, body: any): Promise<string | null> {
  const ua = req.headers["user-agent"];
  if (isBotUserAgent(ua)) return "bot";
  if (body?.webdriver) return "automation";
  if (isExcludedPath(path)) return "excluded_path";
  if (body?.staff) return "staff_browser";
  if (await isStaffSession(req)) return "staff_session";
  return null;
}

// ─── Admin query helpers ───────────────────────────────────────────

const PT = "America/Los_Angeles";
/** created_at is a UTC `timestamp` (no tz). */
const ptDay = (col: string) => `((${col} AT TIME ZONE 'UTC') AT TIME ZONE '${PT}')::date`;
const rangeWhere = (col: string, a: number, b: number) =>
  `${col} >= ((($${a})::date::timestamp AT TIME ZONE '${PT}') AT TIME ZONE 'UTC') AND ${col} < (((($${b})::date + 1)::timestamp AT TIME ZONE '${PT}') AT TIME ZONE 'UTC')`;

const CITY_CASE = citySqlCase("path");
// Same rules as ingest, applied to stored rows too (rows recorded before the
// ingest filters existed must not count either).
const BOT_SQL = BOT_UA_PATTERN.source.replace(/'/g, "''");
const HISTORY_CLEAN = (a: string) =>
  `${a}.path NOT LIKE '/admin%' AND ${a}.path NOT LIKE '/instructor/%' AND ${a}.path NOT LIKE '/api/%'
   AND length(coalesce(${a}.user_agent,'')) >= 10 AND coalesce(${a}.user_agent,'') !~* '${BOT_SQL}'`;
const CITY_ARRAY = `ARRAY[${TRAFFIC_CITIES.map((c) => `'${c.slug}'`).join(",")}]::text[]`;

interface Filters {
  city?: string; // san-diego | las-vegas | fresno | other
  source?: string;
  page?: string;
  landing?: string;
  region?: string;
  geoCity?: string;
  device?: string;
  visitorType?: string; // new | returning
  campaign?: string;
}

function readFilters(q: Request["query"]): Filters {
  const f: Filters = {};
  for (const k of ["city", "source", "page", "landing", "region", "geoCity", "device", "visitorType", "campaign"] as const) {
    const v = q[k];
    if (typeof v === "string" && v.length > 0 && v.length < 300) f[k] = v;
  }
  return f;
}

/**
 * Sessions CTE for a date range + filters. Defines `v` (page views in range),
 * `fs` (filtered sessions), `ev` (their events), `sconv` (per-session outcomes).
 */
function sessionsCte(range: TrafficRange, f: Filters) {
  const params: unknown[] = [range.from, range.to];
  const where: string[] = [];
  const add = (val: unknown) => { params.push(val); return `$${params.length}`; };
  if (f.city) {
    if (f.city === "other") where.push(`NOT (cities && ${CITY_ARRAY})`);
    else where.push(`${add(f.city)} = ANY(cities)`);
  }
  if (f.source) where.push(`source = ${add(f.source)}`);
  if (f.landing) where.push(`landing = ${add(f.landing)}`);
  if (f.page) where.push(`${add(f.page)} = ANY(paths)`);
  if (f.region) where.push(`coalesce(region,'Unknown') = ${add(f.region)}`);
  if (f.geoCity) where.push(`coalesce(geo_city,'Unknown') = ${add(f.geoCity)}`);
  if (f.device) where.push(`device = ${add(f.device)}`);
  if (f.campaign) where.push(`coalesce(utm_campaign, utm_source) = ${add(f.campaign)}`);
  if (f.visitorType === "new") where.push(`is_new`);
  if (f.visitorType === "returning") where.push(`NOT is_new`);
  const sql = `
    WITH v AS (
      SELECT pv.*, ${CITY_CASE} AS page_city,
             coalesce(pv.visitor_id, pv.session_id, 'pv-' || pv.id) AS visitor,
             coalesce(pv.session_id, 'pv-' || pv.id) AS sid
      FROM page_views pv
      WHERE ${rangeWhere("pv.created_at", 1, 2)}
        AND ${HISTORY_CLEAN("pv")}
    ),
    s AS (
      SELECT sid,
        min(created_at) AS started, max(created_at) AS ended, count(*)::int AS views,
        (array_agg(path ORDER BY created_at, id))[1] AS landing,
        (array_agg(referrer_source ORDER BY created_at, id))[1] AS source,
        (array_agg(referrer ORDER BY created_at, id))[1] AS referrer,
        min(visitor) AS visitor,
        (bool_or(is_new_visitor) OR bool_and(visitor_id IS NULL)) AS is_new,
        max(country) AS country, max(region) AS region, max(city) AS geo_city,
        coalesce(max(device), CASE WHEN bool_or(is_mobile) THEN 'mobile' ELSE 'desktop' END) AS device,
        max(utm_source) AS utm_source, max(utm_medium) AS utm_medium, max(utm_campaign) AS utm_campaign,
        array_agg(DISTINCT page_city) AS cities,
        array_agg(DISTINCT path) AS paths
      FROM v GROUP BY sid
    ),
    fs AS (SELECT * FROM s ${where.length ? "WHERE " + where.join(" AND ") : ""}),
    ev AS (
      SELECT ae.* FROM analytics_events ae
      WHERE ${rangeWhere("ae.created_at", 1, 2)} AND ae.session_id IN (SELECT sid FROM fs)
    ),
    sconv AS (
      SELECT session_id,
        bool_or(event_type IN ('quote_submitted','lead_submit','quote_submit')) AS quoted,
        bool_or(event_type = 'booking_started') AS booking_started,
        bool_or(event_type = 'booking_completed') AS booked,
        bool_or(event_type = 'purchase') AS purchased,
        coalesce(sum(revenue) FILTER (WHERE event_type IN ('purchase','booking_completed')), 0)::float AS revenue
      FROM ev GROUP BY session_id
    )`;
  return { sql, params };
}

async function kpis(range: TrafficRange, f: Filters) {
  const { sql, params } = sessionsCte(range, f);
  const r = await pool.query(
    `${sql}
     SELECT
       count(DISTINCT fs.visitor)::int AS visitors,
       count(DISTINCT fs.visitor) FILTER (WHERE fs.is_new)::int AS new_visitors,
       count(DISTINCT fs.visitor) FILTER (WHERE NOT fs.is_new)::int AS returning_visitors,
       count(*)::int AS sessions,
       coalesce(sum(fs.views), 0)::int AS views,
       count(*) FILTER (WHERE fs.views = 1)::int AS single_page_sessions,
       coalesce(avg(EXTRACT(EPOCH FROM (fs.ended - fs.started))) FILTER (WHERE fs.views > 1), 0)::float AS avg_seconds,
       count(*) FILTER (WHERE c.quoted)::int AS quotes,
       count(*) FILTER (WHERE c.booking_started)::int AS bookings_started,
       count(*) FILTER (WHERE c.booked)::int AS bookings,
       count(*) FILTER (WHERE c.purchased)::int AS purchases,
       coalesce(sum(c.revenue), 0)::float AS revenue
     FROM fs LEFT JOIN sconv c ON c.session_id = fs.sid`,
    params,
  );
  return r.rows[0];
}

function rangeFromQuery(req: Request) {
  return resolveTrafficRange({
    preset: req.query.preset as string, from: req.query.from as string, to: req.query.to as string,
  });
}

export function registerAnalyticsRoutes(app: Express) {
  // ─── Pageview tracking endpoint ───────────────────────────────────
  // Called from the client on every route change. Fire-and-forget; never errors.
  app.post("/api/track/pageview", async (req: Request, res: Response) => {
    res.status(204).end();
    try {
      const body = (req.body || {}) as Record<string, any>;
      const rawPath = str(body.path, 500);
      if (!rawPath) return;
      if (await skipReason(req, rawPath, body)) return;

      const ua = (req.headers["user-agent"] as string | undefined) || null;
      const referrer = str(body.referrer, 1000);
      const device = deviceForUserAgent(ua);
      const geo = await lookupGeo(getClientIp(req));
      const userId = (req.session as any)?.userId || null;
      const utm = (body.utm || {}) as Record<string, unknown>;

      await pool.query(
        `INSERT INTO page_views (path, locale, referrer, referrer_source, session_id, user_id, user_agent, is_mobile,
           country, region, city, visitor_id, is_new_visitor, utm_source, utm_medium, utm_campaign, device)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          stripLocalePrefix(rawPath) || "/",
          extractLocale(rawPath),
          referrer,
          categorizeReferrerHost(referrer, siteHosts(req)),
          str(body.sessionId, 64),
          userId,
          ua,
          device !== "desktop",
          geo.country,
          geo.region,
          geo.city,
          str(body.visitorId, 64),
          body.newVisitor === true,
          str(utm.source, 100),
          str(utm.medium, 100),
          str(utm.campaign, 150),
          device,
        ],
      );
    } catch (err) {
      console.warn("[analytics] pageview insert failed:", (err as Error).message);
    }
  });

  // ─── Event tracking endpoint ──────────────────────────────────────
  app.post("/api/track/event", async (req: Request, res: Response) => {
    res.status(204).end();
    try {
      const body = (req.body || {}) as Record<string, any>;
      const eventType = str(body.eventType, 60);
      const rawPath = str(body.path, 500);
      if (!eventType || !rawPath) return;
      if (await skipReason(req, rawPath, body)) return;
      const revenue = Number(body.revenue);
      await pool.query(
        `INSERT INTO analytics_events (event_type, path, cta_label, cta_destination, lead_source, session_id, visitor_id, user_id, metadata, revenue)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          eventType,
          stripLocalePrefix(rawPath) || "/",
          str(body.ctaLabel),
          str(body.ctaDestination, 500),
          str(body.leadSource, 60),
          str(body.sessionId, 64),
          str(body.visitorId, 64),
          (req.session as any)?.userId || null,
          body.metadata && typeof body.metadata === "object" ? JSON.stringify(body.metadata).slice(0, 4000) : null,
          Number.isFinite(revenue) && revenue > 0 ? revenue : null,
        ],
      );
    } catch (err) {
      console.warn("[analytics] event insert failed:", (err as Error).message);
    }
  });

  // ─── Admin: full traffic summary with drill-down filters ──────────
  app.get("/api/admin/traffic/summary", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const range = rangeFromQuery(req);
      const f = readFilters(req.query);
      const prev = previousRange(range);
      const { sql, params } = sessionsCte(range, f);
      const q = (body: string) => pool.query(`${sql} ${body}`, params).then((r) => r.rows);

      const [current, previous, byDay, cities, sources, topPages, landingPages, regions, geoCities, devices, campaigns, events] =
        await Promise.all([
          kpis(range, f),
          kpis(prev, f),
          q(`SELECT ${ptDay("fs.started")}::text AS day, count(DISTINCT fs.visitor)::int AS visitors,
                    coalesce(sum(fs.views),0)::int AS views,
                    count(DISTINCT fs.visitor) FILTER (WHERE fs.is_new)::int AS new_visitors
             FROM fs GROUP BY 1 ORDER BY 1`),
          q(`SELECT c.city, count(DISTINCT fs.visitor)::int AS visitors, count(*)::int AS sessions,
                    count(*) FILTER (WHERE sc.quoted)::int AS quotes,
                    count(*) FILTER (WHERE sc.booking_started)::int AS bookings_started,
                    count(*) FILTER (WHERE sc.booked)::int AS bookings,
                    count(*) FILTER (WHERE sc.purchased)::int AS purchases
             FROM fs
             CROSS JOIN LATERAL unnest(
               CASE WHEN fs.cities && ${CITY_ARRAY} THEN array_remove(fs.cities, 'other') ELSE ARRAY['other'] END
             ) AS c(city)
             LEFT JOIN sconv sc ON sc.session_id = fs.sid
             GROUP BY c.city`),
          q(`SELECT fs.source, count(DISTINCT fs.visitor)::int AS visitors, count(*)::int AS sessions,
                    count(*) FILTER (WHERE sc.quoted OR sc.booked OR sc.purchased)::int AS conversions
             FROM fs LEFT JOIN sconv sc ON sc.session_id = fs.sid GROUP BY 1 ORDER BY 2 DESC`),
          q(`SELECT v.path, count(*)::int AS views, count(DISTINCT v.visitor)::int AS visitors
             FROM v WHERE v.sid IN (SELECT sid FROM fs) GROUP BY 1 ORDER BY 2 DESC LIMIT 50`),
          q(`SELECT fs.landing AS path, count(*)::int AS sessions, count(DISTINCT fs.visitor)::int AS visitors,
                    count(*) FILTER (WHERE fs.views = 1)::int AS left_after_one
             FROM fs GROUP BY 1 ORDER BY 2 DESC LIMIT 30`),
          q(`SELECT coalesce(fs.region,'Unknown') AS region, coalesce(fs.country,'') AS country,
                    count(DISTINCT fs.visitor)::int AS visitors
             FROM fs GROUP BY 1,2 ORDER BY 3 DESC LIMIT 30`),
          q(`SELECT coalesce(fs.geo_city,'Unknown') AS city, coalesce(fs.region,'') AS region,
                    count(DISTINCT fs.visitor)::int AS visitors
             FROM fs GROUP BY 1,2 ORDER BY 3 DESC LIMIT 30`),
          q(`SELECT fs.device, count(DISTINCT fs.visitor)::int AS visitors FROM fs GROUP BY 1 ORDER BY 2 DESC`),
          q(`SELECT coalesce(fs.utm_campaign, fs.utm_source) AS campaign, max(fs.utm_source) AS utm_source,
                    max(fs.utm_medium) AS utm_medium, count(DISTINCT fs.visitor)::int AS visitors
             FROM fs WHERE fs.utm_source IS NOT NULL OR fs.utm_campaign IS NOT NULL GROUP BY 1 ORDER BY 4 DESC LIMIT 20`),
          q(`SELECT event_type, count(*)::int AS count, count(DISTINCT session_id)::int AS sessions FROM ev GROUP BY 1 ORDER BY 2 DESC`),
        ]);

      return res.json({
        range, previousRange: prev, filters: f, current, previous,
        byDay, cities, sources, topPages, landingPages, regions, geoCities, devices, campaigns, events,
      });
    } catch (error: any) {
      console.error("[Analytics] traffic summary error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Admin: visits (sessions) list for the current filters ────────
  app.get("/api/admin/traffic/sessions", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const range = rangeFromQuery(req);
      const f = readFilters(req.query);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 500);
      const { sql, params } = sessionsCte(range, f);
      const rows = await pool.query(
        `${sql}
         SELECT fs.sid AS session_id, fs.visitor, fs.started, fs.ended, fs.views, fs.landing, fs.source, fs.referrer,
                fs.is_new, fs.country, fs.region, fs.geo_city, fs.device, fs.utm_source, fs.utm_campaign,
                array_remove(fs.cities, 'other') AS cities,
                coalesce(sc.quoted,false) AS quoted, coalesce(sc.booked,false) AS booked, coalesce(sc.purchased,false) AS purchased
         FROM fs LEFT JOIN sconv sc ON sc.session_id = fs.sid
         ORDER BY fs.started DESC LIMIT ${limit}`,
        params,
      );
      return res.json({ range, sessions: rows.rows });
    } catch (error: any) {
      console.error("[Analytics] traffic sessions error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Admin: one visit's journey ───────────────────────────────────
  app.get("/api/admin/traffic/sessions/:sid", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const sid = String(req.params.sid).slice(0, 80);
      const views = await pool.query(
        `SELECT id, path, created_at, referrer, referrer_source, locale, country, region, city, device, user_agent,
                visitor_id, is_new_visitor, utm_source, utm_medium, utm_campaign
         FROM page_views WHERE coalesce(session_id, 'pv-' || id) = $1 ORDER BY created_at, id LIMIT 500`,
        [sid],
      );
      const events = await pool.query(
        `SELECT event_type, path, created_at, cta_label, metadata, revenue FROM analytics_events
         WHERE session_id = $1 ORDER BY created_at LIMIT 200`,
        [sid],
      );
      const visitorId = views.rows[0]?.visitor_id;
      let otherVisits: any[] = [];
      if (visitorId) {
        const o = await pool.query(
          `SELECT session_id, min(created_at) AS started, count(*)::int AS views,
                  (array_agg(path ORDER BY created_at))[1] AS landing
           FROM page_views WHERE visitor_id = $1 AND session_id <> $2
           GROUP BY session_id ORDER BY 2 DESC LIMIT 20`,
          [visitorId, sid],
        );
        otherVisits = o.rows;
      }
      return res.json({ sessionId: sid, views: views.rows, events: events.rows, otherVisits });
    } catch (error: any) {
      console.error("[Analytics] traffic session error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Admin: Today-page glance ─────────────────────────────────────
  app.get("/api/admin/traffic/glance", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
    try {
      const today = resolveTrafficRange({ preset: "today" });
      const yesterday = resolveTrafficRange({ preset: "yesterday" });
      const recent = resolveTrafficRange({ preset: "30d" });
      const [t, y] = await Promise.all([kpis(today, {}), kpis(yesterday, {})]);
      const c = sessionsCte(today, {});
      const cityRows = await pool.query(
        `${c.sql} SELECT x.city, count(DISTINCT fs.visitor)::int AS visitors FROM fs
         CROSS JOIN LATERAL unnest(array_remove(fs.cities,'other')) AS x(city) GROUP BY 1`,
        c.params,
      );
      const d = sessionsCte(recent, {});
      const days = await pool.query(
        `${d.sql} SELECT ${ptDay("fs.started")}::text AS day, count(DISTINCT fs.visitor)::int AS visitors FROM fs GROUP BY 1 ORDER BY 1`,
        d.params,
      );
      return res.json({ today: t, yesterday: y, cities: cityRows.rows, byDay: days.rows.slice(-14) });
    } catch (error: any) {
      console.error("[Analytics] traffic glance error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
