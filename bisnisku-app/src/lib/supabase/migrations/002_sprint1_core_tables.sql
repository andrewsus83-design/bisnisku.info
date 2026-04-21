-- ============================================================
-- BISNISKU.INFO — Migration 002: Sprint 1 Core Tables
-- Tables: profiles, businesses, business_hours, audit_logs
-- Source of Truth: Tech Doc v1
-- ============================================================

-- ========================
-- PROFILES
-- Linked 1:1 with auth.users
-- ========================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT UNIQUE,
  email         TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'owner',
  locale        TEXT DEFAULT 'id',
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Auto-create profile ONLY after email is confirmed (or OAuth with pre-confirmed email).
-- This ensures unconfirmed signups do NOT get a profiles row.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT path: only create profile if email already confirmed (Google OAuth)
  IF TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
      NEW.email,
      NEW.phone,
      NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- UPDATE path: create profile when email_confirmed_at changes from NULL → value
  IF TG_OP = 'UPDATE'
     AND OLD.email_confirmed_at IS NULL
     AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, email, phone, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
      NEW.email,
      NEW.phone,
      NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire on INSERT for OAuth (email pre-confirmed)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fire on UPDATE for email confirmation (email confirm link clicked)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- BUSINESSES
-- Core business entity
-- ========================
CREATE TABLE businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  vertical      business_vertical NOT NULL DEFAULT 'other',
  category      TEXT,                       -- Finer category within vertical
  sub_category  TEXT,
  phone         TEXT,
  whatsapp      TEXT,
  email         TEXT,
  website       TEXT,
  address       TEXT,
  city          TEXT DEFAULT 'Jakarta',     -- Founder Decision #3: Jakarta only Phase 1
  province      TEXT DEFAULT 'DKI Jakarta',
  postal_code   TEXT,
  location      GEOGRAPHY(POINT, 4326),    -- PostGIS geo point
  logo_url      TEXT,
  cover_url     TEXT,
  plan          business_plan DEFAULT 'free',
  trial_ends_at TIMESTAMPTZ,
  is_verified   BOOLEAN DEFAULT FALSE,
  is_published  BOOLEAN DEFAULT FALSE,
  settings      JSONB DEFAULT '{}',        -- Flexible per-business settings
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_location ON businesses USING GIST(location);
CREATE INDEX idx_businesses_city ON businesses(city);
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_businesses_plan ON businesses(plan);
CREATE INDEX idx_businesses_vertical ON businesses(vertical);

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- BUSINESS HOURS
-- 7 days, per business
-- ========================
CREATE TABLE business_hours (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time     TIME NOT NULL,
  close_time    TIME NOT NULL,
  is_closed     BOOLEAN DEFAULT FALSE,
  UNIQUE(business_id, day_of_week)
);

-- ========================
-- AUDIT LOGS
-- Immutable log of all CUD operations
-- ========================
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID REFERENCES businesses(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,              -- INSERT, UPDATE, DELETE
  table_name    TEXT NOT NULL,
  record_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_business ON audit_logs(business_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
