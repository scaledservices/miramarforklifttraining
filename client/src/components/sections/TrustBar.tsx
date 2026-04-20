import { Shield, Award, Headphones, BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TrustBar() {
  const { t } = useTranslation();

  const trustItems = [
    { icon: Shield, label: t("trustBar.oshaAligned") },
    { icon: Award, label: t("trustBar.sameDayCert") },
    { icon: Headphones, label: t("trustBar.support") },
    { icon: BadgeCheck, label: t("trustBar.guarantee") },
  ];

  return (
    <section className="py-10 bg-card border-y border-border" data-testid="trust-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center gap-2">
              <item.icon className="w-6 h-6 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
