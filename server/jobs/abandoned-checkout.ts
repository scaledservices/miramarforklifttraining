import { db } from "../db";
import { orders, users } from "@shared/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { ABANDONED_CHECKOUT_DELAY_MINUTES } from "../constants";
import { sendAbandonedCheckoutReminder } from "../email";

export async function runAbandonedCheckoutJob(): Promise<void> {
  const cutoff = new Date(Date.now() - ABANDONED_CHECKOUT_DELAY_MINUTES * 60 * 1000);

  const abandonedOrders = await db.select({
    id: orders.id,
    orderNumber: orders.orderNumber,
    userId: orders.userId,
  }).from(orders)
    .where(
      and(
        eq(orders.status, "pending"),
        eq(orders.abandonedEmailSent, false),
        lt(orders.createdAt, cutoff)
      )
    )
    .limit(50);

  for (const order of abandonedOrders) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, order.userId));
      if (!user) continue;

      await sendAbandonedCheckoutReminder({
        to: user.email,
        orderNumber: order.orderNumber,
        actorUserId: undefined,
        locale: user.locale || "en",
      });

      await db.update(orders).set({
        abandonedEmailSent: true,
        updatedAt: new Date(),
      }).where(eq(orders.id, order.id));
    } catch (err) {
      console.error(`[ABANDONED] Failed for order ${order.orderNumber}:`, err);
    }
  }

  if (abandonedOrders.length > 0) {
    console.log(`[ABANDONED] Processed ${abandonedOrders.length} abandoned orders`);
  }
}
