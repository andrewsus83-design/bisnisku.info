"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validations/onboarding";

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
 * Complete onboarding via RPC function (SECURITY DEFINER — bypasses RLS):
 * 1. Ensure profile exists
 * 2. Create or update business record
 * 3. Mark profile onboarding_done = true
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
  slug = `${slug}-${Date.now().toString(36)}`;

  // Call RPC function (SECURITY DEFINER — bypasses RLS)
  const { data, error: rpcError } = await supabase.rpc("complete_onboarding", {
    p_business_name: businessName,
    p_slug: slug,
    p_vertical: vertical,
    p_city: city,
    p_website: website || null,
    p_phone: whatsapp || null,
    p_whatsapp: whatsapp || null,
    p_instagram: instagram || null,
    p_facebook: facebook || null,
    p_tiktok: tiktok || null,
  });

  if (rpcError) {
    console.error("Onboarding RPC error:", rpcError);
    return { error: `Gagal menyelesaikan onboarding: ${rpcError.message}` };
  }

  // Check if RPC returned an error
  if (data && typeof data === "object" && "error" in data) {
    return { error: String(data.error) };
  }

  redirect("/dashboard");
}
