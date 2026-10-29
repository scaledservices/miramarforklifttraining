/**
 * Self-hosted analytics tracker.
 *
 * Fires pageview and event tracking to /api/track/* endpoints.
 * - Session id: localStorage, 30-minute inactivity window (one "visit").
 * - Visitor id: localStorage, kept 2 years, so returning visitors are known.
 *   Views during a visitor's first session are flagged newVisitor=true.
 * - Campaign tags (utm_*) are captured on the landing page of each visit.
 * - Staff browsers (anyone who has signed in as admin/instructor here) and
 *   automated browsers are flagged so the server leaves them out.
 * All calls are fire-and-forget so tracking never blocks rendering.
 */

const SESSION_KEY = "mft_analytics_session";
const VISITOR_KEY = "mft_visitor";
const STAFF_KEY = "mft_staff_browser";
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const VISITOR_TTL = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years

type Session = { id: string; ts: number; utm?: Record<string, string> };

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function readUtm(): Record<string, string> | undefined {
  try {
    const p = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of ["source", "medium", "campaign"]) {
      const v = p.get(`utm_${k}`);
      if (v) out[k] = v.slice(0, 150);
    }
    if (!out.source && p.get("gclid")) { out.source = "google"; out.medium = "cpc"; }
    if (!out.source && p.get("fbclid")) { out.source = "facebook"; out.medium = out.medium || "social"; }
    return Object.keys(out).length ? out : undefined;
  } catch {
    return undefined;
  }
}

function getSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Session;
      if (s?.id && Date.now() - s.ts < SESSION_TTL) {
        s.ts = Date.now();
        localStorage.setItem(SESSION_KEY, JSON.stringify(s));
        return s;
      }
    }
    const s: Session = { id: newId(), ts: Date.now(), utm: readUtm() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  } catch {
    return { id: "unknown", ts: Date.now() };
  }
}

/** Persistent visitor; `isNew` is true for the visitor's first session. */
function getVisitor(sessionId: string): { id: string; isNew: boolean } {
  try {
    const raw = localStorage.getItem(VISITOR_KEY);
    if (raw) {
      const v = JSON.parse(raw) as { id: string; created: number; firstSession: string };
      if (v?.id && Date.now() - v.created < VISITOR_TTL) {
        return { id: v.id, isNew: v.firstSession === sessionId };
      }
    }
    const v = { id: newId(), created: Date.now(), firstSession: sessionId };
    localStorage.setItem(VISITOR_KEY, JSON.stringify(v));
    return { id: v.id, isNew: true };
  } catch {
    return { id: sessionId, isNew: true };
  }
}

/** Called once the signed-in user is known. Staff browsers stay excluded
 * even after signing out (Alberto browsing his own site is not traffic). */
export function markStaffBrowser(role: string | null | undefined) {
  try {
    if (role && ["admin", "super_admin", "instructor"].includes(role)) {
      localStorage.setItem(STAFF_KEY, "1");
    }
  } catch {}
}

function common() {
  const session = getSession();
  const visitor = getVisitor(session.id);
  let staff = false;
  try { staff = localStorage.getItem(STAFF_KEY) === "1"; } catch {}
  return {
    sessionId: session.id,
    visitorId: visitor.id,
    newVisitor: visitor.isNew,
    utm: session.utm,
    staff,
    webdriver: typeof navigator !== "undefined" && (navigator as any).webdriver === true,
  };
}

function send(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
  } else {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  }
}

function track(path: string, data: Record<string, unknown> = {}) {
  send("/api/track/pageview", { path, ...common(), ...data });
}

/** Record a funnel event (quote submitted, booking completed, purchase...). */
function trackEvent(eventType: string, path: string, data: Record<string, unknown> = {}) {
  send("/api/track/event", { eventType, path, ...common(), ...data });
}

// Initialize pageview tracking on route changes
export function initAnalytics() {
  let lastPath = "";

  function recordPageview() {
    const path = window.location.pathname;
    if (path === lastPath) return;
    const first = lastPath === "";
    lastPath = path;

    track(path, {
      // Only the first page of a page load has a meaningful external referrer.
      referrer: first ? document.referrer || null : window.location.origin + "/",
    });
  }

  // Track initial page load
  recordPageview();

  // Track on history changes (wouter uses pushState/replaceState)
  const origPushState = history.pushState.bind(history);
  const origReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    const result = origPushState(...args);
    setTimeout(recordPageview, 0);
    return result;
  };

  history.replaceState = function (...args) {
    const result = origReplaceState(...args);
    setTimeout(recordPageview, 0);
    return result;
  };

  // Track popstate (back/forward)
  window.addEventListener("popstate", () => {
    setTimeout(recordPageview, 0);
  });
}

// Export trackEvent for use in components (CTA clicks, form submissions, etc.)
export { trackEvent };
