import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { industry } from "@shared/config/industry";

interface SeoCtaProps {
  heading?: string;
  subtext?: string;
  ctaText?: string;
  ctaHref?: string;
}

export default function SeoCta({ heading = "Ready to Get Certified?", subtext = `Complete your ${industry.regulatory.body}-compliant forklift certification online today. Same-day certification available.`, ctaText = "Start Certification — $59.99", ctaHref = "/online-forklift-certification" }: SeoCtaProps) {
  return (
    <section className="bg-primary text-primary-foreground py-12 md:py-16 rounded-lg" data-testid="seo-cta-band">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{heading}</h2>
        <p className="text-primary-foreground/80 mb-6 text-lg">{subtext}</p>
        <Link href={ctaHref}>
          <Button size="lg" variant="secondary" className="gap-2 text-base" data-testid="seo-cta-button">
            {ctaText} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
