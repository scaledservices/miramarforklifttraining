import { useTranslation } from "react-i18next";
import { Plus, CheckCircle } from "lucide-react";
import { getAddonsForProducts, BOOKING_PRODUCT_PRICES } from "@shared/config/bookingPricing";
import { catalog, type Product } from "@/data/catalog";

interface AddonUpsellProps {
  selectedProducts: Product[];
  onToggle: (product: Product) => void;
}

// Opt-in upsell cards shown after the customer picks a base course. Toggling
// an add-on adds/removes the matching catalog product from selectedProducts,
// so pricing (running total, volume discount, 50% deposit) and the submitted
// productSlugs list update through the existing booking state — no separate
// add-on state to keep in sync.
export default function AddonUpsell({ selectedProducts, onToggle }: AddonUpsellProps) {
  const { t } = useTranslation();
  const addons = getAddonsForProducts(selectedProducts.map((p) => p.slug));
  if (addons.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t" data-testid="addon-upsell">
      <h3 className="font-medium text-foreground mb-1">{t("bookTraining.addonsTitle")}</h3>
      <p className="text-sm text-muted-foreground mb-3">{t("bookTraining.addonsDesc")}</p>
      <div className="space-y-3">
        {addons.map((addon) => {
          const product = catalog.find((p) => p.slug === addon.slug && p.category === "hands-on");
          const price = BOOKING_PRODUCT_PRICES[addon.slug];
          if (!product || price === undefined) return null;
          const isSelected = selectedProducts.some((p) => p.slug === addon.slug);
          return (
            <button
              key={addon.slug}
              type="button"
              onClick={() => onToggle(product)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                isSelected
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-primary/30"
              }`}
              data-testid={`addon-card-${addon.slug}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{addon.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.shortDescription}</p>
                  <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${isSelected ? "text-brand-green" : "text-accent"}`}>
                    {isSelected ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t("bookTraining.addonAdded")}
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        {t("bookTraining.addonAdd")}
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">+${price}</p>
                  <p className="text-xs text-muted-foreground">{t("bookTraining.perPerson")}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
