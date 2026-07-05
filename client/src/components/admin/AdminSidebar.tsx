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
  ClipboardList,
  UserCheck,
  UserCog,
  Target,
  Building2,
  BarChart3,
  FileText,
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

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Courses", url: "/admin/courses", icon: BookOpen },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Enrollments", url: "/admin/enrollments", icon: GraduationCap },
  { title: "Certificates", url: "/admin/certificates", icon: Award },
  { title: "Card Orders", url: "/admin/card-orders", icon: CreditCard },
  { title: "Audit Log", url: "/admin/audit-log", icon: ScrollText },
  { title: "Email Outbox", url: "/admin/email-outbox", icon: Mail },
  { title: "SEO Pages", url: "/admin/seo-pages", icon: Globe },
  { title: "SEO Health", url: "/admin/seo-health", icon: Activity },
];

const operationsItems = [
  { title: "Leads", url: "/admin/leads", icon: Target },
  { title: "Quotes", url: "/admin/quotes", icon: FileText },
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
];

const onsiteItems = [
  { title: "Training Requests", url: "/admin/onsite-requests", icon: ClipboardList },
  { title: "Training Events", url: "/admin/training-events", icon: CalendarDays },
  { title: "Bookings", url: "/admin/bookings", icon: Clock },
  { title: "Availability Rules", url: "/admin/sessions", icon: CalendarClock },
  { title: "Instructor Apps", url: "/admin/instructor-applications", icon: UserCheck },
  { title: "Instructors", url: "/admin/instructors", icon: UserCog },
];

export default function AdminSidebar() {
  const [location] = useLocation();

  const isActive = (url: string) => {
    if (url === "/admin") return location === "/admin";
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
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
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
        <SidebarGroup>
          <SidebarGroupLabel>On-Site Training</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {onsiteItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}
