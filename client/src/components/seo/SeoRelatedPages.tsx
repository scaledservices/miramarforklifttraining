import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ArrowRight } from "lucide-react";

interface RelatedPage {
  slug: string;
  title: string;
  heroH1?: string;
  city?: string | null;
  state?: string | null;
}

interface SeoRelatedPagesProps {
  heading?: string;
  pages: RelatedPage[];
  nearbyPages?: RelatedPage[];
}

export default function SeoRelatedPages({ heading = "Related Pages", pages, nearbyPages }: SeoRelatedPagesProps) {
  if ((!pages || pages.length === 0) && (!nearbyPages || nearbyPages.length === 0)) return null;
  return (
    <section className="py-8" data-testid="seo-related-pages">
      {pages.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mb-4">{heading}</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pages.map((p) => (
              <Link key={p.slug} href={`/${p.slug}`}>
                <Card className="hover:border-accent/50 transition-colors cursor-pointer h-full">
                  <CardContent className="py-4 flex items-start gap-3">
                    {p.city && <MapPin className="h-4 w-4 text-accent shrink-0 mt-1" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{p.heroH1 || p.title}</p>
                      {p.state && <p className="text-xs text-muted-foreground">{p.state}</p>}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1 ml-auto" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
      {nearbyPages && nearbyPages.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-3">Nearby Locations</h3>
          <div className="flex flex-wrap gap-2">
            {nearbyPages.map((p) => (
              <Link key={p.slug} href={`/${p.slug}`}>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-accent/10 transition-colors cursor-pointer">
                  <MapPin className="h-3 w-3" /> {p.city || p.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
