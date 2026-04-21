/**
 * Environment variable configuration with runtime validation.
 * All API keys use BISNISKU_ prefix per project convention.
 */

// --- Public (client-safe) ---
export const env = {
  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_BISNISKU_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_BISNISKU_SUPABASE_ANON_KEY!,

  // Xendit (public key only)
  XENDIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_BISNISKU_XENDIT_PUBLIC_KEY ?? "",

  // Sentry
  SENTRY_DSN: process.env.NEXT_PUBLIC_BISNISKU_SENTRY_DSN ?? "",

  // App
  APP_URL: process.env.NEXT_PUBLIC_BISNISKU_APP_URL ?? "http://localhost:3000",
  APP_NAME: process.env.NEXT_PUBLIC_BISNISKU_APP_NAME ?? "bisnisku.info",
} as const;

// --- Server-only (never exposed to client) ---
export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.BISNISKU_SUPABASE_SERVICE_ROLE_KEY ?? "",
  ANTHROPIC_API: process.env.BISNISKU_ANTHROPIC_API ?? "",
  XENDIT_API: process.env.BISNISKU_XENDIT_API ?? "",
  FONNTE_TOKEN: process.env.BISNISKU_FONNTE_TOKEN ?? "",
  GOOGLE_PLACES_API: process.env.BISNISKU_GOOGLE_PLACES_API ?? "",
  RESEND_API: process.env.BISNISKU_RESEND_API ?? "",
} as const;
