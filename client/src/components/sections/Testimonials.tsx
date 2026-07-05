import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      nameKey: "testimonials.review1Name",
      roleKey: "testimonials.review1Role",
      textKey: "testimonials.review1Text",
      rating: 5,
    },
    {
      nameKey: "testimonials.review2Name",
      roleKey: "testimonials.review2Role",
      textKey: "testimonials.review2Text",
      rating: 5,
    },
    {
      nameKey: "testimonials.review3Name",
      roleKey: "testimonials.review3Role",
      textKey: "testimonials.review3Text",
      rating: 5,
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background" data-testid="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-brand-orange text-sm font-semibold uppercase tracking-wider">{t("testimonials.whatPeopleSay")}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight">
            {t("testimonials.trustedBy")}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("testimonials.placeholderNote")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item) => {
            const name = t(item.nameKey);
            return (
              <Card key={item.nameKey} className="border-border" data-testid={`testimonial-${name.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground mb-4">"{t(item.textKey)}"</p>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{t(item.roleKey)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
