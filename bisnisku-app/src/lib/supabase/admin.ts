import { createClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/config/env";

/**
 * Admin Supabase client using service_role key.
 * Bypasses RLS — use ONLY in server-side code (webhooks, cron, admin actions).
 * Never import this in client components or expose to the browser.
 */
export function createAdminClient() {
  const serviceRoleKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("BISNISKU_SUPABASE_SERVICE_ROLE_KEY not configured");
  }

  return createClient(env.SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
