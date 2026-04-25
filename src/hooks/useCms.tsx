import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: string;
  site_name: string | null;
  domain: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  brand_tagline: string | null;
  email: string | null;
  phones: string[];
  whatsapp_number: string | null;
  address: string | null;
  hours: string | null;
  hero_heading: string | null;
  hero_subheading: string | null;
  hero_image_url: string | null;
  hero_cta_label: string | null;
  hero_cta_link: string | null;
  cta_banner_label: string | null;
  cta_banner_text: string | null;
  cta_banner_link: string | null;
  social_links: Record<string, string>;
  nav_links: { label: string; to: string }[];
  footer_text: string | null;
  compliance: string[];
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  benefits: string[];
  cta_label: string | null;
  cta_link: string | null;
  sort_order: number;
  published: boolean;
};

export type PageSection = {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  heading: string | null;
  subheading: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  sort_order: number;
  visible: boolean;
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setSettings({
          ...(data as any),
          phones: Array.isArray((data as any).phones) ? (data as any).phones : [],
          social_links: ((data as any).social_links ?? {}) as Record<string, string>,
          nav_links: Array.isArray((data as any).nav_links) ? (data as any).nav_links : [],
          compliance: Array.isArray((data as any).compliance) ? (data as any).compliance : [],
        });
      });
    return () => { cancelled = true; };
  }, []);
  return settings;
};

export const usePublishedServices = () => {
  const [services, setServices] = useState<Service[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("services")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .then(({ data }) => {
        if (cancelled) return;
        setServices(
          ((data as any[]) ?? []).map((s) => ({
            ...s,
            benefits: Array.isArray(s.benefits) ? s.benefits : [],
          }))
        );
      });
    return () => { cancelled = true; };
  }, []);
  return services;
};

export const usePageSections = (slug: string) => {
  const [sections, setSections] = useState<PageSection[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: page } = await supabase
        .from("pages")
        .select("id")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (!page || cancelled) { setSections([]); return; }
      const { data } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", (page as any).id)
        .eq("visible", true)
        .order("sort_order");
      if (!cancelled) setSections((data as PageSection[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [slug]);
  return sections;
};
