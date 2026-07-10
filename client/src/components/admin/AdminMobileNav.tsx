import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sun,
  CalendarDays,
  Target,
  DollarSign,
  TrendingUp,
  Menu,
  MoreHorizontal,
  Users,
  Award,
  Clock,
  CalendarClock,
  Tag,
  Repeat,
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Building2,
  FileText,
  ScrollText,
  Globe,
} from "lucide-react";

/**
 * App-style bottom tab bar for the admin on phones (hidden ≥ md, where the
 * sidebar takes over). The five tabs are the operator's daily loop; "More"
 * opens a sheet with everything else. Simple words on purpose — the daily
 * operator reads English as a second language.
 */

type Tab = { key: string; labelKey: string; fallback: string; url: string; icon: typeof Sun };

const TABS: Tab[] = [
  { key: "today", labelKey: "adminUx.navToday", fallback: "Today", url: "/admin", icon: Sun },
  { key: "schedule", labelKey: "adminUx.navSchedule", fallback: "Schedule", url: "/admin/bookings", icon: CalendarDays },
  { key: "leads", labelKey: "adminUx.navLeads", fallback: "Leads", url: "/admin/leads", icon: Target },
  { key: "money", labelKey: "adminUx.navMoney", fallback: "Money", url: "/admin/money", icon: DollarSign },
];

const MORE_ITEMS: Tab[] = [
  { key: "analytics", labelKey: "adminUx.navAnalytics", fallback: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { key: "customers", labelKey: "adminUx.navCustomers", fallback: "Customers", url: "/admin/users", icon: Users },
  { key: "certificates", labelKey: "adminUx.navCertificates", fallback: "Certificates", url: "/admin/certificates", icon: Award },
  { key: "bookings", labelKey: "adminUx.navBookings", fallback: "All Bookings", url: "/admin/bookings", icon: Clock },
  { key: "availability", labelKey: "adminUx.navAvailability", fallback: "Availability", url: "/admin/sessions", icon: CalendarClock },
  { key: "standing", labelKey: "adminUx.navStanding", fallback: "Weekly Sessions", url: "/admin/standing-sessions", icon: Repeat },
  { key: "discounts", labelKey: "adminUx.navDiscounts", fallback: "Discounts", url: "/admin/discounts", icon: Tag },
];

const MORE_ITEMS_SUPER: Tab[] = [
  { key: "overview", labelKey: "adminUx.navOverview", fallback: "Business Overview", url: "/admin/overview", icon: LayoutDashboard },
  { key: "reports", labelKey: "adminUx.navReports", fallback: "Reports", url: "/admin/reports", icon: BarChart3 },
  { key: "courses", labelKey: "adminUx.navCourses", fallback: "Courses", url: "/admin/courses", icon: BookOpen },
  { key: "companies", labelKey: "adminUx.navCompanies", fallback: "Companies", url: "/admin/companies", icon: Building2 },
  { key: "quotes", labelKey: "adminUx.navQuotes", fallback: "Quotes", url: "/admin/quotes", icon: FileText },
  { key: "seo", labelKey: "adminUx.navSeoHealth", fallback: "SEO Health", url: "/admin/seo-health", icon: Globe },
  { key: "audit", labelKey: "adminUx.navAuditLog", fallback: "Audit Log", url: "/admin/audit-log", icon: ScrollText },
];

export default function AdminMobileNav() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isSuperAdmin = user?.role === "super_admin";

  const isActive = (url: string) => {
    if (url === "/admin") return location === "/admin" || location === "/admin/today";
    return location.startsWith(url);
  };
  const moreActive = !TABS.some((tab) => isActive(tab.url));

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]"
      data-testid="admin-mobile-nav"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = isActive(tab.url);
          return (
            <Link
              key={tab.key}
              href={tab.url}
              className={`flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium transition-colors ${
                active ? "text-accent-foreground" : "text-muted-foreground"
              }`}
              data-testid={`tab-admin-${tab.key}`}
            >
              <span className={`flex items-center justify-center h-7 w-12 rounded-full ${active ? "bg-accent" : ""}`}>
                <tab.icon className="h-5 w-5" />
              </span>
              {t(tab.labelKey, { defaultValue: tab.fallback })}
            </Link>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={`flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] font-medium transition-colors ${
                moreActive ? "text-accent-foreground" : "text-muted-foreground"
              }`}
              data-testid="tab-admin-more"
            >
              <span className={`flex items-center justify-center h-7 w-12 rounded-full ${moreActive ? "bg-accent" : ""}`}>
                <Menu className="h-5 w-5" />
              </span>
              {t("adminUx.navMore", { defaultValue: "More" })}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto rounded-t-2xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <SheetHeader className="text-left">
              <SheetTitle>{t("adminUx.moreTitle", { defaultValue: "More" })}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 mt-4" data-testid="admin-more-grid">
              {[...MORE_ITEMS, ...(isSuperAdmin ? MORE_ITEMS_SUPER : [])].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    navigate(item.url);
                  }}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-xs font-medium hover:border-accent transition-colors"
                  data-testid={`more-admin-${item.key}`}
                >
                  <item.icon className="h-6 w-6 text-brand-dark dark:text-accent" />
                  <span className="text-center leading-tight">{t(item.labelKey, { defaultValue: item.fallback })}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
