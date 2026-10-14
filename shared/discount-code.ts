/** Codes ignore case and any spaces ("test 99" -> "TEST99"). Meeting 2026-10-13. */
export const normalizeDiscountCode = (raw: unknown): string => String(raw ?? "").replace(/\s+/g, "").toUpperCase();
