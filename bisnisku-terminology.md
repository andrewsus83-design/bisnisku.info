# Bisnisku — Terminology & Internal Glossary

## Project Names
| Term | Meaning |
|------|---------|
| **Bisnisku** | Internal project name, shorthand for the platform |
| **bisnisku.info** | Public domain. NEVER use bisnisku.xyz (old, deprecated) |
| **Geovera** | Original project codename (deprecated, do NOT use) |

## Platform Components
| Term | Meaning |
|------|---------|
| **Admin Backend** | Internal admin panel for Bisnisku team (/admin) |
| **Business Dashboard** | Merchant-facing management dashboard (/dashboard) |
| **Consumer App** | End-user facing app (PWA Phase 1, React Native Phase 2) |
| **Bio Page** | Merchant's public landing page at bisnisku.info/[slug] |
| **Directory** | Yellow Pages-style city business listing (bisnisku.info/jakarta) |

## Business Terms
| Term | Meaning |
|------|---------|
| **Merchant** | Pemilik bisnis yang menggunakan Bisnisku. Pays subscription. |
| **End User / Consumer** | Pelanggan dari merchant. Uses consumer app. |
| **Vertikal** | Kategori bisnis: F&B, Beauty, Health, Automotive |
| **F&B** | Food & Beverage — restoran, kafe, warung, catering |
| **Beauty** | Salon, barbershop, spa, nail art, skincare clinic |
| **Health** | Klinik gigi, klinik umum, praktik dokter, apotek |
| **Automotive** | Bengkel mobil/motor, cuci mobil, detailing |
| **GBP** | Google Business Profile — listing bisnis di Google |
| **Claim** | Proses pemilik bisnis meng-claim listing directory |
| **Tier** | Pricing level: Free, Starter, Growth, Business, Enterprise |
| **BODETABEK** | Bogor, Depok, Tangerang, Bekasi — expansion area after Jakarta |

## Technical Terms
| Term | Meaning |
|------|---------|
| **RLS** | Row Level Security — PostgreSQL feature for multi-tenant data isolation |
| **ISR** | Incremental Static Regeneration — Next.js feature for cached pages |
| **SSG** | Static Site Generation — pre-built pages at build time |
| **SSR** | Server-Side Rendering — rendered per request |
| **RSC** | React Server Components — server-rendered React |
| **Edge Function** | Supabase serverless function (Deno runtime) |
| **pg_cron** | PostgreSQL extension for scheduled jobs |
| **pg_trgm** | PostgreSQL extension for fuzzy text search |
| **PostGIS** | PostgreSQL extension for geospatial queries |
| **Drizzle** | TypeScript ORM for complex database queries |
| **Zod** | Runtime validation library for TypeScript |
| **TailAdmin** | Pre-built dashboard UI component library (Next.js version) |

## Product Terms
| Term | Meaning |
|------|---------|
| **Bisnisku Points** | Platform-wide loyalty points usable cross-merchant |
| **Stamp Card** | Per-merchant loyalty card (buy X get Y free) |
| **Promo Engine** | System for creating/managing discounts, flash sales, bundles |
| **Win-Back** | Automated campaign to re-engage inactive customers |
| **Health Score** | 1-10 business health metric for merchants |
| **Smart Notifications** | AI-timed WhatsApp messages at optimal delivery hours |
| **Growth Booster** | Suite of tools: promo, referral, review booster, win-back |

## Financial Terms
| Term | Meaning |
|------|---------|
| **MRR** | Monthly Recurring Revenue |
| **ARPU** | Average Revenue Per User (per merchant) |
| **CAC** | Customer Acquisition Cost |
| **LTV** | Lifetime Value |
| **Churn** | Percentage of merchants canceling subscription monthly |
| **NPS** | Net Promoter Score |
| **GMV** | Gross Merchandise Value (total transaction volume) |
| **Take Rate** | Transaction fee percentage per tier |

## Common Abbreviations
| Abbr | Full |
|------|------|
| WA | WhatsApp |
| OTP | One-Time Password |
| CRM | Customer Relationship Management |
| CMS | Content Management System |
| KDS | Kitchen Display System |
| PWA | Progressive Web App |
| API | Application Programming Interface |
| SDK | Software Development Kit |
| CI/CD | Continuous Integration / Continuous Deployment |
| PDP | Perlindungan Data Pribadi (Indonesia data protection law) |
| UU | Undang-Undang (Indonesian law) |

## Naming Conventions (Code)
| Context | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `use-business.ts`, `payment-webhook.ts` |
| Components | PascalCase | `BookingCalendar`, `CustomerProfile` |
| Functions | camelCase | `createBooking()`, `sendWhatsApp()` |
| Constants | UPPER_SNAKE | `MAX_UPLOAD_SIZE`, `TIER_LIMITS` |
| DB Tables | snake_case | `loyalty_programs`, `wa_messages` |
| DB Columns | snake_case | `created_at`, `business_id` |
| API Routes | kebab-case | `/api/webhooks/xendit`, `/api/cron/booking-reminders` |
| Env Vars | UPPER_SNAKE | `XENDIT_SECRET_KEY`, `WA_PHONE_NUMBER_ID` |
| Branches | kebab-case | `feature/sprint-4-whatsapp-automation` |
| Commits | conventional | `feat: add WhatsApp template system` |
