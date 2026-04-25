import { Link } from "react-router-dom";
import { Phone, Mail, Facebook, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { SITE, telLink, waLink } from "@/lib/site";
import { SunLogo } from "@/components/SunLogo";
import { useSiteSettings } from "@/hooks/useCms";

export const Footer = () => {
  const settings = useSiteSettings();
  const siteName = settings?.site_name || SITE.name;
  const phones = settings?.phones?.length ? settings.phones : SITE.phones;
  const email = settings?.email || SITE.email;
  const logoUrl = settings?.logo_url;
  const tagline = settings?.brand_tagline || "CSR • Solar • Property — built on trust.";
  const social = settings?.social_links || {};
  const waNumber = settings?.whatsapp_number;
  const waHref = waNumber
    ? `https://wa.me/${waNumber}`
    : waLink("Hello SLKF, I'd like to connect.");

  const socials = [
    { label: "Facebook", icon: Facebook, href: social.facebook },
    { label: "Instagram", icon: Instagram, href: social.instagram },
    { label: "LinkedIn", icon: Linkedin, href: social.linkedin },
    { label: "WhatsApp", icon: MessageCircle, href: waHref },
  ].filter((s) => s.href);

  return (
    <footer className="mt-16 bg-foreground text-background">
      <div className="container-tight py-8 grid gap-6 md:gap-8 md:grid-cols-3 text-sm">
        {/* Col 1: Logo + tagline */}
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-9 w-9 rounded object-contain bg-background/5 p-1" />
            ) : (
              <SunLogo size={32} />
            )}
            <span className="font-semibold">{siteName}</span>
          </div>
          <p className="text-xs text-background/70 leading-relaxed max-w-xs">{tagline}</p>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2.5">
            Quick Links
          </h3>
          <ul className="space-y-1.5">
            <li><Link to="/" className="text-background/85 hover:text-primary transition-colors">Home</Link></li>
            <li><Link to="/services" className="text-background/85 hover:text-primary transition-colors">Services</Link></li>
            <li><Link to="/membership" className="text-background/85 hover:text-primary transition-colors">Membership</Link></li>
            <li><Link to="/contact" className="text-background/85 hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Col 3: Social + Contact */}
        <div>
          <h3 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2.5">
            Connect
          </h3>
          {socials.length > 0 && (
            <div className="flex gap-2 mb-3">
              {socials.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-background/20 text-background/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
          <ul className="space-y-1.5 text-background/85">
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
              <a href={telLink(phones[0])} className="hover:text-primary transition-colors">{phones[0]}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-primary transition-colors break-all">{email}</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Thin copyright bar with darker tone */}
      <div className="bg-black/40 border-t border-background/10">
        <div className="container-tight py-2.5 text-xs text-background/60 flex flex-col sm:flex-row gap-1 justify-between items-center">
          <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <Link to="/auth" className="opacity-60 hover:opacity-100 hover:text-primary transition">Admin</Link>
        </div>
      </div>
    </footer>
  );
};
