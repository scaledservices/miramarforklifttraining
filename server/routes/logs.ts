import type { Express, Request, Response } from "express";
import { z } from "zod";
import { and, desc, gte, ilike, lte, eq, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { systemLogs } from "@shared/schema";
import { logger } from "../monitoring";
import { rateLimit } from "../rate-limit";
import { requireRole } from "./middleware";

// -----------------------------------------------------------------------------
// POST /api/client-errors — browser error intake (window.onerror, unhandled
// promise rejections, React error boundary). Anonymous by design: errors
// happen to logged-out visitors too. Rate-limited hard so a render loop on
// one client can't flood the table.
// -----------------------------------------------------------------------------

const clientErrorSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  url: z.string().max(500).optional(),
  userAgent: z.string().max(300).optional(),
  kind: z.enum(["error", "unhandledrejection", "react-boundary"]).optional(),
});

const LOG_LEVELS = ["error", "warn", "info"] as const;
const LOG_SOURCES = ["server", "client", "job", "email", "payment", "db"] as const;

export function registerLogRoutes(app: Express) {
  app.post(
    "/api/client-errors",
    rateLimit({ name: "client_errors", windowMs: 60_000, max: 10 }),
    (req: Request, res: Response) => {
      const parsed = clientErrorSchema.safeParse(req.body);
      // Always 204 — the reporter must never get an error it would re-report.
      if (!parsed.success) return res.status(204).end();

      const { message, stack, url, userAgent, kind } = parsed.data;
      logger.error(message, {
        source: "client",
        error: stack,
        metadata: { url, userAgent, kind: kind ?? "error" },
      });
      return res.status(204).end();
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/admin/logs?level=&source=&from=&to=&q=&limit=&offset=
  // Recent-first. `from`/`to` are ISO dates (inclusive day bounds for a bare
  // YYYY-MM-DD). `q` searches message text.
  // ---------------------------------------------------------------------------
  app.get(
    "/api/admin/logs",
    requireRole("admin", "super_admin"),
    async (req: Request, res: Response) => {
      try {
        const conditions: SQL[] = [];

        const level = typeof req.query.level === "string" ? req.query.level : undefined;
        if (level) {
          if (!(LOG_LEVELS as readonly string[]).includes(level)) {
            return res.status(400).json({ error: `Invalid level. Valid values: ${LOG_LEVELS.join(", ")}` });
          }
          conditions.push(eq(systemLogs.level, level as (typeof LOG_LEVELS)[number]));
        }

        const source = typeof req.query.source === "string" ? req.query.source : undefined;
        if (source) {
          if (!(LOG_SOURCES as readonly string[]).includes(source)) {
            return res.status(400).json({ error: `Invalid source. Valid values: ${LOG_SOURCES.join(", ")}` });
          }
          conditions.push(eq(systemLogs.source, source));
        }

        const from = typeof req.query.from === "string" ? req.query.from : undefined;
        if (from) {
          const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(from) ? `${from}T00:00:00` : from);
          if (isNaN(d.getTime())) return res.status(400).json({ error: "Invalid 'from' date" });
          conditions.push(gte(systemLogs.createdAt, d));
        }

        const to = typeof req.query.to === "string" ? req.query.to : undefined;
        if (to) {
          const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to}T23:59:59.999` : to);
          if (isNaN(d.getTime())) return res.status(400).json({ error: "Invalid 'to' date" });
          conditions.push(lte(systemLogs.createdAt, d));
        }

        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (q) {
          const escaped = q.replace(/[%_\\]/g, (c) => `\\${c}`);
          conditions.push(ilike(systemLogs.message, `%${escaped}%`));
        }

        const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "100"), 10) || 100, 1), 500);
        const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [logs, countRows] = await Promise.all([
          db
            .select()
            .from(systemLogs)
            .where(where)
            .orderBy(desc(systemLogs.createdAt))
            .limit(limit)
            .offset(offset),
          db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(systemLogs)
            .where(where),
        ]);

        return res.json({ logs, total: countRows[0]?.count ?? 0, limit, offset });
      } catch (error) {
        console.error("[Logs] Query error:", error);
        return res.status(500).json({ error: "Failed to query logs" });
      }
    }
  );
}
