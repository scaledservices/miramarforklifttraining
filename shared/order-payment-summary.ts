// Confirmation math. amountPaid is the approved payment amount (what the card
// was actually charged). The card fee is whatever was charged beyond the
// fee-free total, so the page always matches the card statement.
export function orderPaymentSummary(i: { itemsSubtotal: number; discount: number; photoIdTotal: number; amountPaid: number | null }) {
  const beforeFee = Number((i.itemsSubtotal - i.discount + i.photoIdTotal).toFixed(2));
  const paid = i.amountPaid ?? beforeFee;
  const cardFee = Math.max(0, Number((paid - beforeFee).toFixed(2)));
  return { beforeFee, cardFee, totalPaid: Number(paid.toFixed(2)) };
}
