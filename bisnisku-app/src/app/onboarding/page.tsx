import { redirect } from "next/navigation";
import { getSession, getUserProfile } from "@/lib/supabase/auth-actions";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

/**
 * /onboarding — Typeform-style 3-step onboarding for new merchants.
 * Redirects to /login if not authenticated, or /dashboard if already onboarded.
 */
export default async function OnboardingPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile();

  if (profile?.onboarding_done) {
    redirect("/dashboard");
  }

  return <OnboardingFlow />;
}
