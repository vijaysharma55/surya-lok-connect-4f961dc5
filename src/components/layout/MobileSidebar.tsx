import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu, X, Home, User, Image as ImageIcon, Users, ClipboardList,
  LayoutDashboard, LogOut, LogIn, Phone, Shield, MapPin,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SunLogo } from "@/components/SunLogo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PUBLIC_LINKS: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/my-profile", label: "My Profile", icon: User },
  { to: "/projects", label: "Resources & Media", icon: ImageIcon },
];

const STAFF_LINKS: NavItem[] = [
  { to: "/admin", label: "Stats Dashboard", icon: LayoutDashboard },
  { to: "/admin/applications", label: "Volunteer Applications", icon: ClipboardList },
  { to: "/admin/members", label: "Members List", icon: Users },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { user, isAdmin, isStaff, coordinatorDistricts, signOut } = useAuth();

  const close = () => setOpen(false);

  const roleLabel = isAdmin
    ? "Super Admin"
    : coordinatorDistricts.length === 1
      ? `${coordinatorDistricts[0]} Coordinator`
      : coordinatorDistricts.length > 1
        ? `Coordinator · ${coordinatorDistricts.length} districts`
        : user
          ? "Member"
          : "Guest";

  const displayName =
    (user?.user_metadata as any)?.display_name ||
    user?.email?.split("@")[0] ||
    "Welcome";

  const initials = displayName
    .split(/\s+/)
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      close();
      nav("/");
    } catch (e: any) {
      toast.error(e?.message ?? "Sign out failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[85vw] max-w-sm p-0 flex flex-col bg-background"
      >
        <SheetTitle className="sr-only">Main navigation</SheetTitle>

        {/* Profile header */}
        <div className="bg-gradient-to-br from-primary to-secondary text-primary-foreground p-5 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-full bg-background/20 backdrop-blur flex items-center justify-center font-bold text-base shrink-0 border border-background/30">
                {initials || <User className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-base truncate">{displayName}</div>
                <div className="text-xs opacity-90 truncate">
                  {user?.email ?? "Not signed in"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="p-1 -mr-1 rounded-md hover:bg-background/20 transition shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="bg-background/15 text-primary-foreground border-background/40 backdrop-blur"
            >
              {isAdmin ? <Shield className="h-3 w-3 mr-1" /> : isStaff ? <MapPin className="h-3 w-3 mr-1" /> : null}
              {roleLabel}
            </Badge>
          </div>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <SectionLabel>Navigation</SectionLabel>
          <ul className="px-2 space-y-1">
            {PUBLIC_LINKS.map((item) => (
              <SidebarLink key={item.to} item={item} onClick={close} />
            ))}
          </ul>

          {isStaff && (
            <>
              <SectionLabel className="mt-5">
                {isAdmin ? "Admin" : "Coordinator"}
              </SectionLabel>
              <ul className="px-2 space-y-1">
                {STAFF_LINKS.map((item) => (
                  <SidebarLink key={item.to} item={item} onClick={close} />
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-border p-3 space-y-2 safe-bottom">
          {user ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          ) : (
            <Button
              asChild
              className="w-full justify-start gap-2 bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
            >
              <Link to="/auth" onClick={close}>
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            </Button>
          )}
          <a
            href="tel:+919999999999"
            onClick={close}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition"
          >
            <Phone className="h-4 w-4" /> Helpline
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      {children}
    </div>
  );
}

function SidebarLink({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === "/"}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-secondary/15 text-secondary"
              : "text-foreground hover:bg-accent",
          )
        }
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    </li>
  );
}
