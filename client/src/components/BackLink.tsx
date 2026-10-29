import { forwardRef, type AnchorHTMLAttributes, type ComponentType, type MouseEvent } from "react";
import { Link } from "wouter";
import { canGoBackInApp } from "@/lib/nav-history";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  "data-testid"?: string;
};

// wouter's Link props are a union that does not survive a forwardRef spread.
const RouterLink = Link as unknown as ComponentType<Record<string, unknown>>;

/**
 * A Back link that returns to the page you came from (browser history) when
 * you navigated here inside the app, and falls back to `href` when the page
 * was opened directly (bookmark, email link, new tab).
 */
const BackLink = forwardRef<HTMLAnchorElement, Props>(function BackLink({ onClick, ...props }, ref) {
  return (
    <RouterLink
      {...props}
      ref={ref}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (canGoBackInApp()) {
          e.preventDefault();
          window.history.back();
        }
      }}
    />
  );
});

export default BackLink;
