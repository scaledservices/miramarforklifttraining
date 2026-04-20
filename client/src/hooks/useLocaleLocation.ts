import { useSyncExternalStore, useCallback, useEffect } from "react";
import i18n from "@/i18n";
import { resolveRouteFromLocale, localePath, setStoredLocale, type Locale, DEFAULT_LOCALE } from "@/lib/locale";

function subscribeToLocation(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener("popstate", handler);
  window.addEventListener("pushstate", handler);
  window.addEventListener("replacestate", handler);
  return () => {
    window.removeEventListener("popstate", handler);
    window.removeEventListener("pushstate", handler);
    window.removeEventListener("replacestate", handler);
  };
}

function patchHistoryMethod(method: "pushState" | "replaceState") {
  const original = history[method];
  history[method] = function (this: History, data: any, unused: string, url?: string | URL | null) {
    const result = original.call(this, data, unused, url);
    const event = new Event(method === "pushState" ? "pushstate" : "replacestate");
    window.dispatchEvent(event);
    return result;
  };
}

patchHistoryMethod("pushState");
patchHistoryMethod("replaceState");

function getLocationSnapshot(): string {
  return window.location.pathname;
}

function extractLocaleAndPath(fullPath: string): { locale: Locale; internalPath: string } {
  const match = fullPath.match(/^\/(en|es)(\/.*)?$/);
  if (match) {
    const locale = match[1] as Locale;
    const rest = match[2] || "/";
    const resolvedPath = locale === "es" ? resolveRouteFromLocale(rest) : rest;
    return { locale, internalPath: resolvedPath };
  }

  return { locale: DEFAULT_LOCALE, internalPath: fullPath };
}

export function useLocaleLocation(): [string, (to: string, options?: { replace?: boolean }) => void] {
  const fullPath = useSyncExternalStore(subscribeToLocation, getLocationSnapshot);

  const { locale, internalPath } = extractLocaleAndPath(fullPath);

  useEffect(() => {
    const path = window.location.pathname;
    const hasLocalePrefix = /^\/(en|es)(\/|$)/.test(path);
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    if (hasLocalePrefix) {
      setStoredLocale(locale);
    }
  }, [locale]);

  const navigate = useCallback(
    (to: string, options?: { replace?: boolean }) => {
      const isAbsolute = /^\/(en|es)(\/|$)/.test(to);
      const finalUrl = isAbsolute ? to : localePath(to);

      if (options?.replace) {
        history.replaceState(null, "", finalUrl);
      } else {
        history.pushState(null, "", finalUrl);
      }
    },
    []
  );

  return [internalPath, navigate];
}

export function useCurrentLocale(): Locale {
  const fullPath = useSyncExternalStore(subscribeToLocation, getLocationSnapshot);
  const { locale } = extractLocaleAndPath(fullPath);
  return locale;
}

export function getRawLocationPath(): string {
  return window.location.pathname;
}
