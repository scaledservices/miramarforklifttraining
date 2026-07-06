import { db } from "./db";
import { auditLogs } from "@shared/schema";
import { brand } from "@shared/config/brand";

/**
 * SMS sending module (Twilio).
 *
 * Graceful degradation: when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_PHONE_NUMBER are not set, messages are logged to console only
 * (same pattern as email.ts outbox-only mode when RESEND_API_KEY is absent).
 *
 * TCPA compliance:
 *   - Quiet hours: sendSMS() refuses to send between 9pm and 8am recipient
 *     local time unless opts.bypassQuietHours is true (e.g. for test sends).
 *   - STOP / HELP: every outbound message should include opt-out instructions.
 *     Inbound STOP/HELP/UNDO/STOPALL keywords must be handled by a Twilio
 *     webhook route (to be wired when the account is live) that adds the
 *     number to a do-not-text list.  See handleInboundSmsKeyword() below.
 */

let twilioClient: any = null;
let configWarningLogged = false;

/** True when all three Twilio env vars are present. */
export function isSmsConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

async function getTwilioClient(): Promise<any | null> {
  if (twilioClient) return twilioClient;
  if (!isSmsConfigured()) {
    if (!configWarningLogged) {
      console.warn(
        "[SMS] WARNING: TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER not set — SMS is console-log only"
      );
      configWarningLogged = true;
    }
    return null;
  }
  try {
    const TwilioNS: any = await import("twilio");
    twilioClient = new (TwilioNS.default ?? TwilioNS)(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
    return twilioClient;
  } catch (err) {
    console.error("[SMS] Failed to initialize Twilio client:", err);
    return null;
  }
}

/** Quiet hours: 9pm–8am recipient local time (TCPA). */
export function isWithinQuietHours(localHour: number): boolean {
  // 21:00–07:59 → cannot send
  return localHour >= 21 || localHour < 8;
}

export interface SmsOptions {
  /** Override quiet-hours check (use sparingly, e.g. tests). */
  bypassQuietHours?: boolean;
  /** Recipient local hour (0–23).  When omitted, quiet-hours check is skipped. */
  recipientLocalHour?: number;
  /** For audit log attribution. */
  actorUserId?: number;
  /** Template / purpose tag for the audit log. */
  template?: string;
}

export interface SmsResult {
  sent: boolean;
  providerMessageId?: string;
  error?: string;
  quietHoursSkipped?: boolean;
}

/** Normalize to E.164-ish if the caller passed a bare 10-digit US number. */
function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  return digits.length === 11 && digits.startsWith("1") ? `+${digits}` : trimmed;
}

async function logSmsSend(to: string, body: string, template: string, actorUserId?: number) {
  try {
    await db.insert(auditLogs).values({
      actorUserId: actorUserId ?? null,
      action: "sms_sent",
      entity: "sms",
      entityId: "0",
      metadata: { to, template, bodyPreview: body.slice(0, 80) },
    });
  } catch (err) {
    console.error("[SMS] Failed to log sms send:", err);
  }
}

/**
 * Send an SMS.  Returns a result describing what happened.
 *
 * - Not configured → console.log + audit log, returns { sent: true } (graceful).
 * - Quiet hours   → does not send, returns { sent: false, quietHoursSkipped: true }.
 * - Twilio error  → returns { sent: false, error }.
 * - Success       → returns { sent: true, providerMessageId }.
 */
export async function sendSMS(
  to: string,
  body: string,
  opts: SmsOptions = {}
): Promise<SmsResult> {
  const template = opts.template || "generic";
  const normalizedTo = normalizePhone(to);

  // TCPA quiet-hours gate
  if (!opts.bypassQuietHours && opts.recipientLocalHour !== undefined) {
    if (isWithinQuietHours(opts.recipientLocalHour)) {
      console.log(
        `[SMS] Quiet hours (recipient local hour ${opts.recipientLocalHour}) — skipping send to ${normalizedTo}`
      );
      return { sent: false, quietHoursSkipped: true };
    }
  }

  const client = await getTwilioClient();

  if (!client) {
    // Graceful degradation — console.log like email outbox-only mode
    console.log("[SMS] Not configured — would send:", { to: normalizedTo, body });
    await logSmsSend(normalizedTo, body, template, opts.actorUserId);
    return { sent: true };
  }

  try {
    const result = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: normalizedTo,
    });
    console.log(`[SMS] Sent via Twilio: ${result.sid}`);
    await logSmsSend(normalizedTo, body, template, opts.actorUserId);
    return { sent: true, providerMessageId: result.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS] Twilio send failed:`, msg);
    return { sent: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Inbound keyword handling (STOP / HELP / UNDO / STOPALL)
// ---------------------------------------------------------------------------

/**
 * TCPA: handle inbound SMS keywords.  Call this from a Twilio webhook route
 * (to be wired when the account goes live).  Returns the auto-reply body
 * (if any) or null when the message is not a keyword.
 *
 * STOP / STOPALL / UNSUBSCRIBE → opt out (add to do-not-text store)
 * HELP / INFO                  → return help text
 * UNDO / START / YES           → opt back in
 */
export function handleInboundSmsKeyword(
  from: string,
  body: string
): { keyword: string; replyBody: string } | null {
  const text = body.trim().toUpperCase();

  const STOP_KEYWORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
  const HELP_KEYWORDS = ["HELP", "INFO"];
  const START_KEYWORDS = ["START", "UNDO", "YES", "UNSTOP"];

  if (STOP_KEYWORDS.includes(text)) {
    // TODO: persist opt-out in a sms_opt_outs table when Twilio is live
    console.log(`[SMS] STOP keyword from ${from} — adding to do-not-text list`);
    return {
      keyword: "STOP",
      replyBody:
        `You are opted out and will not receive further SMS messages from ${brand.name}. Reply HELP for help, START to opt back in.`,
    };
  }

  if (HELP_KEYWORDS.includes(text)) {
    return {
      keyword: "HELP",
      replyBody:
        `${brand.name} SMS alerts: training reminders and account info. Msg & data rates may apply. Reply STOP to opt out. Contact: ${brand.support.phone}`,
    };
  }

  if (START_KEYWORDS.includes(text)) {
    // TODO: remove opt-out in sms_opt_outs table when Twilio is live
    console.log(`[SMS] START keyword from ${from} — removing from do-not-text list`);
    return {
      keyword: "START",
      replyBody: `You are opted back in to SMS messages from ${brand.name}. Reply STOP to opt out at any time.`,
    };
  }

  return null;
}
