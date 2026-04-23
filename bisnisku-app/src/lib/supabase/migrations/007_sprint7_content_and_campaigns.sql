-- ============================================================
-- BISNISKU.INFO — Migration 007: Content Management & Campaigns
-- Sprint 7 | CMS + AI Content + Marketing Automation
-- ============================================================

-- ── New Enums ──

CREATE TYPE content_status AS ENUM (
  'draft',        -- Belum dipublish
  'scheduled',    -- Dijadwalkan publish
  'published',    -- Sudah live
  'archived'      -- Diarsipkan
);

CREATE TYPE campaign_status AS ENUM (
  'draft',        -- Belum dijalankan
  'scheduled',    -- Dijadwalkan
  'active',       -- Sedang berjalan
  'paused',       -- Dihentikan sementara
  'completed',    -- Selesai
  'cancelled'     -- Dibatalkan
);

CREATE TYPE campaign_channel AS ENUM (
  'whatsapp',     -- WhatsApp broadcast
  'social',       -- Social media post
  'bio_page',     -- Bio page content
  'email'         -- Email (future)
);

-- ── Content Templates ──
-- Pre-built templates per vertikal (F&B, Beauty, dll)

CREATE TABLE content_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  vertical      business_vertical,           -- NULL = semua vertikal
  content_type  content_type NOT NULL,
  channel       campaign_channel NOT NULL DEFAULT 'social',
  body_template TEXT NOT NULL,                -- Template dengan {{placeholders}}
  variables     JSONB DEFAULT '[]'::JSONB,    -- List of placeholder variables
  thumbnail_url TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Contents (User-generated or AI-generated) ──

CREATE TABLE contents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES content_templates(id) ON DELETE SET NULL,

  -- Content data
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,               -- Main content (markdown/plain text)
  content_type    content_type NOT NULL DEFAULT 'social',
  channel         campaign_channel NOT NULL DEFAULT 'social',
  status          content_status NOT NULL DEFAULT 'draft',

  -- Media
  media_urls      JSONB DEFAULT '[]'::JSONB,   -- Array of image/video URLs
  thumbnail_url   TEXT,

  -- AI metadata
  ai_generated    BOOLEAN DEFAULT FALSE,
  ai_prompt       TEXT,                        -- Original prompt used
  ai_model        TEXT,                        -- claude-haiku-4-5, claude-sonnet-4-6, etc

  -- Publishing
  published_at    TIMESTAMPTZ,
  scheduled_at    TIMESTAMPTZ,                 -- When to auto-publish

  -- SEO (for blog/bio page content)
  seo_title       TEXT,
  seo_description TEXT,
  slug            TEXT,

  -- Metadata
  tags            TEXT[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Content Assets (Media library) ──

CREATE TABLE content_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT NOT NULL,                 -- image/png, image/jpeg, video/mp4
  file_size     INT DEFAULT 0,                 -- bytes

  alt_text      TEXT,
  tags          TEXT[] DEFAULT '{}',

  -- AI-generated metadata
  ai_description TEXT,

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Campaigns ──

CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,
  description     TEXT,
  campaign_type   content_type NOT NULL DEFAULT 'promo',
  channel         campaign_channel NOT NULL DEFAULT 'whatsapp',
  status          campaign_status NOT NULL DEFAULT 'draft',

  -- Target audience
  target_segment  JSONB DEFAULT '{}'::JSONB,   -- Filter: tags, customer_stage, etc
  target_count    INT DEFAULT 0,

  -- Content
  content_id      UUID REFERENCES contents(id) ON DELETE SET NULL,
  message_body    TEXT,                        -- Direct message (if no content linked)
  media_urls      JSONB DEFAULT '[]'::JSONB,

  -- Schedule
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  -- Stats
  sent_count      INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count      INT DEFAULT 0,
  click_count     INT DEFAULT 0,
  failed_count    INT DEFAULT 0,

  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Campaign Messages (individual send records) ──

CREATE TABLE campaign_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL,

  channel       campaign_channel NOT NULL,
  recipient     TEXT NOT NULL,                 -- phone number, email, etc
  message_body  TEXT NOT NULL,
  media_urls    JSONB DEFAULT '[]'::JSONB,

  status        wa_status NOT NULL DEFAULT 'queued',  -- reuse wa_status enum
  sent_at       TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  read_at       TIMESTAMPTZ,
  error_message TEXT,

  metadata      JSONB DEFAULT '{}'::JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Content History (version tracking) ──

CREATE TABLE content_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id    UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,

  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  status        content_status NOT NULL,
  changed_by    UUID REFERENCES auth.users(id),
  change_note   TEXT,

  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──

CREATE INDEX idx_contents_business_id ON contents(business_id);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_type ON contents(content_type);
CREATE INDEX idx_contents_scheduled ON contents(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_contents_published ON contents(published_at DESC) WHERE status = 'published';

CREATE INDEX idx_content_assets_business_id ON content_assets(business_id);
CREATE INDEX idx_content_assets_type ON content_assets(file_type);

CREATE INDEX idx_campaigns_business_id ON campaigns(business_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON campaigns(scheduled_at) WHERE status = 'scheduled';

CREATE INDEX idx_campaign_messages_campaign ON campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_status ON campaign_messages(status);

CREATE INDEX idx_content_history_content ON content_history(content_id);

-- ── RLS Policies ──

ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- Templates: readable by all authenticated users
CREATE POLICY "templates_select" ON content_templates
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- Contents: business owner only
CREATE POLICY "contents_select" ON contents
  FOR SELECT TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "contents_insert" ON contents
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "contents_update" ON contents
  FOR UPDATE TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "contents_delete" ON contents
  FOR DELETE TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Assets: business owner only
CREATE POLICY "assets_select" ON content_assets
  FOR SELECT TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "assets_insert" ON content_assets
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "assets_delete" ON content_assets
  FOR DELETE TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Campaigns: business owner only
CREATE POLICY "campaigns_select" ON campaigns
  FOR SELECT TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "campaigns_insert" ON campaigns
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

CREATE POLICY "campaigns_update" ON campaigns
  FOR UPDATE TO authenticated
  USING (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ))
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

-- Campaign messages: via campaign ownership
CREATE POLICY "campaign_msgs_select" ON campaign_messages
  FOR SELECT TO authenticated
  USING (campaign_id IN (
    SELECT c.id FROM campaigns c
    JOIN businesses b ON b.id = c.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "campaign_msgs_insert" ON campaign_messages
  FOR INSERT TO authenticated
  WITH CHECK (campaign_id IN (
    SELECT c.id FROM campaigns c
    JOIN businesses b ON b.id = c.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- Content history: via content ownership
CREATE POLICY "content_history_select" ON content_history
  FOR SELECT TO authenticated
  USING (content_id IN (
    SELECT ct.id FROM contents ct
    JOIN businesses b ON b.id = ct.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "content_history_insert" ON content_history
  FOR INSERT TO authenticated
  WITH CHECK (content_id IN (
    SELECT ct.id FROM contents ct
    JOIN businesses b ON b.id = ct.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- ── Updated_at trigger ──

CREATE TRIGGER set_contents_updated_at
  BEFORE UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_content_assets_updated_at
  BEFORE UPDATE ON content_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_content_templates_updated_at
  BEFORE UPDATE ON content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed: Content Templates ──

INSERT INTO content_templates (name, description, vertical, content_type, channel, body_template, variables, sort_order) VALUES
-- F&B Templates
('Promo Menu Baru', 'Announce menu baru dengan foto menarik', 'fnb', 'promo', 'whatsapp', E'🍽️ *MENU BARU!*\n\nHai {{customer_name}}! 👋\n\n{{business_name}} punya menu baru: *{{menu_name}}*\n{{description}}\n\n💰 Harga spesial: {{price}}\n📍 Kunjungi kami di {{address}}\n\nPesan sekarang! 🔥', '["customer_name","business_name","menu_name","description","price","address"]', 1),
('Happy Hour', 'Promosikan happy hour / diskon jam tertentu', 'fnb', 'promo', 'whatsapp', E'⏰ *HAPPY HOUR!*\n\nHai {{customer_name}}! 🎉\n\nDapatkan {{discount}}% OFF di {{business_name}}!\n🕐 Berlaku: {{time_range}}\n📅 Sampai: {{valid_until}}\n\nJangan sampai kelewatan! 🔥', '["customer_name","business_name","discount","time_range","valid_until"]', 2),
('Review Request F&B', 'Minta review setelah kunjungan', 'fnb', 'testimonial', 'whatsapp', E'Hai {{customer_name}}! 😊\n\nTerima kasih sudah makan di {{business_name}} 🙏\n\nKami sangat menghargai feedback Anda.\nBoleh bantu kasih review? ⭐\n\n{{review_link}}\n\nTerima kasih banyak! 🎉', '["customer_name","business_name","review_link"]', 3),

-- Beauty Templates
('Promo Treatment', 'Promosikan treatment baru atau diskon', 'beauty', 'promo', 'whatsapp', E'✨ *PROMO SPESIAL!*\n\nHai {{customer_name}}! 💆‍♀️\n\nDapatkan {{discount}}% OFF untuk {{treatment_name}} di {{business_name}}!\n\n💰 Dari {{original_price}} → {{promo_price}}\n📅 Berlaku sampai: {{valid_until}}\n\nBooking sekarang! 💅', '["customer_name","business_name","treatment_name","discount","original_price","promo_price","valid_until"]', 4),
('Reminder Booking Beauty', 'Ingatkan appointment pelanggan', 'beauty', 'event', 'whatsapp', E'Hai {{customer_name}}! 👋\n\nIni reminder untuk appointment Anda:\n\n💆‍♀️ {{service_name}}\n📅 {{date}}\n🕐 {{time}}\n📍 {{business_name}}\n\nSampai jumpa! ✨', '["customer_name","service_name","date","time","business_name"]', 5),

-- Health Templates
('Info Kesehatan', 'Share tips kesehatan untuk pasien', 'health', 'blog', 'social', E'🏥 *Tips Kesehatan*\n\n{{title}}\n\n{{content}}\n\nKonsultasi lebih lanjut di {{business_name}} 📞 {{phone}}\n\n#kesehatan #tips #{{hashtag}}', '["title","content","business_name","phone","hashtag"]', 6),

-- Automotive Templates
('Promo Service', 'Promosikan service berkala atau diskon', 'automotive', 'promo', 'whatsapp', E'🔧 *PROMO SERVICE!*\n\nHai {{customer_name}}! 🚗\n\n{{business_name}} punya promo:\n*{{promo_name}}*\n\n{{description}}\n💰 Mulai dari {{price}}\n📅 Berlaku sampai: {{valid_until}}\n\nBooking sekarang! 🔥', '["customer_name","business_name","promo_name","description","price","valid_until"]', 7),
('Reminder Service Berkala', 'Ingatkan customer untuk service rutin', 'automotive', 'event', 'whatsapp', E'Hai {{customer_name}}! 🚗\n\nSudah waktunya service berkala untuk kendaraan Anda!\n\nTerakhir service: {{last_service_date}}\n📍 {{business_name}}\n📞 {{phone}}\n\nBooking sekarang untuk slot terbaik! 🔧', '["customer_name","last_service_date","business_name","phone"]', 8),

-- Universal Templates
('Welcome New Customer', 'Sambut pelanggan baru', NULL, 'promo', 'whatsapp', E'Hai {{customer_name}}! 👋\n\nSelamat datang di {{business_name}}! 🎉\n\nTerima kasih sudah menjadi pelanggan kami.\n\nSebagai welcome gift, dapatkan {{discount}}% OFF untuk kunjungan pertama Anda!\n\nGunakan kode: {{promo_code}}\n\nSampai jumpa! 😊', '["customer_name","business_name","discount","promo_code"]', 9),
('Win-back Campaign', 'Re-engage pelanggan yang lama tidak berkunjung', NULL, 'promo', 'whatsapp', E'Hai {{customer_name}}! 😊\n\nKami kangen Anda di {{business_name}}! 💛\n\nSudah lama tidak berkunjung, nih ada promo spesial untuk Anda:\n\n🎁 {{promo_description}}\n📅 Berlaku sampai: {{valid_until}}\n\nKami tunggu kedatangan Anda! 🙏', '["customer_name","business_name","promo_description","valid_until"]', 10),
('Social Media Post', 'Template post untuk social media', NULL, 'social', 'social', E'{{caption}}\n\n{{hashtags}}\n\n📍 {{business_name}}\n🔗 {{bio_link}}', '["caption","hashtags","business_name","bio_link"]', 11);
