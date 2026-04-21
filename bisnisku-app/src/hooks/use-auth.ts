"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

/**
 * Client-side auth hook — listens to Supabase auth state changes
 * and syncs with Zustand store.
 */
export function useAuth() {
  const { userId, role, isLoading, setUser, clearUser, setLoading } =
    useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const initAuth = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUser(user.id, profile.role as UserRole);
        } else {
          clearUser();
        }
      } else {
        clearUser();
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser(session.user.id, profile.role as UserRole);
        }
      } else if (event === "SIGNED_OUT") {
        clearUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearUser, setLoading]);

  return {
    userId,
    role,
    isLoading,
    isAuthenticated: !!userId,
    isAdmin: role === "admin" || role === "super_admin",
    isMerchant: role === "owner" || role === "manager" || role === "staff",
  };
}
