import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import Hero from "@/components/sections/Hero";
import CTABand from "@/components/sections/CTABand";
import ProductCard from "@/components/sections/ProductCard";
import SEOHead from "@/components/seo/SEOHead";
import { catalog, type ProductCategory, type ProductLocation } from "@/data/catalog";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Monitor,
  Wrench,
  GraduationCap,
  Building2,
  MapPin,
  X,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { industry } from "@shared/config/industry";

interface FilterConfig {
  categories: ProductCategory[];
  locations: ProductLocation[];
}

function parseFiltersFromSearch(search: string): FilterConfig {
  const params = new URLSearchParams(search);
  const catParam = params.get("category");
  const locParam = params.get("location");

  const categories: ProductCategory[] = catParam
    ? (catParam.split(",").filter((c) =>
        ["online", "hands-on", "trainer", "business"].includes(c)
      ) as ProductCategory[])
    : [];
  const locations: ProductLocation[] = locParam
    ? (locParam.split(",").filter((l) =>
        ["online", "san-diego"].includes(l)
      ) as ProductLocation[])
    : [];

  return { categories, locations };
}

function filtersToSearch(filters: FilterConfig): string {
  const params = new URLSearchParams();
  if (filters.categories.length > 0) {
    params.set("category", filters.categories.join(","));
  }
  if (filters.locations.length > 0) {
    params.set("location", filters.locations.join(","));
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export default function TrainingPrograms() {
  const { t } = useTranslation();
  const search = useSearch();
  const [, navigate] = useLocation();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(() => parseFiltersFromSearch(search), [search]);

  const updateFilters = useCallback(
    (newFilters: FilterConfig) => {
      const qs = filtersToSearch(newFilters);
      const currentPath = window.location.pathname;
      navigate(`${currentPath}${qs}`, { replace: true });
    },
    [navigate]
  );

  const toggleCategory = useCallback(
    (cat: ProductCategory) => {
      const current = filters.categories;
      const next = current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat];
      updateFilters({ ...filters, categories: next });
    },
    [filters, updateFilters]
  );

  const toggleLocation = useCallback(
    (loc: ProductLocation) => {
      const current = filters.locations;
      const next = current.includes(loc)
        ? current.filter((l) => l !== loc)
        : [...current, loc];
      updateFilters({ ...filters, locations: next });
    },
    [filters, updateFilters]
  );

  const clearFilters = useCallback(() => {
    updateFilters({ categories: [], locations: [] });
  }, [updateFilters]);

  const hasActiveFilters =
    filters.categories.length > 0 || filters.locations.length > 0;

  const filteredProducts = useMemo(() => {
    return catalog.filter((product) => {
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(product.category)
      ) {
        return false;
      }
      if (
        filters.locations.length > 0 &&
        !filters.locations.includes(product.location)
      ) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const categoryFilters: {
    key: ProductCategory;
    labelKey: string;
    icon: typeof Monitor;
  }[] = [
    { key: "online", labelKey: "filters.online", icon: Monitor },
    { key: "hands-on", labelKey: "filters.handsOn", icon: Wrench },
    { key: "trainer", labelKey: "filters.trainer", icon: GraduationCap },
    { key: "business", labelKey: "filters.business", icon: Building2 },
  ];

  const locationFilters: {
    key: ProductLocation;
    labelKey: string;
  }[] = [
    { key: "online", labelKey: "filters.locationOnline" },
    { key: "san-diego", labelKey: "filters.locationSanDiego" },
  ];

  const categoryNavCards = [
    {
      key: "online",
      label: t("trainingPrograms.onlineTraining"),
      icon: Monitor,
      href: "/online-training",
      description: t("trainingPrograms.onlineTrainingDesc"),
    },
    {
      key: "hands-on",
      label: t("trainingPrograms.handsOnTraining"),
      icon: Wrench,
      href: "/hands-on-training",
      description: t("trainingPrograms.handsOnTrainingDesc"),
    },
    {
      key: "trainer",
      label: t("trainingPrograms.trainTheTrainer"),
      icon: GraduationCap,
      href: "/train-the-trainer",
      description: t("trainingPrograms.trainTheTrainerDesc"),
    },
    {
      key: "business",
      label: t("trainingPrograms.businessProducts"),
      icon: Building2,
      href: "/business/products",
      description: t("trainingPrograms.businessProductsDesc"),
    },
  ] as const;

  const filterPillContent = (
    <>
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("filters.category")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((cat) => {
            const isActive = filters.categories.includes(cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => toggleCategory(cat.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-background text-foreground border-border hover:border-muted-foreground/40"
                }`}
                data-testid={`filter-category-${cat.key}`}
                aria-pressed={isActive}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {t(cat.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t("filters.location")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {locationFilters.map((loc) => {
            const isActive = filters.locations.includes(loc.key);
            return (
              <button
                key={loc.key}
                type="button"
                onClick={() => toggleLocation(loc.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-background text-foreground border-border hover:border-muted-foreground/40"
                }`}
                data-testid={`filter-location-${loc.key}`}
                aria-pressed={isActive}
              >
                <MapPin className="w-3.5 h-3.5" />
                {t(loc.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      <SEOHead
        title={t("trainingPrograms.seoTitle")}
        description={t("trainingPrograms.seoDesc")}
        canonical="/training-programs"
      />
      <Hero
        image="/images/warehouse-facility.jpg"
        title={t("trainingPrograms.title")}
        subtitle={t("trainingPrograms.subtitle")}
        primaryCta={{
          label: t("cta.getCertifiedOnline"),
          href: "/online-forklift-certification",
        }}
      />

      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {categoryNavCards.map((cat) => {
              const isActive = filters.categories.includes(cat.key as ProductCategory);
              return (
                <div key={cat.key} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.key as ProductCategory)}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                      isActive
                        ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                        : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm"
                    }`}
                    data-testid={`category-card-${cat.key}`}
                    aria-pressed={isActive}
                  >
                    <cat.icon className="w-5 h-5 shrink-0 mt-0.5 text-accent" />
                    <div className="flex-1 min-w-0 pr-6">
                      <h3 className="font-semibold text-sm mb-1">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                  <Link
                    href={cat.href}
                    className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                    data-testid={`category-link-${cat.key}`}
                    aria-label={`${cat.label} — ${t("filters.viewPage")}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="hidden md:flex flex-col gap-4 p-5 rounded-lg border border-border bg-card mb-8" data-testid="filter-bar-desktop">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{t("filters.filterBy")}</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded px-2 py-1"
                  data-testid="filter-clear-desktop"
                >
                  <X className="w-3 h-3" />
                  {t("filters.clearAll")}
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              {filterPillContent}
            </div>
          </div>

          <div className="md:hidden mb-6">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              data-testid="filter-toggle-mobile"
              aria-expanded={mobileFiltersOpen}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                {t("filters.filterBy")}
                {hasActiveFilters && (
                  <span className="bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" data-testid="filter-active-count">
                    {filters.categories.length + filters.locations.length}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${
                  mobileFiltersOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobileFiltersOpen && (
              <div className="mt-2 p-4 rounded-lg border border-border bg-card space-y-4" data-testid="filter-bar-mobile">
                {filterPillContent}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded px-2 py-1"
                    data-testid="filter-clear-mobile"
                  >
                    <X className="w-3 h-3" />
                    {t("filters.clearAll")}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {hasActiveFilters
                ? t("filters.filteredPrograms")
                : t("trainingPrograms.allPrograms")}
            </h2>
            <span
              className="text-sm text-muted-foreground"
              data-testid="filter-result-count"
            >
              {t("filters.showingCount", {
                shown: filteredProducts.length,
                total: catalog.length,
              })}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16" data-testid="filter-no-results">
              <p className="text-muted-foreground mb-4">
                {t("filters.noResults")}
              </p>
              <Button
                variant="outline"
                onClick={clearFilters}
                data-testid="filter-clear-no-results"
              >
                {t("filters.clearAll")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="full"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CTABand
        title={t("trainingPrograms.notSure")}
        subtitle={t("trainingPrograms.notSureDesc")}
        primaryCta={{ label: t("cta.contactUs"), href: "/contact" }}
        secondaryCta={{ label: t("cta.viewFaq"), href: "/business/faq" }}
      />
    </>
  );
}
