import { db } from "./db";
import { payments, orders, certifications, enrollments, auditLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { refundTransaction as refundAuthorizeNetTransaction } from "./authorizeNetClient";

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  rawResponse?: any;
}

/**
 * Refund an order's approved payment.
 *
 * Authorize.net is the only live payment provider. Refunds route through the
 * Authorize.net refund API (void if unsettled, refund if settled). Demo-mode
 * payments get a mock refund row. No other provider is supported.
 *
 * On success the order is marked refunded and every certification issued
 * from it is revoked (with audit log entries).
 */
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

  async function revokeOrderCertifications(refundTxnId?: string) {
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
        metadata: { orderId, transactionId, refundTransactionId: refundTxnId },
      });
    }
  }

  // Authorize.net payments must refund through Authorize.net - checked before
  // the demo fallback so a real card payment can never be "refunded" with a
  // mock entry.
  if (payment.provider === "authorize_net") {
    const anetResult = await refundAuthorizeNetTransaction(transactionId, amount, orderId);
    if (!anetResult.success) {
      return { success: false, errorMessage: anetResult.errorMessage || "Authorize.net refund failed" };
    }

    await db.insert(payments).values({
      orderId,
      provider: "authorize_net",
      providerTransactionId: anetResult.transactionId || `REFUND-${transactionId}`,
      status: "refunded",
      amount: String(amount),
      rawResponse: anetResult.rawResponse ?? { refund: true },
    });

    await db.update(orders).set({ status: "refunded", updatedAt: new Date() }).where(eq(orders.id, orderId));
    await revokeOrderCertifications(anetResult.transactionId);

    return { success: true, transactionId: anetResult.transactionId, rawResponse: anetResult.rawResponse };
  }

  if (isDemo) {
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
    await revokeOrderCertifications(mockRefundId);

    return { success: true, transactionId: mockRefundId };
  }

  return {
    success: false,
    errorMessage: `Refunds are not supported for payment provider "${payment.provider}". Only Authorize.net and demo payments can be refunded.`,
  };
}
