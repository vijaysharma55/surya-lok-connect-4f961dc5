import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Phone, MessageCircle, X } from "lucide-react";
import { SITE, telLink, waLink } from "@/lib/site";
import { SunLogo } from "@/components/SunLogo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useCms";

const defaultNav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();
  const navItems = settings?.nav_links?.length ? settings.nav_links : defaultNav;
  const siteName = settings?.site_name || SITE.name;
  const tagline = settings?.brand_tagline || "CSR • Solar • Property — Mithapur, Patna";
  const phones = settings?.phones?.length ? settings.phones : SITE.phones;
  const email = settings?.email || SITE.email;
  const compliance = settings?.compliance?.length ? settings.compliance : SITE.compliance;
  const logoUrl = settings?.logo_url;
  const waNumber = settings?.whatsapp_number;
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello SLKF, I'd like to know more about your services.")}`
    : waLink("Hello SLKF, I'd like to know more about your services.");

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border shadow-card">
      {/* Top trust strip */}
      <div className="hidden md:block bg-foreground text-background">
        <div className="container-tight flex items-center justify-between py-1.5 text-xs">
          <div className="flex items-center gap-3">
            {compliance.map((c) => (
              <span
                key={c}
                className="rounded-sm bg-primary/20 px-2 py-0.5 font-medium text-primary"
              >
                {c}
              </span>
            ))}
            <span className="text-background/80">Registered NGO • Patna, Bihar</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={telLink(phones[0])}
              className="flex items-center gap-1.5 hover:text-primary transition"
            >
              <Phone className="h-3.5 w-3.5" /> {phones[0]}{phones[1] ? ` / ${phones[1]}` : ""}
            </a>
            <a
              href={`mailto:${email}`}
              className="hover:text-primary transition"
            >
              {email}
            </a>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="container-tight flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3 group">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-10 w-10 rounded object-contain" />
          ) : (
            <SunLogo size={42} className="transition-transform group-hover:rotate-45 duration-500" />
          )}
          <div className="leading-tight">
            <div className="font-semibold text-base sm:text-lg text-foreground">
              {siteName}
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground font-medium">
              {tagline}
            </div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "text-secondary bg-accent"
                    : "text-foreground hover:bg-accent"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
          >
            <a href={telLink()}>
              <Phone className="h-4 w-4" /> Call
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
          >
            <a
              href={waLink("Hello SLKF, I'd like to know more about your services.")}
              target="_blank"
              rel="noopener"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <SunLogo size={32} />
                  <span className="font-semibold text-foreground">SLKF</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-md text-base font-medium transition ${
                        isActive
                          ? "text-secondary bg-accent"
                          : "text-foreground hover:bg-accent"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-6 space-y-2 border-t border-border pt-4">
                <a
                  href={telLink(SITE.phones[0])}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm hover:bg-accent"
                >
                  <Phone className="h-4 w-4 text-secondary" /> {SITE.phones[0]}
                </a>
                <a
                  href={telLink(SITE.phones[1])}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm hover:bg-accent"
                >
                  <Phone className="h-4 w-4 text-secondary" /> {SITE.phones[1]}
                </a>
                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm hover:bg-accent break-all"
                >
                  {SITE.email}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
