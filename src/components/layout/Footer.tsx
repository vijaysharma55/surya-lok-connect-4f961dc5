import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Globe } from "lucide-react";
import { SITE, telLink } from "@/lib/site";
import { SunLogo } from "@/components/SunLogo";
import { useSiteSettings } from "@/hooks/useCms";

export const Footer = () => {
  const settings = useSiteSettings();
  const siteName = settings?.site_name || SITE.name;
  const phones = settings?.phones?.length ? settings.phones : SITE.phones;
  const email = settings?.email || SITE.email;
  const address = settings?.address || SITE.address;
  const hours = settings?.hours || SITE.hours;
  const compliance = settings?.compliance?.length ? settings.compliance : SITE.compliance;
  const domain = settings?.domain || SITE.domain;
  const logoUrl = settings?.logo_url;
  const tagline = settings?.brand_tagline || "CSR • Solar • Property";
  const footerText = settings?.footer_text;

  return (
    <footer className="mt-20 bg-foreground text-background">
      <div className="container-tight py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 w-10 rounded object-contain bg-background/5 p-1" />
            ) : (
              <SunLogo size={40} />
            )}
            <div>
              <div className="font-semibold text-base">{siteName}</div>
              <div className="text-xs text-background/70">{tagline}</div>
            </div>
          </div>
          <p className="text-sm text-background/80 max-w-md leading-relaxed">
            {footerText ||
              "A registered foundation working transparently across Bihar to deliver CSR projects, solar energy solutions, and verified property services — all under one trusted roof."}
          </p>
          <div className="flex gap-2 mt-4">
            {compliance.map((c) => (
              <span
                key={c}
                className="rounded bg-primary/20 text-primary px-2 py-1 text-xs font-semibold"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
            <li><Link to="/services" className="hover:text-primary">Services</Link></li>
            <li><Link to="/projects" className="hover:text-primary">Projects</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">
            Contact
          </h3>
          <ul className="space-y-2 text-sm text-background/85">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              {address}
            </li>
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              {hours}
            </li>
            <li className="flex items-center gap-2 flex-wrap">
              <Phone className="h-4 w-4 text-primary" />
              {phones.map((p, i) => (
                <span key={p} className="flex items-center gap-2">
                  <a href={telLink(p)} className="hover:text-primary">{p}</a>
                  {i < phones.length - 1 && <span className="text-background/50">/</span>}
                </span>
              ))}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href={`mailto:${email}`} className="hover:text-primary break-all">{email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <a href={`https://${domain}`} className="hover:text-primary">{domain}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="container-tight py-4 text-xs text-background/60 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <span className="flex gap-3">
            <span>Designed for transparency & impact.</span>
            <Link to="/auth" className="opacity-60 hover:opacity-100 hover:text-primary">Admin</Link>
          </span>
        </div>
      </div>
    </footer>
  );
};
