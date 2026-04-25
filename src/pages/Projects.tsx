import { useState } from "react";
import { Seo } from "@/components/Seo";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePublishedProjects } from "@/hooks/useCms";

import csr1 from "@/assets/csr-women-skills.jpg";
import csr2 from "@/assets/csr-health-camp.jpg";
import csr3 from "@/assets/csr-plantation.jpg";
import csr4 from "@/assets/service-csr.jpg";
import sol1 from "@/assets/solar-residential.jpg";
import sol2 from "@/assets/solar-farm-pump.jpg";
import sol3 from "@/assets/service-solar.jpg";
import sol4 from "@/assets/hero-sunrise.jpg";
import prop1 from "@/assets/property-plot.jpg";
import prop2 from "@/assets/property-farmhouse.jpg";
import prop3 from "@/assets/service-property.jpg";
import team1 from "@/assets/team.jpg";
import team2 from "@/assets/about-community.jpg";

interface Item { src: string; alt: string; cat: "csr" | "solar" | "property" | "team"; description?: string }

const fallbackItems: Item[] = [
  { src: csr1, alt: "Women's tailoring skill center", cat: "csr" },
  { src: csr2, alt: "Free rural health camp", cat: "csr" },
  { src: csr3, alt: "Tree plantation drive", cat: "csr" },
  { src: csr4, alt: "Children with classroom supplies", cat: "csr" },
  { src: sol1, alt: "Residential rooftop solar installation", cat: "solar" },
  { src: sol2, alt: "Solar-powered farm water pump", cat: "solar" },
  { src: sol3, alt: "Solar installation in progress", cat: "solar" },
  { src: sol4, alt: "Village rooftops with solar at sunrise", cat: "solar" },
  { src: prop1, alt: "Verified plot with markers", cat: "property" },
  { src: prop2, alt: "Modern farmhouse with courtyard", cat: "property" },
  { src: prop3, alt: "Land surveyor on agricultural plot", cat: "property" },
  { src: team1, alt: "SLKF team members", cat: "team" },
  { src: team2, alt: "Community engagement with SLKF team", cat: "team" },
];

const Projects = () => {
  const cms = usePublishedProjects();
  const [open, setOpen] = useState<Item | null>(null);

  const items: Item[] = (cms && cms.length > 0)
    ? cms.map((p) => ({
        src: p.image_url || csr4,
        alt: p.title,
        description: p.description ?? undefined,
        cat: (["csr", "solar", "property", "team"].includes(p.category) ? p.category : "csr") as Item["cat"],
      }))
    : fallbackItems;

  const renderGrid = (filter: Item["cat"] | "all") => {
    const list = filter === "all" ? items : items.filter((i) => i.cat === filter);
    if (list.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No projects in this category yet.</p>;
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {list.map((it, i) => (
          <button
            key={`${it.src}-${i}`}
            onClick={() => setOpen(it)}
            className="group aspect-square overflow-hidden rounded-xl shadow-card focus:outline-none focus:ring-2 focus:ring-ring relative"
          >
            <img
              src={it.src}
              alt={it.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
              <span className="text-xs font-medium text-white line-clamp-1">{it.alt}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <Seo
        title="Projects & Gallery — SLKF"
        description="Photos of SLKF activities across CSR, solar installations, property deals and team work in Patna, Bihar."
        path="/projects"
        keywords={["SLKF projects", "NGO gallery Bihar", "CSR projects Patna", "solar installations gallery"]}
        jsonLd={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />

      <section className="gradient-warm">
        <div className="container-tight py-14 sm:py-20 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
            Projects
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-foreground">
            Real work. Real photos.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            A snapshot of our recent activities across CSR, solar and property — and the team behind them.
          </p>
        </div>
      </section>

      <section className="container-tight py-12">
        <Tabs defaultValue="all">
          <TabsList className="mx-auto flex flex-wrap justify-center mb-8 bg-muted">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="csr">CSR Activities</TabsTrigger>
            <TabsTrigger value="solar">Solar Installations</TabsTrigger>
            <TabsTrigger value="property">Property Deals</TabsTrigger>
            <TabsTrigger value="team">Team Photos</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderGrid("all")}</TabsContent>
          <TabsContent value="csr">{renderGrid("csr")}</TabsContent>
          <TabsContent value="solar">{renderGrid("solar")}</TabsContent>
          <TabsContent value="property">{renderGrid("property")}</TabsContent>
          <TabsContent value="team">{renderGrid("team")}</TabsContent>
        </Tabs>
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl p-2 sm:p-4 bg-card">
          {open && (
            <div className="space-y-3">
              <img
                src={open.src}
                alt={open.alt}
                className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
              />
              <div className="px-2">
                <h3 className="font-semibold text-foreground">{open.alt}</h3>
                {open.description && <p className="text-sm text-muted-foreground mt-1">{open.description}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Projects;
