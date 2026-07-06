import { db } from "./db";
import { auditLogs, emailOutbox, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { brand } from "@shared/config/brand";
import { theme } from "@shared/config/theme";
import { industry } from "@shared/config/industry";
import { t as emailT } from "./email-i18n";
import QRCode from "qrcode";

function getSiteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return `https://${brand.domain}`;
}

let resendClient: any = null;
let apiKeyWarningLogged = false;

async function getResendClient() {
  if (resendClient) return resendClient;
  if (!process.env.RESEND_API_KEY) {
    if (!apiKeyWarningLogged) {
      console.warn("[EMAIL] WARNING: RESEND_API_KEY not set — emails are sandbox/outbox only");
      apiKeyWarningLogged = true;
    }
    return null;
  }
  try {
    const { Resend } = await import("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
    return resendClient;
  } catch (err) {
    console.error("[EMAIL] Failed to initialize Resend:", err);
    return null;
  }
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  template: string;
  payload?: Record<string, any>;
  actorUserId?: number;
  attachments?: EmailAttachment[];
}

async function logEmailSend(options: EmailOptions) {
  try {
    await db.insert(auditLogs).values({
      actorUserId: options.actorUserId || null,
      action: "email_sent",
      entity: "email",
      entityId: "0",
      metadata: {
        to: options.to,
        subject: options.subject,
        template: options.template,
      },
    });
  } catch (err) {
    console.error("Failed to log email send:", err);
  }
}

async function writeToOutbox(options: EmailOptions): Promise<number | null> {
  try {
    const [row] = await db.insert(emailOutbox).values({
      to: options.to,
      subject: options.subject,
      template: options.template,
      payload: options.payload || {},
      html: options.html,
      providerStatus: "queued",
    }).returning({ id: emailOutbox.id });
    return row?.id ?? null;
  } catch (err) {
    console.error("Failed to write to email outbox:", err);
    return null;
  }
}

async function updateOutboxDelivery(outboxId: number, update: { providerStatus?: string; providerMessageId?: string; lastError?: string }) {
  try {
    await db.update(emailOutbox).set(update).where(eq(emailOutbox.id, outboxId));
  } catch (err) {
    console.error("Failed to update email outbox delivery:", err);
  }
}

const FROM_EMAIL = brand.emails.from;

// Dev/test safety valve: when EMAIL_OVERRIDE is set (e.g. peter+miramar@scaled.services),
// ALL outgoing mail is rerouted to that address instead of real recipients, with the
// original recipient preserved in the subject line. Leave unset in production.
const EMAIL_OVERRIDE = process.env.EMAIL_OVERRIDE?.trim();

async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (EMAIL_OVERRIDE) {
    options = {
      ...options,
      to: EMAIL_OVERRIDE,
      subject: `[TEST → ${options.to}] ${options.subject}`,
      payload: { ...options.payload, emailOverride: true, originalRecipient: options.to },
    };
    console.log(`[EMAIL] EMAIL_OVERRIDE active — rerouting to ${EMAIL_OVERRIDE}`);
  }
  console.log(`[EMAIL] To: ${options.to} | Subject: ${options.subject}`);
  const outboxId = await writeToOutbox(options);
  await logEmailSend(options);

  const resend = await getResendClient();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });
      if (result.error) {
        console.error(`[EMAIL] Resend error:`, result.error);
        if (outboxId) {
          await updateOutboxDelivery(outboxId, {
            providerStatus: "failed",
            lastError: typeof result.error === "string" ? result.error : JSON.stringify(result.error),
          });
        }
        return false;
      }
      console.log(`[EMAIL] Sent via Resend: ${result.data?.id}`);
      if (outboxId) {
        await updateOutboxDelivery(outboxId, {
          providerStatus: "sent",
          providerMessageId: result.data?.id || null,
        });
      }
      return true;
    } catch (err) {
      console.error(`[EMAIL] Resend send failed:`, err);
      if (outboxId) {
        await updateOutboxDelivery(outboxId, {
          providerStatus: "error",
          lastError: err instanceof Error ? err.message : String(err),
        });
      }
      return false;
    }
  } else {
    if (outboxId) {
      await updateOutboxDelivery(outboxId, { providerStatus: "outbox_only" });
    }
    console.log(`[EMAIL] (No email provider configured — logged to outbox only)`);
    return true;
  }
}

function getLogoUrl(): string {
  // Email header is a dark band — use the dark-background logo variant.
  return `${getSiteUrl()}${brand.logo.fullDark}`;
}

function getBrandHeader(): string {
  return `
<div style="background-color: ${theme.email.headerBg}; padding: 24px 20px; text-align: center;">
  <img src="${getLogoUrl()}" alt="${brand.name}" style="height: 48px; width: auto;" />
  <p style="color: ${theme.email.headerText}; margin: 8px 0 0; font-size: 12px; letter-spacing: 0.5px;">${brand.tagline}</p>
</div>`;
}

const footerStrings: Record<string, { questions: string; programs: string }> = {
  en: {
    questions: "Questions?",
    programs: `${industry.regulatory.body}-aligned training &amp; certification programs`,
  },
  es: {
    questions: "¿Preguntas?",
    programs: `Programas de capacitación y certificación alineados con ${industry.regulatory.body}`,
  },
};

function getBrandFooter(locale: string = "en"): string {
  const ft = footerStrings[locale] || footerStrings.en;
  return `
<div style="background-color: ${theme.email.footerBg}; border-top: 3px solid ${theme.email.footerBorder}; padding: 24px 20px; text-align: center; font-size: 12px; color: ${theme.email.footerText};">
  <p style="margin: 0 0 4px;"><strong>${brand.name}</strong> | ${brand.domain}</p>
  <p style="margin: 0 0 12px;">${ft.questions} <a href="mailto:${brand.support.email}" style="color: ${theme.email.linkColor}; text-decoration: none;">${brand.support.email}</a> | ${brand.support.phone}</p>
  <p style="margin: 0; font-size: 10px; color: ${theme.email.footerSmall};">${ft.programs}</p>
</div>`;
}

const ES_PATH_MAP: Record<string, string> = {
  "/online-forklift-certification": "/es/certificacion-operador-montacargas-en-linea",
  "/book-training": "/es/reservar-capacitacion",
  "/dashboard": "/es/panel",
  "/contact": "/es/contacto",
  "/become-an-instructor": "/es/convertirse-en-instructor",
  "/reset-password": "/es/restablecer-contrasena",
  "/certifications": "/es/certificaciones",
  "/verify": "/es/verificar",
};

function localePath(locale: string, path: string): string {
  if (locale === "es") {
    return ES_PATH_MAP[path] || `/es${path}`;
  }
  return path;
}

function wrap(locale: string, body: string): string {
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:${theme.colors.background.light};"><div style="font-family: ${theme.email.bodyFont}; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">${getBrandHeader()}<div style="padding: 32px 30px;">${body}</div>${getBrandFooter(locale)}</div></body></html>`;
}

export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "welcome", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{brandName}}", brand.name),
    template: "welcome",
    payload: { userName: params.userName },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading").replace("{{userName}}", params.userName)}</h2>
      <p>${_("body").replace("{{brandName}}", brand.name).replace("{{regulatory}}", industry.regulatory.body)}</p>
      <p><strong>${_("whatNext")}</strong></p>
      <ul style="color: #4a5568; line-height: 1.8;">
        <li>${_("browseCourses")}</li>
        <li>${_("enrollTraining")}</li>
        <li>${_("trackProgress")}</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/online-forklift-certification")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendOrderReceipt(params: {
  to: string;
  orderNumber: string;
  items: { title: string; quantity: number; unitPrice: number }[];
  total: number;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "orderReceipt", key);
  const itemRows = params.items.map(i =>
    `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${i.title}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${i.unitPrice.toFixed(2)}</td></tr>`
  ).join("");

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{orderNumber}}", params.orderNumber),
    template: "order_receipt",
    payload: { orderNumber: params.orderNumber, items: params.items, total: params.total },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("body").replace("{{orderNumber}}", params.orderNumber)}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead><tr style="background: #f7f7f7;"><th style="padding: 8px; text-align: left;">${_("thItem")}</th><th style="padding: 8px; text-align: center;">${_("thQty")}</th><th style="padding: 8px; text-align: right;">${_("thPrice")}</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="font-size: 18px; font-weight: bold; color: ${theme.email.headingColor}; text-align: right;">${_("total").replace("{{total}}", params.total.toFixed(2))}</p>
      <p>${_("cta").replace("{{accentHex}}", theme.email.linkColor).replace("{{dashboardUrl}}", `${baseUrl}${localePath(loc, "/dashboard")}`)}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendGroupInvite(params: {
  to: string;
  inviterName: string;
  groupName: string;
  inviteToken: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const inviteUrl = `${baseUrl}/accept-invite?token=${params.inviteToken}`;
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "groupInvite", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{groupName}}", params.groupName).replace("{{brandName}}", brand.name),
    template: "group_invite",
    payload: { inviterName: params.inviterName, groupName: params.groupName, inviteToken: params.inviteToken, inviteUrl },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("body").replace("{{inviterName}}", params.inviterName).replace("{{groupName}}", params.groupName)}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: #999; font-size: 12px;">${_("footer")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendCertificationEmail(params: {
  to: string;
  userName: string;
  courseName: string;
  certificateNumber: string;
  certificationId: number;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const certUrl = `${baseUrl}${localePath(loc, "/certifications")}/${params.certificationId}`;
  const verifyUrl = `${baseUrl}${localePath(loc, "/verify")}/${params.certificateNumber}`;
  const _ = (key: string) => emailT(loc, "certification", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{courseName}}", params.courseName),
    template: "certification",
    payload: { userName: params.userName, courseName: params.courseName, certificateNumber: params.certificateNumber, certificationId: params.certificationId, certUrl, verifyUrl },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading").replace("{{userName}}", params.userName)}</h2>
      <p>${_("body").replace("{{courseName}}", params.courseName)}</p>
      <p><strong>${_("certNumber")}</strong> ${params.certificateNumber}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${certUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p>${_("shareVerify")} <a href="${verifyUrl}" style="color: ${theme.email.linkColor};">${verifyUrl}</a></p>
      <p style="color: #999; font-size: 12px;">${_("pdfNote")}</p>
      <div style="background: ${theme.colors.background.light}; border-left: 4px solid ${theme.colors.primary.hex}; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #4a5568; font-size: 13px;">${_("instructorCta")} <a href="${baseUrl}${localePath(loc, "/become-an-instructor")}" style="color: ${theme.email.linkColor}; text-decoration: none;">${_("learnMore")}</a></p>
      </div>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendCardOrderReceipt(params: {
  to: string;
  certNumber: string;
  shippingMethod: string;
  shippingCost: number;
  totalAmount: number;
  actorUserId?: number;
  locale?: string;
}) {
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "cardOrderReceipt", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{certNumber}}", params.certNumber),
    template: "card_order_receipt",
    payload: { certNumber: params.certNumber, shippingMethod: params.shippingMethod, shippingCost: params.shippingCost, totalAmount: params.totalAmount },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("body")}</p>
      <p><strong>${_("certificate")}</strong> ${params.certNumber}</p>
      <p><strong>${_("shipping")}</strong> ${params.shippingMethod} ($${params.shippingCost.toFixed(2)})</p>
      <p><strong>${_("total")}</strong> $${params.totalAmount.toFixed(2)}</p>
      <p>${_("trackingNote")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendShippingNotification(params: {
  to: string;
  trackingNumber: string;
  carrier: string;
  actorUserId?: number;
  locale?: string;
}) {
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "shippingNotification", key);

  return sendEmail({
    to: params.to,
    subject: _("subject"),
    template: "shipping_notification",
    payload: { trackingNumber: params.trackingNumber, carrier: params.carrier },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("body")}</p>
      <p><strong>${_("carrier")}</strong> ${params.carrier}</p>
      <p><strong>${_("trackingNumber")}</strong> ${params.trackingNumber}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  token: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const resetUrl = `${baseUrl}${localePath(loc, "/reset-password")}?token=${params.token}`;
  const _ = (key: string) => emailT(loc, "passwordReset", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{brandName}}", brand.name),
    template: "password_reset",
    payload: { token: params.token, resetUrl },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("body")}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: #999; font-size: 12px;">${_("footer")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendTrainingReminder(params: {
  to: string;
  memberName: string;
  courseName: string;
  progressPct: number;
  groupName: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "trainingReminder", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{courseName}}", params.courseName),
    template: "training_reminder",
    payload: { memberName: params.memberName, courseName: params.courseName, progressPct: params.progressPct, groupName: params.groupName },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("greeting").replace("{{memberName}}", params.memberName)}</p>
      <p>${_("body").replace("{{groupName}}", params.groupName)}</p>
      <p><strong>${_("course")}</strong> ${params.courseName}</p>
      <p><strong>${_("progress")}</strong> ${_("progressValue").replace("{{pct}}", String(params.progressPct))}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/dashboard")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: #999; font-size: 12px;">${_("footer").replace("{{regulatory}}", industry.regulatory.body)}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendBookingConfirmation(params: {
  to: string;
  bookingNumber: string;
  trainingType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  onsiteAddress: string;
  participantCount: number;
  totalPrice: number;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();

  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "bookingConfirmation", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{bookingNumber}}", params.bookingNumber),
    template: "booking_confirmation",
    payload: {
      bookingNumber: params.bookingNumber,
      trainingType: params.trainingType,
      sessionDate: params.sessionDate,
      startTime: params.startTime,
      endTime: params.endTime,
      onsiteAddress: params.onsiteAddress,
      participantCount: params.participantCount,
      totalPrice: params.totalPrice,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("body")}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("bookingNumber")}</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.bookingNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("trainingType")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("date")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.sessionDate}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("time")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.startTime} - ${params.endTime}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("location")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.onsiteAddress}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("participants")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.participantCount}</td></tr>
        <tr><td style="padding: 8px; color: ${theme.colors.text.muted};">${_("totalPrice")}</td><td style="padding: 8px; font-weight: bold; font-size: 18px; color: ${theme.email.headingColor};">$${params.totalPrice.toFixed(2)}</td></tr>
      </table>
      <div style="background: ${theme.colors.background.light}; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px; font-weight: bold; color: ${theme.email.headingColor};">${_("cancellationPolicy")}</p>
        <p style="margin: 0; color: #4a5568; font-size: 13px;">${_("cancellationText").replace("{{supportEmail}}", brand.support.email)}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/dashboard")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendBookingAdminNotification(params: {
  bookingNumber: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  trainingType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  participantCount: number;
  specialRequests?: string | null;
  actorUserId?: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || `admin@${brand.domain}`;
  const baseUrl = getSiteUrl();
  const loc = "en";

  const specialRequestsRow = params.specialRequests
    ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Special Requests</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.specialRequests}</td></tr>`
    : "";

  return sendEmail({
    to: adminEmail,
    subject: `New Booking - ${params.bookingNumber} | ${params.contactName}`,
    template: "booking_admin_notification",
    payload: {
      bookingNumber: params.bookingNumber,
      contactName: params.contactName,
      contactPhone: params.contactPhone,
      contactEmail: params.contactEmail,
      trainingType: params.trainingType,
      sessionDate: params.sessionDate,
      startTime: params.startTime,
      endTime: params.endTime,
      customerAddress: params.customerAddress,
      customerCity: params.customerCity,
      customerState: params.customerState,
      customerZip: params.customerZip,
      participantCount: params.participantCount,
      specialRequests: params.specialRequests,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">New Training Booking</h2>
      <p>A new on-site training session has been booked. Review the details below:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Booking Number</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.bookingNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Customer Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.contactName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.contactPhone}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${params.contactEmail}" style="color: ${theme.email.linkColor};">${params.contactEmail}</a></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Training Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.sessionDate}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Time</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.startTime} - ${params.endTime}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Address</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.customerAddress}<br>${params.customerCity}, ${params.customerState} ${params.customerZip}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Participants</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.participantCount}</td></tr>
        ${specialRequestsRow}
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/admin/bookings" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Manage Bookings</a>
      </div>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendBookingCancellation(params: {
  to: string;
  bookingNumber: string;
  trainingType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "bookingCancellation", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{bookingNumber}}", params.bookingNumber),
    template: "booking_cancellation",
    payload: {
      bookingNumber: params.bookingNumber,
      trainingType: params.trainingType,
      sessionDate: params.sessionDate,
      startTime: params.startTime,
      endTime: params.endTime,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("body")}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${emailT(loc, "bookingConfirmation", "bookingNumber")}</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.bookingNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${emailT(loc, "bookingConfirmation", "trainingType")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${emailT(loc, "bookingConfirmation", "date")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.sessionDate}</td></tr>
        <tr><td style="padding: 8px; color: ${theme.colors.text.muted};">${emailT(loc, "bookingConfirmation", "time")}</td><td style="padding: 8px;">${params.startTime} - ${params.endTime}</td></tr>
      </table>
      <p>${_("refundNote")}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/book-training")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

const VALID_NOTIFICATION_TYPES = ["booking_new", "booking_cancelled", "order_new", "contact_form"] as const;
type NotificationType = typeof VALID_NOTIFICATION_TYPES[number];

function parseNotificationPreferences(prefs: unknown): Record<NotificationType, boolean> {
  const defaults: Record<NotificationType, boolean> = {
    booking_new: false,
    booking_cancelled: false,
    order_new: false,
    contact_form: false,
  };
  if (!prefs || typeof prefs !== "object") return defaults;
  const p = prefs as Record<string, unknown>;
  for (const key of VALID_NOTIFICATION_TYPES) {
    if (typeof p[key] === "boolean") {
      defaults[key] = p[key] as boolean;
    }
  }
  return defaults;
}

async function getAdminEmails(notificationType: NotificationType): Promise<string[]> {
  try {
    const admins = await db.select({ email: users.email, prefs: users.notificationPreferences })
      .from(users)
      .where(eq(users.role, 'super_admin'));

    const recipients = admins
      .filter(a => {
        const parsed = parseNotificationPreferences(a.prefs);
        return parsed[notificationType] === true;
      })
      .map(a => a.email);

    if (recipients.length === 0) {
      const fallback = process.env.ADMIN_EMAIL || `admin@${brand.domain}`;
      return [fallback];
    }
    return recipients;
  } catch (err) {
    console.error("[EMAIL] Failed to fetch admin recipients:", err);
    const fallback = process.env.ADMIN_EMAIL || `admin@${brand.domain}`;
    return [fallback];
  }
}

export async function sendBookingConfirmedEmail(params: {
  to: string;
  bookingNumber: string;
  trainingType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  onsiteAddress: string;
  participantCount: number;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "bookingConfirmed", key);
  const _bc = (key: string) => emailT(loc, "bookingConfirmation", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{bookingNumber}}", params.bookingNumber),
    template: "booking_confirmed_by_admin",
    payload: params,
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("body")}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_bc("bookingNumber")}</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.bookingNumber}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_bc("trainingType")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_bc("date")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.sessionDate}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_bc("time")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.startTime} - ${params.endTime}</td></tr>
        <tr><td style="padding: 8px; color: ${theme.colors.text.muted};">${_bc("location")}</td><td style="padding: 8px;">${params.onsiteAddress}</td></tr>
      </table>
      <div style="background: ${theme.email.successBg}; border-left: 4px solid ${theme.email.successBorder}; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: ${theme.email.successText};">${_("whatToPrepare")}</p>
        <ul style="margin: 8px 0 0; color: ${theme.colors.text.dark}; font-size: 13px;">
          <li>${_("prepareArea").replace("{{participantCount}}", String(params.participantCount))}</li>
          <li>${_("prepareParticipants")}</li>
          <li>${_("prepareAttire")}</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/dashboard")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendBookingCompletedEmail(params: {
  to: string;
  bookingNumber: string;
  trainingType: string;
  sessionDate: string;
  contactName: string;
  participantCount: number;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "bookingCompleted", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{bookingNumber}}", params.bookingNumber),
    template: "booking_completed",
    payload: params,
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("greeting").replace("{{contactName}}", params.contactName)}</p>
      <p>${_("body").replace("{{brandName}}", brand.name).replace("{{sessionDate}}", params.sessionDate).replace("{{trainingType}}", params.trainingType).replace("{{participantCount}}", String(params.participantCount))}</p>
      <div style="background: ${theme.email.successBg}; border-left: 4px solid ${theme.email.successBorder}; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: ${theme.email.successText};">${_("nextSteps")}</p>
        <ul style="margin: 8px 0 0; color: ${theme.colors.text.dark}; font-size: 13px;">
          <li>${_("certsDashboard")}</li>
          <li>${_("walletCards")}</li>
          <li>${_("verifyLinks")}</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/dashboard")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("bookAnother")} <a href="${baseUrl}${localePath(loc, "/book-training")}" style="color: ${theme.email.linkColor};">${_("scheduleHere")}</a>.</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendRefundNotification(params: {
  to: string;
  orderNumber: string;
  refundAmount: number;
  actorUserId?: number;
  locale?: string;
}) {
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "refundNotification", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{orderNumber}}", params.orderNumber),
    template: "refund_notification",
    payload: params,
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("body")}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("orderNumber")}</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.orderNumber}</td></tr>
        <tr><td style="padding: 8px; color: ${theme.colors.text.muted};">${_("refundAmount")}</td><td style="padding: 8px; font-weight: bold; font-size: 18px; color: ${theme.colors.green.hex};">$${params.refundAmount.toFixed(2)}</td></tr>
      </table>
      <p>${_("note")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendCertificateRevokedNotification(params: {
  to: string;
  certificateNumber: string;
  courseName: string;
  actorUserId?: number;
  locale?: string;
}) {
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "certRevoked", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{certificateNumber}}", params.certificateNumber),
    template: "certificate_revoked",
    payload: params,
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("body").replace("{{courseName}}", params.courseName).replace("{{certificateNumber}}", params.certificateNumber)}</p>
      <p>${_("note")}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:${brand.support.email}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendSeatAssignedNotification(params: {
  to: string;
  memberName: string;
  courseName: string;
  groupName: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "seatAssigned", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{courseName}}", params.courseName),
    template: "seat_assigned",
    payload: params,
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("greeting").replace("{{memberName}}", params.memberName)}</p>
      <p>${_("body").replace("{{courseName}}", params.courseName).replace("{{groupName}}", params.groupName)}</p>
      <p>${_("startNow")}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/dashboard")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer").replace("{{regulatory}}", industry.regulatory.body)}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendContactFormAdminAlert(params: {
  name: string;
  email: string;
  phone?: string;
  trainingType: string;
  message: string;
}) {
  const recipients = await getAdminEmails("contact_form");
  const baseUrl = getSiteUrl();
  const loc = "en";

  for (const to of recipients) {
    await sendEmail({
      to,
      subject: `Contact Form: ${params.name} — ${params.trainingType}`,
      template: "contact_form_admin",
      payload: params,
      html: wrap(loc, `
        <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Name</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${params.email}" style="color: ${theme.email.linkColor};">${params.email}</a></td></tr>
          ${params.phone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.phone}</td></tr>` : ""}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Training Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
          <tr><td style="padding: 8px; color: ${theme.colors.text.muted}; vertical-align: top;">Message</td><td style="padding: 8px;">${params.message}</td></tr>
        </table>
        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${params.email}?subject=Re: Your ${brand.name} Inquiry" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reply to ${params.name}</a>
        </div>
      `),
    });
  }
}

export async function sendNewOrderAdminAlert(params: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: { title: string; quantity: number; unitPrice: number }[];
  total: number;
}) {
  const recipients = await getAdminEmails("order_new");
  const baseUrl = getSiteUrl();
  const loc = "en";

  const itemRows = params.items.map(i =>
    `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${i.title}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${i.unitPrice.toFixed(2)}</td></tr>`
  ).join("");

  for (const to of recipients) {
    await sendEmail({
      to,
      subject: `New Order - ${params.orderNumber} | ${params.customerName}`,
      template: "order_admin_alert",
      payload: params,
      html: wrap(loc, `
        <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">New Order Received</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Order Number</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.orderNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Customer</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.customerName} (<a href="mailto:${params.customerEmail}" style="color: ${theme.email.linkColor};">${params.customerEmail}</a>)</td></tr>
        </table>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead><tr style="background: #f7f7f7;"><th style="padding: 8px; text-align: left;">Item</th><th style="padding: 8px; text-align: center;">Qty</th><th style="padding: 8px; text-align: right;">Price</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="font-size: 18px; font-weight: bold; color: ${theme.email.headingColor}; text-align: right;">Total: $${params.total.toFixed(2)}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/admin/orders" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Manage Orders</a>
        </div>
      `),
    });
  }
}

export async function sendBookingAdminNotificationToAll(params: {
  bookingNumber: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  trainingType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  participantCount: number;
  specialRequests?: string | null;
  actorUserId?: number;
}) {
  const recipients = await getAdminEmails("booking_new");
  const baseUrl = getSiteUrl();
  const loc = "en";

  const specialRequestsRow = params.specialRequests
    ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Special Requests</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.specialRequests}</td></tr>`
    : "";

  for (const to of recipients) {
    await sendEmail({
      to,
      subject: `New Booking - ${params.bookingNumber} | ${params.contactName}`,
      template: "booking_admin_notification",
      payload: params,
      html: wrap(loc, `
        <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">New Training Booking</h2>
        <p>A new on-site training session has been booked. Review the details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Booking Number</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.bookingNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Customer Name</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.contactName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.contactPhone}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${params.contactEmail}" style="color: ${theme.email.linkColor};">${params.contactEmail}</a></td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Training Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.sessionDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Time</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.startTime} - ${params.endTime}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Address</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.customerAddress}<br>${params.customerCity}, ${params.customerState} ${params.customerZip}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Participants</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.participantCount}</td></tr>
          ${specialRequestsRow}
        </table>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/admin/bookings" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Manage Bookings</a>
        </div>
      `),
      actorUserId: params.actorUserId,
    });
  }
}

export async function sendBookingCancellationAdminAlert(params: {
  bookingNumber: string;
  contactName: string;
  trainingType: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  participantCount: number;
  cancelledBy: string;
  actorUserId?: number;
}) {
  const recipients = await getAdminEmails("booking_cancelled");
  const baseUrl = getSiteUrl();
  const loc = "en";

  for (const to of recipients) {
    await sendEmail({
      to,
      subject: `Booking Cancelled - ${params.bookingNumber} | ${params.contactName}`,
      template: "booking_cancellation_admin",
      payload: params,
      html: wrap(loc, `
        <h2 style="color: #c53030; font-family: ${theme.email.headingFont}; margin-top: 0;">Booking Cancelled</h2>
        <p>A training booking has been cancelled:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Booking Number</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.bookingNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Customer</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.contactName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Training</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.sessionDate} (${params.startTime} - ${params.endTime})</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Participants</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.participantCount}</td></tr>
          <tr><td style="padding: 8px; color: ${theme.colors.text.muted};">Cancelled By</td><td style="padding: 8px;">${params.cancelledBy}</td></tr>
        </table>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${baseUrl}/admin/bookings" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Bookings</a>
        </div>
      `),
      actorUserId: params.actorUserId,
    });
  }
}

export async function sendOnsiteRequestCustomerConfirmation(params: {
  to: string;
  contactName: string;
  companyName?: string;
  trainingType: string;
  traineeCount: number;
  city: string;
  state: string;
  preferredDate1?: string;
  preferredDate2?: string;
  preferredDate3?: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "onsiteConfirmation", key);
  const dateRows = [params.preferredDate1, params.preferredDate2, params.preferredDate3]
    .filter(Boolean)
    .map((d, i) => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("preferredDate").replace("{{n}}", String(i + 1))}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d}</td></tr>`)
    .join("");

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{brandName}}", brand.name),
    template: "onsite_request_confirmation",
    payload: {
      contactName: params.contactName,
      companyName: params.companyName,
      trainingType: params.trainingType,
      traineeCount: params.traineeCount,
      city: params.city,
      state: params.state,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("greeting").replace("{{contactName}}", params.contactName)}</p>
      <p>${_("body")}</p>
      <h3 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 24px;">${_("summary")}</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${params.companyName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("company")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.companyName}</td></tr>` : ""}
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("trainingType")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("trainees")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.traineeCount}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("trainingLocation")}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.city}, ${params.state}</td></tr>
        ${dateRows}
      </table>
      <div style="background: ${theme.email.successBg}; border-left: 4px solid ${theme.email.successBorder}; padding: 16px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; color: ${theme.email.successText}; font-weight: 500;">${_("whatNext")}</p>
        <p style="margin: 8px 0 0; color: ${theme.colors.text.dark}; font-size: 14px;">${_("whatNextText").replace("{{email}}", params.to)}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/contact")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("urgentNote")}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendOnsiteRequestAdminAlert(params: {
  requestId: number;
  contactName: string;
  companyName?: string;
  email: string;
  phone: string;
  trainingAddress: string;
  city: string;
  state: string;
  zip: string;
  traineeCount: number;
  preferredDate1?: string;
  preferredDate2?: string;
  preferredDate3?: string;
  equipmentTypes: string[];
  trainingType: string;
  notes?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || `admin@${brand.domain}`;
  const baseUrl = getSiteUrl();
  const loc = "en";

  const dateRows = [params.preferredDate1, params.preferredDate2, params.preferredDate3]
    .filter(Boolean)
    .map((d, i) => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Preferred Date ${i + 1}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${d}</td></tr>`)
    .join("");

  return sendEmail({
    to: adminEmail,
    subject: `New On-Site Training Request #${params.requestId} | ${params.contactName}${params.companyName ? ` (${params.companyName})` : ""}`,
    template: "onsite_request_admin_alert",
    payload: {
      requestId: params.requestId,
      contactName: params.contactName,
      companyName: params.companyName,
      email: params.email,
      phone: params.phone,
      trainingAddress: params.trainingAddress,
      city: params.city,
      state: params.state,
      zip: params.zip,
      traineeCount: params.traineeCount,
      equipmentTypes: params.equipmentTypes,
      trainingType: params.trainingType,
      notes: params.notes,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">New On-Site Training Request</h2>
      <p>A new on-site training request has been submitted. Review and follow up with the customer:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Request #</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">#${params.requestId}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Contact</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.contactName}</td></tr>
        ${params.companyName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.companyName}</td></tr>` : ""}
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${params.email}" style="color: ${theme.email.linkColor};">${params.email}</a></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${params.phone}" style="color: ${theme.email.linkColor};">${params.phone}</a></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Training Address</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingAddress}, ${params.city}, ${params.state} ${params.zip}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Training Type</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.trainingType}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Trainees</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.traineeCount}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Equipment Types</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.equipmentTypes.join(", ") || "Not specified"}</td></tr>
        ${dateRows}
        ${params.notes ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted}; vertical-align: top;">Notes</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.notes}</td></tr>` : ""}
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/admin/onsite-requests/${params.requestId}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Request in Admin</a>
      </div>
    `),
  });
}

export async function sendInstructorApplicationConfirmation(params: {
  to: string;
  applicantName: string;
  actorUserId?: number;
  locale?: string;
}) {
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "instructorAppConfirmation", key);

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{brandName}}", brand.name),
    template: "instructor_application_confirmation",
    payload: { applicantName: params.applicantName },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("greeting").replace("{{applicantName}}", params.applicantName)}</p>
      <p>${_("body").replace("{{brandName}}", brand.name)}</p>
      <div style="background: ${theme.colors.background.light}; border-left: 4px solid ${theme.colors.accent.hex}; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #4a5568; font-size: 14px;"><strong>${_("whatNext")}</strong></p>
        <ul style="color: #4a5568; font-size: 14px; margin: 8px 0 0; padding-left: 20px;">
          <li>${_("reviewQualifications")}</li>
          <li>${_("mayReachOut")}</li>
          <li>${_("decisionTimeline")}</li>
        </ul>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer")} <a href="mailto:${brand.support.email}" style="color: ${theme.email.linkColor};">${brand.support.email}</a>.</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendInstructorApplicationAdminAlert(params: {
  applicantName: string;
  applicantEmail: string;
  city: string;
  state: string;
  yearsExperience: number;
  applicationId: number;
  actorUserId?: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL || `admin@${brand.domain}`;
  const baseUrl = getSiteUrl();
  const loc = "en";

  return sendEmail({
    to: adminEmail,
    subject: `New Instructor Application - ${params.applicantName}`,
    template: "instructor_application_admin_alert",
    payload: {
      applicantName: params.applicantName,
      applicantEmail: params.applicantEmail,
      city: params.city,
      state: params.state,
      yearsExperience: params.yearsExperience,
      applicationId: params.applicationId,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">New Instructor Application</h2>
      <p>A certified graduate has applied to join the instructor network.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Applicant</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${params.applicantName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${params.applicantEmail}" style="color: ${theme.email.linkColor};">${params.applicantEmail}</a></td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Location</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.city}, ${params.state}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Experience</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.yearsExperience} years</td></tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/admin/instructor-applications/${params.applicationId}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review Application</a>
      </div>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendInstructorAssignmentNotification(params: {
  instructorEmail: string;
  instructorName: string;
  requestId: number;
  companyName: string | null;
  city: string;
  state: string;
  trainingType: string;
  preferredDates: string[];
  actorUserId?: number;
}) {
  const baseUrl = getSiteUrl();
  const loc = "en";
  const datesList = params.preferredDates.length > 0
    ? params.preferredDates.map(d => `<li>${d}</li>`).join("")
    : "<li>Flexible / TBD</li>";

  return sendEmail({
    to: params.instructorEmail,
    subject: `New Training Assignment - ${params.companyName || "On-Site Request"} in ${params.city}, ${params.state}`,
    template: "instructor_assignment",
    payload: { requestId: params.requestId, instructorName: params.instructorName },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">New Training Assignment</h2>
      <p>Hi ${params.instructorName},</p>
      <p>You've been proposed for an on-site training assignment. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted}; width: 140px;">Training Type</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${params.trainingType}</td></tr>
        ${params.companyName ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Company</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${params.companyName}</td></tr>` : ""}
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Location</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${params.city}, ${params.state}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Preferred Dates</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><ul style="margin: 0; padding-left: 16px;">${datesList}</ul></td></tr>
      </table>
      <p>An admin will follow up with more details. Please log in to your dashboard for full information.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/dashboard")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Dashboard</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">If you have questions or need to decline, please contact us at ${brand.support.email}.</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendAssignmentAdminAlert(params: {
  instructorName: string;
  requestId: number;
  companyName: string | null;
  city: string;
  state: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  actorUserId?: number;
}) {
  const baseUrl = getSiteUrl();
  const loc = "en";
  const recipients = await getAdminEmailsFallback();

  const html = wrap(loc, `
    <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">Instructor Assignment Update</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted}; width: 140px;">Action</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${params.action}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Instructor</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${params.instructorName}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Request</td><td style="padding: 8px; border-bottom: 1px solid #eee;">#${params.requestId} — ${params.companyName || "On-site Training"} (${params.city}, ${params.state})</td></tr>
      ${params.previousStatus && params.newStatus ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">Status Change</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.previousStatus} → ${params.newStatus}</td></tr>` : ""}
    </table>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${baseUrl}/admin/onsite-requests/${params.requestId}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Request</a>
    </div>
  `);

  await Promise.all(recipients.map(to =>
    sendEmail({
      to,
      subject: `Instructor Assignment Update - ${params.action} (Request #${params.requestId})`,
      template: "assignment_admin_alert",
      payload: { requestId: params.requestId, instructorName: params.instructorName, action: params.action },
      html,
      actorUserId: params.actorUserId,
    })
  ));
}

async function getAdminEmailsFallback(): Promise<string[]> {
  try {
    const admins = await db.select({ email: users.email })
      .from(users)
      .where(eq(users.role, 'super_admin'));
    if (admins.length > 0) return admins.map(a => a.email);
  } catch (err) {
    console.error("[EMAIL] Failed to fetch admin recipients:", err);
  }
  return [process.env.ADMIN_EMAIL || `admin@${brand.domain}`];
}

export async function sendAbandonedCheckoutReminder(params: {
  to: string;
  orderNumber: string;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const _ = (key: string) => emailT(loc, "abandonedCheckout", key);

  return sendEmail({
    to: params.to,
    subject: _("subject"),
    template: "abandoned_checkout",
    payload: { orderNumber: params.orderNumber },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont};">${_("heading")}</h2>
      <p>${_("body").replace("{{orderNumber}}", params.orderNumber)}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}${localePath(loc, "/dashboard")}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: #999; font-size: 12px;">${_("footer").replace("{{regulatory}}", industry.regulatory.body)}</p>
    `),
    actorUserId: params.actorUserId,
  });
}


export async function sendBalanceDueEmail(params: {
  to: string;
  contactName: string;
  bookingNumber: string;
  bookingId: number;
  balanceDue: number;
  actorUserId?: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const es = (params.locale || "en") === "es";
  const payUrl = `${baseUrl}${es ? "/es" : "/en"}/pay-balance/${params.bookingId}`;

  return sendEmail({
    to: params.to,
    subject: es
      ? `Saldo pendiente - Reserva ${params.bookingNumber}`
      : `Balance Due - Booking ${params.bookingNumber}`,
    template: "balance_due",
    payload: { bookingNumber: params.bookingNumber, balanceDue: params.balanceDue },
    html: wrap(params.locale || "en", `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${es ? "Saldo Pendiente de su Capacitación" : "Your Training Balance Is Due"}</h2>
      <p>${es ? `Hola ${params.contactName},` : `Hi ${params.contactName},`}</p>
      <p>${es
        ? `Gracias por capacitarse con nosotros. El saldo restante de su reserva <strong>${params.bookingNumber}</strong> es:`
        : `Thank you for training with us. The remaining balance for your booking <strong>${params.bookingNumber}</strong> is:`}</p>
      <p style="font-size: 26px; font-weight: bold; color: ${theme.email.headingColor}; text-align: center; margin: 24px 0;">$${params.balanceDue.toFixed(2)}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${es ? "Pagar Saldo en Línea" : "Pay Balance Online"}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${es
        ? `¿Preguntas? Llámenos al ${brand.support.phone}.`
        : `Questions? Call us at ${brand.support.phone}.`}</p>
    `),
    actorUserId: params.actorUserId,
  });
}

export async function sendBalanceReminderEmail(params: {
  to: string;
  contactName: string;
  bookingNumber: string;
  bookingId: number;
  balanceDue: number;
  sessionDate: string; // "YYYY-MM-DD" from the bookings.session_date date column
  reminderDay: number; // days after booking creation (3 / 7 / 14)
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const es = loc === "es";
  const _ = (key: string) => emailT(loc, "balanceReminder", key);
  // Same customer pay-balance URL that sendBalanceDueEmail builds for the
  // admin "send balance link" action in server/routes/services.ts.
  const payUrl = `${baseUrl}${es ? "/es" : "/en"}/pay-balance/${params.bookingId}`;
  const sessionDateDisplay = (() => {
    try {
      return new Date(`${params.sessionDate}T00:00:00`).toLocaleDateString(es ? "es-US" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return params.sessionDate;
    }
  })();

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{bookingNumber}}", params.bookingNumber),
    // The template key + payload below are the dedupe source of truth for the
    // balance-reminders job (server/jobs/balance-reminders.ts): it checks the
    // email_outbox table for a row with this template, bookingId and
    // reminderDay before sending. Do not remove these payload fields.
    template: "balance_reminder",
    payload: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      reminderDay: params.reminderDay,
      balanceDue: params.balanceDue,
      sessionDate: params.sessionDate,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("greeting").replace("{{contactName}}", params.contactName)}</p>
      <p>${_("body").replace("{{brandName}}", brand.name)}</p>
      <p style="font-size: 26px; font-weight: bold; color: ${theme.email.headingColor}; text-align: center; margin: 24px 0 8px;">$${params.balanceDue.toFixed(2)}</p>
      <p style="text-align: center; color: ${theme.colors.text.muted}; font-size: 13px; margin: 0 0 24px;">${_("amountDue")}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("bookingNumber")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${params.bookingNumber}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("sessionDate")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${sessionDateDisplay}</strong></td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${payUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p>${_("payNote")}</p>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer").replace("{{phone}}", brand.support.phone)}</p>
    `),
  });
}

export async function sendRecertReminderEmail(params: {
  to: string;
  certHolderName: string;
  certificateNumber: string;
  courseName: string;
  expiresAt: Date; // expiry date from certifications.expires_at
  certId: number;
  reminderDay: number; // days before expiry (90 / 60 / 30)
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const es = loc === "es";
  const _ = (key: string) => emailT(loc, "recertReminder", key);
  // Renewal page is the primary rebook destination for expiring certs.
  const renewUrl = `${baseUrl}${es ? "/es" : "/en"}/renewal`;
  const expiryDateDisplay = (() => {
    try {
      return new Date(params.expiresAt).toLocaleDateString(es ? "es-US" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return params.expiresAt.toISOString().split("T")[0];
    }
  })();

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{days}}", String(params.reminderDay)),
    // The template key + payload below are the dedupe source of truth for the
    // recert-reminders job (server/jobs/recert-reminders.ts): it checks the
    // email_outbox table for a row with this template, certId and
    // reminderDay before sending. Do not remove these payload fields.
    template: "recert_reminder",
    payload: {
      certId: params.certId,
      certificateNumber: params.certificateNumber,
      reminderDay: params.reminderDay,
      expiresAt: params.expiresAt.toISOString(),
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("greeting").replace("{{certHolderName}}", params.certHolderName)}</p>
      <p>${_("body").replace("{{brandName}}", brand.name).replace("{{regulatory}}", industry.regulatory.body)}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("certificateNumber")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${params.certificateNumber}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("courseName")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${params.courseName}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("expiryDate")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${expiryDateDisplay}</strong></td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${renewUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p>${_("renewNote")}</p>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer").replace("{{phone}}", brand.support.phone)}</p>
    `),
  });
}

export async function sendReviewRequestEmail(params: {
  to: string;
  contactName: string;
  bookingNumber: string;
  bookingId: number;
  sessionDate: string; // "YYYY-MM-DD" from the bookings.session_date date column
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const es = loc === "es";
  const _ = (key: string) => emailT(loc, "reviewRequest", key);

  // Review URL from env var; fall back to /contact page if not set.
  const reviewUrl = process.env.GOOGLE_REVIEW_URL || `${baseUrl}${es ? "/es" : "/en"}${es ? "/contacto" : "/contact"}`;

  // Generate QR code as a data URL — large enough to scan from a phone screen.
  // width=300 produces a ~300x300 PNG; margin=2 keeps a quiet zone without
  // excessive whitespace.
  const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#4f3b3b", // brand brown
      light: "#ffffff",
    },
  });

  const sessionDateDisplay = (() => {
    try {
      return new Date(`${params.sessionDate}T00:00:00`).toLocaleDateString(es ? "es-US" : "en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return params.sessionDate;
    }
  })();

  return sendEmail({
    to: params.to,
    subject: _("subject").replace("{{brandName}}", brand.name),
    // The template key + payload below are the dedupe source of truth for the
    // review-requests job (server/jobs/review-requests.ts): it checks the
    // email_outbox table for a row with this template and bookingId before
    // sending. Do not remove these payload fields.
    template: "review_request",
    payload: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      sessionDate: params.sessionDate,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("greeting").replace("{{contactName}}", params.contactName)}</p>
      <p>${_("body").replace("{{brandName}}", brand.name).replace("{{sessionDate}}", sessionDateDisplay)}</p>
      <p>${_("scanCta")}</p>
      <div style="text-align: center; margin: 24px 0;">
        <img src="${qrDataUrl}" alt="Google Review QR Code" style="width: 220px; height: 220px; border: 1px solid #eee; border-radius: 8px; padding: 8px;" />
      </div>
      <p style="text-align: center; color: ${theme.colors.text.muted}; font-size: 13px; margin: 0 0 16px;">${_("orClick")}</p>
      <div style="text-align: center; margin: 16px 0 24px;">
        <a href="${reviewUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer")}</p>
    `),
  });
}

export async function sendRouteFillAlertEmail(params: {
  to: string;
  bookingNumber: string;
  bookingId: number;
  sessionDate: string; // "YYYY-MM-DD"
  startTime: string;
  areaName: string;
  openSeats: number;
  bookedSeats: number;
  maxParticipants: number;
  locale?: string;
}) {
  const baseUrl = getSiteUrl();
  const loc = params.locale || "en";
  const es = loc === "es";
  const _ = (key: string) => emailT(loc, "routeFillAlert", key);
  const adminBookingsUrl = `${baseUrl}${es ? "/es" : "/en"}/admin/bookings`;
  const sessionDateDisplay = (() => {
    try {
      return new Date(`${params.sessionDate}T00:00:00`).toLocaleDateString(es ? "es-US" : "en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
    } catch {
      return params.sessionDate;
    }
  })();
  const sessionDateShort = (() => {
    try {
      return new Date(`${params.sessionDate}T00:00:00`).toLocaleDateString(es ? "es-US" : "en-US", {
        month: "long", day: "numeric",
      });
    } catch {
      return params.sessionDate;
    }
  })();

  return sendEmail({
    to: params.to,
    subject: _("subject")
      .replace("{{openSeats}}", String(params.openSeats))
      .replace("{{areaName}}", params.areaName)
      .replace("{{sessionDate}}", sessionDateShort),
    // The template key + payload below are the dedupe source of truth for the
    // route-fill-alerts job (server/jobs/route-fill-alerts.ts): it checks the
    // email_outbox table for a row with this template, bookingId and
    // sessionDate created today before sending. Do not remove these payload fields.
    template: "route_fill_alert",
    payload: {
      bookingId: params.bookingId,
      bookingNumber: params.bookingNumber,
      sessionDate: params.sessionDate,
      areaName: params.areaName,
      openSeats: params.openSeats,
    },
    html: wrap(loc, `
      <h2 style="color: ${theme.email.headingColor}; font-family: ${theme.email.headingFont}; margin-top: 0;">${_("heading")}</h2>
      <p>${_("greeting")}</p>
      <p style="font-size: 18px; font-weight: bold; color: ${theme.email.headingColor};">${_("body")
        .replace("{{openSeats}}", String(params.openSeats))
        .replace("{{areaName}}", params.areaName)
        .replace("{{sessionDateLong}}", sessionDateDisplay)}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("bookingNumber")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${params.bookingNumber}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("location")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${params.areaName}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("sessionDate")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${sessionDateDisplay}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("startTime")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${params.startTime}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("openSeats")}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong style="color: ${theme.colors.green.hex};">${params.openSeats}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${theme.colors.text.muted};">${_("seatsCapacity").replace("{{booked}}", String(params.bookedSeats)).replace("{{max}}", String(params.maxParticipants))}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${params.bookedSeats} / ${params.maxParticipants}</strong></td>
        </tr>
      </table>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${adminBookingsUrl}" style="background: ${theme.email.buttonBg}; color: ${theme.email.buttonText}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${_("cta")}</a>
      </div>
      <p style="color: ${theme.colors.text.muted}; font-size: 13px;">${_("footer")}</p>
    `),
  });
}

export async function sendInvoiceEmail(params: {
  to: string;
  contactName: string;
  companyName: string;
  invoiceNumber: string;
  amount: number;
  terms: string;
  dueDate: string;
  bookingNumber?: string;
  locale?: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const loc = params.locale || "en";
  const es = loc === "es";
  const _ = (key: string) => emailT(loc, "invoice", key);
  await sendEmail({
    to: params.to,
    subject: `${_("subject")} — ${params.invoiceNumber}`,
    html: await wrap({
      title: _("subject"),
      heading: _("heading"),
      bodyHtml: `
        <p>${_("greeting").replace("{name}", params.contactName)},</p>
        <p>${_("body").replace("{invoice}", params.invoiceNumber).replace("{amount}", "$" + params.amount.toFixed(2)).replace("{terms}", params.terms).replace("{due}", params.dueDate)}</p>
        ${params.bookingNumber ? `<p><strong>${_("bookingLabel")}</strong> ${params.bookingNumber}</p>` : ""}
        <p>${_("cta")}</p>
      `,
    }),
    attachments: params.attachments,
  });
}
