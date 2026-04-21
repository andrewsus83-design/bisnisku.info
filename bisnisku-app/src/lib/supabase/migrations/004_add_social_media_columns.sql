-- ============================================================
-- BISNISKU.INFO — Migration 004: Add Social Media Columns
-- Adds instagram, facebook, tiktok to businesses table
-- ============================================================

ALTER TABLE businesses ADD COLUMN instagram TEXT;
ALTER TABLE businesses ADD COLUMN facebook TEXT;
ALTER TABLE businesses ADD COLUMN tiktok TEXT;

COMMENT ON COLUMN businesses.instagram IS 'Instagram username or full URL';
COMMENT ON COLUMN businesses.facebook IS 'Facebook page URL or username';
COMMENT ON COLUMN businesses.tiktok IS 'TikTok username or full URL';
COMMENT ON COLUMN businesses.whatsapp IS 'WhatsApp number (with country code)';
COMMENT ON COLUMN businesses.website IS 'Business website URL';
