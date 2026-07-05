import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentLocale, getRawLocationPath } from "@/hooks/useLocaleLocation";
import { getAlternateLocalePath, setStoredLocale, type Locale } from "@/lib/locale";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const currentLocale = useCurrentLocale();

  function switchTo(locale: Locale) {
    if (locale === currentLocale) return;
    setStoredLocale(locale);
    const rawPath = getRawLocationPath();
    const suffix = window.location.search + window.location.hash;
    const newPath = getAlternateLocalePath(rawPath, locale);
    window.location.href = newPath + suffix;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className} data-testid="button-language-switcher">
          <Globe className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">{LOCALE_LABELS[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchTo("en")}
          className={currentLocale === "en" ? "font-semibold" : ""}
          data-testid="menu-item-lang-en"
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchTo("es")}
          className={currentLocale === "es" ? "font-semibold" : ""}
          data-testid="menu-item-lang-es"
        >
          Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
