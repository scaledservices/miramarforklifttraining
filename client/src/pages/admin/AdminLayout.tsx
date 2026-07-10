import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarStyle = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3rem",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 border-b p-2 sticky top-0 z-50 bg-background">
            <SidebarTrigger data-testid="button-admin-sidebar-toggle" />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" data-testid="link-back-to-site">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Site
              </Link>
            </Button>
          </header>
          {/* Bottom padding on phones clears the fixed bottom tab bar */}
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto" data-testid="admin-main-content">
            {children}
          </main>
        </div>
      </div>
      <AdminMobileNav />
    </SidebarProvider>
  );
}
