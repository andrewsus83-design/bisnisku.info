import { z } from "zod";

// ── Service Schema ──
export const serviceSchema = z.object({
  name: z.string().min(2, "Nama layanan minimal 2 karakter").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif").optional(),
  priceMax: z.coerce.number().min(0).optional(),
  durationMin: z.coerce.number().int().min(1).max(480).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

// ── Menu Category Schema ──
export const menuCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(100),
  description: z.string().max(300).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
});

export type MenuCategoryInput = z.infer<typeof menuCategorySchema>;

// ── Menu Item Schema ──
export const menuItemSchema = z.object({
  name: z.string().min(2, "Nama menu minimal 2 karakter").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  categoryId: z.string().uuid().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

// ── Reorder Schema (shared for drag-drop) ──
export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.coerce.number().int(),
    })
  ),
});

export type ReorderInput = z.infer<typeof reorderSchema>;
