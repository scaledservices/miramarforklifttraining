import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { hasAnyRole } from "@shared/roles";
import { rateLimit } from "../rate-limit";
import type { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: number;
    oauthState?: string;
    returnTo?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function sanitizeReturnTo(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (typeof url !== "string") return undefined;
  if (!url.startsWith("/") || url.startsWith("//")) return undefined;
  if (url.includes("..") || url.includes("\\")) return undefined;
  return url;
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!hasAnyRole(user.role, roles)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  if (req.path.startsWith("/api/stripe/webhook") || req.path.startsWith("/api/webhooks/")) {
    return next();
  }
  if (req.path.match(/^\/api\/auth\/(google|linkedin|facebook)\/(callback)?/)) {
    return next();
  }

  const origin = req.headers["origin"];
  const referer = req.headers["referer"];
  const host = req.headers["host"];

  if (!host) {
    return next();
  }

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        console.warn(`[CSRF] Origin mismatch: origin=${origin} host=${host} path=${req.path}`);
        return res.status(403).json({ error: "Cross-origin request blocked" });
      }
    } catch {
      return res.status(403).json({ error: "Invalid origin header" });
    }
    return next();
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        console.warn(`[CSRF] Referer mismatch: referer=${referer} host=${host} path=${req.path}`);
        return res.status(403).json({ error: "Cross-origin request blocked" });
      }
    } catch {
      return res.status(403).json({ error: "Invalid referer header" });
    }
    return next();
  }

  if (req.session?.userId && req.path.startsWith("/api/")) {
    console.warn(`[CSRF] Blocked authenticated request with no Origin/Referer: path=${req.path}`);
    return res.status(403).json({ error: "Missing origin header on authenticated request" });
  }

  return next();
}

export function sanitizeUser(user: User) {
  const { passwordHash, passwordResetTokenHash, passwordResetTokenExpiresAt, passwordResetTokenUsedAt, ...safe } = user;
  return safe;
}

export function omitExamAnswers(questions: any[]): any[] {
  if (!Array.isArray(questions)) return questions;
  return questions.map(q => {
    const { correctAnswers, ...rest } = q;
    return rest;
  });
}

export const loginLimiter = rateLimit({ name: "login", windowMs: 60_000, max: 5 });
export const resetRequestLimiter = rateLimit({ name: "reset_request", windowMs: 60_000, max: 3 });
export const resetConfirmLimiter = rateLimit({ name: "reset_confirm", windowMs: 60_000, max: 5 });
export const acceptInviteLimiter = rateLimit({ name: "accept_invite", windowMs: 60_000, max: 5 });
export const payLimiter = rateLimit({ name: "pay", windowMs: 60_000, max: 5 });
export const verifyLimiter = rateLimit({ name: "verify", windowMs: 60_000, max: 10 });
export const examSubmitLimiter = rateLimit({
  name: "exam_submit",
  windowMs: 60_000,
  max: 10,
  keyGenerator: (req: Request) => req.params.enrollmentId || req.ip || "unknown",
});
export const assistantLimiter = rateLimit({
  name: "assistant",
  windowMs: 60_000,
  max: 20,
  keyGenerator: (req: Request) => req.session?.userId ? String(req.session.userId) : (req.ip || "unknown"),
});
