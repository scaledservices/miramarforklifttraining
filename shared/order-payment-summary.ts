// Confirmation math. amountPaid is the approved payment amount (what the card
// was actually charged). The card fee is whatever was charged beyond the
// fee-free total, so the page always matches the card statement.
/**
 * What a refund should return: everything actually charged (approved
 * payments, card fee included) minus anything already refunded.
 * Meeting 2026-10-13: refunds used order.total, which excludes the card fee.
 */
export function refundableAmount(payments: { status: string; amount: string | number }[]): number {
  let charged = 0, refunded = 0;
  for (const p of payments) {
    if (p.status === "approved") charged += Number(p.amount);
    else if (p.status === "refunded") refunded += Number(p.amount);
  }
  return Math.max(0, Number((charged - refunded).toFixed(2)));
}

export function orderPaymentSummary(i: { itemsSubtotal: number; discount: number; photoIdTotal: number; amountPaid: number | null }) {
  const beforeFee = Number((i.itemsSubtotal - i.discount + i.photoIdTotal).toFixed(2));
  const paid = i.amountPaid ?? beforeFee;
  const cardFee = Math.max(0, Number((paid - beforeFee).toFixed(2)));
  return { beforeFee, cardFee, totalPaid: Number(paid.toFixed(2)) };
}
