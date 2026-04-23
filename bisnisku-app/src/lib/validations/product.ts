import { z } from "zod";

// ── Enums ──

export const productTypes = ["voucher", "special", "digital"] as const;
export type ProductType = (typeof productTypes)[number];

export const discountTypes = ["percentage", "fixed", "bogo", "free_service", "bundle", "cashback"] as const;
export type DiscountType = (typeof discountTypes)[number];

export const productStatuses = ["active", "inactive", "out_of_stock", "archived"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const voucherStatuses = ["active", "redeemed", "expired", "cancelled"] as const;
export type VoucherStatus = (typeof voucherStatuses)[number];

// ── Labels (Bahasa Indonesia) ──

export const productTypeLabels: Record<ProductType, string> = {
  voucher: "Voucher",
  special: "Produk Spesial",
  digital: "Produk Digital",
};

export const discountTypeLabels: Record<DiscountType, string> = {
  percentage: "Persentase (%)",
  fixed: "Potongan Tetap (Rp)",
  bogo: "Beli 1 Gratis 1",
  free_service: "Gratis Layanan",
  bundle: "Paket Bundle",
  cashback: "Cashback",
};

export const productStatusLabels: Record<ProductStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  out_of_stock: "Habis",
  archived: "Diarsipkan",
};

export const voucherStatusLabels: Record<VoucherStatus, string> = {
  active: "Aktif",
  redeemed: "Digunakan",
  expired: "Kadaluarsa",
  cancelled: "Dibatalkan",
};

// ── Schemas ──

export const productSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  description: z.string().max(1000).optional(),
  product_type: z.enum(productTypes),
  status: z.enum(productStatuses).default("active"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
  compare_price: z.number().min(0).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  media_urls: z.array(z.string().url()).default([]),
  is_featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  slug: z.string().max(100).optional().nullable(),
  seo_title: z.string().max(70).optional().nullable(),
  seo_description: z.string().max(160).optional().nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const voucherSchema = z.object({
  discount_type: z.enum(discountTypes),
  discount_value: z.number().min(0.01, "Nilai diskon wajib diisi"),
  min_spend: z.number().min(0).default(0),
  max_discount: z.number().min(0).optional().nullable(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional().nullable(),
  max_uses: z.number().int().min(1).optional().nullable(),
  max_uses_per_customer: z.number().int().min(1).default(1),
  buy_quantity: z.number().int().min(1).default(1),
  get_quantity: z.number().int().min(1).default(1),
  bundle_items: z.array(z.object({
    product_name: z.string(),
    quantity: z.number().int().min(1),
  })).default([]),
  auto_send_wa: z.boolean().default(false),
  wa_message: z.string().max(1000).optional().nullable(),
  quantity: z.number().int().min(1).max(10000).default(100), // Number of codes to generate
});

export type VoucherFormData = z.infer<typeof voucherSchema>;

export const specialProductSchema = z.object({
  track_stock: z.boolean().default(true),
  total_stock: z.number().int().min(0).default(0),
  low_stock_alert: z.number().int().min(0).default(5),
  allow_preorder: z.boolean().default(false),
  lead_time_days: z.number().int().min(0).default(0),
  fulfillment_type: z.enum(["pickup", "delivery", "both"]).default("pickup"),
  weight_grams: z.number().int().min(0).optional().nullable(),
  variants: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    price: z.number().min(0).optional().nullable(),
    stock: z.number().int().min(0).default(0),
    option_type: z.string().optional(),
    option_value: z.string().optional(),
    image_url: z.string().url().optional().nullable(),
  })).default([]),
});

export type SpecialProductFormData = z.infer<typeof specialProductSchema>;

export const digitalProductSchema = z.object({
  delivery_method: z.enum(["auto", "manual"]).default("auto"),
  auto_send_wa: z.boolean().default(true),
  max_downloads: z.number().int().min(1).max(100).default(5),
  access_days: z.number().int().min(1).max(365).default(30),
  requires_email: z.boolean().default(false),
});

export type DigitalProductFormData = z.infer<typeof digitalProductSchema>;

// ── Combined Create Schemas ──

export const createVoucherSchema = productSchema.extend({
  product_type: z.literal("voucher"),
  voucher: voucherSchema,
});

export const createSpecialProductSchema = productSchema.extend({
  product_type: z.literal("special"),
  special: specialProductSchema,
});

export const createDigitalProductSchema = productSchema.extend({
  product_type: z.literal("digital"),
  digital: digitalProductSchema,
});

export type CreateVoucherData = z.infer<typeof createVoucherSchema>;
export type CreateSpecialData = z.infer<typeof createSpecialProductSchema>;
export type CreateDigitalData = z.infer<typeof createDigitalProductSchema>;

// ── Redeem Voucher Schema ──

export const redeemVoucherSchema = z.object({
  code: z.string().min(1, "Kode voucher wajib diisi"),
  customer_id: z.string().uuid().optional().nullable(),
  transaction_amount: z.number().min(0).optional(),
  staff_name: z.string().optional(),
});

export type RedeemVoucherData = z.infer<typeof redeemVoucherSchema>;

// ── DB Row Types ──

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  product_type: ProductType;
  status: ProductStatus;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  media_urls: string[];
  sort_order: number;
  is_featured: boolean;
  tags: string[];
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  total_sold: number;
  total_revenue: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Voucher {
  id: string;
  product_id: string;
  business_id: string;
  discount_type: DiscountType;
  discount_value: number;
  min_spend: number;
  max_discount: number | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  max_uses_per_customer: number;
  buy_quantity: number;
  get_quantity: number;
  bundle_items: Array<{ product_name: string; quantity: number }>;
  auto_send_wa: boolean;
  wa_message: string | null;
  total_issued: number;
  total_redeemed: number;
  total_savings: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface VoucherCode {
  id: string;
  voucher_id: string;
  customer_id: string | null;
  code: string;
  qr_url: string | null;
  status: VoucherStatus;
  redeemed_at: string | null;
  redeemed_by: string | null;
  sent_via_wa: boolean;
  sent_at: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VoucherRedemption {
  id: string;
  voucher_code_id: string;
  voucher_id: string;
  customer_id: string | null;
  business_id: string;
  transaction_amount: number | null;
  discount_applied: number;
  staff_name: string | null;
  redeemed_at: string;
  metadata: Record<string, unknown>;
}

export interface SpecialProduct {
  id: string;
  product_id: string;
  track_stock: boolean;
  total_stock: number;
  low_stock_alert: number;
  allow_preorder: boolean;
  lead_time_days: number;
  fulfillment_type: string;
  weight_grams: number | null;
  dimensions: Record<string, number> | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  stock: number;
  image_url: string | null;
  option_type: string | null;
  option_value: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DigitalProduct {
  id: string;
  product_id: string;
  delivery_method: string;
  auto_send_wa: boolean;
  max_downloads: number;
  access_days: number;
  requires_email: boolean;
  total_downloads: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DigitalProductFile {
  id: string;
  digital_product_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  sort_order: number;
  is_preview: boolean;
  created_at: string;
}

// ── Product with relations ──

export interface ProductWithVoucher extends Product {
  voucher: Voucher | null;
  voucher_codes?: VoucherCode[];
}

export interface ProductWithSpecial extends Product {
  special: SpecialProduct | null;
  variants?: ProductVariant[];
}

export interface ProductWithDigital extends Product {
  digital: DigitalProduct | null;
  files?: DigitalProductFile[];
}

export type ProductWithDetails = ProductWithVoucher | ProductWithSpecial | ProductWithDigital;

// ── Stats ──

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  totalVouchers: number;
  activeVouchers: number;
  totalRedemptions: number;
  totalRevenue: number;
  totalSpecial: number;
  totalDigital: number;
}
