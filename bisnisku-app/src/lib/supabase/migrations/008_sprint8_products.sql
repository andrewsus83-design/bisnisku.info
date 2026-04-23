-- ============================================================
-- BISNISKU.INFO — Migration 008: Product Engine
-- Sprint 8 | Vouchers + Special Products + Digital Products
-- ============================================================

-- ── New Enums ──

CREATE TYPE voucher_status AS ENUM (
  'active',       -- Bisa digunakan
  'redeemed',     -- Sudah dipakai
  'expired',      -- Kadaluarsa
  'cancelled'     -- Dibatalkan
);

CREATE TYPE product_status AS ENUM (
  'active',       -- Aktif dijual
  'inactive',     -- Nonaktif
  'out_of_stock', -- Habis
  'archived'      -- Diarsipkan
);

-- ── Products (parent table for all product types) ──

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,
  description     TEXT,
  product_type    product_type NOT NULL,
  status          product_status NOT NULL DEFAULT 'active',

  -- Pricing
  price           NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_price   NUMERIC(12,2),              -- Harga coret (original price)
  currency        TEXT DEFAULT 'IDR',

  -- Media
  image_url       TEXT,
  media_urls      JSONB DEFAULT '[]'::JSONB,

  -- Display
  sort_order      INT DEFAULT 0,
  is_featured     BOOLEAN DEFAULT FALSE,
  tags            TEXT[] DEFAULT '{}',

  -- SEO (for bio page display)
  slug            TEXT,
  seo_title       TEXT,
  seo_description TEXT,

  -- Stats
  total_sold      INT DEFAULT 0,
  total_revenue   NUMERIC(14,2) DEFAULT 0,

  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Vouchers ──

CREATE TABLE vouchers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Discount config
  discount_type   discount_type NOT NULL DEFAULT 'percentage',
  discount_value  NUMERIC(12,2) NOT NULL,      -- 10 = 10% atau Rp 10.000
  min_spend       NUMERIC(12,2) DEFAULT 0,     -- Minimum belanja
  max_discount    NUMERIC(12,2),               -- Cap diskon (untuk percentage)

  -- Validity
  valid_from      TIMESTAMPTZ DEFAULT now(),
  valid_until     TIMESTAMPTZ,
  max_uses        INT,                          -- Total bisa dipakai (NULL = unlimited)
  max_uses_per_customer INT DEFAULT 1,          -- Per pelanggan

  -- BOGO / Bundle specifics
  buy_quantity    INT DEFAULT 1,
  get_quantity    INT DEFAULT 1,
  bundle_items    JSONB DEFAULT '[]'::JSONB,    -- [{product_name, quantity}]

  -- Delivery
  auto_send_wa    BOOLEAN DEFAULT FALSE,        -- Auto kirim via WA saat create
  wa_message      TEXT,                         -- Custom WA message template

  -- Stats
  total_issued    INT DEFAULT 0,
  total_redeemed  INT DEFAULT 0,
  total_savings   NUMERIC(14,2) DEFAULT 0,      -- Total diskon yang diberikan

  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Voucher Codes (individual codes with QR) ──

CREATE TABLE voucher_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id      UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,

  code            TEXT NOT NULL UNIQUE,          -- BISNISKU-XXXX-XXXX
  qr_url          TEXT,                          -- QR code image URL
  status          voucher_status NOT NULL DEFAULT 'active',

  -- Redemption
  redeemed_at     TIMESTAMPTZ,
  redeemed_by     UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Delivery tracking
  sent_via_wa     BOOLEAN DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,

  expires_at      TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Voucher Redemptions (log) ──

CREATE TABLE voucher_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_code_id UUID NOT NULL REFERENCES voucher_codes(id) ON DELETE CASCADE,
  voucher_id      UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_amount  NUMERIC(12,2),            -- Total belanja
  discount_applied    NUMERIC(12,2) NOT NULL,   -- Diskon yang diberikan
  staff_name          TEXT,                      -- Nama staff yang redeem

  redeemed_at     TIMESTAMPTZ DEFAULT now(),
  metadata        JSONB DEFAULT '{}'::JSONB
);

-- ── Special Products (physical/service with variants) ──

CREATE TABLE special_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Stock
  track_stock     BOOLEAN DEFAULT TRUE,
  total_stock     INT DEFAULT 0,
  low_stock_alert INT DEFAULT 5,

  -- Pre-order
  allow_preorder  BOOLEAN DEFAULT FALSE,
  lead_time_days  INT DEFAULT 0,                -- Waktu persiapan

  -- Fulfillment
  fulfillment_type TEXT DEFAULT 'pickup',       -- pickup, delivery, both
  weight_grams    INT,
  dimensions      JSONB,                        -- {length, width, height}

  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Product Variants ──

CREATE TABLE product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,                 -- "Size M", "Warna Merah"
  sku             TEXT,
  price           NUMERIC(12,2),                 -- Override parent price (NULL = use parent)
  stock           INT DEFAULT 0,
  image_url       TEXT,

  option_type     TEXT,                          -- "size", "color", "weight"
  option_value    TEXT,                          -- "M", "Merah", "500g"

  sort_order      INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,

  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Digital Products ──

CREATE TABLE digital_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Delivery config
  delivery_method TEXT DEFAULT 'auto',           -- auto, manual
  auto_send_wa    BOOLEAN DEFAULT TRUE,          -- Auto kirim link via WA

  -- Access control
  max_downloads   INT DEFAULT 5,                 -- Limit download per purchase
  access_days     INT DEFAULT 30,                -- Berapa hari bisa diakses
  requires_email  BOOLEAN DEFAULT FALSE,

  -- Stats
  total_downloads INT DEFAULT 0,

  metadata        JSONB DEFAULT '{}'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Digital Product Files ──

CREATE TABLE digital_product_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,

  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,                 -- Supabase Storage path
  file_type       TEXT NOT NULL,                 -- application/pdf, video/mp4, etc
  file_size       INT DEFAULT 0,                 -- bytes

  sort_order      INT DEFAULT 0,
  is_preview      BOOLEAN DEFAULT FALSE,         -- Preview file (free)

  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Digital Product Access (download tracking) ──

CREATE TABLE digital_product_access (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digital_product_id UUID NOT NULL REFERENCES digital_products(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Access token
  access_token    TEXT NOT NULL UNIQUE,           -- Signed URL token
  download_count  INT DEFAULT 0,
  max_downloads   INT DEFAULT 5,

  -- Validity
  granted_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  last_download   TIMESTAMPTZ,

  -- Delivery
  sent_via_wa     BOOLEAN DEFAULT FALSE,
  sent_at         TIMESTAMPTZ,

  metadata        JSONB DEFAULT '{}'::JSONB
);

-- ── Indexes ──

CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(business_id) WHERE is_featured = TRUE;

CREATE INDEX idx_vouchers_product ON vouchers(product_id);
CREATE INDEX idx_vouchers_business ON vouchers(business_id);
CREATE INDEX idx_voucher_codes_voucher ON voucher_codes(voucher_id);
CREATE INDEX idx_voucher_codes_code ON voucher_codes(code);
CREATE INDEX idx_voucher_codes_customer ON voucher_codes(customer_id);
CREATE INDEX idx_voucher_codes_status ON voucher_codes(status);

CREATE INDEX idx_voucher_redemptions_voucher ON voucher_redemptions(voucher_id);
CREATE INDEX idx_voucher_redemptions_business ON voucher_redemptions(business_id);
CREATE INDEX idx_voucher_redemptions_customer ON voucher_redemptions(customer_id);

CREATE INDEX idx_special_products_product ON special_products(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);

CREATE INDEX idx_digital_products_product ON digital_products(product_id);
CREATE INDEX idx_digital_product_files_dp ON digital_product_files(digital_product_id);
CREATE INDEX idx_digital_product_access_dp ON digital_product_access(digital_product_id);
CREATE INDEX idx_digital_product_access_token ON digital_product_access(access_token);

-- ── RLS Policies ──

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_product_access ENABLE ROW LEVEL SECURITY;

-- Products: business owner
CREATE POLICY "products_select" ON products
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "products_insert" ON products
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "products_update" ON products
  FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "products_delete" ON products
  FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Vouchers: via business ownership
CREATE POLICY "vouchers_select" ON vouchers
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "vouchers_insert" ON vouchers
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "vouchers_update" ON vouchers
  FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Voucher codes: via voucher → business ownership
CREATE POLICY "voucher_codes_select" ON voucher_codes
  FOR SELECT TO authenticated
  USING (voucher_id IN (
    SELECT v.id FROM vouchers v
    JOIN businesses b ON b.id = v.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "voucher_codes_insert" ON voucher_codes
  FOR INSERT TO authenticated
  WITH CHECK (voucher_id IN (
    SELECT v.id FROM vouchers v
    JOIN businesses b ON b.id = v.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "voucher_codes_update" ON voucher_codes
  FOR UPDATE TO authenticated
  USING (voucher_id IN (
    SELECT v.id FROM vouchers v
    JOIN businesses b ON b.id = v.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- Voucher redemptions: via business ownership
CREATE POLICY "redemptions_select" ON voucher_redemptions
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "redemptions_insert" ON voucher_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Special products: via product → business ownership
CREATE POLICY "special_products_select" ON special_products
  FOR SELECT TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "special_products_insert" ON special_products
  FOR INSERT TO authenticated
  WITH CHECK (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "special_products_update" ON special_products
  FOR UPDATE TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- Product variants: via product → business ownership
CREATE POLICY "variants_select" ON product_variants
  FOR SELECT TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "variants_insert" ON product_variants
  FOR INSERT TO authenticated
  WITH CHECK (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "variants_update" ON product_variants
  FOR UPDATE TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "variants_delete" ON product_variants
  FOR DELETE TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- Digital products: via product → business ownership
CREATE POLICY "digital_products_select" ON digital_products
  FOR SELECT TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "digital_products_insert" ON digital_products
  FOR INSERT TO authenticated
  WITH CHECK (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "digital_products_update" ON digital_products
  FOR UPDATE TO authenticated
  USING (product_id IN (
    SELECT p.id FROM products p
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- Digital product files: via digital_product → product → business
CREATE POLICY "dp_files_select" ON digital_product_files
  FOR SELECT TO authenticated
  USING (digital_product_id IN (
    SELECT dp.id FROM digital_products dp
    JOIN products p ON p.id = dp.product_id
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "dp_files_insert" ON digital_product_files
  FOR INSERT TO authenticated
  WITH CHECK (digital_product_id IN (
    SELECT dp.id FROM digital_products dp
    JOIN products p ON p.id = dp.product_id
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "dp_files_delete" ON digital_product_files
  FOR DELETE TO authenticated
  USING (digital_product_id IN (
    SELECT dp.id FROM digital_products dp
    JOIN products p ON p.id = dp.product_id
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- Digital product access: via digital_product → product → business
CREATE POLICY "dp_access_select" ON digital_product_access
  FOR SELECT TO authenticated
  USING (digital_product_id IN (
    SELECT dp.id FROM digital_products dp
    JOIN products p ON p.id = dp.product_id
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

CREATE POLICY "dp_access_insert" ON digital_product_access
  FOR INSERT TO authenticated
  WITH CHECK (digital_product_id IN (
    SELECT dp.id FROM digital_products dp
    JOIN products p ON p.id = dp.product_id
    JOIN businesses b ON b.id = p.business_id
    WHERE b.owner_id = auth.uid()
  ));

-- ── Updated_at triggers ──

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_special_products_updated_at
  BEFORE UPDATE ON special_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_digital_products_updated_at
  BEFORE UPDATE ON digital_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
