import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/config/env";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/onboarding"];
// Routes only for unauthenticated users
const AUTH_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  // First, refresh the session
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected || isAuthRoute) {
    // Create a fresh client to check auth
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Cookies already handled by updateSession
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protected route without auth → redirect to login
    if (isProtected && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user — check onboarding status for dashboard and auth routes
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_done")
        .eq("id", user.id)
        .single();

      const onboardingComplete = profile?.onboarding_done === true;

      // Dashboard without completed onboarding → redirect to /onboarding
      if (pathname.startsWith("/dashboard") && !onboardingComplete) {
        const onboardingUrl = request.nextUrl.clone();
        onboardingUrl.pathname = "/onboarding";
        return NextResponse.redirect(onboardingUrl);
      }

      // Auth route (login/register) with active session →
      // redirect to onboarding if not done, otherwise dashboard
      if (isAuthRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = onboardingComplete ? "/dashboard" : "/onboarding";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
