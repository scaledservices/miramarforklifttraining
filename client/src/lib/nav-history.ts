import { nextNavStack } from "@shared/lead-prefill";

// Pages visited inside the app this tab session, so a Back button can return
// to the page the admin came from instead of a fixed list page.
const KEY = "mft-nav-stack";

function read(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function recordLocation(location: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(nextNavStack(read(), location)));
  } catch {}
}

export function canGoBackInApp(): boolean {
  return read().length > 1;
}
