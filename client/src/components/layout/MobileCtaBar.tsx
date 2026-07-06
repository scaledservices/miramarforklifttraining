import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Phone, CalendarDays } from "lucide-react";
import { brand } from "@shared/config/brand";

// Routes where a persistent sales CTA would distract from the task at hand.
const HIDDEN_PREFIXES = [
  "/admin", "/group", "/dashboard", "/course", "/checkout", "/cart",
  "/login", "/register", "/reset-password", "/accept-invite", "/request-quote",
  "/book-training", "/get-certified", "/reservar-capacitacion", "/pay-balance",
  "/pago", "/carrito", "/iniciar-sesion", "/crear-cuenta", "/restablecer-contrasena",
  "/aceptar-invitacion", "/panel", "/equipo",
];

export default function MobileCtaBar() {
  const { t } = useTranslation();
  const [location] = useLocation();

  if (HIDDEN_PREFIXES.some((p) => location.startsWith(p))) return null;

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-2 gap-px bg-black/20 border-t border-black/10 backdrop-blur supports-[backdrop-filter]:bg-black/10 pb-[env(safe-area-inset-bottom)]"
      data-testid="mobile-cta-bar"
    >
      <a
        href={`tel:${brand.support.phoneTel}`}
        className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold bg-brand-dark text-white"
        data-testid="mobile-cta-call"
      >
        <Phone className="w-4 h-4 text-accent" />
        {t("mobileBar.call")}
      </a>
      <Link
        href="/get-certified"
        className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold bg-accent text-accent-foreground"
        data-testid="mobile-cta-quote"
      >
        <CalendarDays className="w-4 h-4" />
        {t("cta.getCertified")}
      </Link>
    </div>
  );
}
