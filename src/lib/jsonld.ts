import { SITE } from "@/lib/site";

const LOGO = `${SITE.url}/icon-512.png`;

export const orgJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "NGO",
  name: SITE.name,
  alternateName: SITE.shortName,
  url: SITE.url,
  logo: LOGO,
  email: SITE.email,
  telephone: `+91${SITE.primaryPhone}`,
  foundingDate: "2026-05-24",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Mithapur",
    addressLocality: "Patna",
    addressRegion: "Bihar",
    addressCountry: "IN",
  },
  sameAs: [] as string[],
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/projects?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: `${SITE.url}${it.path}`,
  })),
});

export const serviceJsonLd = (name: string, description: string, path: string) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name,
  description,
  url: `${SITE.url}${path}`,
  provider: {
    "@type": "NGO",
    name: SITE.name,
    url: SITE.url,
  },
  areaServed: { "@type": "State", name: "Bihar" },
});

export const contactPageJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE.url}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: SITE.name,
    email: SITE.email,
    telephone: SITE.phones.map((p) => `+91${p}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Mithapur",
      addressLocality: "Patna",
      addressRegion: "Bihar",
      addressCountry: "IN",
    },
  },
});
