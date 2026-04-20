import { useEffect } from "react";
import { theme } from "@shared/config/theme";

function applyVars(root: HTMLElement, isDark: boolean) {
  const vars = isDark ? theme.cssVars.dark : theme.cssVars.light;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
}

export default function ThemeInjector() {
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    applyVars(root, isDark);

    const observer = new MutationObserver(() => {
      applyVars(root, root.classList.contains("dark"));
    });

    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return null;
}
