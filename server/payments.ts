import { db } from "./db";
import { payments, orders, webhookEvents, certifications, enrollments, auditLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { getUncachableStripeClient, isStripeConfigured } from "./stripeClient";

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  rawResponse?: any;
  clientSecret?: string;
}

export async function createPaymentIntent(
  amount: number,
  orderId: number,
  orderNumber: string
): Promise<PaymentResult> {
  const existingPayments = await db.select().from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "approved")));
  if (existingPayments.length > 0) {
    return {
      success: true,
      transactionId: existingPayments[0].providerTransactionId || "existing",
      rawResponse: { message: "Order already paid" },
    };
  }

  if (!isStripeConfigured()) {
    if (process.env.DEMO_MODE === "true") {
      const mockTxnId = `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await db.insert(payments).values({
        orderId,
        provider: "demo_sandbox",
        providerTransactionId: mockTxnId,
        status: "approved",
        amount: String(amount),
        rawResponse: { demo: true, transactionId: mockTxnId },
      });

      await db.update(orders).set({ status: "paid", updatedAt: new Date() }).where(eq(orders.id, orderId));

      return { success: true, transactionId: mockTxnId, rawResponse: { demo: true } };
    }
    return { success: false, errorMessage: "Payments not configured. Connect Stripe or enable DEMO_MODE=true." };
  }

  try {
    const stripe = await getUncachableStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: {
        orderId: String(orderId),
        orderNumber,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    await db.insert(payments).values({
      orderId,
      provider: "stripe",
      providerTransactionId: paymentIntent.id,
      status: "pending",
      amount: String(amount),
      rawResponse: { paymentIntentId: paymentIntent.id },
    });

    return {
      success: true,
      transactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
    };
  } catch (err: any) {
    await db.insert(payments).values({
      orderId,
      provider: "stripe",
      providerTransactionId: null,
      status: "error",
      amount: String(amount),
      rawResponse: { error: err.message },
    });

    return { success: false, errorMessage: err.message };
  }
}

export async function confirmPaymentCompleted(
  paymentIntentId: string,
  orderId: number
): Promise<PaymentResult> {
  try {
    const stripe = await getUncachableStripeClient();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata?.orderId && String(paymentIntent.metadata.orderId) !== String(orderId)) {
      return { success: false, errorMessage: "Payment does not match this order" };
    }

    const existingPayment = await db.select().from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.providerTransactionId, paymentIntentId)));
    if (existingPayment.length === 0) {
      return { success: false, errorMessage: "Payment record not found for this order" };
    }

    if (paymentIntent.status === "succeeded") {
      await db.update(payments).set({
        status: "approved",
        rawResponse: { paymentIntentId: paymentIntent.id, status: paymentIntent.status },
        updatedAt: new Date(),
      }).where(and(eq(payments.orderId, orderId), eq(payments.providerTransactionId, paymentIntentId)));

      await db.update(orders).set({ status: "paid", updatedAt: new Date() }).where(eq(orders.id, orderId));

      return { success: true, transactionId: paymentIntentId };
    }

    return { success: false, errorMessage: `Payment status: ${paymentIntent.status}` };
  } catch (err: any) {
    return { success: false, errorMessage: err.message };
  }
}

export async function refundTransaction(
  transactionId: string,
  amount: number,
  lastFourDigits: string,
  orderId: number
): Promise<PaymentResult> {
  const existingPayment = await db.select().from(payments)
    .where(and(eq(payments.orderId, orderId), eq(payments.status, "approved")));

  if (existingPayment.length === 0) {
    return { success: false, errorMessage: "No approved payment found for this order" };
  }

  const payment = existingPayment[0];
  const isDemo = payment.provider === "demo_sandbox";

  if (isDemo || !isStripeConfigured()) {
    const mockRefundId = `REFUND-${Date.now()}`;
    await db.insert(payments).values({
      orderId,
      provider: payment.provider || "demo_sandbox",
      providerTransactionId: mockRefundId,
      status: "refunded",
      amount: String(amount),
      rawResponse: { sandbox: true, refund: true },
    });

    await db.update(orders).set({ status: "refunded", updatedAt: new Date() }).where(eq(orders.id, orderId));

    const orderCerts = await db.select().from(certifications)
      .innerJoin(enrollments, eq(certifications.enrollmentId, enrollments.id))
      .where(eq(enrollments.orderId, orderId));

    for (const { certifications: cert } of orderCerts) {
      await db.update(certifications).set({
        status: "revoked",
        updatedAt: new Date(),
      }).where(eq(certifications.id, cert.id));

      await db.insert(auditLogs).values({
        actorUserId: null,
        action: "certification_revoked_on_refund",
        entity: "certification",
        entityId: cert.id,
        metadata: { orderId, transactionId },
      });
    }

    return { success: true, transactionId: mockRefundId };
  }

  try {
    const stripe = await getUncachableStripeClient();
    const refund = await stripe.refunds.create({
      payment_intent: transactionId,
      amount: Math.round(amount * 100),
    });

    await db.insert(payments).values({
      orderId,
      provider: "stripe",
      providerTransactionId: refund.id,
      status: "refunded",
      amount: String(amount),
      rawResponse: refund,
    });

    await db.update(orders).set({ status: "refunded", updatedAt: new Date() }).where(eq(orders.id, orderId));

    const orderCerts = await db.select().from(certifications)
      .innerJoin(enrollments, eq(certifications.enrollmentId, enrollments.id))
      .where(eq(enrollments.orderId, orderId));

    for (const { certifications: cert } of orderCerts) {
      await db.update(certifications).set({
        status: "revoked",
        updatedAt: new Date(),
      }).where(eq(certifications.id, cert.id));
    }

    return { success: true, transactionId: refund.id, rawResponse: refund };
  } catch (err: any) {
    return { success: false, errorMessage: err.message };
  }
}

export async function processWebhookEvent(eventId: string, payload: any): Promise<boolean> {
  const existing = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, eventId));
  if (existing.length > 0 && existing[0].status === "processed") {
    return true;
  }

  if (existing.length === 0) {
    await db.insert(webhookEvents).values({
      provider: "stripe",
      eventId,
      payload,
      status: "received",
    });
  }

  try {
    console.log(`[WEBHOOK] Processing event: ${eventId}`, payload?.type);
    await db.update(webhookEvents).set({
      status: "processed",
      processedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(webhookEvents.eventId, eventId));

    return true;
  } catch (err: any) {
    await db.update(webhookEvents).set({
      status: "failed",
      lastError: err.message,
      lastAttemptedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(webhookEvents.eventId, eventId));

    return false;
  }
}
