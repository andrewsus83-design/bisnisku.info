"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  bioPageSaveSchema,
  type BioPageSaveInput,
} from "@/lib/validations/bio-page";

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
// BIO PAGE
// ════════════════════════════════════════════

/** Get or create bio page for current business */
export async function getBioPage() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Try to get existing bio page
  const { data: page } = await supabase
    .from("bio_pages")
    .select("*, bio_blocks(*)")
    .eq("business_id", businessId)
    .single();

  if (page) {
    // Sort blocks by sort_order
    if (page.bio_blocks) {
      page.bio_blocks.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }
    return page;
  }

  // Create default bio page with starter blocks
  const { data: newPage, error } = await supabase
    .from("bio_pages")
    .insert({
      business_id: businessId,
      status: "draft",
      theme: {
        primaryColor: "#0F172A",
        accentColor: "#FFCC00",
        fontFamily: "Inter",
        buttonStyle: "rounded",
        darkMode: false,
      },
    })
    .select()
    .single();

  if (error) throw error;

  // Insert default blocks
  const defaultBlocks = [
    { type: "hero", sort_order: 0 },
    { type: "about", sort_order: 1 },
    { type: "services", sort_order: 2 },
    { type: "contact", sort_order: 3 },
    { type: "social_links", sort_order: 4 },
  ];

  const { data: blocks, error: blockError } = await supabase
    .from("bio_blocks")
    .insert(
      defaultBlocks.map((b) => ({
        bio_page_id: newPage.id,
        type: b.type,
        content: {},
        settings: {},
        sort_order: b.sort_order,
        is_visible: true,
      }))
    )
    .select();

  if (blockError) throw blockError;

  return { ...newPage, bio_blocks: blocks };
}

/** Save bio page (page settings + all blocks) */
export async function saveBioPage(input: BioPageSaveInput) {
  const parsed = bioPageSaveSchema.parse(input);
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Get existing bio page
  const { data: existing } = await supabase
    .from("bio_pages")
    .select("id")
    .eq("business_id", businessId)
    .single();

  if (!existing) throw new Error("Bio page not found");

  // Update page settings
  const { error: pageError } = await supabase
    .from("bio_pages")
    .update({
      template_id: parsed.page.templateId || null,
      status: parsed.page.status,
      theme: parsed.page.theme,
      seo_title: parsed.page.seoTitle || null,
      seo_description: parsed.page.seoDescription || null,
      og_image_url: parsed.page.ogImageUrl || null,
      custom_css: parsed.page.customCss || null,
      published_at:
        parsed.page.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", existing.id);

  if (pageError) throw pageError;

  // Delete all existing blocks and re-insert
  await supabase.from("bio_blocks").delete().eq("bio_page_id", existing.id);

  if (parsed.blocks.length > 0) {
    const { error: blockError } = await supabase.from("bio_blocks").insert(
      parsed.blocks.map((b, i) => ({
        bio_page_id: existing.id,
        type: b.type,
        content: b.content,
        settings: b.settings,
        sort_order: i,
        is_visible: b.isVisible,
      }))
    );

    if (blockError) throw blockError;
  }

  revalidatePath("/dashboard/bio-page");
  // Revalidate the public page via ISR
  const { data: biz } = await supabase
    .from("businesses")
    .select("slug")
    .eq("id", businessId)
    .single();
  if (biz?.slug) {
    revalidatePath(`/${biz.slug}`);
  }

  return { success: true };
}

/** Publish bio page */
export async function publishBioPage() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Update bio page status
  const { error: pageError } = await supabase
    .from("bio_pages")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("business_id", businessId);

  if (pageError) throw pageError;

  // Also set business as published
  const { error: bizError } = await supabase
    .from("businesses")
    .update({ is_published: true })
    .eq("id", businessId);

  if (bizError) throw bizError;

  revalidatePath("/dashboard/bio-page");
  return { success: true };
}

/** Get the public URL slug for current business */
export async function getBusinessSlug(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("businesses")
    .select("slug")
    .eq("owner_id", user.id)
    .single();

  return data?.slug || null;
}

/** Unpublish bio page */
export async function unpublishBioPage() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { error } = await supabase
    .from("bio_pages")
    .update({ status: "draft", published_at: null })
    .eq("business_id", businessId);

  if (error) throw error;
  revalidatePath("/dashboard/bio-page");
  return { success: true };
}

// ════════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════════

/** Get all page templates */
export async function getPageTemplates() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("page_templates")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

/** Apply a template to the current bio page */
export async function applyTemplate(templateId: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Get template
  const { data: template, error: tplError } = await supabase
    .from("page_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (tplError || !template) throw new Error("Template not found");

  // Get existing bio page
  const { data: page } = await supabase
    .from("bio_pages")
    .select("id")
    .eq("business_id", businessId)
    .single();

  if (!page) throw new Error("Bio page not found");

  // Update page theme + template reference
  await supabase
    .from("bio_pages")
    .update({
      template_id: templateId,
      theme: template.theme,
    })
    .eq("id", page.id);

  // Replace blocks with template blocks
  await supabase.from("bio_blocks").delete().eq("bio_page_id", page.id);

  const templateBlocks = (template.blocks as Array<{
    type: string;
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>) || [];

  if (templateBlocks.length > 0) {
    await supabase.from("bio_blocks").insert(
      templateBlocks.map((b, i) => ({
        bio_page_id: page.id,
        type: b.type,
        content: b.content || {},
        settings: b.settings || {},
        sort_order: i,
        is_visible: true,
      }))
    );
  }

  revalidatePath("/dashboard/bio-page");
  return { success: true };
}

// ════════════════════════════════════════════
// PUBLIC: Fetch bio page by slug (for [slug] route)
// ════════════════════════════════════════════

export async function getBioPageBySlug(slug: string) {
  const supabase = await createClient();

  // Get business by slug
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select(
      `
      id, name, slug, description, vertical, phone, whatsapp,
      email, website, address, city, logo_url, cover_url,
      instagram, facebook, tiktok, settings
    `
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (bizError || !business) return null;

  // Get bio page + blocks
  const { data: bioPage } = await supabase
    .from("bio_pages")
    .select("*, bio_blocks(*)")
    .eq("business_id", business.id)
    .eq("status", "published")
    .single();

  if (!bioPage) return null;

  // Sort blocks
  if (bioPage.bio_blocks) {
    bioPage.bio_blocks.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
  }

  // Get services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("sort_order");

  // Get menu items with categories
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*, menu_categories(name)")
    .eq("business_id", business.id)
    .eq("is_available", true)
    .order("sort_order");

  // Increment view count (fire and forget)
  supabase
    .from("bio_pages")
    .update({ view_count: (bioPage.view_count || 0) + 1 })
    .eq("id", bioPage.id)
    .then(() => {});

  return {
    business,
    bioPage,
    blocks: bioPage.bio_blocks || [],
    services: services || [],
    menuItems: menuItems || [],
  };
}
