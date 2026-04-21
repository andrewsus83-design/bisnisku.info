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

// ── Background Themes (gradients) ──
export const backgroundThemes = [
  { value: "none", label: "Polos", preview: "bg-white" },
  { value: "glitter", label: "Glitter", preview: "bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100" },
  { value: "arts", label: "Arts", preview: "bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100" },
  { value: "candies", label: "Candies", preview: "bg-gradient-to-br from-pink-200 via-fuchsia-100 to-violet-200" },
  { value: "spaces", label: "Spaces", preview: "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" },
  { value: "cloud", label: "Cloud", preview: "bg-gradient-to-b from-sky-100 via-blue-50 to-white" },
] as const;

export type BackgroundTheme = (typeof backgroundThemes)[number]["value"];

// ── Background Textures (CSS pattern overlays) ──
export const backgroundTextures = [
  { value: "none", label: "None", category: "none" },
  // Paper & Fabric
  { value: "linen", label: "Linen", category: "paper" },
  { value: "canvas", label: "Canvas", category: "paper" },
  { value: "kraft", label: "Kraft Paper", category: "paper" },
  { value: "crumpled", label: "Crumpled", category: "paper" },
  { value: "watercolor", label: "Watercolor", category: "paper" },
  // Stone & Wood
  { value: "marble", label: "Marble", category: "stone" },
  { value: "concrete", label: "Concrete", category: "stone" },
  { value: "wood", label: "Wood Grain", category: "stone" },
  { value: "slate", label: "Slate", category: "stone" },
  { value: "terrazzo", label: "Terrazzo", category: "stone" },
  // Pattern & Abstract
  { value: "dots", label: "Dots", category: "pattern" },
  { value: "grid", label: "Grid", category: "pattern" },
  { value: "diagonal", label: "Diagonal", category: "pattern" },
  { value: "noise", label: "Noise", category: "pattern" },
  { value: "geometric", label: "Geometric", category: "pattern" },
] as const;

export type BackgroundTexture = (typeof backgroundTextures)[number]["value"];

/** CSS for each texture overlay — applied as a pseudo-element or background-image */
export function getTextureCSS(texture: BackgroundTexture, darkMode: boolean): React.CSSProperties {
  const opacity = darkMode ? 0.08 : 0.15;
  const color = darkMode ? "255,255,255" : "0,0,0";
  const colorAlt = darkMode ? "200,200,200" : "120,120,120";

  const map: Record<string, string> = {
    none: "",
    // Paper & Fabric
    linen: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${color},${opacity * 0.5}) 2px, rgba(${color},${opacity * 0.5}) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(${color},${opacity * 0.5}) 2px, rgba(${color},${opacity * 0.5}) 3px)`,
    canvas: `repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(${color},${opacity * 0.3}) 1px, rgba(${color},${opacity * 0.3}) 2px), repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(${color},${opacity * 0.3}) 1px, rgba(${color},${opacity * 0.3}) 2px)`,
    kraft: `repeating-linear-gradient(0deg, rgba(${color},${opacity * 0.2}), transparent 1px), repeating-linear-gradient(90deg, rgba(${color},${opacity * 0.15}), transparent 2px)`,
    crumpled: `radial-gradient(ellipse at 20% 50%, rgba(${color},${opacity * 0.4}) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(${color},${opacity * 0.3}) 0%, transparent 40%), radial-gradient(ellipse at 60% 80%, rgba(${color},${opacity * 0.35}) 0%, transparent 45%)`,
    watercolor: `radial-gradient(ellipse at 30% 30%, rgba(${colorAlt},${opacity * 0.6}) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(${colorAlt},${opacity * 0.4}) 0%, transparent 50%)`,
    // Stone & Wood
    marble: `repeating-linear-gradient(115deg, transparent, transparent 20px, rgba(${color},${opacity * 0.3}) 20px, rgba(${color},${opacity * 0.3}) 21px, transparent 21px, transparent 40px)`,
    concrete: `radial-gradient(circle at 25% 25%, rgba(${color},${opacity * 0.15}) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(${color},${opacity * 0.1}) 1px, transparent 1px)`,
    wood: `repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(${color},${opacity * 0.2}) 4px, rgba(${color},${opacity * 0.2}) 5px, transparent 5px, transparent 12px)`,
    slate: `linear-gradient(180deg, rgba(${color},${opacity * 0.05}) 0%, rgba(${color},${opacity * 0.15}) 50%, rgba(${color},${opacity * 0.05}) 100%)`,
    terrazzo: `radial-gradient(circle 8px at 20% 30%, rgba(${colorAlt},${opacity * 0.5}) 0%, transparent 100%), radial-gradient(circle 5px at 60% 20%, rgba(${colorAlt},${opacity * 0.4}) 0%, transparent 100%), radial-gradient(circle 6px at 80% 60%, rgba(${colorAlt},${opacity * 0.45}) 0%, transparent 100%), radial-gradient(circle 4px at 40% 80%, rgba(${colorAlt},${opacity * 0.35}) 0%, transparent 100%)`,
    // Pattern & Abstract
    dots: `radial-gradient(circle, rgba(${color},${opacity}) 1px, transparent 1px)`,
    grid: `linear-gradient(rgba(${color},${opacity * 0.3}) 1px, transparent 1px), linear-gradient(90deg, rgba(${color},${opacity * 0.3}) 1px, transparent 1px)`,
    diagonal: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(${color},${opacity * 0.3}) 10px, rgba(${color},${opacity * 0.3}) 11px)`,
    noise: `radial-gradient(circle at 10% 20%, rgba(${color},${opacity * 0.1}) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(${color},${opacity * 0.08}) 0%, transparent 25%), radial-gradient(circle at 50% 50%, rgba(${color},${opacity * 0.12}) 0%, transparent 30%)`,
    geometric: `linear-gradient(30deg, rgba(${color},${opacity * 0.2}) 12%, transparent 12.5%, transparent 87%, rgba(${color},${opacity * 0.2}) 87.5%), linear-gradient(150deg, rgba(${color},${opacity * 0.2}) 12%, transparent 12.5%, transparent 87%, rgba(${color},${opacity * 0.2}) 87.5%), linear-gradient(30deg, rgba(${color},${opacity * 0.2}) 12%, transparent 12.5%, transparent 87%, rgba(${color},${opacity * 0.2}) 87.5%), linear-gradient(150deg, rgba(${color},${opacity * 0.2}) 12%, transparent 12.5%, transparent 87%, rgba(${color},${opacity * 0.2}) 87.5%)`,
  };

  const bgImage = map[texture] || "";
  if (!bgImage) return {};

  const sizeMap: Record<string, string> = {
    dots: "20px 20px",
    grid: "24px 24px",
    geometric: "40px 70px",
    concrete: "30px 30px",
  };

  return {
    backgroundImage: bgImage,
    ...(sizeMap[texture] ? { backgroundSize: sizeMap[texture] } : {}),
  };
}

// ── Font Options (12+) ──
export const fontOptions = [
  // Sans-serif
  { value: "Inter", label: "Inter", family: "Inter, sans-serif", category: "sans" },
  { value: "Plus Jakarta Sans", label: "Jakarta Sans", family: "'Plus Jakarta Sans', sans-serif", category: "sans" },
  { value: "Space Grotesk", label: "Space Grotesk", family: "'Space Grotesk', sans-serif", category: "sans" },
  { value: "Montserrat", label: "Montserrat", family: "'Montserrat', sans-serif", category: "sans" },
  { value: "Raleway", label: "Raleway", family: "'Raleway', sans-serif", category: "sans" },
  { value: "Nunito", label: "Nunito", family: "'Nunito', sans-serif", category: "sans" },
  { value: "DM Sans", label: "DM Sans", family: "'DM Sans', sans-serif", category: "sans" },
  // Serif
  { value: "Merriweather", label: "Merriweather", family: "'Merriweather', serif", category: "serif" },
  { value: "Playfair Display", label: "Playfair", family: "'Playfair Display', serif", category: "serif" },
  { value: "Lora", label: "Lora", family: "'Lora', serif", category: "serif" },
  // Mono & Special
  { value: "JetBrains Mono", label: "JetBrains", family: "'JetBrains Mono', monospace", category: "mono" },
  { value: "Courier Prime", label: "Courier", family: "'Courier Prime', monospace", category: "mono" },
  { value: "Caveat", label: "Caveat", family: "'Caveat', cursive", category: "handwriting" },
] as const;

export type FontOption = (typeof fontOptions)[number]["value"];

/** Look up the CSS font-family string from a font value */
export function getFontFamily(value: string): string {
  const found = fontOptions.find((f) => f.value === value);
  return found?.family ?? `'${value}', sans-serif`;
}

// ── Theme Schema ──
export const themeSchema = z.object({
  primaryColor: z.string().default("#0F172A"),
  accentColor: z.string().default("#FFCC00"),
  primaryFont: z.string().default("Plus Jakarta Sans"),
  secondaryFont: z.string().default("Inter"),
  /** @deprecated — kept for backward compat, mapped to primaryFont on load */
  fontFamily: z.string().optional(),
  buttonStyle: z.enum(["rounded", "pill", "square"]).default("rounded"),
  darkMode: z.boolean().default(false),
  backgroundTheme: z.enum(["none", "glitter", "arts", "candies", "spaces", "cloud"]).default("none"),
  backgroundTexture: z.string().default("none"),
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
    primaryFont: "Plus Jakarta Sans",
    secondaryFont: "Inter",
    buttonStyle: "rounded",
    darkMode: false,
    backgroundTheme: "none",
    backgroundTexture: "none",
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
