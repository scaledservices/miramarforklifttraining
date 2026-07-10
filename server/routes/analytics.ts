import { Express, Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { requireRole } from "../routes/middleware";

// Categorize referrer into a source
function categorizeReferrer(referrer: string | null): string {
  if (!referrer) return "direct";
  const lower = referrer.toLowerCase();
  if (lower.includes("google.")) return "google";
  if (lower.includes("bing.")) return "bing";
  if (lower.includes("yahoo.")) return "yahoo";
  if (lower.includes("facebook.") || lower.includes("fb.")) return "facebook";
  if (lower.includes("instagram.")) return "instagram";
  if (lower.includes("linkedin.")) return "linkedin";
  if (lower.includes("reddit.")) return "reddit";
  if (lower.includes("twitter.") || lower.includes("x.com")) return "twitter";
  if (lower.includes("tiktok.")) return "tiktok";
  if (lower.includes("youtube.")) return "youtube";
  if (lower.includes("yelp.")) return "yelp";
  if (lower.includes("miramarforklift")) return "internal";
  return "other";
}

// Detect mobile from user agent
function isMobile(ua: string | undefined): boolean {
  if (!ua) return false;
  return /android|iphone|ipad|ipod|blackberry|opera mini|mobile|palm|symbian/i.test(ua);
}

// Extract locale from path (/en/... or /es/...)
function extractLocale(path: string): string {
  const match = path.match(/^\/(en|es)(\/|$)/);
  return match ? match[1] : "en";
}

// Strip locale prefix from path for cleaner analytics
function stripLocale(path: string): string {
  return path.replace(/^\/(en|es)(?=\/|$)/, "") || "/";
}

// Posthog-style anonymous session ID from cookie
function getSessionId(req: Request): string | undefined {
  const raw = req.headers["x-analytics-session"] as string | undefined;
  return raw || undefined;
}

export function registerAnalyticsRoutes(app: Express) {
  // ─── Pageview tracking endpoint ───────────────────────────────────
  // Called from client-side on every route change. Fire-and-forget.
  app.post("/api/track/pageview", async (req: Request, res: Response) => {
    try {
      const { path, referrer, sessionId } = req.body as {
        path: string;
        referrer?: string;
        sessionId?: string;
      };

      if (!path || typeof path !== "string") {
        return res.status(204).end(); // silent - don't error on bad data
      }

      const ua = req.headers["user-agent"];
      const userId = (req as any).user?.id;
      const locale = extractLocale(path);
      const cleanPath = stripLocale(path);
      const refSource = categorizeReferrer(referrer || null);

      // Fire and forget - never block the response
      pool.query(
        `INSERT INTO page_views (path, locale, referrer, referrer_source, session_id, user_id, user_agent, is_mobile) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cleanPath, locale, referrer || null, refSource, sessionId || null, userId || null, ua || null, isMobile(ua)]
      ).catch(() => {}); // swallow errors - analytics must never break the page

      return res.status(204).end();
    } catch {
      return res.status(204).end();
    }
  });

  // ─── Event tracking endpoint ──────────────────────────────────────
  app.post("/api/track/event", async (req: Request, res: Response) => {
    try {
      const { eventType, path, ctaLabel, ctaDestination, leadSource, sessionId, metadata, revenue } = req.body as {
        eventType: string;
        path: string;
        ctaLabel?: string;
        ctaDestination?: string;
        leadSource?: string;
        sessionId?: string;
        metadata?: any;
        revenue?: number;
      };

      if (!eventType || !path) {
        return res.status(204).end();
      }

      const userId = (req as any).user?.id;
      const cleanPath = stripLocale(path);

      pool.query(
        `INSERT INTO analytics_events (event_type, path, cta_label, cta_destination, lead_source, session_id, user_id, metadata, revenue) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [eventType, cleanPath, ctaLabel || null, ctaDestination || null, leadSource || null, sessionId || null, userId || null, metadata ? JSON.stringify(metadata) : null, revenue || null]
      ).catch(() => {});

      return res.status(204).end();
    } catch {
      return res.status(204).end();
    }
  });

  // ─── Admin analytics query endpoint ───────────────────────────────
  app.get("/api/admin/analytics/overview", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const sinceStr = since.toISOString();

      // Total pageviews and unique sessions in the period
      const pvResult = await pool.query(`
        SELECT
          count(*)::int as total_views,
          count(DISTINCT session_id)::int as unique_sessions
        FROM page_views
        WHERE created_at >= $1
      `, [sinceStr]);

      // Pageviews by day
      const byDay = await pool.query(`
        SELECT date_trunc('day', created_at) as day,
               count(*)::int as views,
               count(DISTINCT session_id)::int as sessions
        FROM page_views
        WHERE created_at >= $1
        GROUP BY day ORDER BY day
      `, [sinceStr]);

      // Top pages
      const topPages = await pool.query(`
        SELECT path, count(*)::int as views,
               count(DISTINCT session_id)::int as unique_visitors
        FROM page_views
        WHERE created_at >= $1
        GROUP BY path ORDER BY views DESC LIMIT 20
      `, [sinceStr]);

      // Traffic sources
      const sources = await pool.query(`
        SELECT referrer_source as source, count(*)::int as views,
               count(DISTINCT session_id)::int as sessions
        FROM page_views
        WHERE created_at >= $1
        GROUP BY referrer_source ORDER BY views DESC
      `, [sinceStr]);

      // Conversion events
      const events = await pool.query(`
        SELECT event_type, count(*)::int as count
        FROM analytics_events
        WHERE created_at >= $1
        GROUP BY event_type ORDER BY count DESC
      `, [sinceStr]);

      // Revenue from events
      const revenueResult = await pool.query(`
        SELECT COALESCE(sum(revenue), 0)::float as total_revenue
        FROM analytics_events
        WHERE event_type = 'purchase' AND created_at >= $1
      `, [sinceStr]);

      // Top city pages
      const cityPages = await pool.query(`
        SELECT path, count(*)::int as views,
               count(DISTINCT session_id)::int as visitors
        FROM page_views
        WHERE path LIKE '/service-areas/%' AND created_at >= $1
        GROUP BY path ORDER BY views DESC LIMIT 15
      `, [sinceStr]);

      // Conversion rate
      const convResult = await pool.query(`
        SELECT
          count(DISTINCT pv.session_id)::int as total_sessions,
          count(DISTINCT CASE WHEN ae.event_type IN ('purchase', 'booking_completed', 'quote_submit') THEN ae.session_id END)::int as converting_sessions
        FROM page_views pv
        LEFT JOIN analytics_events ae
          ON ae.session_id = pv.session_id AND ae.event_type IN ('purchase', 'booking_completed', 'quote_submit')
        WHERE pv.created_at >= $1
      `, [sinceStr]);

      const totalSessions = convResult.rows[0]?.total_sessions || 0;
      const convertingSessions = convResult.rows[0]?.converting_sessions || 0;
      const conversionRate = totalSessions > 0 ? (convertingSessions / totalSessions) * 100 : 0;

      return res.json({
        days,
        totalViews: pvResult.rows[0]?.total_views || 0,
        uniqueSessions: pvResult.rows[0]?.unique_sessions || 0,
        conversionRate: Number(conversionRate.toFixed(2)),
        totalRevenue: revenueResult.rows[0]?.total_revenue || 0,
        byDay: byDay.rows,
        topPages: topPages.rows,
        sources: sources.rows,
        events: events.rows,
        cityPages: cityPages.rows,
      });
    } catch (error: any) {
      console.error("[Analytics] Overview error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Admin: traffic by source with conversion ─────────────────────
  app.get("/api/admin/analytics/funnel", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const sinceStr = since.toISOString();

      const funnel = await pool.query(`
        SELECT
          pv.referrer_source as source,
          count(DISTINCT pv.session_id)::int as visitors,
          count(DISTINCT CASE WHEN ae.event_type = 'cta_click' THEN ae.session_id END)::int as clicked_cta,
          count(DISTINCT CASE WHEN ae.event_type IN ('quote_submit', 'booking_started') THEN ae.session_id END)::int as started_conversion,
          count(DISTINCT CASE WHEN ae.event_type IN ('purchase', 'booking_completed') THEN ae.session_id END)::int as converted,
          COALESCE(sum(ae.revenue), 0)::float as revenue
        FROM page_views pv
        LEFT JOIN analytics_events ae ON ae.session_id = pv.session_id
        WHERE pv.created_at >= $1
        GROUP BY pv.referrer_source
        ORDER BY visitors DESC
      `, [sinceStr]);

      return res.json({
        days,
        funnel: funnel.rows,
      });
    } catch (error: any) {
      console.error("[Analytics] Funnel error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Admin: top pages with bounce rate ────────────────────────────
  app.get("/api/admin/analytics/pages", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const sinceStr = since.toISOString();

      const pages = await pool.query(`
        SELECT
          path,
          count(*)::int as views,
          count(DISTINCT session_id)::int as unique_visitors
        FROM page_views
        WHERE created_at >= $1
        GROUP BY path
        ORDER BY views DESC
        LIMIT $2
      `, [sinceStr, limit]);

      return res.json({ days, pages: pages.rows });
    } catch (error: any) {
      console.error("[Analytics] Pages error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
