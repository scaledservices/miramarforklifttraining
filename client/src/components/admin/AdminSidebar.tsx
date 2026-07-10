import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ShoppingCart,
  GraduationCap,
  Award,
  CreditCard,
  ScrollText,
  Mail,
  Globe,
  Activity,
  CalendarDays,
  CalendarClock,
  Clock,
  UserCheck,
  UserCog,
  Target,
  Building2,
  BarChart3,
  TrendingUp,
  FileText,
  Sun,
  DollarSign,
  Tag,
  Repeat,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { title: string; url: string; icon: typeof Sun };

// The operator (admin role) gets a slim, phone-first menu. Super-admin sees everything.
const operateItems: NavItem[] = [
  { title: "Today", url: "/admin", icon: Sun },
  { title: "Bookings", url: "/admin/bookings", icon: Clock },
  { title: "Availability", url: "/admin/sessions", icon: CalendarClock },
  { title: "Standing Sessions", url: "/admin/standing-sessions", icon: Repeat },
  { title: "Leads", url: "/admin/leads", icon: Target },
  { title: "Customers", url: "/admin/users", icon: Users },
  { title: "Money", url: "/admin/money", icon: DollarSign },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { title: "Discounts", url: "/admin/discounts", icon: Tag },
  { title: "Certificates", url: "/admin/certificates", icon: Award },
];

const salesItems: NavItem[] = [
  { title: "Quotes", url: "/admin/quotes", icon: FileText },
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Training Events", url: "/admin/training-events", icon: CalendarDays },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
  { title: "Overview", url: "/admin/overview", icon: LayoutDashboard },
];

const managementItems: NavItem[] = [
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Enrollments", url: "/admin/enrollments", icon: GraduationCap },
  { title: "Card Orders", url: "/admin/card-orders", icon: CreditCard },
  { title: "Instructor Apps", url: "/admin/instructor-applications", icon: UserCheck },
  { title: "Instructors", url: "/admin/instructors", icon: UserCog },
];

const systemItems: NavItem[] = [
  { title: "Audit Log", url: "/admin/audit-log", icon: ScrollText },
  { title: "Email Outbox", url: "/admin/email-outbox", icon: Mail },
  { title: "SEO Pages", url: "/admin/seo-pages", icon: Globe },
  { title: "SEO Health", url: "/admin/seo-health", icon: Activity },
];

function NavGroup({ label, items, isActive }: { label: string; items: NavItem[]; isActive: (url: string) => boolean }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function AdminSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const isActive = (url: string) => {
    if (url === "/admin") return location === "/admin" || location === "/admin/today";
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <span className="text-lg font-semibold" data-testid="text-admin-title">
          Admin Panel
        </span>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Operate" items={operateItems} isActive={isActive} />
        {isSuperAdmin && <NavGroup label="Sales" items={salesItems} isActive={isActive} />}
        {isSuperAdmin && <NavGroup label="Management" items={managementItems} isActive={isActive} />}
        {isSuperAdmin && <NavGroup label="System" items={systemItems} isActive={isActive} />}
      </SidebarContent>
    </Sidebar>
  );
}
