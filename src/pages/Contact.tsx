import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Seo } from "@/components/Seo";
import { breadcrumbJsonLd, contactPageJsonLd } from "@/lib/jsonld";
import { ContactForm } from "@/components/ContactForm";
import { Button } from "@/components/ui/button";
import { SITE, telLink, waLink } from "@/lib/site";

const Contact = () => (
  <>
    <Seo
      title="Contact SLKF — Mithapur, Patna"
      description="Reach Surya Lok Kalyan Foundation in Mithapur, Patna. Call 7520585153 or 7319935455, WhatsApp us, or email slkf02026@gmail.com."
      path="/contact"
      keywords={["Contact SLKF", "NGO contact Patna", "SLKF phone", "SLKF email", "Mithapur Patna NGO"]}
      jsonLd={[
        contactPageJsonLd(),
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]),
      ]}
    />

    <section className="gradient-warm">
      <div className="container-tight py-14 sm:py-20 text-center">
        <span className="text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
          Get in touch
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-foreground">
          We'd love to hear from you
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Whether it's a CSR partnership, a solar quote, or a property enquiry — drop us a line.
          We respond within working hours.
        </p>
      </div>
    </section>

    <section className="container-tight py-16 grid lg:grid-cols-5 gap-10">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="flex gap-3 items-start">
            <MapPin className="h-5 w-5 text-secondary mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Office</h3>
              <p className="text-sm text-muted-foreground mt-1">{SITE.address}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="flex gap-3 items-start">
            <Clock className="h-5 w-5 text-secondary mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Working hours</h3>
              <p className="text-sm text-muted-foreground mt-1">{SITE.hours}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="flex gap-3 items-start">
            <Phone className="h-5 w-5 text-secondary mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Call us</h3>
              <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                {SITE.phones.map((p) => (
                  <li key={p}>
                    <a href={telLink(p)} className="hover:text-secondary">
                      +91 {p}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="flex gap-3 items-start">
            <Mail className="h-5 w-5 text-secondary mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Email</h3>
              <a
                href={`mailto:${SITE.email}`}
                className="text-sm text-muted-foreground hover:text-secondary break-all"
              >
                {SITE.email}
              </a>
            </div>
          </div>
        </div>
        <Button
          asChild
          size="lg"
          className="w-full bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
        >
          <a href={waLink("Hi SLKF, I have an enquiry.")} target="_blank" rel="noopener">
            <MessageCircle className="h-5 w-5" /> Quick WhatsApp
          </a>
        </Button>
      </div>

      <div className="lg:col-span-3">
        <ContactForm />
      </div>
    </section>

    <section className="container-tight pb-16">
      <div className="rounded-2xl overflow-hidden shadow-trust border border-border">
        <iframe
          title="SLKF Office Location — Mithapur, Patna"
          src={SITE.mapEmbed}
          width="100%"
          height="380"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  </>
);

export default Contact;
