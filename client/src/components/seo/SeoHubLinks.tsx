import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, MapPin, Users } from "lucide-react";

interface HubLink {
  slug: string;
  label: string;
  type: string;
  isExternal?: boolean;
}

interface SeoHubLinksProps {
  links: HubLink[];
}

export default function SeoHubLinks({ links }: SeoHubLinksProps) {
  if (!links || links.length === 0) return null;

  const iconMap: Record<string, typeof ShieldCheck> = {
    cta: ShieldCheck,
    hub: MapPin,
    state: MapPin,
    money: Users,
  };

  return (
    <section className="py-6" data-testid="seo-hub-links">
      <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const Icon = iconMap[link.type] || ArrowRight;
          if (link.type === "cta") {
            return (
              <Link key={link.slug} href={`/${link.slug}`}>
                <Button size="sm" className="gap-1.5" data-testid={`hub-link-${link.slug}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Button>
              </Link>
            );
          }
          return (
            <Link key={link.slug} href={`/${link.slug}`}>
              <Badge variant="secondary" className="px-3 py-1.5 cursor-pointer" data-testid={`hub-link-${link.slug}`}>
                <Icon className="h-3 w-3 mr-1" />
                {link.label}
              </Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
