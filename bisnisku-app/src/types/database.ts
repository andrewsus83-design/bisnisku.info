/**
 * Supabase database types — auto-generated placeholder.
 * Run `npx supabase gen types typescript` to regenerate from live schema.
 */

export type UserRole =
  | "super_admin"
  | "admin"
  | "owner"
  | "manager"
  | "staff"
  | "consumer";

export type PricingTier =
  | "free"
  | "starter"
  | "growth"
  | "business"
  | "enterprise";

export type BusinessVertical = "fnb" | "beauty" | "health" | "automotive" | "other";

export type ClaimStatus = "unclaimed" | "pending" | "verified" | "rejected";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";

// Placeholder — will be replaced by Supabase CLI generated types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          vertical: BusinessVertical;
          description: string | null;
          phone: string | null;
          address: string | null;
          city: string;
          latitude: number | null;
          longitude: number | null;
          tier: PricingTier;
          claim_status: ClaimStatus;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["businesses"]["Row"], "created_at" | "updated_at" | "is_active">;
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      pricing_tier: PricingTier;
      business_vertical: BusinessVertical;
      claim_status: ClaimStatus;
      subscription_status: SubscriptionStatus;
    };
  };
}
