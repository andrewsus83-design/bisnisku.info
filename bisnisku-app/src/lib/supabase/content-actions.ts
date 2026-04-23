"use server";

import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/config/env";
import { revalidatePath } from "next/cache";
import type {
  CreateContentInput,
  UpdateContentInput,
  AiGenerateContentInput,
  AiGenerateVariationsInput,
  ContentType,
  ContentStatus,
  CampaignChannel,
} from "@/lib/validations/content";

// ── Helpers ──

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

async function getBusinessProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, description, vertical, city, category, sub_category, phone, slug")
    .eq("owner_id", user.id)
    .single();

  if (!business) throw new Error("No business found");
  return { ...business, userEmail: user.email };
}

// ── Content CRUD ──

export async function getContents(params?: {
  status?: ContentStatus;
  content_type?: ContentType;
  channel?: CampaignChannel;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  let query = supabase
    .from("contents")
    .select("*, content_templates(name)", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (params?.status) query = query.eq("status", params.status);
  if (params?.content_type) query = query.eq("content_type", params.content_type);
  if (params?.channel) query = query.eq("channel", params.channel);
  if (params?.search) {
    query = query.or(`title.ilike.%${params.search}%,body.ilike.%${params.search}%`);
  }

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { contents: data ?? [], total: count ?? 0 };
}

export async function getContentById(id: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("contents")
    .select("*, content_templates(name, body_template, variables)")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (error) throw error;
  return data;
}

export async function createContent(
  input: CreateContentInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from("contents")
      .insert({
        business_id: businessId,
        title: input.title,
        body: input.body,
        content_type: input.content_type,
        channel: input.channel,
        status: input.status ?? "draft",
        media_urls: input.media_urls ?? [],
        thumbnail_url: input.thumbnail_url ?? null,
        template_id: input.template_id ?? null,
        tags: input.tags ?? [],
        seo_title: input.seo_title ?? null,
        seo_description: input.seo_description ?? null,
        slug: input.slug ?? null,
        scheduled_at: input.scheduled_at ?? null,
        published_at: input.status === "published" ? new Date().toISOString() : null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/content");
    return { success: true, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function updateContent(
  input: UpdateContentInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    // Build update payload (only include provided fields)
    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.body !== undefined) updates.body = input.body;
    if (input.content_type !== undefined) updates.content_type = input.content_type;
    if (input.channel !== undefined) updates.channel = input.channel;
    if (input.status !== undefined) {
      updates.status = input.status;
      if (input.status === "published" && !updates.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }
    if (input.media_urls !== undefined) updates.media_urls = input.media_urls;
    if (input.thumbnail_url !== undefined) updates.thumbnail_url = input.thumbnail_url;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.seo_title !== undefined) updates.seo_title = input.seo_title;
    if (input.seo_description !== undefined) updates.seo_description = input.seo_description;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.scheduled_at !== undefined) updates.scheduled_at = input.scheduled_at;

    const { error } = await supabase
      .from("contents")
      .update(updates)
      .eq("id", input.id)
      .eq("business_id", businessId);

    if (error) return { success: false, error: error.message };

    // Save to content_history
    if (input.title || input.body || input.status) {
      const current = await getContentById(input.id);
      if (current) {
        const {
          data: { user },
        } = await (await createClient()).auth.getUser();
        await supabase.from("content_history").insert({
          content_id: input.id,
          title: current.title,
          body: current.body,
          status: current.status,
          changed_by: user?.id ?? null,
          change_note: input.status ? `Status changed to ${input.status}` : "Content updated",
        });
      }
    }

    revalidatePath("/dashboard/content");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteContent(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    const { error } = await supabase
      .from("contents")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/content");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ── Content Stats ──

export async function getContentStats() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, count } = await supabase
    .from("contents")
    .select("status, ai_generated", { count: "exact" })
    .eq("business_id", businessId);

  const items = data ?? [];
  return {
    total: count ?? 0,
    draft: items.filter((c) => c.status === "draft").length,
    scheduled: items.filter((c) => c.status === "scheduled").length,
    published: items.filter((c) => c.status === "published").length,
    archived: items.filter((c) => c.status === "archived").length,
    aiGenerated: items.filter((c) => c.ai_generated).length,
  };
}

// ── Content Templates ──

export async function getContentTemplates(vertical?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("content_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (vertical) {
    query = query.or(`vertical.eq.${vertical},vertical.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ── Content History ──

export async function getContentHistory(contentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("content_history")
    .select("*")
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

// ── Calendar Events ──

export async function getCalendarEvents(month: number, year: number) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  // Get scheduled/published contents
  const { data: contents } = await supabase
    .from("contents")
    .select("id, title, content_type, status, channel, scheduled_at, published_at")
    .eq("business_id", businessId)
    .in("status", ["scheduled", "published"])
    .or(
      `scheduled_at.gte.${startDate},scheduled_at.lte.${endDate},published_at.gte.${startDate},published_at.lte.${endDate}`
    );

  // Get campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, campaign_type, status, channel, scheduled_at, started_at")
    .eq("business_id", businessId)
    .not("status", "eq", "draft")
    .or(
      `scheduled_at.gte.${startDate},scheduled_at.lte.${endDate},started_at.gte.${startDate},started_at.lte.${endDate}`
    );

  const events = [
    ...(contents ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      date: (c.scheduled_at ?? c.published_at) as string,
      type: "content" as const,
      content_type: c.content_type as ContentType,
      status: c.status as ContentStatus,
      channel: c.channel as CampaignChannel,
    })),
    ...(campaigns ?? []).map((c) => ({
      id: c.id,
      title: c.name,
      date: (c.scheduled_at ?? c.started_at) as string,
      type: "campaign" as const,
      content_type: c.campaign_type as ContentType,
      status: c.status as ContentStatus,
      channel: c.channel as CampaignChannel,
    })),
  ];

  return events;
}

// ── Content Assets ──

export async function getContentAssets(params?: {
  file_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  let query = supabase
    .from("content_assets")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (params?.file_type) {
    query = query.ilike("file_type", `${params.file_type}%`);
  }
  if (params?.search) {
    query = query.or(`file_name.ilike.%${params.search}%,alt_text.ilike.%${params.search}%`);
  }

  const limit = params?.limit ?? 30;
  const offset = params?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { assets: data ?? [], total: count ?? 0 };
}

export async function createContentAsset(input: {
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  alt_text?: string;
  tags?: string[];
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from("content_assets")
      .insert({
        business_id: businessId,
        file_name: input.file_name,
        file_url: input.file_url,
        file_type: input.file_type,
        file_size: input.file_size,
        alt_text: input.alt_text ?? null,
        tags: input.tags ?? [],
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteContentAsset(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    const { error } = await supabase
      .from("content_assets")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// ── AI Content Generation ──

async function callClaude(
  prompt: string,
  model: "haiku" | "sonnet" = "haiku",
  maxTokens = 1000
): Promise<{ text: string; model: string } | { error: string }> {
  const apiKey = serverEnv.ANTHROPIC_API;

  const modelId =
    model === "sonnet" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

  if (!apiKey) {
    return { error: "ANTHROPIC_API key belum dikonfigurasi" };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { error: `API error ${response.status}: ${errBody}` };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    return { text, model: modelId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { error: msg };
  }
}

export async function aiGenerateContent(
  input: AiGenerateContentInput
): Promise<
  | { success: true; title: string; body: string; model: string }
  | { success: false; error: string }
> {
  try {
    const business = await getBusinessProfile();

    const toneMap = {
      professional: "profesional dan terpercaya",
      friendly: "ramah dan bersahabat",
      casual: "santai dan fun",
      urgent: "mendesak dan penting",
      promotional: "promosi yang menarik",
    };

    const channelGuide = {
      whatsapp: "WhatsApp message (pendek, to-the-point, gunakan emoji, include CTA)",
      social: "Social media post (engaging, gunakan emoji & hashtags, max 280 karakter untuk caption)",
      bio_page: "Bio page content (informatif, profesional, SEO-friendly)",
      email: "Email marketing (clear subject line, persuasive body, CTA button)",
    };

    const prompt = `Kamu adalah copywriter profesional untuk bisnis lokal di Indonesia.

Buat konten ${input.content_type} untuk channel ${input.channel}.

Info bisnis:
- Nama: ${business.name}
- Kategori: ${business.vertical}${business.category ? ` — ${business.category}` : ""}
- Kota: ${business.city || "Jakarta"}
${business.description ? `- Deskripsi: ${business.description}` : ""}

Instruksi dari user: ${input.prompt}

Panduan:
- Tone: ${toneMap[input.tone]}
- Channel: ${channelGuide[input.channel]}
- Bahasa: ${input.language === "id" ? "Bahasa Indonesia" : "English"}
${input.include_emoji ? "- Gunakan emoji yang relevan" : "- Jangan pakai emoji"}
${input.include_hashtags ? "- Tambahkan 3-5 hashtags di akhir" : ""}
- Maksimal ${input.max_length} karakter

Jawab dalam format JSON saja tanpa markdown:
{"title": "judul konten (max 100 char)", "body": "isi konten lengkap"}`;

    const result = await callClaude(prompt, input.model ?? "haiku", 1500);

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    // Parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Gagal parsing hasil AI" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      title: parsed.title || "Untitled",
      body: parsed.body || result.text,
      model: result.model,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function aiGenerateVariations(
  input: AiGenerateVariationsInput
): Promise<
  | { success: true; variations: string[]; model: string }
  | { success: false; error: string }
> {
  try {
    const toneInstruction = input.tone
      ? `dengan tone ${input.tone}`
      : "dengan variasi tone berbeda";

    const prompt = `Buat ${input.count} variasi dari konten marketing berikut ${toneInstruction}.

Konten asli:
${input.original_body}

Buat variasi yang berbeda namun tetap menyampaikan pesan yang sama.
Jawab dalam format JSON array saja tanpa markdown:
["variasi 1", "variasi 2", "variasi 3"]`;

    const result = await callClaude(prompt, "haiku", 2000);

    if ("error" in result) {
      return { success: false, error: result.error };
    }

    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { success: false, error: "Gagal parsing variasi AI" };
    }

    const variations = JSON.parse(jsonMatch[0]) as string[];
    return { success: true, variations, model: result.model };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

/** AI-generate content and save directly as draft */
export async function aiGenerateAndSaveContent(
  input: AiGenerateContentInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const aiResult = await aiGenerateContent(input);
  if (!aiResult.success) return aiResult;

  const saveResult = await createContent({
    title: aiResult.title,
    body: aiResult.body,
    content_type: input.content_type,
    channel: input.channel,
    status: "draft",
    tags: [],
    media_urls: [],
    metadata: {
      ai_generated: true,
      ai_prompt: input.prompt,
      ai_model: aiResult.model,
    },
  });

  if (!saveResult.success) return saveResult;

  // Update ai_generated flag
  const supabase = await createClient();
  await supabase
    .from("contents")
    .update({
      ai_generated: true,
      ai_prompt: input.prompt,
      ai_model: aiResult.model,
    })
    .eq("id", saveResult.id);

  return saveResult;
}
