import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function resolveLocale(options: {
  userId?: number;
  routeLocale?: string;
  courseLanguage?: string;
}): Promise<string> {
  if (options.userId) {
    try {
      const [user] = await db.select({ locale: users.locale }).from(users).where(eq(users.id, options.userId));
      if (user?.locale && user.locale !== "en") return user.locale;
    } catch {}
  }

  if (options.routeLocale && options.routeLocale !== "en") return options.routeLocale;

  if (options.courseLanguage && options.courseLanguage !== "en") return options.courseLanguage;

  return "en";
}
