"use server";

import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { env } from "@/config/env";
import { serverEnv } from "@/config/env";
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
 * Create a Supabase admin client (service_role key).
 * Bypasses PostgREST schema cache AND RLS — use only in server actions.
 */
function createAdminClient() {
  return createClient(env.SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Complete onboarding using admin client (bypasses PostgREST schema cache):
 * 1. Verify user is authenticated
 * 2. Ensure profile exists
 * 3. Create or update business record
 * 4. Mark profile onboarding_done = true
 */
export async function completeOnboarding(input: OnboardingInput) {
  // Use the auth client to verify the user session
  const supabase = await createAuthClient();

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

  // Use admin client to bypass PostgREST schema cache
  const admin = createAdminClient();

  try {
    // Step 1: Ensure profile exists (upsert)
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        full_name:
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "User",
        email: user.email,
        onboarding_done: false,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      return { error: `Gagal membuat profil: ${profileError.message}` };
    }

    // Step 2: Check if business already exists for this user
    const { data: existingBiz } = await admin
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (existingBiz) {
      // Update existing business
      const { error: updateError } = await admin
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
        return { error: `Gagal mengupdate bisnis: ${updateError.message}` };
      }
    } else {
      // Create new business
      const { error: insertError } = await admin.from("businesses").insert({
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

      if (insertError) {
        console.error("Business insert error:", insertError);
        return { error: `Gagal membuat bisnis: ${insertError.message}` };
      }
    }

    // Step 3: Mark onboarding as complete
    const { error: doneError } = await admin
      .from("profiles")
      .update({ onboarding_done: true })
      .eq("id", user.id);

    if (doneError) {
      console.error("Onboarding done error:", doneError);
      return {
        error: `Gagal menyelesaikan onboarding: ${doneError.message}`,
      };
    }
  } catch (err) {
    console.error("Onboarding unexpected error:", err);
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }

  redirect("/dashboard");
}
