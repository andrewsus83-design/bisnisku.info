-- ============================================================
-- BISNISKU.INFO — Migration 003: RLS Policies & Audit Trigger
-- Source of Truth: Tech Doc v1 RLS patterns
-- ============================================================

-- ========================
-- PROFILES RLS
-- ========================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY profiles_admin_select ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update all profiles (e.g., role assignment)
CREATE POLICY profiles_admin_update ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- ========================
-- BUSINESSES RLS
-- Owner isolation + public read for published
-- ========================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Anyone can see published businesses (directory)
CREATE POLICY businesses_public_read ON businesses FOR SELECT
  USING (is_published = true);

-- Owner can see all their businesses (even unpublished)
CREATE POLICY businesses_owner_select ON businesses FOR SELECT
  USING (owner_id = auth.uid());

-- Owner can create businesses
CREATE POLICY businesses_owner_insert ON businesses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owner can update their own businesses
CREATE POLICY businesses_owner_update ON businesses FOR UPDATE
  USING (owner_id = auth.uid());

-- Owner can delete their own businesses
CREATE POLICY businesses_owner_delete ON businesses FOR DELETE
  USING (owner_id = auth.uid());

-- Admin full access to all businesses
CREATE POLICY businesses_admin_all ON businesses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Staff/manager access via business ownership chain
CREATE POLICY businesses_staff_select ON businesses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('manager', 'staff')
    )
    AND owner_id IN (
      -- Staff sees businesses they belong to (via owner relationship)
      -- Full staff-business mapping table will be added in Sprint 2+
      SELECT owner_id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- ========================
-- BUSINESS HOURS RLS
-- Same as parent business access
-- ========================
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Public can read hours for published businesses
CREATE POLICY hours_public_read ON business_hours FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE is_published = true
    )
  );

-- Owner can manage hours for their businesses
CREATE POLICY hours_owner_all ON business_hours FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY hours_admin_all ON business_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ========================
-- AUDIT LOGS RLS
-- Read-only for business owners, full for admins
-- ========================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Business owners can read their own audit logs
CREATE POLICY audit_owner_read ON audit_logs FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Admins can read all audit logs
CREATE POLICY audit_admin_read ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Only system (SECURITY DEFINER functions) can insert audit logs
-- No direct insert policy for regular users

-- ========================
-- AUDIT TRIGGER FUNCTION
-- Auto-log all CUD operations
-- ========================
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs(user_id, business_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    -- Try to extract business_id from the record
    CASE
      WHEN TG_TABLE_NAME = 'businesses' THEN COALESCE(NEW.id, OLD.id)
      WHEN NEW IS NOT NULL AND NEW::jsonb ? 'business_id' THEN (NEW::jsonb ->> 'business_id')::UUID
      WHEN OLD IS NOT NULL AND OLD::jsonb ? 'business_id' THEN (OLD::jsonb ->> 'business_id')::UUID
      ELSE NULL
    END,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to Sprint 1 tables
CREATE TRIGGER businesses_audit
  AFTER INSERT OR UPDATE OR DELETE ON businesses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER business_hours_audit
  AFTER INSERT OR UPDATE OR DELETE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Note: profiles and audit_logs themselves are NOT audited to avoid recursion
