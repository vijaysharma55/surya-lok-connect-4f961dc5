import { Helmet } from "react-helmet-async";
import { SITE } from "@/lib/site";

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

export const Seo = ({ title, description, path = "/", image, ogImage, canonical, noIndex }: SeoProps) => {
  const fullTitle = title.includes(SITE.shortName) ? title : `${title} | ${SITE.name}`;
  const url = canonical ?? `${SITE.url}${path}`;
  const og = ogImage ?? image;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {og && <meta property="og:image" content={og} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Helmet>
  );
};
