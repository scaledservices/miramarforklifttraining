/**
 * Self-hosted analytics tracker.
 *
 * Fires pageview and event tracking to /api/track/* endpoints.
 * Uses a localStorage session ID (30-min window) for anonymous user journeys.
 * All calls are fire-and-forget (no await) so tracking never blocks rendering.
 */

const SESSION_KEY = "mft_analytics_session";
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function getSessionId(): string {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const { id, ts } = JSON.parse(raw);
      if (Date.now() - ts < SESSION_TTL) {
        // refresh timestamp
        localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
        return id;
      }
    }
    // Create new session
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
    return id;
  } catch {
    return "unknown";
  }
}

function track(path: string, data: Record<string, any> = {}) {
  const sessionId = getSessionId();
  const payload = { path, sessionId, ...data };

  // Fire and forget - use sendBeacon if available (doesn't block page unload)
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon("/api/track/pageview", blob);
  } else {
    fetch("/api/track/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  }
}

function trackEvent(eventType: string, path: string, data: Record<string, any> = {}) {
  const sessionId = getSessionId();
  const payload = { eventType, path, sessionId, ...data };

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon("/api/track/event", blob);
  } else {
    fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  }
}

// Initialize pageview tracking on route changes
export function initAnalytics() {
  let lastPath = "";

  function recordPageview() {
    const path = window.location.pathname;
    if (path === lastPath) return;
    lastPath = path;

    track(path, {
      referrer: document.referrer || null,
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
