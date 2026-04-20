import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { industry } from "@shared/config/industry";

interface SeoStickyCtaProps {
  price?: string;
  ctaText?: string;
  ctaHref?: string;
}

export default function SeoStickyCta({ price = "$59.99", ctaText = "Get Certified Now", ctaHref = "/online-forklift-certification" }: SeoStickyCtaProps) {
  return (
    <div className="hidden lg:block" data-testid="seo-sticky-cta">
      <Card className="sticky top-24">
        <CardContent className="py-6 space-y-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{price}</p>
            <p className="text-xs text-muted-foreground mt-1">One-time payment</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> {industry.regulatory.body}-compliant training</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Certificate with QR verification</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Same-day certification</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Employer documentation kit</div>
          </div>
          <Link href={ctaHref}>
            <Button className="w-full gap-2" size="lg" data-testid="sticky-cta-button">
              {ctaText} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
