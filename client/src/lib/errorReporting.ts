/**
 * Client-side error reporting: ships browser errors to POST /api/client-errors
 * so they land in the server's system_logs table (queryable at /api/admin/logs).
 *
 * Fail-safe by design: reporting never throws, never retries, and dedupes so
 * a render loop or flaky extension can't flood the endpoint (the server also
 * rate-limits per IP as a backstop).
 */

type ClientErrorKind = "error" | "unhandledrejection" | "react-boundary";

const seenMessages = new Set<string>();
const MAX_UNIQUE = 10; // distinct errors per page load
const MAX_TOTAL = 20; // absolute cap per page load
let totalSent = 0;

export function reportClientError(input: {
  message: string;
  stack?: string;
  kind?: ClientErrorKind;
}): void {
  try {
    const message = String(input.message || "Unknown client error").slice(0, 2000);
    if (totalSent >= MAX_TOTAL) return;
    if (seenMessages.has(message)) return;
    if (seenMessages.size >= MAX_UNIQUE) return;
    seenMessages.add(message);
    totalSent++;

    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        message,
        stack: input.stack?.slice(0, 8000),
        url: window.location.href.slice(0, 500),
        userAgent: navigator.userAgent.slice(0, 300),
        kind: input.kind ?? "error",
      }),
    }).catch(() => {
      // Never let the reporter create errors of its own.
    });
  } catch {
    // Same: swallow everything.
  }
}

let installed = false;

/** Wires window.onerror + unhandled promise rejections. Call once at startup. */
export function installGlobalErrorReporting(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    reportClientError({
      message: event.message || String(event.error ?? "Unknown error"),
      stack: event.error instanceof Error ? event.error.stack : undefined,
      kind: "error",
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportClientError({
      message:
        reason instanceof Error
          ? `Unhandled rejection: ${reason.message}`
          : `Unhandled rejection: ${String(reason).slice(0, 500)}`,
      stack: reason instanceof Error ? reason.stack : undefined,
      kind: "unhandledrejection",
    });
  });
}
