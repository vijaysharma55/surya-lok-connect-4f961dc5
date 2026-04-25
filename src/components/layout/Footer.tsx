import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Globe } from "lucide-react";
import { SITE, telLink } from "@/lib/site";
import { SunLogo } from "@/components/SunLogo";

export const Footer = () => {
  return (
    <footer className="mt-20 bg-foreground text-background">
      <div className="container-tight py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <SunLogo size={40} />
            <div>
              <div className="font-semibold text-base">{SITE.name}</div>
              <div className="text-xs text-background/70">CSR • Solar • Property</div>
            </div>
          </div>
          <p className="text-sm text-background/80 max-w-md leading-relaxed">
            A registered foundation working transparently across Bihar to deliver CSR projects,
            solar energy solutions, and verified property services — all under one trusted roof.
          </p>
          <div className="flex gap-2 mt-4">
            {SITE.compliance.map((c) => (
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
              {SITE.address}
            </li>
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              {SITE.hours}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a href={telLink(SITE.phones[0])} className="hover:text-primary">{SITE.phones[0]}</a>
              <span className="text-background/50">/</span>
              <a href={telLink(SITE.phones[1])} className="hover:text-primary">{SITE.phones[1]}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a href={`mailto:${SITE.email}`} className="hover:text-primary break-all">{SITE.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <a href={SITE.url} className="hover:text-primary">{SITE.domain}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="container-tight py-4 text-xs text-background/60 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <span className="flex gap-3">
            <span>Designed for transparency & impact.</span>
            <Link to="/auth" className="opacity-60 hover:opacity-100 hover:text-primary">Admin</Link>
          </span>
        </div>
      </div>
    </footer>
  );
};
