"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignStatus,
  CampaignChannel,
  ContentType,
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

// ── Campaign CRUD ──

export async function getCampaigns(params?: {
  status?: CampaignStatus;
  channel?: CampaignChannel;
  campaign_type?: ContentType;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  let query = supabase
    .from("campaigns")
    .select("*, contents(title, body)", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (params?.status) query = query.eq("status", params.status);
  if (params?.channel) query = query.eq("channel", params.channel);
  if (params?.campaign_type) query = query.eq("campaign_type", params.campaign_type);
  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { campaigns: data ?? [], total: count ?? 0 };
}

export async function getCampaignById(id: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("campaigns")
    .select("*, contents(title, body, media_urls)")
    .eq("id", id)
    .eq("business_id", businessId)
    .single();

  if (error) throw error;
  return data;
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        business_id: businessId,
        name: input.name,
        description: input.description ?? null,
        campaign_type: input.campaign_type,
        channel: input.channel,
        status: "draft" as const,
        content_id: input.content_id ?? null,
        message_body: input.message_body ?? null,
        media_urls: input.media_urls ?? [],
        target_segment: input.target_segment ?? {},
        scheduled_at: input.scheduled_at ?? null,
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

export async function updateCampaign(
  input: UpdateCampaignInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.campaign_type !== undefined) updates.campaign_type = input.campaign_type;
    if (input.channel !== undefined) updates.channel = input.channel;
    if (input.status !== undefined) {
      updates.status = input.status;
      if (input.status === "active") updates.started_at = new Date().toISOString();
      if (input.status === "completed") updates.completed_at = new Date().toISOString();
    }
    if (input.content_id !== undefined) updates.content_id = input.content_id;
    if (input.message_body !== undefined) updates.message_body = input.message_body;
    if (input.media_urls !== undefined) updates.media_urls = input.media_urls;
    if (input.target_segment !== undefined) updates.target_segment = input.target_segment;
    if (input.scheduled_at !== undefined) updates.scheduled_at = input.scheduled_at;

    const { error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", input.id)
      .eq("business_id", businessId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/content");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

export async function deleteCampaign(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = await createClient();
    const businessId = await getBusinessId();

    const { error } = await supabase
      .from("campaigns")
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

// ── Campaign Stats ──

export async function getCampaignStats() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data } = await supabase
    .from("campaigns")
    .select("status, sent_count, delivered_count, read_count")
    .eq("business_id", businessId);

  const items = data ?? [];
  const totalSent = items.reduce((s, c) => s + (c.sent_count ?? 0), 0);
  const totalDelivered = items.reduce((s, c) => s + (c.delivered_count ?? 0), 0);
  const totalRead = items.reduce((s, c) => s + (c.read_count ?? 0), 0);

  return {
    total: items.length,
    active: items.filter((c) => c.status === "active").length,
    totalSent,
    totalDelivered,
    totalRead,
    avgDeliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
    avgReadRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
  };
}

// ── Campaign Messages ──

export async function getCampaignMessages(
  campaignId: string,
  limit = 50,
  offset = 0
) {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("campaign_messages")
    .select("*, customers(full_name, phone)", { count: "exact" })
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { messages: data ?? [], total: count ?? 0 };
}

// ── Estimate Target Count ──

export async function estimateTargetCount(
  segment: {
    tags?: string[];
    customer_stage?: string;
    min_visits?: number;
    max_visits?: number;
    last_visit_before?: string;
    last_visit_after?: string;
  }
): Promise<number> {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  let query = supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (segment.customer_stage) {
    query = query.eq("stage", segment.customer_stage);
  }
  if (segment.min_visits !== undefined) {
    query = query.gte("total_visits", segment.min_visits);
  }
  if (segment.max_visits !== undefined) {
    query = query.lte("total_visits", segment.max_visits);
  }
  if (segment.last_visit_before) {
    query = query.lte("last_visit_at", segment.last_visit_before);
  }
  if (segment.last_visit_after) {
    query = query.gte("last_visit_at", segment.last_visit_after);
  }

  // Tag filtering requires a join — simplified for now
  const { count } = await query;
  return count ?? 0;
}
