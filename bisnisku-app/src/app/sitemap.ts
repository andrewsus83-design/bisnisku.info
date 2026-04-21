import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://bisnisku.info";

/**
 * Dynamic sitemap.xml — includes all published bio pages.
 * Google crawls this to discover and index all merchant pages.
 * Revalidated via ISR alongside the bio pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch all published businesses
  const { data: businesses } = await supabase
    .from("businesses")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  const bioPages: MetadataRoute.Sitemap = (businesses || []).map((biz) => ({
    url: `${BASE_URL}/${biz.slug}`,
    lastModified: biz.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  return [...staticPages, ...bioPages];
}
