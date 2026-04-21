-- ============================================================
-- BISNISKU.INFO — Migration 005: Sprint 2 — Bio Pages & Services
-- Tables: services, menu_categories, menu_items,
--         bio_pages, bio_blocks, page_templates
-- Source of Truth: Tech Doc v1
-- ============================================================

-- ========================
-- ENUMS for Sprint 2
-- ========================
CREATE TYPE block_type AS ENUM (
  'hero', 'about', 'services', 'menu',
  'gallery', 'reviews', 'location_map',
  'contact', 'social_links', 'custom_html',
  'promo_banner', 'booking_cta'
);

CREATE TYPE page_status AS ENUM (
  'draft', 'published', 'archived'
);

CREATE TYPE service_status AS ENUM (
  'active', 'inactive'
);

-- ========================
-- SERVICES
-- Business services (salon treatments, clinic services, etc.)
-- ========================
CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2),
  price_max     NUMERIC(12,2),               -- For price ranges (e.g., Rp 50K - 100K)
  duration_min  INTEGER,                      -- Duration in minutes
  image_url     TEXT,
  sort_order    INTEGER DEFAULT 0,
  status        service_status DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_services_sort ON services(business_id, sort_order);

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- MENU CATEGORIES
-- Grouping for menu items (F&B vertical)
-- ========================
CREATE TABLE menu_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_menu_categories_business ON menu_categories(business_id);

CREATE TRIGGER menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- MENU ITEMS
-- Individual dishes / products (F&B vertical)
-- ========================
CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  price         NUMERIC(12,2) NOT NULL,
  image_url     TEXT,
  is_available  BOOLEAN DEFAULT TRUE,
  is_popular    BOOLEAN DEFAULT FALSE,        -- Highlight as best seller
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_menu_items_business ON menu_items(business_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);

CREATE TRIGGER menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- PAGE TEMPLATES
-- Starter templates for bio pages
-- ========================
CREATE TABLE page_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  vertical      business_vertical,            -- NULL = all verticals
  theme         JSONB NOT NULL DEFAULT '{}',  -- { primaryColor, fontFamily, buttonStyle, darkMode }
  blocks        JSONB NOT NULL DEFAULT '[]',  -- Default block layout
  is_premium    BOOLEAN DEFAULT FALSE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_page_templates_vertical ON page_templates(vertical);

-- ========================
-- BIO PAGES
-- One bio page per business (bisnisku.info/[slug])
-- ========================
CREATE TABLE bio_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id   UUID REFERENCES page_templates(id) ON DELETE SET NULL,
  status        page_status DEFAULT 'draft',
  theme         JSONB NOT NULL DEFAULT '{}',  -- { primaryColor, fontFamily, buttonStyle, darkMode }
  seo_title     TEXT,                         -- Override for <title>
  seo_description TEXT,                       -- Override for meta description
  og_image_url  TEXT,                         -- Open Graph image
  custom_css    TEXT,                         -- Custom CSS overrides
  view_count    INTEGER DEFAULT 0,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id)                         -- One bio page per business
);

CREATE INDEX idx_bio_pages_business ON bio_pages(business_id);
CREATE INDEX idx_bio_pages_status ON bio_pages(status);

CREATE TRIGGER bio_pages_updated_at
  BEFORE UPDATE ON bio_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================
-- BIO BLOCKS
-- Individual blocks within a bio page
-- ========================
CREATE TABLE bio_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id   UUID NOT NULL REFERENCES bio_pages(id) ON DELETE CASCADE,
  type          block_type NOT NULL,
  content       JSONB NOT NULL DEFAULT '{}',  -- Block-specific content (varies by type)
  settings      JSONB NOT NULL DEFAULT '{}',  -- Block-specific settings (padding, bg, etc.)
  sort_order    INTEGER DEFAULT 0,
  is_visible    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bio_blocks_page ON bio_blocks(bio_page_id);
CREATE INDEX idx_bio_blocks_sort ON bio_blocks(bio_page_id, sort_order);

CREATE TRIGGER bio_blocks_updated_at
  BEFORE UPDATE ON bio_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS POLICIES — Sprint 2 Tables
-- Pattern: owner can CRUD their own, public can read published
-- ============================================================

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_templates ENABLE ROW LEVEL SECURITY;

-- ── Services ──
CREATE POLICY "services_owner_all" ON services
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (
    status = 'active' AND
    business_id IN (SELECT id FROM businesses WHERE is_published = TRUE)
  );

-- ── Menu Categories ──
CREATE POLICY "menu_categories_owner_all" ON menu_categories
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "menu_categories_public_read" ON menu_categories
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE is_published = TRUE)
  );

-- ── Menu Items ──
CREATE POLICY "menu_items_owner_all" ON menu_items
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (
    is_available = TRUE AND
    business_id IN (SELECT id FROM businesses WHERE is_published = TRUE)
  );

-- ── Bio Pages ──
CREATE POLICY "bio_pages_owner_all" ON bio_pages
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "bio_pages_public_read" ON bio_pages
  FOR SELECT USING (status = 'published');

-- ── Bio Blocks ──
CREATE POLICY "bio_blocks_owner_all" ON bio_blocks
  FOR ALL USING (
    bio_page_id IN (
      SELECT bp.id FROM bio_pages bp
      JOIN businesses b ON bp.business_id = b.id
      WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "bio_blocks_public_read" ON bio_blocks
  FOR SELECT USING (
    is_visible = TRUE AND
    bio_page_id IN (SELECT id FROM bio_pages WHERE status = 'published')
  );

-- ── Page Templates (read-only for all, admin manages via backend) ──
CREATE POLICY "templates_public_read" ON page_templates
  FOR SELECT USING (TRUE);

-- ============================================================
-- SEED: Starter Templates
-- ============================================================
INSERT INTO page_templates (name, slug, description, theme, blocks, sort_order) VALUES
(
  'Modern Clean',
  'modern-clean',
  'Desain bersih dan modern dengan latar putih',
  '{"primaryColor": "#0F172A", "accentColor": "#FFCC00", "fontFamily": "Inter", "buttonStyle": "rounded", "darkMode": false}',
  '[{"type": "hero", "content": {}, "settings": {}}, {"type": "about", "content": {}, "settings": {}}, {"type": "services", "content": {}, "settings": {}}, {"type": "gallery", "content": {}, "settings": {}}, {"type": "contact", "content": {}, "settings": {}}, {"type": "social_links", "content": {}, "settings": {}}]',
  1
),
(
  'Bold Dark',
  'bold-dark',
  'Tampilan gelap yang bold dan profesional',
  '{"primaryColor": "#FFCC00", "accentColor": "#3B82F6", "fontFamily": "Plus Jakarta Sans", "buttonStyle": "rounded", "darkMode": true}',
  '[{"type": "hero", "content": {}, "settings": {}}, {"type": "about", "content": {}, "settings": {}}, {"type": "services", "content": {}, "settings": {}}, {"type": "reviews", "content": {}, "settings": {}}, {"type": "location_map", "content": {}, "settings": {}}, {"type": "contact", "content": {}, "settings": {}}]',
  2
),
(
  'Soft Pastel',
  'soft-pastel',
  'Warna pastel lembut, cocok untuk salon & spa',
  '{"primaryColor": "#EC4899", "accentColor": "#8B5CF6", "fontFamily": "Inter", "buttonStyle": "pill", "darkMode": false}',
  '[{"type": "hero", "content": {}, "settings": {}}, {"type": "about", "content": {}, "settings": {}}, {"type": "menu", "content": {}, "settings": {}}, {"type": "gallery", "content": {}, "settings": {}}, {"type": "social_links", "content": {}, "settings": {}}]',
  3
),
(
  'Professional',
  'professional',
  'Formal dan terpercaya, cocok untuk klinik & bengkel',
  '{"primaryColor": "#1A73E8", "accentColor": "#10B981", "fontFamily": "Inter", "buttonStyle": "square", "darkMode": false}',
  '[{"type": "hero", "content": {}, "settings": {}}, {"type": "about", "content": {}, "settings": {}}, {"type": "services", "content": {}, "settings": {}}, {"type": "reviews", "content": {}, "settings": {}}, {"type": "contact", "content": {}, "settings": {}}, {"type": "location_map", "content": {}, "settings": {}}]',
  4
),
(
  'Vibrant',
  'vibrant',
  'Penuh warna dan energik, cocok untuk F&B',
  '{"primaryColor": "#EA580C", "accentColor": "#FFCC00", "fontFamily": "Plus Jakarta Sans", "buttonStyle": "rounded", "darkMode": false}',
  '[{"type": "hero", "content": {}, "settings": {}}, {"type": "menu", "content": {}, "settings": {}}, {"type": "gallery", "content": {}, "settings": {}}, {"type": "promo_banner", "content": {}, "settings": {}}, {"type": "reviews", "content": {}, "settings": {}}, {"type": "social_links", "content": {}, "settings": {}}]',
  5
);
