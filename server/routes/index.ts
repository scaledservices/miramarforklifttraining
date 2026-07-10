import type { Express } from "express";
import { type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { pool } from "../db";
import { registerSeoRoutes } from "../seo";
import { csrfProtection } from "./middleware";
import { registerAuthRoutes } from "./auth";
import { registerOnsiteRoutes } from "./onsite";
import { registerInstructorRoutes } from "./instructors";
import { registerLmsRoutes } from "./lms";
import { registerOrderRoutes } from "./orders";
import { registerCertRoutes } from "./certs";
import { registerGroupRoutes } from "./groups";
import { registerAdminRoutes } from "./admin";
import { registerServiceRoutes } from "./services";
import { registerAssistantRoutes } from "./assistant";
import { registerTrainingEventRoutes } from "./training-events";
import { registerQuoteRoutes } from "./quotes";
import { registerAuthorizeNetRoutes } from "./authorizeNet";
import { registerTodayRoutes } from "./today";
import { registerMoneyRoutes } from "./money";
import { registerDiscountRoutes } from "./discounts";
import { registerReferralRoutes } from "./referrals";
import { registerGeoRoutes } from "./geo";
import { registerAuditBinderRoutes } from "./audit-binder";
import { registerRosterRoutes } from "./roster";
import { registerRoleCertRoutes } from "./role-certs";
import { registerPhotoRoutes } from "./photos";
import { registerInvoicingRoutes } from "./invoicing";
import { registerStandingSessionRoutes } from "./standing-sessions";
import { registerLogRoutes } from "./logs";
import { requestContextMiddleware } from "../monitoring";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Behind Railway's proxy, Express must trust X-Forwarded-Proto or
  // express-session refuses to set Secure cookies (breaking all logins).
  app.set("trust proxy", 1);

  const PgStore = connectPgSimple(session);
  app.use(session({
    store: new PgStore({
      pool: pool as any,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("SESSION_SECRET required"); })() : "dev-session-key"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  }));

  app.use(passport.initialize());
  app.use(csrfProtection);
  // After session middleware: every log line inside a request now carries
  // path, method, userId, and (sanitized, on errors) the request body.
  app.use(requestContextMiddleware);

  registerSeoRoutes(app);

  await registerAuthRoutes(app);
  registerOnsiteRoutes(app);
  registerInstructorRoutes(app);
  registerLmsRoutes(app);
  registerOrderRoutes(app);
  registerCertRoutes(app);
  registerGroupRoutes(app);
  registerAdminRoutes(app);
  registerServiceRoutes(app);
  registerAssistantRoutes(app);
  registerTrainingEventRoutes(app);
  registerQuoteRoutes(app);
  registerAuthorizeNetRoutes(app);
  registerTodayRoutes(app);
  registerMoneyRoutes(app);
  registerDiscountRoutes(app);
  registerReferralRoutes(app);
  registerGeoRoutes(app);
  registerAuditBinderRoutes(app);
  registerRosterRoutes(app);
  registerRoleCertRoutes(app);
  registerPhotoRoutes(app);
  registerInvoicingRoutes(app);
  registerStandingSessionRoutes(app);
  registerLogRoutes(app);

  return httpServer;
}
