import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { PASSWORD_RESET_TTL_MINUTES, INVITE_TTL_DAYS } from "./constants";
import type { User } from "@shared/schema";

function getTokenHmacSecret(): string {
  const secret = process.env.TOKEN_HMAC_SECRET;
  if (!secret) throw new Error("TOKEN_HMAC_SECRET environment variable is required");
  return secret;
}

export function hashToken(token: string): string {
  return crypto.createHmac("sha256", getTokenHmacSecret()).update(token).digest("hex");
}

export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function requestPasswordReset(email: string): Promise<{ rawToken: string } | { error: string }> {
  const user = await storage.getUserByEmail(email);
  if (!user) return { error: "If an account with that email exists, a reset link has been sent." };

  if (!user.passwordHash) {
    return { error: "Your account uses social login. Please sign in with your linked provider." };
  }

  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  await storage.updateUser(user.id, {
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: expiresAt,
    passwordResetTokenUsedAt: null,
  } as any);

  await storage.createAuditLog({
    actorUserId: user.id,
    action: "password_reset_requested",
    entity: "users",
    entityId: String(user.id),
    metadata: { email: user.email },
  });

  return { rawToken };
}

export async function confirmPasswordReset(rawToken: string, newPassword: string): Promise<{ success: true; userId: number } | { error: string }> {
  const tokenHash = hashToken(rawToken);
  const user = await storage.getUserByResetTokenHash(tokenHash);

  if (!user) return { error: "Invalid or expired reset token." };
  if (!user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt < new Date()) {
    return { error: "Reset token has expired." };
  }
  if (user.passwordResetTokenUsedAt) {
    return { error: "Reset token has already been used." };
  }

  const passwordHash = await hashPassword(newPassword);
  await storage.updateUser(user.id, {
    passwordHash,
    passwordResetTokenUsedAt: new Date(),
  } as any);

  await storage.createAuditLog({
    actorUserId: user.id,
    action: "password_reset_completed",
    entity: "users",
    entityId: String(user.id),
    metadata: { userId: user.id },
  });

  return { success: true, userId: user.id };
}

export function isInviteExpired(invitedAt: Date): boolean {
  const expiresAt = new Date(invitedAt.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  return new Date() > expiresAt;
}

export async function handleOAuthLogin(provider: string, providerId: string, email: string, name: string): Promise<User> {
  let user = await storage.getUserByProvider(provider, providerId);
  if (user) return user;

  user = await storage.getUserByEmail(email);
  if (user) {
    const linked = await storage.linkOAuthProvider(user.id, provider, providerId);
    return linked!;
  }

  return storage.createUser({
    email,
    name,
    passwordHash: null,
    authProvider: provider,
    authProviderId: providerId,
    role: "individual",
  });
}
