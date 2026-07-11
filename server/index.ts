import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { registerSsrMiddleware } from "./seo-ssr";
import { createServer } from "https";
import { readFileSync } from "fs";
import { startJobScheduler } from "./jobs";
import { ensureSequences, pool } from "./db";
import { isStripeConfigured } from "./stripeClient";
import { WebhookHandlers } from "./webhookHandlers";
import { installConsoleCapture, errorHandler, logger, logDbError } from "./monitoring";

const isProduction = process.env.NODE_ENV === "production";

// Structured logging: capture console.error/console.warn into system_logs so
// every existing catch block is persisted, and record crashes before exit.
installConsoleCapture();

pool.on("error", (err) => logDbError("Postgres pool error", err));

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — exiting", { error: err });
  // Give the fire-and-forget DB write a moment, then preserve crash semantics.
  setTimeout(() => process.exit(1), 500);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { error: reason });
});

if (isProduction && process.env.DEMO_MODE === "true") {
  console.error("FATAL: DEMO_MODE=true is not allowed in production. Payments would be bypassed. Exiting.");
  process.exit(1);
}

if (isProduction && !process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET must be set in production. Exiting.");
  process.exit(1);
}

if (isProduction && !process.env.TOKEN_HMAC_SECRET) {
  console.error("FATAL: TOKEN_HMAC_SECRET must be set in production. Exiting.");
  process.exit(1);
}

if (isProduction && process.env.PDF_STORAGE_MODE === "object") {
  console.error("FATAL: PDF_STORAGE_MODE=object is not yet implemented. Use 'local' or leave unset. Exiting.");
  process.exit(1);
}

const app = express();

const isDev = !isProduction;
let sslOptions = undefined;
if (isDev) {
  try {
    sslOptions = {
      key: readFileSync("key.pem"),
      cert: readFileSync("cert.pem"),
    };
  } catch {
    console.warn("SSL certs not found, falling back to HTTP. Generate with: openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost'");
  }
}
const httpServer = sslOptions ? createServer(sslOptions, app) : createServer(app);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://js.authorize.net", "https://jstest.authorize.net", "https://maps.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.authorize.net", "https://apitest.authorize.net", "https://js.authorize.net", "https://jstest.authorize.net", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com", "https://accept.authorize.net", "https://test.authorize.net", "https://js.authorize.net", "https://jstest.authorize.net"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

app.use(compression());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const summary = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${summary.length > 200 ? summary.slice(0, 200) + "…[truncated]" : summary}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await ensureSequences();

  if (isStripeConfigured()) {
    try {
      const { runMigrations } = await import('stripe-replit-sync');
      console.log('Initializing Stripe schema...');
      await runMigrations({ databaseUrl: process.env.DATABASE_URL! });
      console.log('Stripe schema ready');

      const { getStripeSync } = await import('./stripeClient');
      const stripeSync = await getStripeSync();

      const domains = process.env.REPLIT_DOMAINS?.split(',')[0];
      if (domains) {
        const webhookBaseUrl = `https://${domains}`;
        try {
          const webhookResult = await stripeSync.findOrCreateManagedWebhook(
            `${webhookBaseUrl}/api/stripe/webhook`
          );
          const webhookUrl = webhookResult?.webhook?.url || webhookResult?.url || `${webhookBaseUrl}/api/stripe/webhook`;
          console.log(`Stripe webhook configured: ${webhookUrl}`);
        } catch (webhookErr: any) {
          console.log(`[STRIPE] Webhook setup skipped (use Stripe Dashboard to configure): ${webhookErr.message}`);
        }
      }

      stripeSync.syncBackfill()
        .then(() => console.log('Stripe data synced'))
        .catch((err: any) => console.error('Stripe sync error:', err));
    } catch (err) {
      console.error('Stripe initialization failed (non-fatal):', err);
    }
  } else {
    console.log('[STRIPE] Not configured - using demo mode for payments');
  }

  await registerRoutes(httpServer, app);

  app.use(errorHandler);

  registerSsrMiddleware(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "127.0.0.1",
      reusePort: false,
    },
    () => {
      log(`serving on port ${port}`);
      startJobScheduler();
    },
  );
})();
