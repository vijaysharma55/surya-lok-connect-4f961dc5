import { Link } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  HandHeart,
  Sun,
  Home as HomeIcon,
  ShieldCheck,
  Users,
  Building2,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceCard } from "@/components/ServiceCard";
import { SITE, telLink, waLink } from "@/lib/site";

import heroImg from "@/assets/hero-sunrise.jpg";
import csrImg from "@/assets/service-csr.jpg";
import solarImg from "@/assets/service-solar.jpg";
import propertyImg from "@/assets/service-property.jpg";
import g1 from "@/assets/csr-women-skills.jpg";
import g2 from "@/assets/csr-health-camp.jpg";
import g3 from "@/assets/csr-plantation.jpg";
import g4 from "@/assets/solar-residential.jpg";
import g5 from "@/assets/solar-farm-pump.jpg";
import g6 from "@/assets/property-plot.jpg";
import g7 from "@/assets/property-farmhouse.jpg";
import g8 from "@/assets/team.jpg";

const Home = () => {
  return (
    <>
      <Seo
        title="Surya Lok Kalyan Foundation — CSR, Solar & Property in Bihar"
        description="Registered NGO in Patna delivering CSR projects, solar energy installations, and verified property services across Bihar with full transparency."
        path="/"
      />

      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Indian village sunrise with rooftop solar panels and farmers"
          width={1920}
          height={1080}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero-overlay)" }}
        />
        <div className="relative container-tight py-20 sm:py-28 lg:py-36 text-white">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 bg-primary/95 text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-5">
              <Sun className="h-3.5 w-3.5" /> 80G • 12A • 10AC Registered
            </span>
            <h1 className="font-hindi text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg">
              ☀️ सूरज की रोशनी से<br />समाज की रोशनी तक
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/95 max-w-xl leading-relaxed">
              CSR Projects | Solar Energy | Property Solutions —{" "}
              <span className="font-hindi">सब एक छत के नीचे</span>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))] font-semibold shadow-warm"
              >
                <Link to="/contact">
                  <span className="font-hindi">हमसे जुड़ें</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground backdrop-blur"
              >
                <Link to="/projects">
                  <span className="font-hindi">Projects देखें</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-foreground text-background">
        <div className="container-tight grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 text-center">
          {[
            { v: "80G", l: "Tax Exemption" },
            { v: "12A", l: "Income Tax Reg." },
            { v: "10AC", l: "Provisional Cert." },
            { v: "Patna", l: "Bihar, India" },
          ].map((i) => (
            <div key={i.v}>
              <div className="text-xl sm:text-2xl font-bold text-primary">{i.v}</div>
              <div className="text-xs text-background/75">{i.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT SNIPPET */}
      <section className="container-tight py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
              About SLKF
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground">
              A serious organization built on transparency
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              <span className="font-hindi text-foreground font-medium">
                Surya Lok Kalyan Foundation
              </span>{" "}
              was established on {SITE.established} with a clear mission — to serve people,
              cooperate with government initiatives, and run every project on a transparent,
              accountable system.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              From CSR programs and solar energy adoption to verified property services, we
              operate locally in Mithapur, Patna and scale across Bihar — with documentation
              you can trust.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                asChild
                className="bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
              >
                <Link to="/about">
                  Read more <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-foreground/20"
              >
                <a href={waLink("Hi SLKF, I want to learn more about your foundation.")} target="_blank" rel="noopener">
                  <MessageCircle className="h-4 w-4" /> Chat with us
                </a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={g8}
              alt="SLKF team in Patna office"
              loading="lazy"
              decoding="async"
              className="rounded-2xl shadow-trust w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-5 -left-5 hidden sm:block bg-primary text-primary-foreground rounded-xl p-4 shadow-warm max-w-[200px]">
              <div className="text-3xl font-bold">3+</div>
              <div className="text-xs font-semibold">Service verticals under one roof</div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-[hsl(var(--background-soft))] py-16 sm:py-20">
        <div className="container-tight">
          <SectionHeading
            eyebrow="What we do"
            title="Three services. One trusted foundation."
            subtitle="From CSR fund utilization to solar installation and verified property deals — we make every step transparent."
          />
          <div className="grid md:grid-cols-3 gap-6">
            <ServiceCard
              icon={HandHeart}
              title="CSR Project Management"
              description="Schools, hospitals, skill centers and women employment programs — execute your CSR with measurable, transparent impact."
              benefits={["80G tax benefit", "Brand value", "Real social impact"]}
              to="/services/csr"
              image={csrImg}
              imageAlt="Children receiving notebooks at a CSR-supported classroom"
            />
            <ServiceCard
              icon={Sun}
              title="Solar Energy Solutions"
              description="End-to-end solar for homes, offices, farms and schools — including subsidy paperwork and net-metering."
              benefits={["Govt. subsidy support", "Near-zero electricity bills", "5-year warranty"]}
              to="/services/solar"
              image={solarImg}
              imageAlt="Technicians installing rooftop solar panels"
            />
            <ServiceCard
              icon={HomeIcon}
              title="Property Buy & Sell"
              description="Verified land, plots and farmhouses with legal verification and registry support — clean documents, no surprises."
              benefits={["Zero brokerage", "Clean documents", "Registry support"]}
              to="/services/property"
              image={propertyImg}
              imageAlt="Surveyor reviewing land documents on a verified plot"
            />
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="container-tight py-16 sm:py-20">
        <SectionHeading
          eyebrow="Why choose SLKF"
          title="Trust isn't claimed. It's documented."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Eye, title: "Transparent Work", text: "Every project tracked with online records and reports." },
            { icon: Users, title: "Local + Scalable", text: "Patna roots, Bihar-wide execution capacity." },
            { icon: Building2, title: "Multi-Service", text: "CSR, solar and property — one accountable partner." },
            { icon: ShieldCheck, title: "Trust-Oriented", text: "80G, 12A, 10AC compliant. Documents over claims." },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-warm transition"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section className="bg-[hsl(var(--background-soft))] py-16 sm:py-20">
        <div className="container-tight">
          <SectionHeading
            eyebrow="Our work"
            title="Projects across CSR, solar and property"
            subtitle="A glimpse of recent activities. Visit the projects page for the full gallery."
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[g1, g2, g3, g4, g5, g6, g7, g8].map((src, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-xl shadow-card"
              >
                <img
                  src={src}
                  alt={`SLKF project ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
              <Link to="/projects">
                View all projects <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="container-tight py-16">
        <div className="rounded-3xl gradient-trust text-white p-8 sm:p-12 text-center shadow-trust">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to start a project with us?
          </h2>
          <p className="mt-3 text-white/90 max-w-xl mx-auto">
            Call directly or send us a WhatsApp message — we usually respond within working hours.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]"
            >
              <a href={telLink()}>
                <Phone className="h-5 w-5" /> Call {SITE.phones[0]}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white hover:text-foreground"
            >
              <a href={waLink("Hi SLKF, I'd like to discuss a project.")} target="_blank" rel="noopener">
                <MessageCircle className="h-5 w-5" /> WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
