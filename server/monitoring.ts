import { Request, Response, NextFunction } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { db } from "./db";
import { systemLogs } from "@shared/schema";

// =============================================================================
// Structured logging
//
// Every log entry is a JSON object: { timestamp, level, source, message,
// stack, requestPath, requestMethod, userId, requestBody, metadata,
// environment }. Entries go to stdout/stderr (Railway log drain picks them up)
// and, for error/warn/info emitted through the logger, to the system_logs
// table (queried by GET /api/admin/logs, pruned after 30 days by a job).
//
// console.error / console.warn are also captured, so the hundreds of existing
// catch blocks flow into the structured log without being rewritten. Request
// context (path, method, userId, body) rides along via AsyncLocalStorage.
// =============================================================================

export type LogLevel = "error" | "warn" | "info";
export type LogSource = "server" | "client" | "job" | "email" | "payment" | "db";

interface RequestContext {
  path: string;
  method: string;
  userId?: number;
  body?: unknown;
}

const requestContext = new AsyncLocalStorage<RequestContext>();

// Originals, saved before any capture patching — all internal output goes
// through these so a failing DB write can never re-enter the logger.
const rawLog = console.log.bind(console);
const rawWarn = console.warn.bind(console);
const rawError = console.error.bind(console);

const ENVIRONMENT = process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || "development";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// -----------------------------------------------------------------------------
// Sanitization: never let payment data, passwords, or tokens reach a log.
// -----------------------------------------------------------------------------

const REDACTED_KEY_PATTERN =
  /card|cvv|cvc|password|passwd|token|secret|authorization|auth[-_]?header|data[-_]?value|data[-_]?descriptor|opaque|account[-_]?number|routing|ssn|expir|cookie|session[-_]?id/i;

/** Standalone 13–19 digit runs read as card numbers — redact defensively. */
const CARD_NUMBER_PATTERN = /\b\d[\d -]{11,17}\d\b/;

const MAX_STRING = 1000;
const MAX_DEPTH = 4;
const MAX_KEYS = 30;
const MAX_ARRAY = 20;

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    const clipped = value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[truncated]` : value;
    return CARD_NUMBER_PATTERN.test(clipped) ? "[REDACTED]" : clipped;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) return { message: value.message, stack: value.stack };
  if (depth >= MAX_DEPTH) return "[depth limit]";
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY).map((v) => sanitizeForLog(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    let count = 0;
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (++count > MAX_KEYS) {
        out["…"] = "[key limit]";
        break;
      }
      out[key] = REDACTED_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeForLog(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

// -----------------------------------------------------------------------------
// Core emit: console (always) + database (rate-capped, fire-and-forget).
// -----------------------------------------------------------------------------

interface LogOptions {
  source?: LogSource;
  /** Error object or stack string */
  error?: unknown;
  /** Extra structured context (sanitized before write) */
  metadata?: Record<string, unknown>;
  /** Skip the DB write (used for info-level noise) */
  consoleOnly?: boolean;
}

// Flood guard: at most this many DB writes per minute; overflow is console-only.
const DB_WRITES_PER_MINUTE = 120;
let dbWriteCount = 0;
let dbWriteWindowStart = Date.now();
let dbInsertInFlight = false;

function canWriteDb(): boolean {
  const now = Date.now();
  if (now - dbWriteWindowStart > 60_000) {
    dbWriteWindowStart = now;
    dbWriteCount = 0;
  }
  return ++dbWriteCount <= DB_WRITES_PER_MINUTE;
}

function stackOf(error: unknown): string | undefined {
  if (error instanceof Error) return error.stack;
  if (typeof error === "string" && error.includes("\n    at ")) return error;
  return undefined;
}

function emit(level: LogLevel, message: string, opts: LogOptions = {}) {
  const ctx = requestContext.getStore();
  const stack = stackOf(opts.error) ?? (opts.error != null && !(opts.error instanceof Error) ? String(opts.error) : undefined);

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    source: opts.source ?? "server",
    message: message.slice(0, 2000),
    stack: stack?.slice(0, 8000),
    requestPath: ctx?.path,
    requestMethod: ctx?.method,
    userId: ctx?.userId,
    // Body only on errors — that's when it earns its storage cost.
    requestBody: level === "error" && ctx?.body && typeof ctx.body === "object" ? sanitizeForLog(ctx.body) : undefined,
    metadata: opts.metadata ? (sanitizeForLog(opts.metadata) as Record<string, unknown>) : undefined,
    environment: ENVIRONMENT,
  };

  // Console for the Railway drain: JSON lines in production, readable in dev.
  const consoleFn = level === "error" ? rawError : level === "warn" ? rawWarn : rawLog;
  if (IS_PRODUCTION) {
    consoleFn(JSON.stringify(entry));
  } else {
    consoleFn(`[${level.toUpperCase()}][${entry.source}] ${message}`, stack ?? "", opts.metadata ?? "");
  }

  if (opts.consoleOnly || !canWriteDb()) return;

  // Fire-and-forget; a failing insert must never throw into the caller or
  // recurse into the logger.
  db.insert(systemLogs)
    .values({
      level: entry.level,
      source: entry.source,
      message: entry.message,
      stack: entry.stack ?? null,
      requestPath: entry.requestPath ?? null,
      requestMethod: entry.requestMethod ?? null,
      userId: entry.userId ?? null,
      requestBody: entry.requestBody ?? null,
      metadata: entry.metadata ?? null,
      environment: entry.environment,
    })
    .catch((err) => {
      if (dbInsertInFlight) return;
      dbInsertInFlight = true;
      rawError("[LOGGER] Failed to persist log entry:", err?.message ?? err);
      dbInsertInFlight = false;
    });
}

export const logger = {
  error(message: string, opts: LogOptions = {}) {
    emit("error", message, opts);
  },
  warn(message: string, opts: LogOptions = {}) {
    emit("warn", message, opts);
  },
  info(message: string, opts: LogOptions = {}) {
    emit("info", message, opts);
  },
};

// -----------------------------------------------------------------------------
// console.error / console.warn capture — the existing codebase logs errors
// through these everywhere; capturing them persists every catch block's
// output without touching 15+ route files.
// -----------------------------------------------------------------------------

let captureInstalled = false;
let insideCapture = false;

export function installConsoleCapture() {
  if (captureInstalled || process.env.LOG_CAPTURE_DISABLED === "true") return;
  captureInstalled = true;

  const wrap = (level: "error" | "warn", original: (...args: any[]) => void) =>
    (...args: any[]) => {
      if (insideCapture) return original(...args);
      insideCapture = true;
      try {
        original(...args);
        const errArg = args.find((a) => a instanceof Error);
        const message = args
          .map((a) => (a instanceof Error ? a.message : typeof a === "string" ? a : safeStringify(a)))
          .join(" ")
          .slice(0, 2000);
        // Console output already happened above — persist to DB only.
        persistCaptured(level, message, errArg);
      } finally {
        insideCapture = false;
      }
    };

  console.error = wrap("error", rawError);
  console.warn = wrap("warn", rawWarn);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(sanitizeForLog(value));
  } catch {
    return String(value);
  }
}

function persistCaptured(level: "error" | "warn", message: string, error?: Error) {
  if (!message.trim() || !canWriteDb()) return;
  const ctx = requestContext.getStore();
  db.insert(systemLogs)
    .values({
      level,
      source: "server",
      message,
      stack: error?.stack?.slice(0, 8000) ?? null,
      requestPath: ctx?.path ?? null,
      requestMethod: ctx?.method ?? null,
      userId: ctx?.userId ?? null,
      requestBody: level === "error" && ctx?.body && typeof ctx.body === "object" ? sanitizeForLog(ctx.body) : null,
      metadata: null,
      environment: ENVIRONMENT,
    })
    .catch((err) => rawError("[LOGGER] Failed to persist captured log:", err?.message ?? err));
}

// -----------------------------------------------------------------------------
// Express middleware
// -----------------------------------------------------------------------------

/** Registers request context so every log inside the request knows its origin.
 *  Must run after session middleware so req.session.userId is populated. */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  requestContext.run(
    {
      path: req.path,
      method: req.method,
      userId: (req as any).session?.userId,
      body: req.body,
    },
    next
  );
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (req.path.startsWith("/api/")) {
      const logLevel = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
      rawLog(`[${logLevel}] ${req.method} ${req.path} ${status} ${duration}ms`);
    }

    return originalEnd.apply(this, args);
  };

  next();
}

/** Final Express error middleware: structured log + safe JSON response. */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Internal Server Error";

  logger.error(`Unhandled route error: ${req.method} ${req.path} — ${message}`, {
    error: err,
    metadata: { status },
  });

  if (res.headersSent) {
    return next(err);
  }
  return res.status(status).json({ message: status >= 500 ? "Internal Server Error" : message });
}

// -----------------------------------------------------------------------------
// Domain event helpers (existing call sites keep working)
// -----------------------------------------------------------------------------

export function logPaymentEvent(event: string, data: Record<string, any>) {
  logger.info(`[PAYMENT] ${event}`, { source: "payment", metadata: data, consoleOnly: true });
}

export function logPaymentError(event: string, error: unknown, data: Record<string, any> = {}) {
  logger.error(`[PAYMENT] ${event}`, { source: "payment", error, metadata: data });
}

export function logWebhookEvent(event: string, data: Record<string, any>) {
  logger.info(`[WEBHOOK] ${event}`, { metadata: data, consoleOnly: true });
}

export function logCertEvent(event: string, data: Record<string, any>) {
  logger.info(`[CERT] ${event}`, { metadata: data, consoleOnly: true });
}

export function logEmailError(context: string, error: unknown, data: Record<string, any> = {}) {
  logger.error(`[EMAIL] ${context}`, { source: "email", error, metadata: data });
}

export function logJobError(jobName: string, error: unknown) {
  logger.error(`[JOB] ${jobName} failed`, { source: "job", error, metadata: { job: jobName } });
}

export function logDbError(context: string, error: unknown) {
  logger.error(`[DB] ${context}`, { source: "db", error });
}
