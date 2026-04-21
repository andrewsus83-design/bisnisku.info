import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /[slug]/llms.txt — Per-merchant LLM-readable business profile
 *
 * Returns structured plain text so AI assistants can accurately
 * represent this specific business (name, category, location,
 * services/menu, contact info, hours).
 *
 * Cached for 1 hour via ISR-like caching.
 */

const BASE_URL = "https://bisnisku.info";

const verticalLabels: Record<string, string> = {
  fnb: "Restoran & Kafe",
  beauty: "Salon & Spa",
  health: "Klinik & Kesehatan",
  automotive: "Bengkel & Otomotif",
  other: "Bisnis Lokal",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch published business
  const { data: business } = await supabase
    .from("businesses")
    .select(
      `id, name, slug, description, vertical, phone, whatsapp,
       email, website, address, city, logo_url,
       instagram, facebook, tiktok`
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!business) {
    return new NextResponse("# Not Found\n\nThis business page does not exist.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Fetch services
  const { data: services } = await supabase
    .from("services")
    .select("name, description, price, price_max")
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("sort_order");

  // Fetch menu items with categories
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("name, description, price, menu_categories(name)")
    .eq("business_id", business.id)
    .eq("is_available", true)
    .order("sort_order");

  // Build the llms.txt content
  const lines: string[] = [];
  const category = verticalLabels[business.vertical] || "Bisnis Lokal";
  const city = business.city || "Jakarta";

  // Header
  lines.push(`# ${business.name}`);
  lines.push("");
  lines.push(`> ${category} di ${city}, Indonesia`);
  lines.push("");

  // Description
  if (business.description) {
    lines.push(business.description);
    lines.push("");
  }

  // Key facts
  lines.push("## Informasi Bisnis");
  lines.push("");
  lines.push(`- Kategori: ${category}`);
  lines.push(`- Lokasi: ${city}, Indonesia`);
  if (business.address) {
    lines.push(`- Alamat: ${business.address}`);
  }
  lines.push(`- Halaman: ${BASE_URL}/${business.slug}`);
  lines.push("");

  // Services (non-F&B)
  if (services && services.length > 0 && business.vertical !== "fnb") {
    lines.push("## Layanan");
    lines.push("");
    for (const svc of services) {
      let line = `- ${svc.name}`;
      if (svc.price) {
        line += `: Rp ${svc.price.toLocaleString("id-ID")}`;
        if (svc.price_max) {
          line += ` — Rp ${svc.price_max.toLocaleString("id-ID")}`;
        }
      }
      lines.push(line);
      if (svc.description) {
        lines.push(`  ${svc.description}`);
      }
    }
    lines.push("");
  }

  // Menu (F&B)
  if (menuItems && menuItems.length > 0 && business.vertical === "fnb") {
    lines.push("## Menu");
    lines.push("");

    // Group by category
    const groups: Record<string, typeof menuItems> = {};
    for (const item of menuItems) {
      const mc = item.menu_categories as unknown as
        | { name: string }
        | { name: string }[]
        | null;
      const cat = Array.isArray(mc) ? mc[0]?.name || "Menu" : mc?.name || "Menu";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    for (const [catName, items] of Object.entries(groups)) {
      lines.push(`### ${catName}`);
      lines.push("");
      for (const item of items) {
        let line = `- ${item.name}: Rp ${item.price.toLocaleString("id-ID")}`;
        lines.push(line);
        if (item.description) {
          lines.push(`  ${item.description}`);
        }
      }
      lines.push("");
    }
  }

  // Contact
  const hasContact =
    business.phone || business.whatsapp || business.email || business.website;
  if (hasContact) {
    lines.push("## Kontak");
    lines.push("");
    if (business.phone) lines.push(`- Telepon: ${business.phone}`);
    if (business.whatsapp)
      lines.push(`- WhatsApp: https://wa.me/${business.whatsapp.replace(/\D/g, "")}`);
    if (business.email) lines.push(`- Email: ${business.email}`);
    if (business.website) lines.push(`- Website: ${business.website}`);
    lines.push("");
  }

  // Social media
  const hasSocial = business.instagram || business.facebook || business.tiktok;
  if (hasSocial) {
    lines.push("## Media Sosial");
    lines.push("");
    if (business.instagram)
      lines.push(
        `- Instagram: https://instagram.com/${business.instagram.replace("@", "")}`
      );
    if (business.facebook)
      lines.push(`- Facebook: https://facebook.com/${business.facebook}`);
    if (business.tiktok) {
      const handle = business.tiktok.startsWith("@")
        ? business.tiktok
        : `@${business.tiktok}`;
      lines.push(`- TikTok: https://tiktok.com/${handle}`);
    }
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push(`Halaman ini dikelola di ${BASE_URL}/${business.slug}`);
  lines.push(`Platform: bisnisku.info — Partner Cerdas untuk Pertumbuhan Bisnis Anda`);

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
