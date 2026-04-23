import { z } from "zod";

// ── Enums (matching DB) ──

export const contentTypes = [
  "promo",
  "blog",
  "testimonial",
  "menu_update",
  "event",
  "social",
] as const;

export const contentStatuses = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

export const campaignStatuses = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export const campaignChannels = [
  "whatsapp",
  "social",
  "bio_page",
  "email",
] as const;

export type ContentType = (typeof contentTypes)[number];
export type ContentStatus = (typeof contentStatuses)[number];
export type CampaignStatus = (typeof campaignStatuses)[number];
export type CampaignChannel = (typeof campaignChannels)[number];

// ── Labels ──

export const contentTypeLabels: Record<ContentType, string> = {
  promo: "Promo",
  blog: "Blog / Artikel",
  testimonial: "Testimoni",
  menu_update: "Update Menu",
  event: "Event",
  social: "Social Media",
};

export const contentStatusLabels: Record<ContentStatus, string> = {
  draft: "Draft",
  scheduled: "Dijadwalkan",
  published: "Published",
  archived: "Diarsipkan",
};

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Dijadwalkan",
  active: "Aktif",
  paused: "Dijeda",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const channelLabels: Record<CampaignChannel, string> = {
  whatsapp: "WhatsApp",
  social: "Social Media",
  bio_page: "Bio Page",
  email: "Email",
};

// ── Content Schemas ──

export const createContentSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(200),
  body: z.string().min(1, "Konten wajib diisi"),
  content_type: z.enum(contentTypes).default("social"),
  channel: z.enum(campaignChannels).default("social"),
  status: z.enum(contentStatuses).default("draft"),
  media_urls: z.array(z.string().url()).default([]),
  thumbnail_url: z.string().url().optional(),
  template_id: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
  slug: z.string().max(100).optional(),
  scheduled_at: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;

export const updateContentSchema = createContentSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateContentInput = z.infer<typeof updateContentSchema>;

// ── AI Generation Schemas ──

export const aiGenerateContentSchema = z.object({
  prompt: z.string().min(5, "Prompt minimal 5 karakter").max(1000),
  content_type: z.enum(contentTypes).default("social"),
  channel: z.enum(campaignChannels).default("social"),
  tone: z
    .enum(["professional", "friendly", "casual", "urgent", "promotional"])
    .default("professional"),
  language: z.enum(["id", "en"]).default("id"),
  include_emoji: z.boolean().default(true),
  include_hashtags: z.boolean().default(false),
  max_length: z.number().min(50).max(5000).default(500),
  /** AI model to use: haiku (fast, cheap) or sonnet (quality, article) */
  model: z.enum(["haiku", "sonnet"]).default("haiku"),
});

export type AiGenerateContentInput = z.infer<typeof aiGenerateContentSchema>;

export const aiGenerateVariationsSchema = z.object({
  original_body: z.string().min(1),
  count: z.number().min(1).max(5).default(3),
  tone: z
    .enum(["professional", "friendly", "casual", "urgent", "promotional"])
    .optional(),
});

export type AiGenerateVariationsInput = z.infer<typeof aiGenerateVariationsSchema>;

// ── Campaign Schemas ──

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Nama campaign wajib diisi").max(200),
  description: z.string().max(500).optional(),
  campaign_type: z.enum(contentTypes).default("promo"),
  channel: z.enum(campaignChannels).default("whatsapp"),
  content_id: z.string().uuid().optional(),
  message_body: z.string().optional(),
  media_urls: z.array(z.string().url()).default([]),
  target_segment: z
    .object({
      tags: z.array(z.string()).optional(),
      customer_stage: z.string().optional(),
      min_visits: z.number().optional(),
      max_visits: z.number().optional(),
      last_visit_before: z.string().datetime().optional(),
      last_visit_after: z.string().datetime().optional(),
    })
    .optional(),
  scheduled_at: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(campaignStatuses).optional(),
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

// ── Content Asset Schemas ──

export const createAssetSchema = z.object({
  file_name: z.string().min(1),
  file_url: z.string().url(),
  file_type: z.string().min(1),
  file_size: z.number().min(0).default(0),
  alt_text: z.string().max(200).optional(),
  tags: z.array(z.string()).default([]),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

// ── Template Schema ──

export const contentTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  vertical: z.string().nullable(),
  content_type: z.enum(contentTypes),
  channel: z.enum(campaignChannels),
  body_template: z.string(),
  variables: z.array(z.string()),
  thumbnail_url: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number(),
});

export type ContentTemplate = z.infer<typeof contentTemplateSchema>;

// ── Calendar Event type (for content calendar view) ──

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date
  type: "content" | "campaign";
  content_type: ContentType;
  status: ContentStatus | CampaignStatus;
  channel: CampaignChannel;
}

// ── Stats type ──

export interface ContentStats {
  total: number;
  draft: number;
  scheduled: number;
  published: number;
  archived: number;
  aiGenerated: number;
}

export interface CampaignStats {
  total: number;
  active: number;
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  avgDeliveryRate: number;
  avgReadRate: number;
}
