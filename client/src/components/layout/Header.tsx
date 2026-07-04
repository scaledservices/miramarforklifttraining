import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  LayoutDashboard,
  Users,
  Shield,
  ShoppingCart,
  Monitor,
  Wrench,
  GraduationCap,
  MapPin,
  BookOpen,
  HelpCircle,
  Mail,
  Building2,
  Package,
  CircleHelp,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import Logo from "@/components/ui/Logo";
import LanguageSwitcher from "@/components/LanguageSwitcher";

function DesktopNav() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const handleMouseEnter = useCallback((key: string) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenDropdown(key);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setOpenDropdown(null), 150);
  }, []);

  const toggleDropdown = useCallback((key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trainingCategories = [
    { label: t("nav.inPersonTraining"), href: "/in-person-training", icon: Wrench },
    { label: t("nav.onlineTraining"), href: "/online-training", icon: Monitor },
    { label: t("nav.trainTheTrainer"), href: "/train-the-trainer", icon: GraduationCap },
  ];

  const trainingLocations = [
    { label: t("nav.sanDiego"), href: "/locations/san-diego" },
  ];

  const businessLinks = [
    { label: t("nav.teamTraining"), href: "/business", icon: Building2 },
    { label: t("nav.getQuote"), href: "/request-quote", icon: ClipboardList },
    { label: t("nav.businessProducts"), href: "/business/products", icon: Package },
    { label: t("nav.businessFaq"), href: "/business/faq", icon: CircleHelp },
  ];

  const resourceLinks = [
    // Blog link hidden until blog content exists (senior review Section B.5)
    { label: t("nav.faq"), href: "/faq", icon: HelpCircle },
    { label: t("nav.support"), href: "/support", icon: HelpCircle },
    { label: t("nav.contact"), href: "/contact", icon: Mail },
  ];

  const isTrainingActive =
    location.startsWith("/training-programs") ||
    location.startsWith("/online-training") ||
    location.startsWith("/in-person-training") ||
    location.startsWith("/hands-on-training") ||
    location.startsWith("/train-the-trainer") ||
    location.startsWith("/locations");

  const isBusinessActive = location.startsWith("/business") || location.startsWith("/request-quote");

  const isResourcesActive =
    location.startsWith("/blog") ||
    location.startsWith("/support") ||
    location.startsWith("/contact");

  const handleTriggerKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleDropdown(key);
    }
  };

  return (
    <nav ref={navRef} className="hidden lg:flex items-center gap-1" data-testid="nav-desktop" role="navigation" aria-label={t("nav.mainNavigation")}>
      <div
        className="relative"
        onMouseEnter={() => handleMouseEnter("training")}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isTrainingActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-expanded={openDropdown === "training"}
          aria-haspopup="true"
          onClick={() => toggleDropdown("training")}
          onKeyDown={(e) => handleTriggerKeyDown(e, "training")}
          data-testid="nav-training"
        >
          {t("nav.training")}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "training" ? "rotate-180" : ""}`} />
        </button>
        {openDropdown === "training" && (
          <div className="absolute top-full left-0 pt-1 z-50" role="menu" aria-label={t("nav.training")}>
            <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[420px] grid grid-cols-2 gap-6">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {t("nav.programs")}
                </span>
                {trainingCategories.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2 py-2 text-sm rounded-md transition-colors hover-elevate ${
                        location.startsWith(item.href) ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                      role="menuitem"
                      data-testid={`nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="mt-2 pt-2 border-t border-border">
                  <Link
                    href="/training-programs"
                    className={`block px-2 py-2 text-sm rounded-md transition-colors hover-elevate ${
                      location === "/training-programs" ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    role="menuitem"
                    data-testid="nav-training-programs"
                    onClick={() => setOpenDropdown(null)}
                  >
                    {t("nav.viewAllPrograms")}
                  </Link>
                </div>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {t("nav.trainingLocations")}
                </span>
                {trainingLocations.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2 py-2 text-sm rounded-md transition-colors hover-elevate ${
                      location === item.href ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    role="menuitem"
                    data-testid={`nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
                <div className="mt-2 pt-2 border-t border-border">
                  <Link
                    href="/locations"
                    className={`block px-2 py-2 text-sm rounded-md transition-colors hover-elevate ${
                      location === "/locations" ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    role="menuitem"
                    data-testid="nav-locations-all"
                    onClick={() => setOpenDropdown(null)}
                  >
                    {t("nav.allServiceAreas")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className="relative"
        onMouseEnter={() => handleMouseEnter("business")}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isBusinessActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-expanded={openDropdown === "business"}
          aria-haspopup="true"
          onClick={() => toggleDropdown("business")}
          onKeyDown={(e) => handleTriggerKeyDown(e, "business")}
          data-testid="nav-business"
        >
          {t("nav.forBusiness")}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "business" ? "rotate-180" : ""}`} />
        </button>
        {openDropdown === "business" && (
          <div className="absolute top-full left-0 pt-1 z-50" role="menu" aria-label={t("nav.forBusiness")}>
            <div className="bg-background border border-border rounded-md shadow-lg py-1 min-w-[200px]">
              {businessLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover-elevate ${
                      location === item.href ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    role="menuitem"
                    data-testid={`nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div
        className="relative"
        onMouseEnter={() => handleMouseEnter("resources")}
        onMouseLeave={handleMouseLeave}
      >
        <button
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isResourcesActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-expanded={openDropdown === "resources"}
          aria-haspopup="true"
          onClick={() => toggleDropdown("resources")}
          onKeyDown={(e) => handleTriggerKeyDown(e, "resources")}
          data-testid="nav-resources"
        >
          {t("nav.resources")}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === "resources" ? "rotate-180" : ""}`} />
        </button>
        {openDropdown === "resources" && (
          <div className="absolute top-full left-0 pt-1 z-50" role="menu" aria-label={t("nav.resources")}>
            <div className="bg-background border border-border rounded-md shadow-lg py-1 min-w-[180px]">
              {resourceLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover-elevate ${
                      location === item.href ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                    role="menuitem"
                    data-testid={`nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                    onClick={() => setOpenDropdown(null)}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function MobileNavActions({ onClose }: { onClose: () => void }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  if (isAuthenticated && user) {
    const isAdmin = user.role === "super_admin" || user.role === "admin";
    const dashboardLink = isAdmin ? "/admin" : user.role === "group_admin" ? "/group" : "/dashboard";
    const dashboardLabel = isAdmin ? t("nav.admin") : user.role === "group_admin" ? t("nav.crew") : t("nav.dashboard");
    return (
      <div className="p-4 border-t border-border space-y-2">
        <Link href={dashboardLink} onClick={onClose}>
          <Button variant="outline" className="w-full" data-testid="mobile-button-dashboard">
            {user.role === "group_admin" ? <Users className="w-4 h-4 mr-2" /> : <LayoutDashboard className="w-4 h-4 mr-2" />}
            {dashboardLabel}
          </Button>
        </Link>
        {user.role === "group_admin" && (
          <Link href="/dashboard" onClick={onClose}>
            <Button variant="outline" className="w-full" data-testid="mobile-button-personal-dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              {t("nav.dashboard")}
            </Button>
          </Link>
        )}
        <Button variant="outline" className="w-full" onClick={() => { logout(); onClose(); setLocation("/"); }} data-testid="mobile-button-logout">
          <LogOut className="w-4 h-4 mr-2" />
          {t("nav.logout")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border space-y-2">
      <Link href="/login" onClick={onClose}>
        <Button variant="outline" className="w-full" data-testid="mobile-button-login">
          <LogIn className="w-4 h-4 mr-2" />
          {t("nav.login")}
        </Button>
      </Link>
      <Link href="/p/online-forklift-operator-training" onClick={onClose}>
        <Button className="w-full bg-accent text-accent-foreground border-accent-border" data-testid="mobile-button-cta">
          {t("cta.getCertified")}
        </Button>
      </Link>
    </div>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { t } = useTranslation();
  const [location] = useLocation();

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const isTrainingActive =
    location.startsWith("/training-programs") ||
    location.startsWith("/online-training") ||
    location.startsWith("/in-person-training") ||
    location.startsWith("/hands-on-training") ||
    location.startsWith("/train-the-trainer") ||
    location.startsWith("/locations");

  const isBusinessActive = location.startsWith("/business") || location.startsWith("/request-quote");

  const isResourcesActive =
    location.startsWith("/blog") ||
    location.startsWith("/support") ||
    location.startsWith("/contact");

  const trainingCategories = [
    { label: t("nav.inPersonTraining"), href: "/in-person-training" },
    { label: t("nav.onlineTraining"), href: "/online-training" },
    { label: t("nav.trainTheTrainer"), href: "/train-the-trainer" },
    { label: t("nav.viewAllPrograms"), href: "/training-programs" },
  ];

  const trainingLocations = [
    { label: t("nav.sanDiego"), href: "/locations/san-diego" },
  ];

  const businessLinks = [
    { label: t("nav.teamTraining"), href: "/business" },
    { label: t("nav.getQuote"), href: "/request-quote" },
    { label: t("nav.businessProducts"), href: "/business/products" },
    { label: t("nav.businessFaq"), href: "/business/faq" },
  ];

  const resourceLinks = [
    // Blog link hidden until blog content exists
    { label: t("nav.faq"), href: "/faq" },
    { label: t("nav.support"), href: "/support" },
    { label: t("nav.contact"), href: "/contact" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="lg:hidden" data-testid="button-mobile-menu">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-bold text-lg">{t("nav.menu")}</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <div>
              <button
                className={`flex items-center justify-between w-full px-6 py-3 text-sm font-medium transition-colors ${
                  isTrainingActive ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => toggleSection("training")}
                aria-expanded={expandedSection === "training"}
                data-testid="mobile-nav-training-toggle"
              >
                {t("nav.training")}
                <ChevronRight className={`w-4 h-4 transition-transform ${expandedSection === "training" ? "rotate-90" : ""}`} />
              </button>
              {expandedSection === "training" && (
                <div className="pb-2">
                  <span className="block px-8 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("nav.programs")}
                  </span>
                  {trainingCategories.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-10 py-2 text-sm transition-colors ${
                        location.startsWith(item.href) ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                      onClick={() => setOpen(false)}
                      data-testid={`mobile-nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <span className="block px-8 py-1.5 mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("nav.trainingLocations")}
                  </span>
                  {trainingLocations.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-10 py-2 text-sm transition-colors ${
                        location === item.href ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                      onClick={() => setOpen(false)}
                      data-testid={`mobile-nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                className={`flex items-center justify-between w-full px-6 py-3 text-sm font-medium transition-colors ${
                  isBusinessActive ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => toggleSection("business")}
                aria-expanded={expandedSection === "business"}
                data-testid="mobile-nav-business-toggle"
              >
                {t("nav.forBusiness")}
                <ChevronRight className={`w-4 h-4 transition-transform ${expandedSection === "business" ? "rotate-90" : ""}`} />
              </button>
              {expandedSection === "business" && (
                <div className="pb-2">
                  {businessLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-10 py-2 text-sm transition-colors ${
                        location === item.href ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                      onClick={() => setOpen(false)}
                      data-testid={`mobile-nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                className={`flex items-center justify-between w-full px-6 py-3 text-sm font-medium transition-colors ${
                  isResourcesActive ? "text-foreground" : "text-muted-foreground"
                }`}
                onClick={() => toggleSection("resources")}
                aria-expanded={expandedSection === "resources"}
                data-testid="mobile-nav-resources-toggle"
              >
                {t("nav.resources")}
                <ChevronRight className={`w-4 h-4 transition-transform ${expandedSection === "resources" ? "rotate-90" : ""}`} />
              </button>
              {expandedSection === "resources" && (
                <div className="pb-2">
                  {resourceLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-10 py-2 text-sm transition-colors ${
                        location === item.href ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                      onClick={() => setOpen(false)}
                      data-testid={`mobile-nav-${item.href.replace(/^\//, "").replace(/\//g, "-")}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <MobileNavActions onClose={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HeaderActions() {
  const { user, isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (isAuthenticated && user) {
    const isAdmin = user.role === "super_admin" || user.role === "admin";
    const dashboardLink = isAdmin ? "/admin" : user.role === "group_admin" ? "/group" : "/dashboard";
    const dashboardLabel = isAdmin ? t("nav.admin") : user.role === "group_admin" ? t("nav.crew") : t("nav.dashboard");
    const DashIcon = isAdmin ? Shield : user.role === "group_admin" ? Users : LayoutDashboard;

    return (
      <>
        <Link href="/cart" className="relative hidden sm:flex">
          <Button variant="ghost" size="sm" data-testid="button-cart">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="text-cart-count">{cartCount}</span>
            )}
          </Button>
        </Link>
        <Link href={dashboardLink} className="hidden lg:flex">
          <Button variant="ghost" size="sm" data-testid="button-dashboard">
            <DashIcon className="w-4 h-4 mr-1.5" />
            {dashboardLabel}
          </Button>
        </Link>
        {user.role === "group_admin" && (
          <Link href="/dashboard" className="hidden lg:flex">
            <Button variant="ghost" size="sm" data-testid="button-personal-dashboard">
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              {t("nav.dashboard")}
            </Button>
          </Link>
        )}
        <Button variant="ghost" size="sm" className="hidden lg:flex" onClick={() => { logout(); setLocation("/"); }} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-1.5" />
          {t("nav.logout")}
        </Button>
      </>
    );
  }

  return (
    <>
      <Link href="/cart" className="relative flex">
        <Button variant="ghost" size="sm" data-testid="button-cart">
          <ShoppingCart className="w-4 h-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="text-cart-count">{cartCount}</span>
          )}
        </Button>
      </Link>
      <Link href="/login" className="hidden lg:flex">
        <Button variant="ghost" size="sm" data-testid="button-login">
          <LogIn className="w-4 h-4 mr-1.5" />
          {t("nav.login")}
        </Button>
      </Link>
      <Link href="/p/online-forklift-operator-training" className="hidden sm:block">
        <Button size="sm" className="bg-accent text-accent-foreground border-accent-border" data-testid="button-header-cta">
          {t("cta.getCertified")}
        </Button>
      </Link>
    </>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border"
          : "bg-background border-b border-transparent"
      }`}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/" className="flex items-center shrink-0" data-testid="link-logo">
            <Logo variant="navbar" />
          </Link>

          <DesktopNav />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <HeaderActions />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
