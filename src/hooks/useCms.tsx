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
  nav_links: { label: string; to: string; href?: string }[];
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

export type Project = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  sort_order: number;
  published: boolean;
};

const normalizeSettings = (data: any): SiteSettings => {
  const navRaw = Array.isArray(data.nav_links) ? data.nav_links : [];
  return {
    ...data,
    phones: Array.isArray(data.phones) ? data.phones : [],
    social_links: (data.social_links ?? {}) as Record<string, string>,
    nav_links: navRaw.map((n: any) => ({
      label: n.label,
      to: n.to ?? n.href ?? "/",
      href: n.href ?? n.to,
    })),
    compliance: Array.isArray(data.compliance) ? data.compliance : [],
  };
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetch = () =>
      supabase
        .from("site_settings")
        .select("*")
        .eq("id", "global")
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled || !data) return;
          setSettings(normalizeSettings(data));
        });
    fetch();
    const channel = supabase
      .channel("site_settings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => fetch())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);
  return settings;
};

export const usePublishedServices = () => {
  const [services, setServices] = useState<Service[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetch = () =>
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
    fetch();
    const channel = supabase
      .channel("services-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => fetch())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);
  return services;
};

export const usePublishedProjects = () => {
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetch = () =>
      supabase
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("sort_order")
        .then(({ data }) => {
          if (!cancelled) setProjects((data as Project[]) ?? []);
        });
    fetch();
    const channel = supabase
      .channel("projects-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => fetch())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);
  return projects;
};

export const usePageSections = (slug: string) => {
  const [sections, setSections] = useState<PageSection[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      const { data: page } = await supabase
        .from("pages")
        .select("id")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (!page || cancelled) {
        if (!cancelled) setSections([]);
        return;
      }
      const { data } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", (page as any).id)
        .eq("visible", true)
        .order("sort_order");
      if (!cancelled) setSections((data as PageSection[]) ?? []);
    };
    fetch();
    const channel = supabase
      .channel(`page_sections-${slug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "page_sections" }, () => fetch())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [slug]);
  return sections;
};
