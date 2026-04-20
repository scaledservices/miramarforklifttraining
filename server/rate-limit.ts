import { Request, Response, NextFunction } from "express";

// NOTE: This rate limiter uses in-memory storage (Map).
// Limitations:
// - Counters reset on server restart
// - In a multi-instance deployment, each instance tracks independently
// - Acceptable for single-instance Replit deployment
// - For multi-instance scaling, migrate to Redis-backed rate limiting (e.g. rate-limit-redis)

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

function cleanup(store: Map<string, RateLimitEntry>) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

setInterval(() => {
  for (const store of stores.values()) {
    cleanup(store);
  }
}, 60_000);

export function rateLimit(options: {
  name: string;
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}) {
  const { name, windowMs, max, keyGenerator } = options;
  const store = getStore(name);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : (req.ip || req.socket.remoteAddress || "unknown");
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        retryAfter,
      });
    }

    next();
  };
}
