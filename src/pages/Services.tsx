import { HandHeart, Sun, Home as HomeIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { Seo } from "@/components/Seo";
import { breadcrumbJsonLd, serviceJsonLd } from "@/lib/jsonld";
import { ServiceCard } from "@/components/ServiceCard";
import csrImg from "@/assets/service-csr.jpg";
import solarImg from "@/assets/service-solar.jpg";
import propertyImg from "@/assets/service-property.jpg";
import { usePublishedServices } from "@/hooks/useCms";

const slugFallback: Record<string, string> = { csr: csrImg, solar: solarImg, property: propertyImg };

const Services = () => {
  const services = usePublishedServices();
  const list = services && services.length > 0 ? services : [
    { id: "csr", slug: "csr", title: "CSR Project Management", short_description: "End-to-end planning and execution of CSR initiatives with measurable outcomes and transparent reporting.", description: null, icon: "HandHeart", image_url: null, benefits: ["80G tax benefit", "Strong brand value", "Verifiable impact"], cta_label: null, cta_link: null, sort_order: 1, published: true },
    { id: "solar", slug: "solar", title: "Solar Energy Solutions", short_description: "Solar installation for homes, offices, farms and institutions — with subsidy paperwork and net-metering.", description: null, icon: "Sun", image_url: null, benefits: ["Govt. subsidy", "Near-zero bills", "5-year warranty"], cta_label: null, cta_link: null, sort_order: 2, published: true },
    { id: "property", slug: "property", title: "Property Buy & Sell", short_description: "Verified land, plots and farmhouses with legal verification and registry support.", description: null, icon: "Home", image_url: null, benefits: ["No brokerage", "Clean documents", "Registry support"], cta_label: null, cta_link: null, sort_order: 3, published: true },
  ];

  return (
    <>
      <Seo
        title="Services — CSR, Solar & Property"
        description="Explore SLKF's three core services: CSR project management, solar energy installations, and verified property buy/sell — all under one trusted roof."
        path="/services"
        keywords={["CSR services Bihar", "solar installation Patna", "property dealer Patna", "NGO services", "SLKF services"]}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
          serviceJsonLd("CSR Project Management", "End-to-end CSR program design, implementation and reporting for corporates.", "/services/csr"),
          serviceJsonLd("Solar Energy Solutions", "Rooftop and ground-mount solar installations for homes, businesses and institutions.", "/services/solar"),
          serviceJsonLd("Property Services", "Verified buy, sell and rental property services across Bihar.", "/services/property"),
        ]}
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
          {list.map((s) => {
            const Icon = ((Icons as any)[s.icon ?? ""] as any) || HandHeart;
            const img = s.image_url || slugFallback[s.slug] || csrImg;
            return (
              <ServiceCard
                key={s.id}
                icon={Icon}
                title={s.title}
                description={s.short_description || s.description || ""}
                benefits={(s.benefits as string[]) || []}
                to={`/services/${s.slug}`}
                image={img}
                imageAlt={s.title}
              />
            );
          })}
        </div>
      </section>
    </>
  );
};

export default Services;
