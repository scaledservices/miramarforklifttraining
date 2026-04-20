import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";
import { ArrowRight, Shield, Clock, Award } from "lucide-react";

interface HeroProps {
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  badges?: string[];
  variant?: "home" | "page";
  image?: string;
  imageAlt?: string;
}

function isExternalUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  if (isExternalUrl(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  return <Link href={href}>{children}</Link>;
}

export default function Hero({ title, subtitle, primaryCta, secondaryCta, badges, variant = "page", image, imageAlt }: HeroProps) {
  const { t } = useTranslation();

  if (variant === "home") {
    return (
      <section className="relative overflow-hidden" data-testid="hero-home">
        {image && (
          <div className="absolute inset-0">
            <OptimizedImage src={image} alt={imageAlt || ""} className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,85%,15%)]/95 via-[hsl(210,85%,18%)]/85 to-[hsl(210,85%,20%)]/70" />
          </div>
        )}
        {!image && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(210,85%,20%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_60%)]" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-36">
          <div className="max-w-3xl">
            {badges && (
              <div className="flex flex-wrap gap-2 mb-6">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-white/10 text-white/90 rounded-full backdrop-blur-sm border border-white/10"
                  >
                    <Shield className="w-3 h-3" />
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6 drop-shadow-md">
              {title}
            </h1>
            <p className="text-lg sm:text-xl text-white/85 leading-relaxed mb-8 max-w-2xl drop-shadow-sm">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              {primaryCta && (
                <CtaLink href={primaryCta.href}>
                  <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="hero-primary-cta">
                    {primaryCta.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CtaLink>
              )}
              {secondaryCta && (
                <CtaLink href={secondaryCta.href}>
                  <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm" data-testid="hero-secondary-cta">
                    {secondaryCta.label}
                  </Button>
                </CtaLink>
              )}
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span>{t("hero.oshaAlignedTraining")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span>{t("hero.sameDayCertification")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" />
                <span>{t("hero.printableCertificate")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-16 md:py-20" data-testid="hero-page">
      {image ? (
        <div className="absolute inset-0">
          <OptimizedImage src={image} alt={imageAlt || ""} className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,85%,15%)]/95 via-[hsl(210,85%,18%)]/85 to-[hsl(210,85%,20%)]/65" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-[hsl(210,85%,22%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.05),transparent_50%)]" />
        </>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4 drop-shadow-md">
            {title}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-2xl drop-shadow-sm">
            {subtitle}
          </p>
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              {primaryCta && (
                <CtaLink href={primaryCta.href}>
                  <Button size="lg" className="bg-accent text-accent-foreground border-accent-border" data-testid="hero-primary-cta">
                    {primaryCta.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CtaLink>
              )}
              {secondaryCta && (
                <CtaLink href={secondaryCta.href}>
                  <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm" data-testid="hero-secondary-cta">
                    {secondaryCta.label}
                  </Button>
                </CtaLink>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
