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

  // Ensure profile exists (FK constraint: businesses.owner_id → profiles.id)
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileCreateError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        onboarding_done: false,
      });

    if (profileCreateError) {
      console.error("Profile create error:", profileCreateError);
      return { error: `Gagal membuat profil: ${profileCreateError.message}` };
    }
  }

  // Check if business already exists for this user
  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingBiz) {
    // Update existing business
    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        name: businessName,
        vertical,
        city,
        website: website || null,
        phone: whatsapp || null,
        whatsapp: whatsapp || null,
        instagram: instagram || null,
        facebook: facebook || null,
        tiktok: tiktok || null,
      })
      .eq("id", existingBiz.id);

    if (updateError) {
      console.error("Business update error:", updateError);
      return { error: `Gagal update bisnis: ${updateError.message}` };
    }
  } else {
    // Generate unique slug
    let slug = generateSlug(businessName);
    const { data: slugExists } = await supabase
      .from("businesses")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Create new business
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
      console.error("Business insert error:", bizError);
      return { error: `Gagal membuat bisnis: ${bizError.message}` };
    }
  }

  // Mark onboarding as done
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ onboarding_done: true })
    .eq("id", user.id);

  if (profileError) {
    console.error("Profile update error:", profileError);
    return { error: `Gagal menyelesaikan onboarding: ${profileError.message}` };
  }

  redirect("/dashboard");
}
