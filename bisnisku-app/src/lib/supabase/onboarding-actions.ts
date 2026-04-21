"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding";

/**
 * Generate a URL-friendly slug from business name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/**
 * Complete onboarding:
 * 1. Create business record with all details
 * 2. Mark profile onboarding_done = true
 */
export async function completeOnboarding(input: OnboardingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesi Anda telah berakhir. Silakan login kembali." };
  }

  // Validate
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Data tidak valid";
    return { error: firstError };
  }

  const {
    businessName,
    vertical,
    city,
    website,
    whatsapp,
    instagram,
    facebook,
    tiktok,
  } = parsed.data;

  // Generate unique slug
  let slug = generateSlug(businessName);
  const { data: existing } = await supabase
    .from("businesses")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Create business
  const { error: bizError } = await supabase.from("businesses").insert({
    owner_id: user.id,
    name: businessName,
    slug,
    vertical,
    city,
    website: website || null,
    phone: whatsapp || null,
    whatsapp: whatsapp || null,
    instagram: instagram || null,
    facebook: facebook || null,
    tiktok: tiktok || null,
    plan: "free",
    is_verified: true,
  });

  if (bizError) {
    return { error: "Gagal membuat bisnis. Coba lagi." };
  }

  // Mark onboarding as done
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_done: true })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Gagal menyelesaikan onboarding. Coba lagi." };
  }

  redirect("/dashboard");
}
