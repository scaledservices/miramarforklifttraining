import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import passport from "passport";
import { storage } from "../storage";
import { hashPassword, verifyPassword, requestPasswordReset, confirmPasswordReset, isInviteExpired, handleOAuthLogin } from "../auth";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../email";
import type { User } from "@shared/schema";
import { getPostLoginRedirect } from "@shared/roles";
import { resolveLocale } from "../locale-resolver";
import { requireAuth, sanitizeReturnTo, sanitizeUser, loginLimiter, resetRequestLimiter, resetConfirmLimiter, acceptInviteLimiter } from "./middleware";

export async function registerAuthRoutes(app: Express) {
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, locale: reqLocale } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain uppercase, lowercase, and a number" });
    }

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const regLocale = (reqLocale === "es") ? "es" : "en";
    const passwordHash = await hashPassword(password);
    const user = await storage.createUser({ email, passwordHash, name, phone, role: "individual", locale: regLocale });

    req.session.userId = user.id;

    sendWelcomeEmail({ to: user.email, userName: user.name, actorUserId: user.id, locale: user.locale || "en" }).catch(err =>
      console.error("[EMAIL] Welcome email failed:", err)
    );

    await storage.createAuditLog({
      actorUserId: user.id,
      action: "account_created",
      entity: "users",
      entityId: String(user.id),
      metadata: { email: user.email },
    });

    return res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("[Auth] Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("connect.sid");
    return res.json({ success: true });
  });
});

app.get("/api/auth/me", async (req: Request, res: Response) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await storage.getUser(req.session.userId);
  if (!user) return res.json({ user: null });
  return res.json({ user: sanitizeUser(user) });
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const { Strategy: GoogleStrategy } = await import("passport-google-oauth20");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || `localhost:${process.env.PORT || 5000}`;
  const protocol = domain.includes("localhost") ? "http" : "https";

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${protocol}://${domain}/api/auth/google/callback`,
  }, async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || email?.split("@")[0] || "User";
      if (!email) return done(new Error("No email from Google"));
      const user = await handleOAuthLogin("google", profile.id, email, name);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  app.get("/api/auth/google", (req, res, next) => {
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const returnTo = sanitizeReturnTo(req.query.returnTo as string | undefined);
    if (returnTo) req.session.returnTo = returnTo;
    req.session.save(() => {
      passport.authenticate("google", { scope: ["profile", "email"], session: false, state })(req, res, next);
    });
  });

  app.get("/api/auth/google/callback",
    (req: Request, res: Response, next: NextFunction) => {
      const returnedState = req.query.state as string | undefined;
      if (!returnedState || returnedState !== req.session.oauthState) {
        return res.redirect("/login?error=google_failed");
      }
      delete req.session.oauthState;
      next();
    },
    passport.authenticate("google", { failureRedirect: "/login?error=google_failed", session: false }),
    async (req: Request, res: Response) => {
      const user = req.user as User;
      const returnTo = sanitizeReturnTo(req.session.returnTo);
      delete req.session.returnTo;
      req.session.userId = user.id;
      req.session.save(() => {
        res.redirect(returnTo || getPostLoginRedirect(user.role));
      });
    }
  );
  console.log("[OAuth] Google strategy configured");
}

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  const linkedinOAuth = await import("passport-linkedin-oauth2");
  const LinkedInStrategy = linkedinOAuth.Strategy;
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || `localhost:${process.env.PORT || 5000}`;
  const protocol = domain.includes("localhost") ? "http" : "https";

  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${protocol}://${domain}/api/auth/linkedin/callback`,
    scope: ["openid", "profile", "email"],
  }, async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || email?.split("@")[0] || "User";
      if (!email) return done(new Error("No email from LinkedIn"));
      const user = await handleOAuthLogin("linkedin", profile.id, email, name);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  app.get("/api/auth/linkedin", (req, res, next) => {
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const returnTo = sanitizeReturnTo(req.query.returnTo as string | undefined);
    if (returnTo) req.session.returnTo = returnTo;
    req.session.save(() => {
      passport.authenticate("linkedin", { session: false, state })(req, res, next);
    });
  });

  app.get("/api/auth/linkedin/callback",
    (req: Request, res: Response, next: NextFunction) => {
      const returnedState = req.query.state as string | undefined;
      if (!returnedState || returnedState !== req.session.oauthState) {
        return res.redirect("/login?error=linkedin_failed");
      }
      delete req.session.oauthState;
      next();
    },
    passport.authenticate("linkedin", { failureRedirect: "/login?error=linkedin_failed", session: false }),
    async (req: Request, res: Response) => {
      const user = req.user as User;
      const returnTo = sanitizeReturnTo(req.session.returnTo);
      delete req.session.returnTo;
      req.session.userId = user.id;
      req.session.save(() => {
        res.redirect(returnTo || getPostLoginRedirect(user.role));
      });
    }
  );
  console.log("[OAuth] LinkedIn strategy configured");
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  const { Strategy: FacebookStrategy } = await import("passport-facebook");
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || `localhost:${process.env.PORT || 5000}`;
  const protocol = domain.includes("localhost") ? "http" : "https";

  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${protocol}://${domain}/api/auth/facebook/callback`,
    profileFields: ["id", "emails", "name", "displayName"],
  }, async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() || "User";
      if (!email) return done(new Error("No email from Facebook. Please ensure your Facebook account has a verified email."));
      const user = await handleOAuthLogin("facebook", profile.id, email, name);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  app.get("/api/auth/facebook", (req, res, next) => {
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    const returnTo = sanitizeReturnTo(req.query.returnTo as string | undefined);
    if (returnTo) req.session.returnTo = returnTo;
    req.session.save(() => {
      passport.authenticate("facebook", { scope: ["email"], session: false, state })(req, res, next);
    });
  });

  app.get("/api/auth/facebook/callback",
    (req: Request, res: Response, next: NextFunction) => {
      const returnedState = req.query.state as string | undefined;
      if (!returnedState || returnedState !== req.session.oauthState) {
        return res.redirect("/login?error=facebook_failed");
      }
      delete req.session.oauthState;
      next();
    },
    passport.authenticate("facebook", { failureRedirect: "/login?error=facebook_failed", session: false }),
    async (req: Request, res: Response) => {
      const user = req.user as User;
      const returnTo = sanitizeReturnTo(req.session.returnTo);
      delete req.session.returnTo;
      req.session.userId = user.id;
      req.session.save(() => {
        res.redirect(returnTo || getPostLoginRedirect(user.role));
      });
    }
  );
  console.log("[OAuth] Facebook strategy configured");
}

app.get("/api/auth/providers", (_req: Request, res: Response) => {
  res.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
  });
});

app.post("/api/auth/password-reset-request", resetRequestLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const result = await requestPasswordReset(email);
    if ("error" in result && result.error.includes("social login")) {
      return res.status(400).json({ error: result.error });
    }
    if ("rawToken" in result) {
      const userLocale = await resolveLocale({ routeLocale: (req.query.locale as string) || undefined });
      await sendPasswordResetEmail({ to: email, token: result.rawToken, locale: userLocale });
    }
    return res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("[Auth] Password reset request error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/password-reset-confirm", resetConfirmLimiter, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and new password are required" });

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain uppercase, lowercase, and a number" });
    }

    const result = await confirmPasswordReset(token, password);
    if ("error" in result) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  } catch (error) {
    console.error("[Auth] Password reset confirm error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/auth/invite-info", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) return res.status(404).json({ error: "Invalid invite token" });

    const member = await storage.getGroupMemberByToken(token);
    if (!member) return res.status(404).json({ error: "Invalid invite token" });

    const group = await storage.getGroup(member.groupId);
    const inviter = member.invitedByUserId ? await storage.getUser(member.invitedByUserId) : null;

    return res.json({
      email: member.email,
      name: member.name,
      groupName: group?.name || "Unknown Crew",
      inviterName: inviter?.name || "Your team admin",
      accepted: !!member.acceptedAt,
      expired: isInviteExpired(member.invitedAt),
    });
  } catch (error) {
    console.error("[invite-info] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/accept-invite", acceptInviteLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const { inviteToken } = req.body;
    if (!inviteToken) return res.status(400).json({ error: "Invite token is required" });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(inviteToken)) return res.status(404).json({ error: "Invalid invite token" });

    const member = await storage.getGroupMemberByToken(inviteToken);
    if (!member) return res.status(404).json({ error: "Invalid invite token" });
    if (member.acceptedAt) return res.status(400).json({ error: "This invite has already been accepted" });
    if (isInviteExpired(member.invitedAt)) {
      return res.status(400).json({ error: "This invite has expired. Please ask your crew admin to send a new one." });
    }

    const updated = await storage.acceptInvite(member.id, req.session.userId!);

    let assignedEnrollmentId: number | null = null;
    let seatAssignmentFailed = false;
    if (member.pendingEnrollmentId) {
      try {
        const enrollment = await storage.getEnrollment(member.pendingEnrollmentId);
        if (enrollment && !enrollment.userId) {
          await storage.assignEnrollmentUser(member.pendingEnrollmentId, req.session.userId!, member.invitedByUserId || req.session.userId!);
          assignedEnrollmentId = member.pendingEnrollmentId;
        } else {
          seatAssignmentFailed = true;
        }
      } catch (e) {
        console.warn("[Auth] Failed to auto-assign pending enrollment:", e);
        seatAssignmentFailed = true;
      }
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "invite_accepted",
      entity: "group_members",
      entityId: String(member.id),
      metadata: { groupId: member.groupId, assignedEnrollmentId, seatAssignmentFailed },
    });

    const redirectTo = assignedEnrollmentId
      ? `/course/${assignedEnrollmentId}`
      : "/dashboard";

    return res.json({ member: updated, assignedEnrollmentId, seatAssignmentFailed, redirectTo });
  } catch (error) {
    console.error("[Auth] Accept invite error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
}
