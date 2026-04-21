# Bisnisku — Complete Feature Inventory

## Feature Matrix per Sprint

### Sprint 1: Project Setup + Auth + DB + Dashboard Shell
**Tables**: profiles, businesses, business_hours, audit_logs
**Features**:
- Supabase project setup + PostgreSQL + extensions (PostGIS, pg_trgm, pg_cron)
- Phone OTP registration/login (Bahasa Indonesia)
- Google OAuth login for merchants
- Dashboard shell with TailAdmin Next.js (sidebar, header, mobile responsive)
- Onboarding wizard (5 steps: business info → hours → first service → template → publish)
- Business context provider (tenant resolution)
- Audit log system (auto-trigger on all CUD operations)
- RLS policies on all tables
- CI pipeline: lint + typecheck

### Sprint 2: Bio Page Builder + Service/Menu Management
**Tables**: services, menu_items, menu_categories, bio_pages, bio_blocks, page_templates
**Features**:
- Service/Menu CRUD (create, read, update, delete, reorder via drag-drop)
- Photo upload to Supabase Storage (max 5MB, image optimization)
- Category management for services/menu items
- Drag-and-drop bio page builder with block types: Hero, About, Services/Menu, Gallery, Reviews, Location Map, Contact, Social Links, Custom HTML
- 5 starter templates: Modern Clean, Bold Dark, Soft Pastel, Professional, Vibrant
- Live preview (split-screen editor)
- Theme customization (primary color, font, button style)
- Publish → SSG page at bisnisku.info/[slug]
- SEO: generateMetadata() with title, description, OG image
- Mobile-first responsive design
- WhatsApp CTA button (floating)
- Page view analytics tracking

### Sprint 3: Payment Integration (Xendit)
**Tables**: payments, transactions, payouts, payment_methods
**Features**:
- Xendit API integration (create invoice, payment page redirect, webhook handler)
- Payment methods: QRIS, GoPay, OVO, Dana, ShopeePay, Virtual Account, Credit Card
- Webhook handler: /api/webhooks/xendit (signature verification, idempotency)
- Deposit system for bookings (configurable: no deposit / fixed / percentage)
- Transaction fee calculation (tier-based: Starter 3%, Growth 1.5%, Business 0.5%, Enterprise 0%)
- Payout system: merchant withdrawal → admin approve → Xendit disbursement
- Payment dashboard: revenue chart, transaction list, payout history
- Security: webhook signature, idempotency keys, retry handling

### Sprint 4: WhatsApp Automation + Smart Notifications
**Tables**: wa_messages, wa_templates, notification_logs, notification_preferences
**Features**:
- WhatsApp Cloud API integration
- Message templates (Meta-approved): booking_confirmed, booking_reminder, payment_success, review_request, promo_broadcast, winback
- Trigger system: database triggers + Edge Functions → WA message on event
- Booking reminders: H-3, H-1, 2 jam sebelum (via pg_cron + Edge Function)
- Post-visit: thank you + review request (1 hari setelah)
- Message log: track sent/delivered/read status
- Dashboard: /dashboard/marketing/messages — message history, delivery stats
- Smart timing: send at optimal hours (not midnight)
- Fallback: SMS via Twilio if WA fails
- Opt-out management (customer can unsubscribe)

### Sprint 5: CRM + Customer Database + Sales Pipeline
**Tables**: customers, customer_tags, customer_segments, customer_notes, customer_interactions
**Features**:
- Customer list: /dashboard/customers — searchable, filterable, sortable table
- Customer profile 360°: visit history, spending, bookings, loyalty points, notes, tags
- Auto-tagging: VIP (>10 visits), New (first 30 days), At-risk (>60 days no visit), Big spender (>Rp5M total)
- Custom segments: filter by tags, visit count, spend, date range
- Customer import: CSV upload for existing data
- Customer notes + interaction log
- Data export: CSV/JSON (PDP UU 27/2022 compliance)
- Sales pipeline view: lead → prospect → customer → VIP

### Sprint 6: Loyalty Engine + Bisnisku Points
**Tables**: loyalty_programs, loyalty_stamps, loyalty_points, loyalty_rewards, bisnisku_points, points_transactions, points_settlements
**Features**:
- Loyalty program builder: /dashboard/loyalty
- Stamp card: visual stamp UI, auto-stamp on visit/purchase, configurable reward (e.g., "Beli 10 dapat 1 gratis")
- Points system: earn rate config, points log, redeem UI, reward catalog
- Tiered membership: auto-upgrade based on visits/spend, tier-specific benefits
- Bisnisku Points: earn on every transaction, cross-merchant redemption
- Points economics: 50% subsidy model (merchant pays 50% of redeemed value)
- Monthly batch settlement calculation
- Customer-facing: /my/points — balance, history, available rewards, nearby redemption spots

### Sprint 7: Content Management System + AI Content Assistant
**Tables**: content_posts, content_schedule, content_channels, content_templates
**Features**:
- Content dashboard: /dashboard/marketing/content — create, schedule, publish
- Content types: promo, blog, testimonial, menu update, event announcement
- AI content assistant: generate copy from keywords, auto-adapt to multi-channel
- Content calendar: visual calendar view, drag-to-schedule, auto-publish
- Multi-channel distribution: landing page + WhatsApp broadcast + Google Post (GBP sync) + bio page
- Image editor: basic crop, resize, text overlay, filter (Canvas API)
- Performance tracking: views, clicks, conversions per content piece
- Templates library: per vertical (F&B, salon, klinik, bengkel)

### Sprint 8: Product Engine (Voucher/Special/Digital Products)
**Tables**: products, vouchers, voucher_codes, voucher_redemptions, digital_products, digital_product_files, special_products, product_variants
**Features**:
- Product dashboard: /dashboard/products — tabs for Vouchers, Special Products, Digital Products
- Voucher generator (6 types): discount %, discount fixed, BOGO, free service, bundle, cashback
- QR code per voucher, WhatsApp delivery
- Voucher redemption: scan QR → verify → apply discount → mark redeemed
- Special product CRUD: variants, stock management, pre-order with lead time
- Digital product: file upload, auto-delivery (signed URL via WA), access management
- Product storefront: products displayed on bio page + directory listing
- Product analytics: sales, redemption rate, breakage rate, revenue by type

### Sprint 9: AI Landing Page Generator + Marketing Automation
**Tables**: ai_landing_pages, ai_generations, marketing_automations, automation_triggers, automation_actions
**Features**:
- Claude API integration for landing page generation
- Landing page wizard: input business data → AI generates headline, description, USP, CTA
- Template engine: 50+ templates per vertical, AI picks best match
- Color extraction: AI detect dominant colors from logo/photos → generate palette
- A/B testing: auto-create 2 variants, split traffic 50/50, track conversions
- Content regeneration: "Coba lagi" button
- SEO auto-generation: meta title, description, OG tags, structured data
- Tier gating: Starter = 1 page basic, Growth = 5 + A/B, Business = unlimited
- Marketing automation rules: IF trigger THEN action (e.g., IF new customer THEN send welcome WA)

### Sprint 10: Business Growth Booster Tools
**Tables**: promos, promo_codes, promo_redemptions, referrals, referral_rewards, google_reviews, review_requests, winback_campaigns, winback_messages, business_health_scores
**Features**:
- **Promo Engine**: flash sale, bundle deals, happy hour, seasonal promo, discount codes
- Discount types: percentage, fixed amount, buy-X-get-Y, minimum spend, first-time customer
- Auto-scheduling: start/end date, recurring promos, max redemptions
- Flash sale countdown timer widget on bio page
- **Referral Program**: customer share link → friend signs up → both get reward
- Referral tracking dashboard: invites, conversions, rewards
- **Social Proof Widgets**: "52 orang booking minggu ini", "Rating 4.8/5 dari 230 review"
- Live activity feed: "Ani baru saja booking Hair Treatment" (privacy-safe)
- Visitor counter on bio page
- **Google Review Booster**: post-visit WA with deep link to Google Review
- Smart timing: only after positive experience (completed, not cancelled)
- Review monitoring: track new reviews, average rating trend
- AI review response suggestions
- Review widget on bio page (auto-sync)
- **Win-Back Campaigns**: auto-flag customers >30/60/90 days inactive
- Automated WA message with special offer
- Birthday promo: auto-send birthday greeting + discount
- Re-engagement triggers: "Miss you" promo
- VIP auto-upgrade for frequent customers
- **Business Health Score**: simple 1-10 score
- Quick stats: revenue today, bookings, new customers, page views
- Weekly digest: WA summary to merchant every Monday
- Benchmarking: "Anda di top 20% salon Jakarta" (anonymized)
- AI action suggestions: "Tambahkan foto baru untuk meningkatkan engagement 25%"

### Sprint 11: Booking System + Calendar
**Tables**: bookings, booking_slots, staff, staff_schedules, booking_reminders
**Features**:
- Booking calendar: weekly/daily view with slot availability
- Slot generation algorithm: operating hours + staff schedule + service duration
- Customer booking flow: pilih layanan → pilih staff (optional) → tanggal/waktu → isi data → confirm
- Booking status: pending → confirmed → in_progress → completed / cancelled / no_show
- Supabase Realtime: calendar auto-update on new booking
- Booking confirmation page + QR code for on-site scan
- Unit tests: slot calculation, overlap detection, timezone handling

### Sprint 12: Digital Menu Display + QR Code (F&B)
**Tables**: qr_codes, menu_views (analytics)
**Features**:
- QR code generator: per-table/per-outlet QR codes → /menu/[business_slug]
- Digital menu page: browse categories, search, filter (dietary tags), item detail + photo + price
- Menu layout options: grid view (large photos) or list view (compact)
- Size & modifier display (tanpa cart/order)
- CTA: WhatsApp order button (deep link with pre-filled message)
- CTA alternatif: "Hubungi untuk pesan" (phone) atau "Pesan via GoFood/GrabFood" (external link)
- Badges: bestseller, new, chef_pick
- Dietary tags: halal, vegetarian, spicy — filterable
- Operating hours aware: "Sedang tutup" outside hours
- Mobile-first optimized (90%+ traffic from mobile QR scan)
- **NOT included** (Coming Soon Phase 2): Cart, checkout, KDS, delivery, order management

### Sprint 13: GBP Data Injection + City Directory
**Tables**: gbp_listings, gbp_import_jobs, gbp_import_cells, gbp_photos, gbp_categories
**Features**:
- Google Places API integration (Edge Function: gbp-batch-import)
- Grid cell generator: Jakarta bounding box → 1km² cells → priority areas first
- 5-layer cost filter: geographic, category, quality gate, smart refresh, photo budget
- Category auto-mapping: Google types → Bisnisku categories
- Photo caching pipeline: download → resize (200px, 600px, original) → Supabase Storage
- City directory UI: /jakarta — homepage, category browse, search results, listing cards
- Geo-search: PostGIS ST_DWithin for radius filter
- Fuzzy text search: pg_trgm
- SEO: structured data (LocalBusiness), sitemap.xml generator, meta tags per listing
- View count + click tracking per listing

### Sprint 14: Claim System + Subscription Billing
**Tables**: claims, claim_verifications, claim_documents, subscriptions, invoices, billing_events, subscription_plans
**Features**:
- Claim flow: /claim/[listing_id] — 4-step wizard (method → verify → account → onboarding)
- Verification methods: Phone OTP, document upload, Google verification, in-person
- Anti-fraud: rate limiting (3 attempts/day), claim limit (5 per account)
- Admin review panel: /admin/claims
- Subscription system: plan selection, Xendit recurring payment, webhook for renewal
- Feature gate middleware: check businesses.plan on protected endpoints
- 14-day Pro trial: auto-activate on claim, auto-downgrade after trial
- Billing dashboard: /dashboard/settings/billing — current plan, upgrade/downgrade, invoices

### Sprint 15: Merchant Outreach + Admin Panel + Growth Engine
**Tables**: outreach_campaigns, outreach_messages, outreach_segments, admin_users, support_tickets
**Features**:
- Admin panel: /admin — merchant management, listing management, claim review, billing overview
- Outreach campaign builder: target segment, template, schedule, track conversions
- Automated 5-touch WhatsApp sequence for unclaimed listings
- Conversion funnel dashboard: unclaimed → contacted → claimed → trial → paid
- Merchant health score: activity level, churn risk, upgrade potential
- Support ticket system: merchant submit → admin respond → resolve
- Platform metrics: total merchants, MRR, churn rate, NPS

### Sprint 16: GBP 2-Way Sync + Multi-Vertikal Polish
**Tables**: gbp_sync_logs, gbp_review_sync
**Features**:
- GBP push sync: update hours/photos/description/posts from Bisnisku → Google My Business API
- GBP pull sync: new reviews, rating changes, customer photos → Bisnisku
- Conflict resolution UI: side-by-side diff on data mismatch
- Vertikal polish — Clinic: queue display TV mode, appointment types
- Vertikal polish — Workshop: service job tracking, vehicle history, photo progress
- Vertikal polish — Salon: stylist portfolio, before/after gallery
- Vertikal polish — F&B: floor plan editor, reservation with table assignment

### Sprint 17: Performance + Security Hardening + Testing
**Features**:
- Lighthouse score >90 on all pages
- Image optimization: next/image + Supabase CDN + WebP auto-conversion
- Database optimization: EXPLAIN ANALYZE on top 20 queries, missing indexes
- Caching strategy: ISR, React Query staleTime, edge caching
- Security audit: OWASP Top 10, dependency audit (npm audit)
- E2E tests: Playwright for critical flows
- Unit tests: Vitest for business logic
- Load testing: k6 for 1,000 concurrent users
- Error handling: Sentry, error boundaries, graceful degradation

### Sprint 18: Launch Preparation + BODETABEK Pipeline
**Features**:
- Production deployment: Vercel production, custom domain bisnisku.info
- DNS + SSL: Vercel auto-SSL
- Monitoring: Sentry alerts, Vercel Analytics, uptime monitoring
- GBP full import Jakarta: all priority categories
- Outreach wave 1: WhatsApp campaign to top 500 businesses
- Documentation: API docs, merchant onboarding guide
- BODETABEK pipeline: GBP import config for 5 cities
- Backup & DR: Supabase automatic backups, point-in-time recovery test
- Legal: Terms of Service, Privacy Policy (PDP compliant), merchant agreement

## Coming Soon — Phase 2

### Analytics Dashboard + Advanced Reporting
- Revenue analytics: daily/weekly/monthly, by service/product, payment method
- Booking analytics: volume trends, completion rate, no-show rate, peak hours heatmap
- Customer analytics: new vs returning, acquisition source, retention cohorts, CLV
- Marketing analytics: campaign performance, WA delivery rates, promo effectiveness
- Directory analytics: listing views, impressions, CTR, conversion funnel
- Export: PDF reports, CSV, scheduled email
- AI insights: "Revenue turun 15% minggu ini karena [analisis]"

### Full F&B Ordering System
- Cart system + checkout flow + online payment
- Kitchen Display System (KDS) + real-time order queue
- Order status push (ordered → preparing → ready → served)
- Delivery/takeaway with tracking
- Order management dashboard
- Table management + split bill

### Mobile App (React Native)
- Native iOS + Android app
- Push notifications (vs WA for PWA)
- Offline mode for basic features
- Camera integration for QR scan + photo upload
- Biometric auth

### Advanced AI
- AI chatbot for customer service
- Predictive analytics / demand forecasting
- AI-powered customer segmentation
- Smart inventory management (F&B)
