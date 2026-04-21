import { z } from "zod";

// ── Block Types ──
export const blockTypes = [
  "hero",
  "about",
  "services",
  "menu",
  "gallery",
  "reviews",
  "location_map",
  "contact",
  "social_links",
  "custom_html",
  "promo_banner",
  "booking_cta",
  "links",
] as const;

export type BlockType = (typeof blockTypes)[number];

// ── Background Themes ──
export const backgroundThemes = [
  { value: "none", label: "Polos", preview: "bg-white" },
  { value: "glitter", label: "Glitter", preview: "bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100" },
  { value: "arts", label: "Arts", preview: "bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100" },
  { value: "candies", label: "Candies", preview: "bg-gradient-to-br from-pink-200 via-fuchsia-100 to-violet-200" },
  { value: "spaces", label: "Spaces", preview: "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" },
  { value: "cloud", label: "Cloud", preview: "bg-gradient-to-b from-sky-100 via-blue-50 to-white" },
] as const;

export type BackgroundTheme = (typeof backgroundThemes)[number]["value"];

// ── Font Options ──
export const fontOptions = [
  { value: "Inter", label: "Normal", family: "Inter, sans-serif", category: "sans" },
  { value: "Plus Jakarta Sans", label: "Modern", family: "'Plus Jakarta Sans', sans-serif", category: "sans" },
  { value: "Merriweather", label: "Serif", family: "'Merriweather', serif", category: "serif" },
  { value: "Courier Prime", label: "Typewriter", family: "'Courier Prime', monospace", category: "mono" },
  { value: "Caveat", label: "Handwriting", family: "'Caveat', cursive", category: "handwriting" },
  { value: "JetBrains Mono", label: "Mono", family: "'JetBrains Mono', monospace", category: "mono" },
  { value: "Playfair Display", label: "Elegant", family: "'Playfair Display', serif", category: "serif" },
  { value: "Space Grotesk", label: "Futuristic", family: "'Space Grotesk', sans-serif", category: "sans" },
] as const;

export type FontOption = (typeof fontOptions)[number]["value"];

// ── Theme Schema ──
export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#0F172A"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFCC00"),
  fontFamily: z.string().default("Inter"),
  buttonStyle: z.enum(["rounded", "pill", "square"]).default("rounded"),
  darkMode: z.boolean().default(false),
  backgroundTheme: z.enum(["none", "glitter", "arts", "candies", "spaces", "cloud"]).default("none"),
});

export type ThemeInput = z.infer<typeof themeSchema>;

// ── Block Schema ──
export const bioBlockSchema = z.object({
  type: z.enum(blockTypes),
  content: z.record(z.string(), z.unknown()).default({}),
  settings: z.record(z.string(), z.unknown()).default({}),
  sortOrder: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export type BioBlockInput = z.infer<typeof bioBlockSchema>;

// ── Bio Page Schema ──
export const bioPageSchema = z.object({
  templateId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  theme: themeSchema.default({
    primaryColor: "#0F172A",
    accentColor: "#FFCC00",
    fontFamily: "Inter",
    buttonStyle: "rounded",
    darkMode: false,
    backgroundTheme: "none",
  }),
  seoTitle: z.string().max(60).optional().or(z.literal("")),
  seoDescription: z.string().max(160).optional().or(z.literal("")),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  customCss: z.string().max(5000).optional().or(z.literal("")),
});

export type BioPageInput = z.infer<typeof bioPageSchema>;

// ── Full page save (page + blocks) ──
export const bioPageSaveSchema = z.object({
  page: bioPageSchema,
  blocks: z.array(bioBlockSchema),
});

export type BioPageSaveInput = z.infer<typeof bioPageSaveSchema>;
