import { Sun } from "lucide-react";
import { Seo } from "@/components/Seo";
import { ServiceDetailLayout } from "@/components/ServiceDetailLayout";
import img from "@/assets/service-solar.jpg";

const ServiceSolar = () => (
  <>
    <Seo
      title="Solar Energy Solutions — Home, Farm & Office"
      description="Solar installation, government subsidy support and net-metering for homes, offices, farms and schools in Bihar. 5-year warranty."
      path="/services/solar"
    />
    <ServiceDetailLayout
      icon={Sun}
      eyebrow="Solar Services"
      title="Solar that pays for itself"
      intro="Reduce electricity costs to near-zero with rooftop and ground-mount solar systems — from a single home to a school or farm pump. We handle subsidy paperwork and net-metering setup."
      image={img}
      imageAlt="Technicians installing rooftop solar panels"
      features={[
        "Solar installation: home, office, farm, school",
        "Government subsidy paperwork & approvals",
        "Net-metering setup with the electricity board",
        "On-grid & off-grid system design",
        "Solar water pumps for agriculture",
      ]}
      benefits={[
        "Electricity cost reduced to near zero",
        "5-year product warranty on key components",
        "Government subsidy passed on to customer",
        "Free site survey & system sizing",
      ]}
      faqs={[
        { q: "How much subsidy can I get?", a: "Subsidies depend on system size and the latest central/state schemes. We calculate exact eligibility during the free site survey." },
        { q: "What is net-metering?", a: "Excess solar power generated is exported to the grid and adjusted against your consumption — significantly cutting your bill." },
        { q: "How long does installation take?", a: "Typical residential installations are completed within 5–10 working days after approvals." },
      ]}
      whatsappPrefill="Hi SLKF, I'd like a quote for solar installation."
    />
  </>
);

export default ServiceSolar;
