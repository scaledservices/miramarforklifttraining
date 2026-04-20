import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (req.path.startsWith("/api/")) {
      const logLevel = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
      console.log(`[${logLevel}] ${req.method} ${req.path} ${status} ${duration}ms`);
    }

    return originalEnd.apply(this, args);
  };

  next();
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  console.error(err.stack);

  res.status(500).json({ error: "Internal server error" });
}

export function logPaymentEvent(event: string, data: Record<string, any>) {
  console.log(`[PAYMENT] ${event}`, JSON.stringify(data));
}

export function logWebhookEvent(event: string, data: Record<string, any>) {
  console.log(`[WEBHOOK] ${event}`, JSON.stringify(data));
}

export function logCertEvent(event: string, data: Record<string, any>) {
  console.log(`[CERT] ${event}`, JSON.stringify(data));
}
