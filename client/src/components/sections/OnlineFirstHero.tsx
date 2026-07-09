import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Monitor, Clock, Award, MapPin } from "lucide-react";
import TrustBadgeBar from "@/components/sections/TrustBadgeBar";

/**
 * Modified hero for out-of-region visitors.
 *
 * Promotes online certification as the primary path, but STILL shows the
 * onsite offering so nothing is hidden. Visitors outside CA/NV see the
 * online CTA first, followed by a secondary section that makes in-person
 * training discoverable with a "Available in San Diego, Las Vegas & Fresno"
 * label.
 */
export default function OnlineFirstHero() {
  const { t } = useTranslation();

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-dark to-[hsl(10,22%,17%)]"
      data-testid="hero-online-first"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <TrustBadgeBar />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
        <div className="max-w-3xl">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-xs font-semibold uppercase tracking-wider bg-white/10 text-white/90 rounded-full backdrop-blur-sm border border-white/10"
            data-testid="text-online-first-eyebrow"
          >
            <Monitor className="w-3 h-3 text-accent" />
            {t("home.onlineFirstEyebrow", { defaultValue: "Online Certification" })}
          </span>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6 drop-shadow-md"
            data-testid="text-online-first-title"
          >
            {t("home.onlineFirstTitle", {
              defaultValue: "Get OSHA-Aligned Forklift Certified Online",
            })}
          </h1>

          <p className="text-lg sm:text-xl text-white/85 leading-relaxed mb-8 max-w-2xl drop-shadow-sm">
            {t("home.onlineFirstSubtitle", {
              defaultValue:
                "Complete your forklift operator certification from anywhere. Self-paced online course, instant certificate, and same-day verification.",
            })}
          </p>

          {/* Primary CTA: online */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/get-certified">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-accent text-accent-foreground border-accent-border text-base px-8 py-6"
                data-testid="button-online-first-get-certified"
              >
                <Shield className="h-5 w-5 mr-2" />
                {t("home.onlineFirstCta", { defaultValue: "Get Certified Online" })}
              </Button>
            </Link>
            <Link href="/p/online-forklift-operator-training">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/30 text-white bg-white/10 hover:bg-white/20 px-8 py-6"
                data-testid="button-online-first-browse"
              >
                {t("home.onlineFirstBrowse", { defaultValue: "Browse Online Courses" })}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-8 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>
                {t("home.onlineFirstBadge1", { defaultValue: "Self-paced" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>
                {t("home.onlineFirstBadge2", { defaultValue: "OSHA-aligned" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              <span>
                {t("home.onlineFirstBadge3", { defaultValue: "Same-day certificate" })}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary section: onsite is STILL visible, just de-emphasized */}
        <div
          className="mt-12 pt-8 border-t border-white/15 max-w-3xl"
          data-testid="onsite-still-available"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                {t("home.onlineFirstOnsiteHeading", {
                  defaultValue: "Prefer In-Person Training?",
                })}
              </h2>
              <p className="text-sm text-white/70 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                {t("home.onlineFirstOnsiteLocations", {
                  defaultValue: "Available in San Diego, Las Vegas & Fresno",
                })}
              </p>
            </div>
            <Link href="/book-training">
              <Button
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 whitespace-nowrap"
                data-testid="button-online-first-onsite"
              >
                {t("home.onlineFirstOnsiteCta", { defaultValue: "Book Onsite Training" })}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
