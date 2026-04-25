import { HandHeart } from "lucide-react";
import { Seo } from "@/components/Seo";
import { ServiceDetailLayout } from "@/components/ServiceDetailLayout";
import img from "@/assets/service-csr.jpg";

const ServiceCSR = () => (
  <>
    <Seo
      title="CSR Project Management — Schools, Health, Skills"
      description="Plan and execute CSR programs in schools, hospitals and skill centers across Bihar. 80G eligible, transparent reporting, measurable impact."
      path="/services/csr"
    />
    <ServiceDetailLayout
      icon={HandHeart}
      eyebrow="CSR Services"
      title="CSR Project Management with measurable impact"
      intro="We help corporates and donors deploy CSR funds into well-run programs — schools, hospitals, skill development and women employment — with transparent reporting at every stage."
      image={img}
      imageAlt="CSR-supported children with notebooks"
      features={[
        "School support: stationery, uniforms, infrastructure",
        "Health camps and hospital partnerships",
        "Skill centers: tailoring, computer, vocational training",
        "Women employment & livelihood programs",
        "End-to-end CSR fund utilization & reporting",
      ]}
      benefits={[
        "80G tax benefit on contributions",
        "Strong brand value and CSR compliance",
        "Real, documented social impact",
        "Photo, financial and outcome reports",
      ]}
      faqs={[
        { q: "Can our company partner with SLKF for CSR?", a: "Yes. We work with corporates of all sizes and provide complete documentation, MoUs, and periodic reports as per CSR rules." },
        { q: "Are donations 80G eligible?", a: "Yes. SLKF holds 80G certification, so eligible donations qualify for tax exemption." },
        { q: "How is fund utilization tracked?", a: "Each program has a dedicated budget, supporting bills, photos, and outcome reports shared with the partner." },
      ]}
      whatsappPrefill="Hi SLKF, I'd like to discuss a CSR partnership."
    />
  </>
);

export default ServiceCSR;
