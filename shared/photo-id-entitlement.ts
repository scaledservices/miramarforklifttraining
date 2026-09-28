// A prepaid photo ID bought on a team order may be claimed only by a member
// enrolled through THAT order (or used by the buyer on the member's behalf).
// The old check matched any unclaimed ID for the same course, so a member of
// one company could consume another company's prepaid ID.
export function entitlementBelongsToMember(
  ent: { orderId: number; enrollmentId: number | null; purchasedByUserId: number },
  ctx: { userId: number; certUserId: number; memberOrderId: number | null },
): boolean {
  if (ent.enrollmentId !== null) return ent.purchasedByUserId === ctx.userId;
  if (ent.purchasedByUserId === ctx.userId) return true;
  return ctx.certUserId === ctx.userId && ctx.memberOrderId !== null && ctx.memberOrderId === ent.orderId;
}
