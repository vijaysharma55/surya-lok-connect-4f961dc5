import { Home as HomeIcon } from "lucide-react";
import { Seo } from "@/components/Seo";
import { ServiceDetailLayout } from "@/components/ServiceDetailLayout";
import img from "@/assets/service-property.jpg";

const ServiceProperty = () => (
  <>
    <Seo
      title="Property Buy & Sell — Verified Plots & Farmhouses"
      description="Verified land, plots and farmhouses with legal verification, clean documents and registry support across Patna and Bihar. No brokerage."
      path="/services/property"
    />
    <ServiceDetailLayout
      icon={HomeIcon}
      eyebrow="Property Services"
      title="Verified property. Clean paperwork."
      intro="Buy or sell land, plots and farmhouses with confidence. Our team performs legal verification, helps with documentation, and supports you through registry — without hidden brokerage."
      image={img}
      imageAlt="Surveyor on a verified agricultural plot"
      features={[
        "Verified land, plots and farmhouses",
        "Legal title & document verification",
        "Registry assistance and coordination",
        "Site visits with detailed reports",
        "Owner-to-buyer direct dealings",
      ]}
      benefits={[
        "No brokerage charges",
        "Clean, verified documents",
        "Registry support included",
        "Local on-ground knowledge in Patna & Bihar",
      ]}
      faqs={[
        { q: "How is the property verified?", a: "We check title deeds, encumbrance, land records, and physical site condition before listing or recommending any property." },
        { q: "Do you charge brokerage?", a: "No traditional brokerage. Service charges, if any, are disclosed upfront before you commit." },
        { q: "Can I sell my land through SLKF?", a: "Yes. Share your documents and location — we'll verify and connect you with serious buyers." },
      ]}
      whatsappPrefill="Hi SLKF, I'm interested in property services."
    />
  </>
);

export default ServiceProperty;
