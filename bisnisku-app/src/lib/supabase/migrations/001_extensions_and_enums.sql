-- ============================================================
-- BISNISKU.INFO — Migration 001: Extensions & Enums
-- Sprint 1 | Source of Truth: Tech Doc v1 + Founder Decisions
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;        -- Geo-radius search
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS pgcrypto;       -- UUID generation

-- ============================================================
-- Enum Types
-- Note: user_role aligned with Founder Decision #5 (3-platform)
--   Backend:   super_admin, admin
--   Dashboard: owner, manager, staff  (was "merchant" in Tech Doc)
--   Directory: consumer
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'super_admin',   -- Bisnisku internal: full platform management
  'admin',         -- Bisnisku internal: operational tasks
  'owner',         -- Business owner (dashboard)
  'manager',       -- Business manager (dashboard)
  'staff',         -- Business staff (dashboard)
  'consumer'       -- End user (directory, optional auth)
);

CREATE TYPE business_plan AS ENUM (
  'free',          -- Rp 0/mo, no tx processing
  'starter',       -- Rp 999K/mo, 2% tx fee
  'growth',        -- Rp 2.9M/mo, 1% tx fee
  'business',      -- Rp 8.9M/mo, 0.5% tx fee
  'enterprise'     -- Rp 18.9M/mo, 0.3% tx fee
);

CREATE TYPE business_vertical AS ENUM (
  'fnb',           -- Food & Beverage (restoran, kafe)
  'beauty',        -- Salon, spa
  'health',        -- Klinik, apotek
  'automotive',    -- Bengkel, cuci mobil
  'other'          -- Other categories
);

CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'in_progress',
  'completed', 'cancelled', 'no_show'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'failed', 'refunded', 'expired'
);

CREATE TYPE payment_method AS ENUM (
  'qris', 'gopay', 'ovo', 'dana', 'shopeepay',
  'va_bca', 'va_bni', 'va_mandiri', 'credit_card'
);

CREATE TYPE claim_status AS ENUM (
  'pending', 'under_review', 'verified', 'rejected'
);

CREATE TYPE claim_method AS ENUM (
  'phone_otp', 'document', 'google_verify', 'in_person'
);

CREATE TYPE content_type AS ENUM (
  'promo', 'blog', 'testimonial',
  'menu_update', 'event', 'social'
);

CREATE TYPE wa_status AS ENUM (
  'queued', 'sent', 'delivered', 'read', 'failed'
);

CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'cancelled', 'expired'
);

CREATE TYPE outreach_status AS ENUM (
  'draft', 'scheduled', 'sending', 'completed', 'paused'
);

CREATE TYPE product_type AS ENUM (
  'voucher', 'special', 'digital'
);

CREATE TYPE discount_type AS ENUM (
  'percentage', 'fixed', 'bogo',
  'free_service', 'bundle', 'cashback'
);

CREATE TYPE loyalty_type AS ENUM (
  'stamp', 'points', 'tier'
);
