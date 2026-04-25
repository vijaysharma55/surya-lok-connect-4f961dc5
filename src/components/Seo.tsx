import { Helmet } from "react-helmet-async";
import { SITE } from "@/lib/site";

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
}

export const Seo = ({ title, description, path = "/", image }: SeoProps) => {
  const fullTitle = title.includes(SITE.shortName) ? title : `${title} | ${SITE.name}`;
  const url = `${SITE.url}${path}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
};
