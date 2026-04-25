import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageCircle, Phone, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE, telLink, waLink } from "@/lib/site";

interface FAQ { q: string; a: string }

interface Props {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  features: string[];
  benefits: string[];
  faqs: FAQ[];
  whatsappPrefill: string;
}

export const ServiceDetailLayout = ({
  icon: Icon,
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  features,
  benefits,
  faqs,
  whatsappPrefill,
}: Props) => (
  <>
    <section className="gradient-warm">
      <div className="container-tight py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
            <Icon className="h-3.5 w-3.5" /> {eyebrow}
          </div>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-foreground">{title}</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">{intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
            >
              <a href={waLink(whatsappPrefill)} target="_blank" rel="noopener">
                <MessageCircle className="h-4 w-4" /> Enquire on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={telLink()}>
                <Phone className="h-4 w-4" /> Call {SITE.phones[0]}
              </a>
            </Button>
          </div>
        </div>
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          className="rounded-2xl shadow-trust w-full aspect-[4/3] object-cover"
        />
      </div>
    </section>

    <section className="container-tight py-16 grid md:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-semibold text-foreground mb-4">What we offer</h2>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 shadow-card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Key benefits</h2>
        <ul className="space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex gap-2 text-sm text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary-foreground bg-primary rounded-full p-0.5 shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="bg-[hsl(var(--background-soft))] py-16">
      <div className="container-tight max-w-3xl">
        <h2 className="text-3xl font-bold text-foreground text-center mb-8">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="bg-card rounded-2xl border border-border px-4 sm:px-6 shadow-card">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-foreground font-medium">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="text-center mt-8">
          <Button
            asChild
            size="lg"
            className="bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
          >
            <Link to="/contact">
              Get a free consultation <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  </>
);
