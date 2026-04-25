import { Helmet } from "react-helmet-async";
import { SITE } from "@/lib/site";

export interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  keywords?: string | string[];
  /** Open Graph type — default "website". Use "article" for blog/project posts. */
  ogType?: "website" | "article" | "profile";
  /** Optional structured data (JSON-LD). Pass an object or array of objects. */
  jsonLd?: object | object[];
}

const DEFAULT_OG = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/9f3309e3-ddbc-458a-8d8d-fff6f382d9ea";

export const Seo = ({
  title,
  description,
  path = "/",
  image,
  ogImage,
  canonical,
  noIndex,
  keywords,
  ogType = "website",
  jsonLd,
}: SeoProps) => {
  const fullTitle = title.includes(SITE.shortName) ? title : `${title} | ${SITE.name}`;
  const url = canonical ?? `${SITE.url}${path}`;
  const og = ogImage ?? image ?? DEFAULT_OG;
  const kw = Array.isArray(keywords) ? keywords.join(", ") : keywords;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {kw && <meta name="keywords" content={kw} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="en_IN" />
      {og && <meta property="og:image" content={og} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {og && <meta name="twitter:image" content={og} />}

      {noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow,max-image-preview:large" />
      )}

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};
