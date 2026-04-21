# Bisnisku — Technical Architecture Deep Dive

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              BISNISKU PLATFORM                  │
│         bisnisku.info (3 Platforms)             │
└─────────────────────────────────────────────────┘

Platform 1: Admin Backend (internal)
Platform 2: Business Dashboard (merchant-facing)
Platform 3: Consumer App (end user-facing)

     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │  Admin   │  │ Business │  │ Consumer │
     │ Backend  │  │Dashboard │  │ PWA App  │
     └────┬─────┘  └────┬─────┘  └────┬─────┘
          │              │              │
          └──────────┬───┘──────────────┘
                     │
          ┌──────────▼──────────┐
          │   Next.js 16 App    │
          │   (App Router)      │
          │   Vercel Edge       │
          └──────────┬──────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼────┐   ┌─────▼─────┐   ┌────▼────┐
│Supabase │   │   API     │   │  Edge   │
│  SDK    │   │  Routes   │   │Functions│
└────┬────┘   └─────┬─────┘   └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
          ┌──────────▼──────────┐
          │     SUPABASE        │
          │  PostgreSQL + RLS   │
          │  Auth + Storage     │
          │  Realtime + Edge    │
          │  PostGIS + pg_trgm  │
          └──────────┬──────────┘
                     │
     ┌───────┬───────┼───────┬───────┐
     │       │       │       │       │
  Xendit  WA API  Google  Claude  Sentry
  Payment Message  Places   AI    Monitor
```

## Tech Stack Detail

### Frontend
- **Next.js 16** — App Router, React Server Components, Streaming SSR
  - Route groups: `(auth)`, `(dashboard)`, `(public)`, `(admin)`, `(consumer)`
  - SSG + ISR (revalidate 60s) untuk bio pages + directory listings
  - SSR untuk dashboard pages
  - Middleware: auth check, tenant resolution, rate limiting
- **TailAdmin Next.js** — Pre-built dashboard UI components (500+)
- **Tailwind CSS 4** — Utility-first CSS, native nesting, faster builds
- **Zustand** — Client-side state (UI state, form drafts, cart)
- **React Query (TanStack)** — Server state, caching, optimistic updates, infinite scroll
- **Zod** — Runtime validation, shared client-server schemas, auto TypeScript types

### Backend
- **Supabase** — Backend-as-a-service
  - PostgreSQL 15 with Row Level Security (RLS)
  - Supabase Auth (Phone OTP via Twilio/MessageBird + Google OAuth)
  - Supabase Realtime (WebSocket subscriptions)
  - Supabase Storage + CDN (images, files, digital products)
  - Supabase Edge Functions (Deno runtime)
  - pg_cron for scheduled jobs
- **Drizzle ORM** — Type-safe queries, migrations, complex joins
- **PostGIS** — Geolocation queries (ST_DWithin radius search)
- **pg_trgm** — Fuzzy text search for directory

### Integrations
- **Xendit** — Payment processing
  - QRIS, GoPay, OVO, Dana, ShopeePay, Virtual Account, Credit Card
  - Recurring billing for subscriptions
  - Payout/disbursement for merchant settlements
  - Webhook-based async payment confirmation
- **WhatsApp Cloud API** (Meta) — Messaging
  - Template messages (approved by Meta)
  - Interactive buttons + quick replies
  - Delivery/read tracking
  - Fallback: SMS via Twilio
- **Google Places API (New)** — GBP data injection
  - Nearby Search + Place Details + Place Photos
  - 5-layer cost optimization filter
  - $200/month free credit → effectively free
- **Claude API (Anthropic)** — AI features
  - Claude 3.5 Sonnet for landing page generation
  - Content creation (promo, blog, social media)
  - SEO meta generation
  - Review reply suggestions
  - Business insights

### Infrastructure
- **Vercel Pro** — Hosting + deployment
  - Edge network with Jakarta PoP
  - Auto-scaling serverless functions
  - Preview deployments per PR
  - Web Analytics built-in
  - Custom domain: bisnisku.info
- **Sentry** — Error tracking + performance monitoring
- **Better Uptime** — Uptime monitoring + status page

## Project Structure

```
bisnisku/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Login, register, OTP
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/               # Merchant dashboard
│   │   │   ├── overview/page.tsx
│   │   │   ├── booking/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   ├── products/page.tsx
│   │   │   ├── loyalty/page.tsx
│   │   │   ├── marketing/
│   │   │   │   ├── content/page.tsx
│   │   │   │   ├── promos/page.tsx
│   │   │   │   ├── messages/page.tsx
│   │   │   │   └── campaigns/page.tsx
│   │   │   ├── bio-editor/page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── billing/page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (public)/                  # Public-facing pages
│   │   │   ├── [slug]/page.tsx        # Bio pages (SSG + ISR)
│   │   │   ├── menu/[slug]/page.tsx   # Digital menu (SSG)
│   │   │   ├── [city]/page.tsx        # City directory
│   │   │   └── claim/[id]/page.tsx    # Claim flow
│   │   ├── (admin)/                   # Platform admin
│   │   │   ├── merchants/page.tsx
│   │   │   ├── claims/page.tsx
│   │   │   ├── outreach/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (consumer)/                # Consumer PWA
│   │   │   ├── explore/page.tsx
│   │   │   ├── my/points/page.tsx
│   │   │   ├── my/bookings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── xendit/route.ts
│   │   │   │   └── whatsapp/route.ts
│   │   │   ├── cron/
│   │   │   │   ├── booking-reminders/route.ts
│   │   │   │   ├── gbp-import/route.ts
│   │   │   │   └── winback/route.ts
│   │   │   └── ai/
│   │   │       ├── generate-page/route.ts
│   │   │       └── generate-content/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Landing page
│   ├── components/
│   │   ├── ui/                        # TailAdmin + custom
│   │   ├── forms/
│   │   ├── dashboard/
│   │   └── public/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client
│   │   │   ├── server.ts              # Server client
│   │   │   └── admin.ts               # Service role client
│   │   ├── xendit/
│   │   │   ├── client.ts
│   │   │   └── webhooks.ts
│   │   ├── whatsapp/
│   │   │   ├── client.ts
│   │   │   └── templates.ts
│   │   ├── ai/
│   │   │   ├── client.ts              # Claude API
│   │   │   └── prompts/
│   │   ├── validators/                # Zod schemas
│   │   └── utils/
│   ├── hooks/
│   │   ├── use-business.ts
│   │   ├── use-auth.ts
│   │   └── use-realtime.ts
│   ├── stores/                        # Zustand stores
│   │   ├── ui-store.ts
│   │   └── form-store.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── supabase/
│   ├── migrations/                    # SQL migrations
│   │   ├── 001_core_tables.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_audit_triggers.sql
│   │   └── ...
│   ├── functions/                     # Edge Functions
│   │   ├── gbp-batch-import/
│   │   ├── send-whatsapp/
│   │   └── process-payment/
│   └── seed.sql
├── public/
│   ├── manifest.json                  # PWA manifest
│   └── sw.js                          # Service worker
├── tests/
│   ├── unit/                          # Vitest
│   └── e2e/                           # Playwright
├── drizzle/
│   └── schema.ts                      # Drizzle schema
├── CLAUDE.md                          # This context file
├── memory/                            # AI memory files
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.example
```

## Database Architecture

### Multi-Tenant Design
- Row Level Security (RLS) on ALL tables
- `business_id` as tenant identifier
- `auth.uid()` tied to merchant profile
- Middleware resolves tenant from JWT

### Key Database Extensions
- **PostGIS** — `geography` type, `ST_DWithin()`, spatial indexes
- **pg_trgm** — `gin_trgm_ops` index for fuzzy search
- **pg_cron** — Scheduled jobs (reminders, imports, digests)
- **pgcrypto** — `gen_random_uuid()` for UUIDs

### Core Tables (40+ tables across all sprints)
See `bisnisku-features.md` for per-sprint table listing.

## Security Architecture

- **Authentication**: Supabase Auth (JWT, auto-refresh)
- **Authorization**: RLS policies on every table
- **Input Validation**: Zod schemas on all API inputs
- **Webhook Security**: Signature verification (Xendit token, WA verify token)
- **Rate Limiting**: Vercel edge middleware + pg-based per-user limits
- **Encryption**: TLS in transit, Supabase encryption at rest
- **Compliance**: UU PDP (Perlindungan Data Pribadi) — Indonesia's data protection law
- **OWASP**: Top 10 checklist built into Sprint 17

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Score | > 90 (all pages) |
| TTFB | < 1.5s |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| API Response | < 500ms (p95) |
| DB Query | < 100ms (p95) |

## Deployment Pipeline

```
Developer → git push → Vercel Preview Deploy → Review → Merge to main → Vercel Production
                              ↓
                    Preview URL + Lighthouse check
                              ↓
                    Supabase migration (if any)
```

- **Preview**: Every PR gets a preview deployment
- **Production**: Auto-deploy on merge to `main`
- **Database**: Supabase migrations via CLI
- **Edge Functions**: Deploy via `supabase functions deploy`
- **Monitoring**: Sentry auto-reports on deployment
