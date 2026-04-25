import { CheckCircle2, Eye, Users, Handshake, Building2, ShieldCheck } from "lucide-react";
import { Seo } from "@/components/Seo";
import { orgJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { SectionHeading } from "@/components/SectionHeading";
import { SITE } from "@/lib/site";
import aboutImg from "@/assets/about-community.jpg";
import teamImg from "@/assets/team.jpg";

const About = () => (
  <>
    <Seo
      title="About SLKF — Mission, Vision & Compliance"
      description="Founded on 24 May 2026 in Mithapur, Patna, SLKF is a transparent foundation working across CSR, solar and property services with 80G, 12A and 10AC compliance."
      path="/about"
    />

    {/* HEADER */}
    <section className="gradient-warm">
      <div className="container-tight py-14 sm:py-20 text-center">
        <span className="text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
          About Us
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-foreground max-w-3xl mx-auto">
          Building trust through transparent action
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Surya Lok Kalyan Foundation (SLKF) is a registered organisation working at the
          intersection of social impact, clean energy and credible property services in Bihar.
        </p>
      </div>
    </section>

    {/* STORY */}
    <section className="container-tight py-16">
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <img
          src={aboutImg}
          alt="SLKF community engagement in a Bihar village"
          loading="lazy"
          decoding="async"
          className="rounded-2xl shadow-trust w-full aspect-[4/3] object-cover"
        />
        <div>
          <h2 className="text-3xl font-bold text-foreground">Our Story</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            <span className="font-hindi text-foreground font-medium">
              Surya Lok Kalyan Foundation
            </span>{" "}
            की स्थापना <span className="font-semibold text-foreground">{SITE.established}</span> को
            हुई। We were created to bring together three things that rural and semi-urban India
            urgently needs: well-executed CSR programs, accessible solar energy, and honest
            property dealings.
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Headquartered in Mithapur, Patna, SLKF works with corporate partners, government
            schemes, and local communities — and publishes records of every initiative so that
            trust is earned, not assumed.
          </p>
        </div>
      </div>
    </section>

    {/* PILLARS */}
    <section className="bg-[hsl(var(--background-soft))] py-16">
      <div className="container-tight">
        <SectionHeading
          eyebrow="Mission"
          title="Three pillars guide every decision"
          hindi="जनता की सेवा • सरकार के साथ सहयोग • पारदर्शी सिस्टम"
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, t: "Service to People", h: "जनता की सेवा", d: "Programs designed around real community needs — education, health, livelihoods." },
            { icon: Handshake, t: "Government Cooperation", h: "सरकार के साथ सहयोग", d: "Aligning with state and central schemes so every rupee is amplified." },
            { icon: Eye, t: "Transparent System", h: "पारदर्शी सिस्टम", d: "Documents, reports and records you can verify — no exaggeration." },
          ].map((p) => (
            <div key={p.t} className="bg-card rounded-2xl p-6 border border-border shadow-card">
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground">{p.t}</h3>
              <p className="font-hindi text-sm text-secondary mt-0.5">{p.h}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* TRUST POINTS */}
    <section className="container-tight py-16">
      <SectionHeading
        eyebrow="Why we're different"
        title="Trust points, not tall claims"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { t: "Transparent operations", d: "Project reports, photos, and utilization summaries shared with stakeholders." },
          { t: "Local presence in Patna", d: "Office in Mithapur with on-ground teams across Bihar districts." },
          { t: "Multi-sector capability", d: "CSR, solar and property handled by specialists under one roof." },
          { t: "Compliance-first", d: "Operates under 80G, 12A and 10AC certifications." },
        ].map((p) => (
          <div key={p.t} className="flex gap-3 p-5 bg-card rounded-xl border border-border">
            <CheckCircle2 className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">{p.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* COMPLIANCE */}
    <section className="bg-foreground text-background py-12">
      <div className="container-tight">
        <div className="flex items-center justify-center gap-2 mb-6 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Compliance</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {[
            { c: "80G", d: "Donors get tax exemption on contributions." },
            { c: "12A", d: "Income tax registration for non-profit operations." },
            { c: "10AC", d: "Provisional certificate confirming registered status." },
          ].map((x) => (
            <div key={x.c}>
              <div className="text-4xl font-bold text-primary">{x.c}</div>
              <p className="mt-1 text-sm text-background/80">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* TEAM */}
    <section className="container-tight py-16">
      <SectionHeading
        eyebrow="Our team"
        title="Local people. Professional standards."
        subtitle="A small, focused team with experience in social development, renewable energy and real-estate documentation."
      />
      <img
        src={teamImg}
        alt="SLKF team members standing together in their Patna office"
        loading="lazy"
        decoding="async"
        className="rounded-2xl shadow-trust w-full max-w-4xl mx-auto aspect-[16/10] object-cover"
      />
    </section>
  </>
);

export default About;
