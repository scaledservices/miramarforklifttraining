import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/errorReporting";

/**
 * Top-level React error boundary: reports render crashes to the server log
 * and shows a bilingual fallback. Text is static EN + ES on purpose — if the
 * app crashed, i18n may be part of what crashed.
 */

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Stale-chunk recovery: after a deploy, browsers holding the old page
    // request lazy chunks (e.g. Dashboard-OLDHASH.js) that no longer exist.
    // The message is always "Failed to fetch dynamically imported module".
    // A single reload pulls fresh HTML with the new chunk names — do it
    // automatically (guarded against loops) instead of stranding the user
    // on the error page.
    if (/Failed to fetch dynamically imported module/i.test(error?.message ?? "")) {
      const RELOAD_FLAG = "chunk-reload-attempted";
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return;
      }
      // Second failure after reload: fall through to the visible error page.
      sessionStorage.removeItem(RELOAD_FLAG);
    }
    reportClientError({
      message: `React render error: ${error.message}`,
      stack: `${error.stack ?? ""}\nComponent stack:${info.componentStack ?? ""}`,
      kind: "react-boundary",
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "Roboto, system-ui, sans-serif",
          backgroundColor: "#fafafa",
          color: "#1a1a1a",
        }}
        data-testid="error-boundary-fallback"
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: "0.5rem", color: "#555" }}>
            The page hit an unexpected error. Our team has been notified. Please reload the page or
            call us at (858) 901-0149.
          </p>
          <p style={{ marginBottom: "1.25rem", color: "#555" }}>
            La página tuvo un error inesperado. Nuestro equipo ya fue notificado. Recarga la página
            o llámanos al (858) 901-0149.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: "#FFC326",
              color: "#1a1a1a",
              fontWeight: 700,
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
            data-testid="button-error-reload"
          >
            Reload / Recargar
          </button>
        </div>
      </div>
    );
  }
}
