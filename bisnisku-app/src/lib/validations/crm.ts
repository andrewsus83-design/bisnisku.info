import { z } from "zod";

// ── Enums ──
export const customerStageEnum = z.enum([
  "lead",
  "prospect",
  "customer",
  "vip",
  "churned",
]);
export type CustomerStage = z.infer<typeof customerStageEnum>;

export const interactionTypeEnum = z.enum([
  "visit",
  "purchase",
  "booking",
  "inquiry",
  "wa_message",
  "review",
  "referral",
  "complaint",
  "loyalty_redeem",
  "promo_used",
]);
export type InteractionType = z.infer<typeof interactionTypeEnum>;

export const autoTagRuleEnum = z.enum([
  "vip",
  "new",
  "at_risk",
  "big_spender",
  "loyal",
  "birthday_soon",
  "inactive",
]);
export type AutoTagRule = z.infer<typeof autoTagRuleEnum>;

// ── Customer Schema ──
export const customerSchema = z.object({
  name: z.string().min(2, "Nama pelanggan minimal 2 karakter").max(200),
  phone: z
    .string()
    .regex(/^(\+62|62|08)\d{8,13}$/, "Nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  stage: customerStageEnum.default("lead"),
  source: z.string().max(50).default("manual"),
  birthday: z.string().optional().or(z.literal("")), // ISO date string
  address: z.string().max(500).optional().or(z.literal("")),
  gender: z.enum(["M", "F"]).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ── Customer Tag Schema ──
export const customerTagSchema = z.object({
  name: z.string().min(1, "Nama tag wajib diisi").max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Warna harus format hex")
    .default("#64748B"),
});

export type CustomerTagInput = z.infer<typeof customerTagSchema>;

// ── Customer Note Schema ──
export const customerNoteSchema = z.object({
  content: z.string().min(1, "Catatan tidak boleh kosong").max(2000),
  isPinned: z.boolean().default(false),
});

export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;

// ── Customer Interaction Schema ──
export const customerInteractionSchema = z.object({
  type: interactionTypeEnum,
  description: z.string().max(500).optional().or(z.literal("")),
  amount: z.coerce.number().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  occurredAt: z.string().optional(), // ISO date string, defaults to now
});

export type CustomerInteractionInput = z.infer<
  typeof customerInteractionSchema
>;

// ── Segment Filter Schema ──
export const segmentFilterSchema = z.object({
  tags: z.array(z.string().uuid()).default([]),
  stages: z.array(customerStageEnum).default([]),
  minVisits: z.coerce.number().int().min(0).optional(),
  maxVisits: z.coerce.number().int().min(0).optional(),
  minSpend: z.coerce.number().min(0).optional(),
  maxSpend: z.coerce.number().min(0).optional(),
  lastVisitAfter: z.string().optional(),  // ISO date
  lastVisitBefore: z.string().optional(), // ISO date
  source: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type SegmentFilter = z.infer<typeof segmentFilterSchema>;

// ── Customer Segment Schema ──
export const customerSegmentSchema = z.object({
  name: z.string().min(1, "Nama segmen wajib diisi").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  filters: segmentFilterSchema,
  isDynamic: z.boolean().default(true),
});

export type CustomerSegmentInput = z.infer<typeof customerSegmentSchema>;

// ── CSV Import Schema ──
export const csvImportRowSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  birthday: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  tags: z.string().optional(), // Comma-separated tags
});

export type CsvImportRow = z.infer<typeof csvImportRowSchema>;

// ── List/Filter Query Schema ──
export const customerListQuerySchema = z.object({
  search: z.string().optional(),
  stage: customerStageEnum.optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  sortBy: z
    .enum([
      "name",
      "created_at",
      "last_visit_at",
      "total_spent",
      "total_visits",
    ])
    .default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
