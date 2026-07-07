import { useTranslation } from "react-i18next";
import { ShieldCheck, Lock, Award } from "lucide-react";

/**
 * Slim credibility strip pinned to the top of dark hero sections — the
 * Forklift Academy pattern: regulatory alignment, secure checkout, and
 * same-day turnaround visible before the visitor reads anything else.
 */
export default function TrustBadgeBar() {
  const { t } = useTranslation();

  const badges = [
    { icon: ShieldCheck, label: t("home.badgeOsha") },
    { icon: Lock, label: t("home.badgeSecure") },
    { icon: Award, label: t("home.trust2") },
  ];

  return (
    <div className="relative border-b border-white/10 bg-black/25" data-testid="trust-badge-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5">
        {badges.map((b) => (
          <span key={b.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/85 whitespace-nowrap">
            <b.icon className="w-3.5 h-3.5 text-accent shrink-0" />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
