"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type {
  ProductType,
  ProductStatus,
  VoucherStatus,
  CreateVoucherData,
  CreateSpecialData,
  CreateDigitalData,
  RedeemVoucherData,
  ProductStats,
} from "@/lib/validations/product";

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════

async function getBusinessId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) throw new Error("No business found");
  return business.id;
}

/**
 * Generate a voucher code in BISNISKU-XXXX-XXXX format.
 * Uses crypto.randomUUID() as entropy source, then formats.
 */
function generateVoucherCode(): string {
  const hex = crypto.randomUUID().replace(/-/g, "");
  const part1 = hex.substring(0, 4).toUpperCase();
  const part2 = hex.substring(4, 8).toUpperCase();
  return `BISNISKU-${part1}-${part2}`;
}

const REVALIDATE_PATH = "/dashboard/products";

// ════════════════════════════════════════════
// 1. GET PRODUCTS — list with filters & pagination
// ════════════════════════════════════════════

export async function getProducts(params?: {
  product_type?: ProductType;
  status?: ProductStatus;
  search?: string;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (params?.product_type) query = query.eq("product_type", params.product_type);
  if (params?.status) query = query.eq("status", params.status);
  if (params?.is_featured !== undefined) query = query.eq("is_featured", params.is_featured);
  if (params?.search) {
    query = query.or(
      `name.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { products: data ?? [], total: count ?? 0 };
}

// ════════════════════════════════════════════
// 2. GET PRODUCT BY ID — with type-specific details
// ════════════════════════════════════════════

export async function getProductById(id: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (error) throw error;
  if (!product) return null;

  // Fetch type-specific details
  if (product.product_type === "voucher") {
    const { data: voucher } = await supabase
      .from("vouchers")
      .select("*")
      .eq("product_id", id)
      .single();

    return { ...product, voucher: voucher ?? null };
  }

  if (product.product_type === "special") {
    const [{ data: special }, { data: variants }] = await Promise.all([
      supabase
        .from("special_products")
        .select("*")
        .eq("product_id", id)
        .single(),
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("sort_order", { ascending: true }),
    ]);

    return {
      ...product,
      special: special ?? null,
      variants: variants ?? [],
    };
  }

  if (product.product_type === "digital") {
    const [{ data: digital }, { data: files }] = await Promise.all([
      supabase
        .from("digital_products")
        .select("*")
        .eq("product_id", id)
        .single(),
      supabase
        .from("digital_product_files")
        .select("*")
        .eq("digital_product_id", id)
        .order("sort_order", { ascending: true }),
    ]);

    return {
      ...product,
      digital: digital ?? null,
      files: files ?? [],
    };
  }

  return product;
}

// ════════════════════════════════════════════
// 3. GET PRODUCT STATS
// ════════════════════════════════════════════

export async function getProductStats(): Promise<ProductStats> {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: products } = await supabase
    .from("products")
    .select("product_type, status, total_sold, total_revenue")
    .eq("business_id", businessId);

  const items = products ?? [];

  const { data: redemptions } = await supabase
    .from("voucher_redemptions")
    .select("id", { count: "exact" })
    .eq("business_id", businessId);

  return {
    totalProducts: items.length,
    activeProducts: items.filter((p) => p.status === "active").length,
    totalVouchers: items.filter((p) => p.product_type === "voucher").length,
    activeVouchers: items.filter(
      (p) => p.product_type === "voucher" && p.status === "active"
    ).length,
    totalRedemptions: redemptions?.length ?? 0,
    totalRevenue: items.reduce((sum, p) => sum + (p.total_revenue ?? 0), 0),
    totalSpecial: items.filter((p) => p.product_type === "special").length,
    totalDigital: items.filter((p) => p.product_type === "digital").length,
  };
}

// ════════════════════════════════════════════
// 4. CREATE VOUCHER
// ════════════════════════════════════════════

export async function createVoucher(
  input: CreateVoucherData
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    // 1. Create base product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        name: input.name,
        description: input.description ?? null,
        product_type: "voucher",
        status: input.status ?? "active",
        price: input.price,
        compare_price: input.compare_price ?? null,
        image_url: input.image_url ?? null,
        media_urls: input.media_urls ?? [],
        is_featured: input.is_featured ?? false,
        tags: input.tags ?? [],
        slug: input.slug ?? null,
        seo_title: input.seo_title ?? null,
        seo_description: input.seo_description ?? null,
      })
      .select("id")
      .single();

    if (productError) return { success: false, error: productError.message };

    // 2. Create voucher record
    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .insert({
        product_id: product.id,
        business_id: businessId,
        discount_type: input.voucher.discount_type,
        discount_value: input.voucher.discount_value,
        min_spend: input.voucher.min_spend ?? 0,
        max_discount: input.voucher.max_discount ?? null,
        valid_from: input.voucher.valid_from ?? new Date().toISOString(),
        valid_until: input.voucher.valid_until ?? null,
        max_uses: input.voucher.max_uses ?? null,
        max_uses_per_customer: input.voucher.max_uses_per_customer ?? 1,
        buy_quantity: input.voucher.buy_quantity ?? 1,
        get_quantity: input.voucher.get_quantity ?? 1,
        bundle_items: input.voucher.bundle_items ?? [],
        auto_send_wa: input.voucher.auto_send_wa ?? false,
        wa_message: input.voucher.wa_message ?? null,
        total_issued: input.voucher.quantity ?? 100,
      })
      .select("id")
      .single();

    if (voucherError) return { success: false, error: voucherError.message };

    // 3. Generate voucher codes
    const quantity = input.voucher.quantity ?? 100;
    const codes = Array.from({ length: quantity }, () => ({
      voucher_id: voucher.id,
      code: generateVoucherCode(),
      status: "active" as const,
      expires_at: input.voucher.valid_until ?? null,
    }));

    // Insert in batches of 500 to avoid payload limits
    const BATCH_SIZE = 500;
    for (let i = 0; i < codes.length; i += BATCH_SIZE) {
      const batch = codes.slice(i, i + BATCH_SIZE);
      const { error: codeError } = await supabase
        .from("voucher_codes")
        .insert(batch);

      if (codeError) return { success: false, error: codeError.message };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, id: product.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ════════════════════════════════════════════
// 5. CREATE SPECIAL PRODUCT
// ════════════════════════════════════════════

export async function createSpecialProduct(
  input: CreateSpecialData
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    // 1. Create base product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        name: input.name,
        description: input.description ?? null,
        product_type: "special",
        status: input.status ?? "active",
        price: input.price,
        compare_price: input.compare_price ?? null,
        image_url: input.image_url ?? null,
        media_urls: input.media_urls ?? [],
        is_featured: input.is_featured ?? false,
        tags: input.tags ?? [],
        slug: input.slug ?? null,
        seo_title: input.seo_title ?? null,
        seo_description: input.seo_description ?? null,
      })
      .select("id")
      .single();

    if (productError) return { success: false, error: productError.message };

    // 2. Create special_products record
    const { error: specialError } = await supabase
      .from("special_products")
      .insert({
        product_id: product.id,
        track_stock: input.special.track_stock ?? true,
        total_stock: input.special.total_stock ?? 0,
        low_stock_alert: input.special.low_stock_alert ?? 5,
        allow_preorder: input.special.allow_preorder ?? false,
        lead_time_days: input.special.lead_time_days ?? 0,
        fulfillment_type: input.special.fulfillment_type ?? "pickup",
        weight_grams: input.special.weight_grams ?? null,
      });

    if (specialError) return { success: false, error: specialError.message };

    // 3. Create variants if provided
    const variants = input.special.variants ?? [];
    if (variants.length > 0) {
      const variantRows = variants.map((v, idx) => ({
        product_id: product.id,
        name: v.name,
        sku: v.sku ?? null,
        price: v.price ?? null,
        stock: v.stock ?? 0,
        option_type: v.option_type ?? null,
        option_value: v.option_value ?? null,
        image_url: v.image_url ?? null,
        sort_order: idx,
        is_active: true,
      }));

      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(variantRows);

      if (variantError) return { success: false, error: variantError.message };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true, id: product.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ════════════════════════════════════════════
// 6. CREATE DIGITAL PRODUCT
// ════════════════════════════════════════════

export async function createDigitalProduct(
  input: CreateDigitalData
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    // 1. Create base product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        name: input.name,
        description: input.description ?? null,
        product_type: "digital",
        status: input.status ?? "active",
        price: input.price,
        compare_price: input.compare_price ?? null,
        image_url: input.image_url ?? null,
        media_urls: input.media_urls ?? [],
        is_featured: input.is_featured ?? false,
        tags: input.tags ?? [],
        slug: input.slug ?? null,
        seo_title: input.seo_title ?? null,
        seo_description: input.seo_description ?? null,
      })
      .select("id")
      .single();

    if (productError) return { success: false, error: productError.message };

    // 2. Create digital_products record
    const { error: digitalError } = await supabase
      .from("digital_products")
      .insert({
        product_id: product.id,
        delivery_method: input.digital.delivery_method ?? "auto",
        auto_send_wa: input.digital.auto_send_wa ?? true,
        max_downloads: input.digital.max_downloads ?? 5,
        access_days: input.digital.access_days ?? 30,
        requires_email: input.digital.requires_email ?? false,
      });

    if (digitalError) return { success: false, error: digitalError.message };

    revalidatePath(REVALIDATE_PATH);
    return { success: true, id: product.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ════════════════════════════════════════════
// 7. UPDATE PRODUCT
// ════════════════════════════════════════════

export async function updateProduct(
  id: string,
  input: {
    name?: string;
    description?: string | null;
    status?: ProductStatus;
    price?: number;
    compare_price?: number | null;
    image_url?: string | null;
    media_urls?: string[];
    is_featured?: boolean;
    tags?: string[];
    slug?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    sort_order?: number;
    // Type-specific updates
    voucher?: Partial<{
      discount_type: string;
      discount_value: number;
      min_spend: number;
      max_discount: number | null;
      valid_from: string;
      valid_until: string | null;
      max_uses: number | null;
      max_uses_per_customer: number;
      auto_send_wa: boolean;
      wa_message: string | null;
    }>;
    special?: Partial<{
      track_stock: boolean;
      total_stock: number;
      low_stock_alert: number;
      allow_preorder: boolean;
      lead_time_days: number;
      fulfillment_type: string;
      weight_grams: number | null;
    }>;
    digital?: Partial<{
      delivery_method: string;
      auto_send_wa: boolean;
      max_downloads: number;
      access_days: number;
      requires_email: boolean;
    }>;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    // Build base product updates
    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.price !== undefined) updates.price = input.price;
    if (input.compare_price !== undefined) updates.compare_price = input.compare_price;
    if (input.image_url !== undefined) updates.image_url = input.image_url;
    if (input.media_urls !== undefined) updates.media_urls = input.media_urls;
    if (input.is_featured !== undefined) updates.is_featured = input.is_featured;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.seo_title !== undefined) updates.seo_title = input.seo_title;
    if (input.seo_description !== undefined) updates.seo_description = input.seo_description;
    if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .eq("business_id", businessId);

      if (error) return { success: false, error: error.message };
    }

    // Update type-specific table
    if (input.voucher && Object.keys(input.voucher).length > 0) {
      const { error } = await supabase
        .from("vouchers")
        .update(input.voucher)
        .eq("product_id", id)
        .eq("business_id", businessId);

      if (error) return { success: false, error: error.message };
    }

    if (input.special && Object.keys(input.special).length > 0) {
      const { error } = await supabase
        .from("special_products")
        .update(input.special)
        .eq("product_id", id);

      if (error) return { success: false, error: error.message };
    }

    if (input.digital && Object.keys(input.digital).length > 0) {
      const { error } = await supabase
        .from("digital_products")
        .update(input.digital)
        .eq("product_id", id);

      if (error) return { success: false, error: error.message };
    }

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ════════════════════════════════════════════
// 8. DELETE PRODUCT
// ════════════════════════════════════════════

export async function deleteProduct(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    // Delete base product — cascade deletes handle related tables
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) return { success: false, error: error.message };

    revalidatePath(REVALIDATE_PATH);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ════════════════════════════════════════════
// 9. REDEEM VOUCHER
// ════════════════════════════════════════════

export async function redeemVoucher(
  input: RedeemVoucherData
): Promise<
  | { success: true; discount_applied: number; voucher_code_id: string }
  | { success: false; error: string }
> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    // 1. Find the voucher code
    const { data: codeRecord, error: codeError } = await supabase
      .from("voucher_codes")
      .select("*, vouchers!inner(*, products!inner(business_id, status))")
      .eq("code", input.code.trim().toUpperCase())
      .single();

    if (codeError || !codeRecord) {
      return { success: false, error: "Kode voucher tidak ditemukan" };
    }

    // 2. Validate business ownership
    const voucher = codeRecord.vouchers;
    if (voucher.products.business_id !== businessId) {
      return { success: false, error: "Voucher bukan milik bisnis ini" };
    }

    // 3. Validate code status
    if (codeRecord.status !== "active") {
      const statusMsg: Record<string, string> = {
        redeemed: "Voucher sudah digunakan",
        expired: "Voucher sudah kadaluarsa",
        cancelled: "Voucher telah dibatalkan",
      };
      return {
        success: false,
        error: statusMsg[codeRecord.status] ?? "Voucher tidak aktif",
      };
    }

    // 4. Validate product is active
    if (voucher.products.status !== "active") {
      return { success: false, error: "Produk voucher sudah tidak aktif" };
    }

    // 5. Validate expiration
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      // Auto-update status to expired
      await supabase
        .from("voucher_codes")
        .update({ status: "expired" })
        .eq("id", codeRecord.id);

      return { success: false, error: "Voucher sudah kadaluarsa" };
    }

    if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) {
      return { success: false, error: "Periode voucher sudah berakhir" };
    }

    // 6. Validate max uses (voucher-level)
    if (voucher.max_uses && voucher.total_redeemed >= voucher.max_uses) {
      return { success: false, error: "Voucher sudah mencapai batas penggunaan" };
    }

    // 7. Validate per-customer limit
    if (input.customer_id && voucher.max_uses_per_customer) {
      const { count } = await supabase
        .from("voucher_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("voucher_id", voucher.id)
        .eq("customer_id", input.customer_id);

      if ((count ?? 0) >= voucher.max_uses_per_customer) {
        return {
          success: false,
          error: "Pelanggan sudah mencapai batas penggunaan voucher",
        };
      }
    }

    // 8. Validate minimum spend
    if (voucher.min_spend > 0 && (input.transaction_amount ?? 0) < voucher.min_spend) {
      return {
        success: false,
        error: `Minimum transaksi Rp ${voucher.min_spend.toLocaleString("id-ID")}`,
      };
    }

    // 9. Calculate discount
    let discountApplied = 0;
    const txAmount = input.transaction_amount ?? 0;

    switch (voucher.discount_type) {
      case "percentage":
        discountApplied = Math.round((txAmount * voucher.discount_value) / 100);
        if (voucher.max_discount && discountApplied > voucher.max_discount) {
          discountApplied = voucher.max_discount;
        }
        break;
      case "fixed":
        discountApplied = Math.min(voucher.discount_value, txAmount);
        break;
      case "bogo":
      case "free_service":
      case "bundle":
      case "cashback":
        discountApplied = voucher.discount_value;
        break;
      default:
        discountApplied = voucher.discount_value;
    }

    const now = new Date().toISOString();

    // 10. Mark code as redeemed
    const { error: updateCodeError } = await supabase
      .from("voucher_codes")
      .update({
        status: "redeemed",
        redeemed_at: now,
        redeemed_by: input.staff_name ?? null,
        customer_id: input.customer_id ?? null,
      })
      .eq("id", codeRecord.id);

    if (updateCodeError) return { success: false, error: updateCodeError.message };

    // 11. Log redemption
    const { error: redemptionError } = await supabase
      .from("voucher_redemptions")
      .insert({
        voucher_code_id: codeRecord.id,
        voucher_id: voucher.id,
        customer_id: input.customer_id ?? null,
        business_id: businessId,
        transaction_amount: txAmount,
        discount_applied: discountApplied,
        staff_name: input.staff_name ?? null,
        redeemed_at: now,
      });

    if (redemptionError) return { success: false, error: redemptionError.message };

    // 12. Update voucher stats
    await supabase
      .from("vouchers")
      .update({
        total_redeemed: voucher.total_redeemed + 1,
        total_savings: voucher.total_savings + discountApplied,
      })
      .eq("id", voucher.id);

    // 13. Update product stats
    await supabase
      .from("products")
      .update({
        total_sold: (voucher.products as Record<string, unknown>).total_sold
          ? Number((voucher.products as Record<string, unknown>).total_sold) + 1
          : 1,
      })
      .eq("id", voucher.product_id);

    revalidatePath(REVALIDATE_PATH);
    return {
      success: true,
      discount_applied: discountApplied,
      voucher_code_id: codeRecord.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ════════════════════════════════════════════
// 10. GET VOUCHER CODES
// ════════════════════════════════════════════

export async function getVoucherCodes(
  voucherId: string,
  params?: {
    status?: VoucherStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Verify voucher belongs to this business
  const { data: voucher } = await supabase
    .from("vouchers")
    .select("id")
    .eq("id", voucherId)
    .eq("business_id", businessId)
    .single();

  if (!voucher) throw new Error("Voucher not found");

  let query = supabase
    .from("voucher_codes")
    .select("*", { count: "exact" })
    .eq("voucher_id", voucherId)
    .order("created_at", { ascending: false });

  if (params?.status) query = query.eq("status", params.status);
  if (params?.search) {
    query = query.ilike("code", `%${params.search}%`);
  }

  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { codes: data ?? [], total: count ?? 0 };
}

// ════════════════════════════════════════════
// 11. GET REDEMPTION HISTORY
// ════════════════════════════════════════════

export async function getRedemptionHistory(params?: {
  voucher_id?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  let query = supabase
    .from("voucher_redemptions")
    .select(
      "*, voucher_codes(code), vouchers(discount_type, discount_value, products(name))",
      { count: "exact" }
    )
    .eq("business_id", businessId)
    .order("redeemed_at", { ascending: false });

  if (params?.voucher_id) query = query.eq("voucher_id", params.voucher_id);
  if (params?.customer_id) query = query.eq("customer_id", params.customer_id);
  if (params?.date_from) query = query.gte("redeemed_at", params.date_from);
  if (params?.date_to) query = query.lte("redeemed_at", params.date_to);

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { redemptions: data ?? [], total: count ?? 0 };
}
