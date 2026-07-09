// Shared input formatting/validation helpers for forms app-wide.
// Keep these dependency-free — they run on every keystroke.

/** Strip everything but digits. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Progressive US phone formatting: 8589010149 → (858) 901-0149. Max 10 digits. */
export function formatUsPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isValidUsPhone(value: string): boolean {
  return digitsOnly(value).length === 10;
}

export function normalizeEmail(value: string): string {
  return value.toLowerCase().replace(/\s/g, "");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Capitalize the first letter of each word without lowercasing the rest ("mcDonald's" stays intact). */
export function capitalizeWords(value: string): string {
  // Char class covers ASCII + common Latin-1 accented lowercase (José, Peña).
  // Apostrophe is intentionally not a separator ("Jane's" must not become "Jane'S").
  return value.replace(/(^|[\s-])([a-zà-öø-ÿ])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Card number with a space every 4 digits: 4111111111111111 → "4111 1111 1111 1111" (max 16 digits / 19 chars). */
export function formatCardNumber(value: string): string {
  const d = digitsOnly(value).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/**
 * Random password satisfying the register endpoint's policy (8+ chars,
 * upper + lower + digit). Used for silent account creation during booking —
 * the customer sets their own password later via the reset-password flow.
 */
export function generateTempPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const random = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `Mf9${random}`;
}
