import { HandHeart, Sun, Home as HomeIcon } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SectionHeading } from "@/components/SectionHeading";
import { ServiceCard } from "@/components/ServiceCard";
import csrImg from "@/assets/service-csr.jpg";
import solarImg from "@/assets/service-solar.jpg";
import propertyImg from "@/assets/service-property.jpg";

const Services = () => (
  <>
    <Seo
      title="Services — CSR, Solar & Property"
      description="Explore SLKF's three core services: CSR project management, solar energy installations, and verified property buy/sell — all under one trusted roof."
      path="/services"
    />

    <section className="gradient-warm">
      <div className="container-tight py-14 sm:py-20 text-center">
        <span className="text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
          Our Services
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-foreground">
          Three services. One trusted partner.
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          We combine social impact, clean energy and property expertise — handled by specialists,
          delivered with documentation.
        </p>
      </div>
    </section>

    <section className="container-tight py-16">
      <div className="grid md:grid-cols-3 gap-6">
        <ServiceCard
          icon={HandHeart}
          title="CSR Project Management"
          description="End-to-end planning and execution of CSR initiatives with measurable outcomes and transparent reporting."
          benefits={["80G tax benefit", "Strong brand value", "Verifiable impact"]}
          to="/services/csr"
          image={csrImg}
          imageAlt="CSR classroom support program"
        />
        <ServiceCard
          icon={Sun}
          title="Solar Energy Solutions"
          description="Solar installation for homes, offices, farms and institutions — with subsidy paperwork and net-metering."
          benefits={["Govt. subsidy", "Near-zero bills", "5-year warranty"]}
          to="/services/solar"
          image={solarImg}
          imageAlt="Solar panel installation by technicians"
        />
        <ServiceCard
          icon={HomeIcon}
          title="Property Buy & Sell"
          description="Verified land, plots and farmhouses with legal verification and registry support."
          benefits={["No brokerage", "Clean documents", "Registry support"]}
          to="/services/property"
          image={propertyImg}
          imageAlt="Surveyor reviewing land documents"
        />
      </div>
    </section>
  </>
);

export default Services;
