"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  serviceSchema,
  menuCategorySchema,
  menuItemSchema,
  reorderSchema,
  type ServiceInput,
  type MenuCategoryInput,
  type MenuItemInput,
  type ReorderInput,
} from "@/lib/validations/services";

/** Helper: get business_id for the current user */
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

// ════════════════════════════════════════════
// SERVICES
// ════════════════════════════════════════════

export async function getServices() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createService(input: ServiceInput) {
  const parsed = serviceSchema.parse(input);
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("services")
    .insert({
      business_id: businessId,
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price ?? null,
      price_max: parsed.priceMax ?? null,
      duration_min: parsed.durationMin ?? null,
      image_url: parsed.imageUrl || null,
      sort_order: parsed.sortOrder,
      status: parsed.status,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/services");
  return data;
}

export async function updateService(id: string, input: ServiceInput) {
  const parsed = serviceSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .update({
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price ?? null,
      price_max: parsed.priceMax ?? null,
      duration_min: parsed.durationMin ?? null,
      image_url: parsed.imageUrl || null,
      sort_order: parsed.sortOrder,
      status: parsed.status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/services");
  return data;
}

export async function deleteService(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/services");
}

// ════════════════════════════════════════════
// MENU CATEGORIES
// ════════════════════════════════════════════

export async function getMenuCategories() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("menu_categories")
    .select("*")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createMenuCategory(input: MenuCategoryInput) {
  const parsed = menuCategorySchema.parse(input);
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("menu_categories")
    .insert({
      business_id: businessId,
      name: parsed.name,
      description: parsed.description || null,
      sort_order: parsed.sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/menu");
  return data;
}

export async function updateMenuCategory(id: string, input: MenuCategoryInput) {
  const parsed = menuCategorySchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_categories")
    .update({
      name: parsed.name,
      description: parsed.description || null,
      sort_order: parsed.sortOrder,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/menu");
  return data;
}

export async function deleteMenuCategory(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("menu_categories").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/menu");
}

// ════════════════════════════════════════════
// MENU ITEMS
// ════════════════════════════════════════════

export async function getMenuItems() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, menu_categories(name)")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createMenuItem(input: MenuItemInput) {
  const parsed = menuItemSchema.parse(input);
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      business_id: businessId,
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      category_id: parsed.categoryId || null,
      image_url: parsed.imageUrl || null,
      is_available: parsed.isAvailable,
      is_popular: parsed.isPopular,
      sort_order: parsed.sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/menu");
  return data;
}

export async function updateMenuItem(id: string, input: MenuItemInput) {
  const parsed = menuItemSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("menu_items")
    .update({
      name: parsed.name,
      description: parsed.description || null,
      price: parsed.price,
      category_id: parsed.categoryId || null,
      image_url: parsed.imageUrl || null,
      is_available: parsed.isAvailable,
      is_popular: parsed.isPopular,
      sort_order: parsed.sortOrder,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/menu");
  return data;
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard/menu");
}

// ════════════════════════════════════════════
// REORDER (shared drag-drop)
// ════════════════════════════════════════════

export async function reorderItems(
  table: "services" | "menu_categories" | "menu_items",
  input: ReorderInput
) {
  const parsed = reorderSchema.parse(input);
  const supabase = await createClient();

  // Update sort_order for each item
  const updates = parsed.items.map((item) =>
    supabase
      .from(table)
      .update({ sort_order: item.sortOrder })
      .eq("id", item.id)
  );

  await Promise.all(updates);

  const pathMap = {
    services: "/dashboard/services",
    menu_categories: "/dashboard/menu",
    menu_items: "/dashboard/menu",
  };
  revalidatePath(pathMap[table]);
}
