import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { industry } from "@shared/config/industry";

interface SeoHeroProps {
  h1: string;
  subtitle?: string | null;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export default function SeoHero({ h1, subtitle, ctaText = "Get Certified Now", ctaHref = "/online-forklift-certification", secondaryCtaText, secondaryCtaHref }: SeoHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24" data-testid="seo-hero">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <span className="text-sm font-medium text-accent uppercase tracking-wider">{industry.regulatory.body}-Compliant Training</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" data-testid="seo-h1">{h1}</h1>
        {subtitle && <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="seo-subtitle">{subtitle}</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={ctaHref}>
            <Button size="lg" className="gap-2" data-testid="seo-cta-primary">
              {ctaText} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          {secondaryCtaText && secondaryCtaHref && (
            <Link href={secondaryCtaHref}>
              <Button size="lg" variant="outline" data-testid="seo-cta-secondary">{secondaryCtaText}</Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
