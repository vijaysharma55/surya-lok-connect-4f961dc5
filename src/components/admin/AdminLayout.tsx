import { ReactNode } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Wrench,
  Image as ImageIcon,
  Inbox,
  Search,
  PanelTop,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { RoleDebugPanel } from "@/components/admin/RoleDebugPanel";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const allItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true, adminOnly: false },
  { title: "Members", url: "/admin/members", icon: Inbox, adminOnly: false },
  { title: "Volunteers", url: "/admin/applications", icon: Inbox, adminOnly: false },
  { title: "Coordinators", url: "/admin/coordinators", icon: Inbox, adminOnly: true },
  { title: "Pages", url: "/admin/pages", icon: FileText, adminOnly: true },
  { title: "Services", url: "/admin/services", icon: Wrench, adminOnly: true },
  { title: "Projects", url: "/admin/projects", icon: ImageIcon, adminOnly: true },
  { title: "Media", url: "/admin/media", icon: ImageIcon, adminOnly: true },
  { title: "Leads", url: "/admin/leads", icon: Inbox, adminOnly: true },
  { title: "SEO", url: "/admin/seo", icon: Search, adminOnly: true },
  { title: "Header & Footer", url: "/admin/header-footer", icon: PanelTop, adminOnly: true },
  { title: "Settings", url: "/admin/settings", icon: Settings, adminOnly: true },
];

function AdminSidebar() {
  const location = useLocation();
  const { signOut, user, isAdmin } = useAuth();
  const items = allItems.filter((i) => isAdmin || !i.adminOnly);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-1.5">
          <div className="text-sm font-bold">SLKF Admin</div>
          <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end
                  ? location.pathname === item.url
                  : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.end}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4" />
                <span>View website</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { user, isAdmin, isStaff, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Not authorized</h1>
          <p className="text-sm text-muted-foreground">Your account does not have admin access.</p>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>Back to site</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Seo title={`${title ? title + " | " : ""}SLKF Admin`} description="SLKF admin panel" noIndex />
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b bg-background px-3 sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className={cn("text-base font-semibold")}>{title ?? "Admin"}</h1>
          </header>
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
