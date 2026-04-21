-- ============================================================
-- BISNISKU.INFO — Migration 006: Payment & Subscription Tables
-- Sprint 3 | Xendit Integration
-- ============================================================

-- ── Subscription Plans (reference table) ──
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key      business_plan NOT NULL UNIQUE,  -- free, starter, growth, business, enterprise
  name          text NOT NULL,
  description   text,
  price_monthly bigint NOT NULL DEFAULT 0,      -- in IDR (Rp)
  price_yearly  bigint,                         -- optional annual pricing
  tx_fee_pct    numeric(5,2) NOT NULL DEFAULT 0,-- transaction fee percentage
  features      jsonb NOT NULL DEFAULT '[]',    -- array of feature strings
  is_active     boolean NOT NULL DEFAULT true,
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── Subscriptions (merchant subscription to a plan) ──
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id             uuid NOT NULL REFERENCES public.subscription_plans(id),
  status              subscription_status NOT NULL DEFAULT 'trialing',
  xendit_plan_id      text,                     -- Xendit recurring plan ID
  xendit_schedule_id  text,                     -- Xendit recurring schedule ID
  current_period_start timestamptz,
  current_period_end  timestamptz,
  trial_ends_at       timestamptz,
  cancelled_at        timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(business_id)                           -- one active subscription per business
);

-- ── Invoices (one-time or recurring billing records) ──
CREATE TABLE IF NOT EXISTS public.invoices (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subscription_id   uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  xendit_invoice_id text UNIQUE,               -- Xendit invoice ID
  external_id       text UNIQUE NOT NULL,      -- our reference (e.g. INV-{uuid})
  amount            bigint NOT NULL,            -- in IDR
  tax_amount        bigint DEFAULT 0,
  total_amount      bigint NOT NULL,            -- amount + tax
  status            payment_status NOT NULL DEFAULT 'pending',
  description       text,
  invoice_url       text,                       -- Xendit hosted payment page URL
  paid_at           timestamptz,
  expired_at        timestamptz,
  payment_method    text,                       -- actual method used (from webhook)
  payment_channel   text,                       -- actual channel used
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── Payments (individual payment transactions — bookings, vouchers, products) ──
CREATE TABLE IF NOT EXISTS public.payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id       uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_id        uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  xendit_payment_id text,                       -- Xendit payment/charge ID
  external_id       text UNIQUE NOT NULL,       -- our reference (e.g. PAY-{uuid})
  amount            bigint NOT NULL,
  fee_amount        bigint DEFAULT 0,           -- platform transaction fee
  net_amount        bigint NOT NULL,            -- amount - fee
  status            payment_status NOT NULL DEFAULT 'pending',
  payment_method    payment_method,
  description       text,
  reference_type    text,                       -- 'booking', 'voucher', 'product', 'subscription'
  reference_id      uuid,                       -- FK to booking/voucher/product
  paid_at           timestamptz,
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ── Webhook Events (idempotency + audit trail) ──
CREATE TABLE IF NOT EXISTS public.xendit_webhook_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       text UNIQUE NOT NULL,         -- Xendit callback ID for idempotency
  event_type     text NOT NULL,                -- e.g. 'invoices', 'recurring'
  payload        jsonb NOT NULL,
  status         text NOT NULL DEFAULT 'received', -- received, processed, failed
  error_message  text,
  processed_at   timestamptz,
  created_at     timestamptz DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON public.subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_xendit ON public.invoices(xendit_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.xendit_webhook_events(event_id);

-- ── RLS ──
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xendit_webhook_events ENABLE ROW LEVEL SECURITY;

-- subscription_plans: public read
CREATE POLICY "subscription_plans_select_all" ON public.subscription_plans
  FOR SELECT USING (true);

-- subscriptions: owner CRUD
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- invoices: owner read
CREATE POLICY "invoices_select_own" ON public.invoices
  FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "invoices_insert_own" ON public.invoices
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "invoices_update_own" ON public.invoices
  FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- payments: owner read
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
CREATE POLICY "payments_update_own" ON public.payments
  FOR UPDATE USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- webhook_events: no user access (service_role only)
-- RLS enabled but no policies = locked to service_role

-- ── Seed subscription plans ──
INSERT INTO public.subscription_plans (plan_key, name, description, price_monthly, tx_fee_pct, features, sort_order) VALUES
  ('free',       'Free',       'Mulai gratis — bio page & listing di directory', 0,         0,    '["Bio Page dasar","1 outlet","Listing di directory"]', 0),
  ('starter',    'Starter',    'Untuk small business yang baru go digital',       999000,    2,    '["Semua fitur Free","WhatsApp automation","CRM dasar (100 customers)","Loyalty stamp card","5 voucher aktif"]', 1),
  ('growth',     'Growth',     'Untuk bisnis yang sedang berkembang',             2900000,   1,    '["Semua fitur Starter","CRM lanjutan (unlimited)","A/B testing","Multi-staff (3 users)","AI content generation","Booking system"]', 2),
  ('business',   'Business',   'Untuk bisnis mapan yang butuh full automation',   8900000,   0.5,  '["Semua fitur Growth","Full automation","Priority support","Multi-staff (10 users)","Advanced analytics","Custom branding"]', 3),
  ('enterprise', 'Enterprise', 'Multi-outlet dengan custom integrations',         18900000,  0.3,  '["Semua fitur Business","Multi-outlet","Custom integrations","Dedicated account manager","SLA guarantee","API access"]', 4)
ON CONFLICT (plan_key) DO NOTHING;

-- ── Updated_at trigger ──
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
