import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";

interface CTABandProps {
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: "accent" | "primary";
}

export default function CTABand({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  variant = "primary",
}: CTABandProps) {
  const isAccent = variant === "accent";
  const bgClass = isAccent
    ? "bg-accent"
    : "bg-gradient-to-r from-brand-dark to-[hsl(10,22%,16%)]";
  const titleClass = isAccent ? "text-accent-foreground" : "text-white";
  const subtitleClass = isAccent ? "text-accent-foreground/75" : "text-white/80";

  return (
    <section className={`${bgClass} py-14 md:py-16`} data-testid="cta-band">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className={`text-2xl sm:text-3xl font-bold ${titleClass} tracking-tight mb-3`}>
          {title}
        </h2>
        <p className={`text-base ${subtitleClass} mb-8 max-w-2xl mx-auto`}>
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryCta && (
            <Link href={primaryCta.href}>
              <Button
                size="lg"
                className={
                  isAccent
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-accent text-accent-foreground border-accent-border"
                }
                data-testid="cta-band-primary"
              >
                {primaryCta.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
          {secondaryCta && (
            <Link href={secondaryCta.href}>
              <Button size="lg" variant="outline" className={isAccent ? "border-black/25 text-accent-foreground bg-black/5" : "border-white/30 text-white bg-white/5"} data-testid="cta-band-secondary">
                <Phone className="w-4 h-4 mr-2" />
                {secondaryCta.label}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
