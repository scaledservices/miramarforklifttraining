import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";
import SEOHead from "@/components/seo/SEOHead";
import { getAllServiceAreaCities } from "@/data/serviceAreas";
import { MapPin, ArrowRight, Truck } from "lucide-react";

const serviceAreas = getAllServiceAreaCities();

export default function ServiceAreasHub() {
  return (
    <div>
      <SEOHead
        title={`Onsite Forklift Training Service Areas | ${brand.name}`}
        description={`We provide onsite forklift training at your facility across California. ${industry.regulatory.body}-aligned certification at your location — no travel required for your team.`}
        canonical="/service-areas"
      />

      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
            <Truck className="w-3 h-3 mr-1" /> Onsite Training
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Onsite Forklift Training Service Areas</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            We bring {industry.regulatory.body}-aligned forklift certification directly to your facility.
            Don't send your team across the state — let us come to you with same-day certification.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {serviceAreas.map((area) => (
            <Link key={area.slug} href={`/service-areas/${area.slug}`}>
              <Card
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-border hover:border-accent"
                data-testid={`card-service-area-${area.slug}`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                    <MapPin className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{area.city}, {area.stateAbbrev}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                    {area.seo.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {area.industriesServed.slice(0, 3).map((ind) => (
                      <span key={ind} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {ind.split("(")[0].trim()}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-accent">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Don't see your city listed? We travel throughout California for onsite training.
          </p>
          <Link href="/request-quote">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-accent/90"
            >
              Request a Quote for Your Location
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
