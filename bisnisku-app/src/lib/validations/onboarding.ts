import { z } from "zod/v4";

export const businessVerticals = [
  { value: "fnb", label: "Restoran & Kafe", emoji: "🍽️" },
  { value: "beauty", label: "Salon & Spa", emoji: "💇" },
  { value: "health", label: "Klinik & Kesehatan", emoji: "🏥" },
  { value: "automotive", label: "Bengkel & Otomotif", emoji: "🔧" },
  { value: "other", label: "Lainnya", emoji: "🏪" },
] as const;

/** 6 kota besar Indonesia + opsi "Lainnya" untuk custom input */
export const majorCities = [
  "Jakarta",
  "Surabaya",
  "Bandung",
  "Medan",
  "Semarang",
  "Makassar",
] as const;

export const onboardingSchema = z.object({
  // Step 1 — Bisnis & Lokasi
  businessName: z
    .string()
    .min(2, "Nama bisnis minimal 2 karakter")
    .max(100, "Nama bisnis maksimal 100 karakter"),
  vertical: z.enum(["fnb", "beauty", "health", "automotive", "other"], {
    error: "Pilih kategori bisnis",
  }),
  city: z
    .string()
    .min(2, "Nama kota minimal 2 karakter")
    .max(100, "Nama kota maksimal 100 karakter"),

  // Step 2 — Sosial Media & Online
  website: z
    .string()
    .max(255, "URL maksimal 255 karakter")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .max(20, "Nomor WhatsApp maksimal 20 karakter")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .max(100, "Username maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  facebook: z
    .string()
    .max(100, "Username maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
  tiktok: z
    .string()
    .max(100, "Username maksimal 100 karakter")
    .optional()
    .or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
