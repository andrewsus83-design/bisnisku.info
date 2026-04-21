"use server";

import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/config/env";

/**
 * Auto-generate SEO title and description using AI,
 * based on the business profile data from onboarding.
 */
export async function generateSeoFromProfile(): Promise<{
  title?: string;
  description?: string;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch business profile
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description, vertical, city, category, sub_category")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return { error: "Profil bisnis belum dibuat. Selesaikan onboarding terlebih dahulu." };
  }

  const apiKey = serverEnv.ANTHROPIC_API;
  if (!apiKey) {
    // Fallback: generate simple SEO without AI
    const title = `${business.name} — ${verticalLabel(business.vertical)} di ${business.city || "Indonesia"}`;
    const description = `${business.name} adalah ${verticalLabel(business.vertical).toLowerCase()} terpercaya di ${business.city || "Indonesia"}. Kunjungi halaman kami untuk info layanan, menu, promo, dan booking.`;
    return {
      title: title.slice(0, 60),
      description: description.slice(0, 160),
    };
  }

  // Use Claude Haiku for lightweight SEO generation
  try {
    const prompt = `Kamu adalah SEO expert untuk bisnis lokal di Indonesia. Berdasarkan data bisnis berikut, buatkan:
1. SEO Title (maksimal 60 karakter, include nama bisnis dan kota)
2. SEO Description (maksimal 160 karakter, persuasif, include call-to-action)

Data bisnis:
- Nama: ${business.name}
- Kategori: ${verticalLabel(business.vertical)}${business.category ? ` — ${business.category}` : ""}
- Kota: ${business.city || "Indonesia"}
${business.description ? `- Deskripsi: ${business.description}` : ""}

Jawab dalam format JSON saja tanpa markdown:
{"title": "...", "description": "..."}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: (parsed.title || "").slice(0, 60),
        description: (parsed.description || "").slice(0, 160),
      };
    }

    return { error: "Gagal parsing hasil AI. Coba lagi." };
  } catch (err) {
    console.error("AI SEO generation failed:", err);
    // Fallback to template-based generation
    const title = `${business.name} — ${verticalLabel(business.vertical)} di ${business.city || "Indonesia"}`;
    const description = `${business.name} adalah ${verticalLabel(business.vertical).toLowerCase()} terpercaya di ${business.city || "Indonesia"}. Kunjungi halaman kami untuk info layanan, menu, promo, dan booking.`;
    return {
      title: title.slice(0, 60),
      description: description.slice(0, 160),
    };
  }
}

/** Get business profile existence check (for enabling/disabling the AI button) */
export async function hasBusinessProfile(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  return !!data;
}

function verticalLabel(vertical: string): string {
  const map: Record<string, string> = {
    fnb: "Restoran & Kafe",
    beauty: "Salon & Spa",
    health: "Klinik & Kesehatan",
    automotive: "Bengkel & Otomotif",
    other: "Bisnis",
  };
  return map[vertical] || "Bisnis";
}
