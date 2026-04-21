import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBioPageBySlug } from "@/lib/supabase/bio-page-actions";
import { PublicBioPage } from "@/components/bio-public/public-bio-page";
import { LocalBusinessJsonLd } from "@/components/bio-public/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

/** ISR: revalidate every 60 seconds */
export const revalidate = 60;

const BASE_URL = "https://bisnisku.info";

/** Vertical → Indonesian category label for SEO */
const verticalLabels: Record<string, string> = {
  fnb: "Restoran & Kafe",
  beauty: "Salon & Spa",
  health: "Klinik & Kesehatan",
  automotive: "Bengkel & Otomotif",
  other: "Bisnis Lokal",
};

/** Generate comprehensive SEO + Social + GEO metadata */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBioPageBySlug(slug);

  if (!data) {
    return { title: "Halaman tidak ditemukan" };
  }

  const { business, bioPage } = data;
  const category = verticalLabels[business.vertical] || "Bisnis Lokal";
  const city = business.city || "Jakarta";
  const pageUrl = `${BASE_URL}/${slug}`;

  // SEO title: optimized for local search (name + category + city)
  const title =
    bioPage.seo_title ||
    `${business.name} — ${category} di ${city} | bisnisku.info`;

  // SEO description: actionable, includes location signal
  const description =
    bioPage.seo_description ||
    business.description ||
    `${business.name} adalah ${category.toLowerCase()} di ${city}. Lihat layanan, menu, ulasan, dan hubungi langsung via WhatsApp.`;

  // OG image fallback chain
  const ogImage = bioPage.og_image_url || business.cover_url || business.logo_url;

  return {
    title,
    description,

    // ── Canonical URL ──
    alternates: {
      canonical: pageUrl,
    },

    // ── GEO meta tags ──
    other: {
      "geo.region": "ID-JK",
      "geo.placename": city,
      ...(business.address && { "geo.position": business.address }),
      "ICBM": "", // will be populated if lat/lng available
    },

    // ── Open Graph (Facebook, WhatsApp, LinkedIn) ──
    openGraph: {
      title: bioPage.seo_title || business.name,
      description:
        // WhatsApp truncates at ~65 chars, keep OG desc short & actionable
        business.description
          ? business.description.slice(0, 120)
          : `${category} di ${city}. Buka halaman untuk info & kontak.`,
      type: "website",
      url: pageUrl,
      siteName: "bisnisku.info",
      locale: "id_ID",
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: `${business.name} — ${category} di ${city}`,
            },
          ]
        : [],
    },

    // ── Twitter Card ──
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: bioPage.seo_title || business.name,
      description: `${category} di ${city}. Lihat layanan & hubungi langsung.`,
      images: ogImage ? [ogImage] : [],
    },

    // ── Robots ──
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },

    // ── Additional keywords for discovery ──
    keywords: [
      business.name,
      category,
      city,
      `${category.toLowerCase()} ${city.toLowerCase()}`,
      "bisnisku",
      "bisnis lokal",
      "booking online",
    ].filter(Boolean),

    // ── Category ──
    category,
  };
}

export default async function BioPage({ params }: Props) {
  const { slug } = await params;
  const data = await getBioPageBySlug(slug);

  if (!data) notFound();

  return (
    <>
      {/* JSON-LD Structured Data for Google Rich Snippets */}
      <LocalBusinessJsonLd data={data} />

      {/* Page Content */}
      <PublicBioPage data={data} />
    </>
  );
}
