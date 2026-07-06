import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, BookOpen, TrendingUp, Award, ArrowLeft, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function GroupSidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { title: t("group.dashboard"), href: "/group", icon: LayoutDashboard },
    { title: t("group.members"), href: "/group/members", icon: Users },
    { title: t("group.seatAssignments"), href: "/group/seats", icon: BookOpen },
    { title: t("group.progress"), href: "/group/progress", icon: TrendingUp },
    { title: t("group.certifications"), href: "/group/certifications", icon: Award },
    { title: t("compliance.title"), href: "/compliance-dashboard", icon: ClipboardCheck },
  ];

  return (
    <Sidebar data-testid="group-sidebar">
      <SidebarContent>
        <SidebarGroup>
          <div className="p-4 pb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-back-dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span>{t("group.backToDashboard")}</span>
              </Button>
            </Link>
          </div>
          <SidebarGroupLabel>{t("group.crewAdmin")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/group" && location.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} data-testid={`link-group-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface GroupLayoutProps {
  children: React.ReactNode;
}

export default function GroupLayout({ children }: GroupLayoutProps) {
  const { t } = useTranslation();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="group-sidebar-layout flex min-h-[600px] w-full">
        <GroupSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 p-2 border-b">
            <SidebarTrigger data-testid="button-group-sidebar-toggle" />
            <span className="text-sm font-medium text-muted-foreground">{t("group.crewAdmin")}</span>
          </div>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
