import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { X, Globe } from "lucide-react";
import { getAlternateLocalePath } from "@/lib/locale";
import { getRawLocationPath } from "@/hooks/useLocaleLocation";

const DISMISSED_KEY = "lang_banner_dismissed";

export default function LanguageBanner() {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const browserLang = navigator.language || (navigator as any).userLanguage || "";
    const isSpanishBrowser = browserLang.startsWith("es");
    const currentLang = i18n.language;

    if (isSpanishBrowser && currentLang !== "es") {
      setVisible(true);
    }
  }, [i18n.language]);

  const handleSwitch = () => {
    const rawPath = getRawLocationPath();
    const suffix = window.location.search + window.location.hash;
    const newPath = getAlternateLocalePath(rawPath, "es");
    window.location.href = newPath + suffix;
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div
      className="bg-accent/10 border-b border-accent/20 py-2 px-4"
      data-testid="banner-language"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        <Globe className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm text-foreground">
          {t("langBanner.message")}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSwitch}
          data-testid="button-switch-language"
        >
          {t("langBanner.switchLabel")}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          data-testid="button-dismiss-language"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
