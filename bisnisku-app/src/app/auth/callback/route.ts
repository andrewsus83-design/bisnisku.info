import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Auth callback handler — handles both:
 * 1. Email confirmation (user clicks link in email → code exchanged → onboarding)
 * 2. Google OAuth (user approves → code exchanged → onboarding or dashboard)
 *
 * Supabase sends the user here with either:
 *   ?code=<auth_code>                — PKCE flow (email confirm / OAuth)
 *   ?token_hash=<hash>&type=<type>   — Legacy token-based email confirm
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "recovery"
    | "invite"
    | "email"
    | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // ── Path A: PKCE code exchange (default for email confirm + OAuth) ──
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Code exchange failed:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`
      );
    }

    return await redirectAfterAuth(supabase, origin, next);
  }

  // ── Path B: Token-hash verify (legacy / some email templates) ──
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error("[auth/callback] Token verify failed:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=auth_callback_failed&reason=${encodeURIComponent(error.message)}`
      );
    }

    return await redirectAfterAuth(supabase, origin, next);
  }

  // ── No code and no token — invalid request ──
  console.error("[auth/callback] No code or token_hash in URL params");
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

/**
 * After successful auth, check onboarding status and redirect accordingly.
 */
async function redirectAfterAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  origin: string,
  next: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_done")
      .eq("id", user.id)
      .single();

    // New user or onboarding not done → go to onboarding
    if (!profile || !profile.onboarding_done) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
