import { Helmet } from "react-helmet-async";

type Props = {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
};

export const Seo = ({ title, description, canonical, ogImage, noIndex }: Props) => (
  <Helmet>
    {title && <title>{title}</title>}
    {description && <meta name="description" content={description} />}
    {canonical && <link rel="canonical" href={canonical} />}
    {noIndex && <meta name="robots" content="noindex,nofollow" />}
    {title && <meta property="og:title" content={title} />}
    {description && <meta property="og:description" content={description} />}
    {ogImage && <meta property="og:image" content={ogImage} />}
  </Helmet>
);
