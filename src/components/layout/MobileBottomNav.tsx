import { NavLink, useLocation } from "react-router-dom";
import { Home, Briefcase, UserPlus, LogIn, Shield, IdCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
};

const baseItems: Item[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/apply", label: "Volunteer", icon: UserPlus, matchPaths: ["/apply"] },
  { to: "/my-profile", label: "My ID", icon: IdCard, matchPaths: ["/my-profile"] },
];

export const MobileBottomNav = () => {
  const { user, isAdmin } = useAuth();
  const { pathname } = useLocation();

  const profileItem: Item = isAdmin
    ? { to: "/admin", label: "Admin", icon: Shield, matchPaths: ["/admin"] }
    : user
      ? { to: "/admin", label: "Profile", icon: Shield, matchPaths: ["/admin"] }
      : { to: "/auth", label: "Login", icon: LogIn, matchPaths: ["/auth"] };

  const items: Item[] = [...baseItems, profileItem];

  const isItemActive = (item: Item) => {
    if (item.to === "/") return pathname === "/";
    if (item.matchPaths) return item.matchPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
    return pathname === item.to;
  };

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-t border-border shadow-[0_-4px_12px_-4px_hsl(var(--foreground)/0.08)] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;
          return (
            <li key={item.to + item.label}>
              <NavLink
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-2 py-1.5 text-[11px] font-medium",
                  "transition-colors duration-200 active:scale-95 transition-transform",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "scale-110")} />
                </span>
                <span className="leading-none">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
