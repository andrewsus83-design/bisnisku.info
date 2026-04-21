"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  customerSchema,
  customerTagSchema,
  customerNoteSchema,
  customerInteractionSchema,
  customerSegmentSchema,
  customerListQuerySchema,
  type CustomerInput,
  type CustomerTagInput,
  type CustomerNoteInput,
  type CustomerInteractionInput,
  type CustomerSegmentInput,
  type CustomerListQuery,
  type CustomerStage,
} from "@/lib/validations/crm";

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

// ════════════════════════════════════════════
// CUSTOMERS — CRUD
// ════════════════════════════════════════════

/** List customers with search, filter, sort, pagination */
export async function getCustomers(query?: Partial<CustomerListQuery>) {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const q = customerListQuerySchema.parse(query ?? {});

  let builder = supabase
    .from("customers")
    .select(
      "*, customer_tag_assignments(tag_id, customer_tags(id, name, color))",
      { count: "exact" }
    )
    .eq("business_id", businessId);

  // Search
  if (q.search) {
    builder = builder.or(
      `name.ilike.%${q.search}%,phone.ilike.%${q.search}%,email.ilike.%${q.search}%`
    );
  }

  // Filter by stage
  if (q.stage) {
    builder = builder.eq("stage", q.stage);
  }

  // Filter by tags — fetch customer IDs that have ALL selected tags
  if (q.tagIds && q.tagIds.length > 0) {
    // Use a subquery approach: get customer IDs from assignments for each tag
    const { data: taggedCustomers } = await supabase
      .from("customer_tag_assignments")
      .select("customer_id")
      .in("tag_id", q.tagIds);

    if (taggedCustomers && taggedCustomers.length > 0) {
      // Count how many of the requested tags each customer has
      const customerTagCounts = new Map<string, number>();
      for (const row of taggedCustomers) {
        customerTagCounts.set(
          row.customer_id,
          (customerTagCounts.get(row.customer_id) || 0) + 1
        );
      }
      // Only include customers that have ALL selected tags
      const matchingIds = Array.from(customerTagCounts.entries())
        .filter(([, count]) => count >= q.tagIds!.length)
        .map(([id]) => id);

      if (matchingIds.length > 0) {
        builder = builder.in("id", matchingIds);
      } else {
        // No customers match all tags — return empty
        return { customers: [], total: 0, page: q.page, perPage: q.perPage, totalPages: 0 };
      }
    } else {
      // No tag assignments found — return empty
      return { customers: [], total: 0, page: q.page, perPage: q.perPage, totalPages: 0 };
    }
  }

  // Sort
  builder = builder.order(q.sortBy, { ascending: q.sortDir === "asc" });

  // Pagination
  const from = (q.page - 1) * q.perPage;
  builder = builder.range(from, from + q.perPage - 1);

  const { data, error, count } = await builder;
  if (error) throw error;

  return {
    customers: data ?? [],
    total: count ?? 0,
    page: q.page,
    perPage: q.perPage,
    totalPages: Math.ceil((count ?? 0) / q.perPage),
  };
}

/** Get single customer with all related data */
export async function getCustomer(customerId: string) {
  const supabase = await createClient();
  await getBusinessId(); // Auth check via RLS

  const { data, error } = await supabase
    .from("customers")
    .select(
      `*,
       customer_tag_assignments(tag_id, customer_tags(id, name, color)),
       customer_notes(id, content, is_pinned, created_at, author_id),
       customer_interactions(id, type, description, amount, occurred_at, metadata)`
    )
    .eq("id", customerId)
    .single();

  if (error) throw error;
  return data;
}

/** Create customer */
export async function createCustomer(input: CustomerInput) {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const parsed = customerSchema.parse(input);

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      name: parsed.name,
      phone: parsed.phone || null,
      email: parsed.email || null,
      avatar_url: parsed.avatarUrl || null,
      stage: parsed.stage,
      source: parsed.source,
      birthday: parsed.birthday || null,
      address: parsed.address || null,
      gender: parsed.gender || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/crm");
  return data;
}

/** Update customer */
export async function updateCustomer(
  customerId: string,
  input: Partial<CustomerInput>
) {
  const supabase = await createClient();
  await getBusinessId();
  const parsed = customerSchema.partial().parse(input);

  const updateData: Record<string, unknown> = {};
  if (parsed.name !== undefined) updateData.name = parsed.name;
  if (parsed.phone !== undefined) updateData.phone = parsed.phone || null;
  if (parsed.email !== undefined) updateData.email = parsed.email || null;
  if (parsed.avatarUrl !== undefined)
    updateData.avatar_url = parsed.avatarUrl || null;
  if (parsed.stage !== undefined) updateData.stage = parsed.stage;
  if (parsed.source !== undefined) updateData.source = parsed.source;
  if (parsed.birthday !== undefined)
    updateData.birthday = parsed.birthday || null;
  if (parsed.address !== undefined)
    updateData.address = parsed.address || null;
  if (parsed.gender !== undefined) updateData.gender = parsed.gender || null;

  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", customerId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/crm");
  return data;
}

/** Delete customer */
export async function deleteCustomer(customerId: string) {
  const supabase = await createClient();
  await getBusinessId();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) throw error;
  revalidatePath("/dashboard/crm");
}

/** Update customer stage */
export async function updateCustomerStage(
  customerId: string,
  stage: CustomerStage
) {
  const supabase = await createClient();
  await getBusinessId();

  const { data, error } = await supabase
    .from("customers")
    .update({ stage })
    .eq("id", customerId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/crm");
  return data;
}

// ════════════════════════════════════════════
// TAGS
// ════════════════════════════════════════════

/** Get all tags for the business */
export async function getCustomerTags() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("customer_tags")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  if (error) throw error;
  return data;
}

/** Create tag */
export async function createCustomerTag(input: CustomerTagInput) {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const parsed = customerTagSchema.parse(input);

  const { data, error } = await supabase
    .from("customer_tags")
    .insert({
      business_id: businessId,
      name: parsed.name,
      color: parsed.color,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete tag */
export async function deleteCustomerTag(tagId: string) {
  const supabase = await createClient();
  await getBusinessId();

  const { error } = await supabase
    .from("customer_tags")
    .delete()
    .eq("id", tagId);

  if (error) throw error;
}

/** Assign tag to customer */
export async function assignTag(customerId: string, tagId: string) {
  const supabase = await createClient();
  await getBusinessId();

  const { error } = await supabase.from("customer_tag_assignments").insert({
    customer_id: customerId,
    tag_id: tagId,
    assigned_by: "manual",
  });

  if (error) throw error;
  revalidatePath("/dashboard/crm");
}

/** Remove tag from customer */
export async function removeTag(customerId: string, tagId: string) {
  const supabase = await createClient();
  await getBusinessId();

  const { error } = await supabase
    .from("customer_tag_assignments")
    .delete()
    .eq("customer_id", customerId)
    .eq("tag_id", tagId);

  if (error) throw error;
  revalidatePath("/dashboard/crm");
}

// ════════════════════════════════════════════
// NOTES
// ════════════════════════════════════════════

/** Get notes for a customer */
export async function getCustomerNotes(customerId: string) {
  const supabase = await createClient();
  await getBusinessId();

  const { data, error } = await supabase
    .from("customer_notes")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Add note */
export async function addCustomerNote(
  customerId: string,
  input: CustomerNoteInput
) {
  const supabase = await createClient();
  await getBusinessId();
  const parsed = customerNoteSchema.parse(input);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("customer_notes")
    .insert({
      customer_id: customerId,
      author_id: user?.id ?? null,
      content: parsed.content,
      is_pinned: parsed.isPinned,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Toggle pin note */
export async function togglePinNote(noteId: string, isPinned: boolean) {
  const supabase = await createClient();
  await getBusinessId();

  const { error } = await supabase
    .from("customer_notes")
    .update({ is_pinned: isPinned })
    .eq("id", noteId);

  if (error) throw error;
}

/** Delete note */
export async function deleteCustomerNote(noteId: string) {
  const supabase = await createClient();
  await getBusinessId();

  const { error } = await supabase
    .from("customer_notes")
    .delete()
    .eq("id", noteId);

  if (error) throw error;
}

// ════════════════════════════════════════════
// INTERACTIONS
// ════════════════════════════════════════════

/** Log interaction */
export async function logInteraction(
  customerId: string,
  input: CustomerInteractionInput
) {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const parsed = customerInteractionSchema.parse(input);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("customer_interactions")
    .insert({
      customer_id: customerId,
      business_id: businessId,
      type: parsed.type,
      description: parsed.description || null,
      amount: parsed.amount ?? null,
      metadata: parsed.metadata,
      recorded_by: user?.id ?? null,
      occurred_at: parsed.occurredAt || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard/crm");
  return data;
}

/** Get interactions for a customer */
export async function getCustomerInteractions(
  customerId: string,
  limit = 50
) {
  const supabase = await createClient();
  await getBusinessId();

  const { data, error } = await supabase
    .from("customer_interactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ════════════════════════════════════════════
// SEGMENTS
// ════════════════════════════════════════════

/** Get all segments */
export async function getSegments() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data, error } = await supabase
    .from("customer_segments")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Create segment */
export async function createSegment(input: CustomerSegmentInput) {
  const supabase = await createClient();
  const businessId = await getBusinessId();
  const parsed = customerSegmentSchema.parse(input);

  const { data, error } = await supabase
    .from("customer_segments")
    .insert({
      business_id: businessId,
      name: parsed.name,
      description: parsed.description || null,
      filters: parsed.filters,
      is_dynamic: parsed.isDynamic,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Delete segment */
export async function deleteSegment(segmentId: string) {
  const supabase = await createClient();
  await getBusinessId();

  const { error } = await supabase
    .from("customer_segments")
    .delete()
    .eq("id", segmentId);

  if (error) throw error;
}

// ════════════════════════════════════════════
// STATS / DASHBOARD METRICS
// ════════════════════════════════════════════

/** Get CRM dashboard overview stats */
export async function getCrmStats() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Total customers by stage
  const { data: stageCounts } = await supabase.rpc("get_customer_stage_counts", {
    p_business_id: businessId,
  }).single();

  // Fallback: count manually if RPC doesn't exist
  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId);

  const { count: newThisMonth } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  const { count: atRiskCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_active", true)
    .lt(
      "last_visit_at",
      new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    );

  return {
    totalCustomers: totalCustomers ?? 0,
    newThisMonth: newThisMonth ?? 0,
    atRiskCount: atRiskCount ?? 0,
    stageCounts: stageCounts ?? null,
  };
}

// ════════════════════════════════════════════
// CSV IMPORT
// ════════════════════════════════════════════

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/** Import customers from parsed CSV rows */
export async function importCustomersFromCsv(
  rows: Array<{
    name: string;
    phone?: string;
    email?: string;
    birthday?: string;
    address?: string;
    gender?: string;
    tags?: string;
  }>
): Promise<ImportResult> {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.name || row.name.trim().length < 2) {
        errors.push(`Baris ${i + 1}: Nama tidak valid`);
        skipped++;
        continue;
      }

      const { data: customer, error } = await supabase
        .from("customers")
        .upsert(
          {
            business_id: businessId,
            name: row.name.trim(),
            phone: row.phone?.trim() || null,
            email: row.email?.trim() || null,
            birthday: row.birthday || null,
            address: row.address || null,
            gender: row.gender === "M" || row.gender === "F" ? row.gender : null,
            source: "import",
          },
          { onConflict: "business_id,phone", ignoreDuplicates: true }
        )
        .select("id")
        .single();

      if (error) {
        errors.push(`Baris ${i + 1}: ${error.message}`);
        skipped++;
        continue;
      }

      // Assign tags if provided
      if (row.tags && customer) {
        const tagNames = row.tags.split(",").map((t) => t.trim()).filter(Boolean);
        for (const tagName of tagNames) {
          // Upsert tag
          const { data: tag } = await supabase
            .from("customer_tags")
            .upsert(
              { business_id: businessId, name: tagName },
              { onConflict: "business_id,name" }
            )
            .select("id")
            .single();

          if (tag) {
            await supabase.from("customer_tag_assignments").upsert(
              {
                customer_id: customer.id,
                tag_id: tag.id,
                assigned_by: "import",
              },
              { onConflict: "customer_id,tag_id" }
            );
          }
        }
      }

      imported++;
    } catch {
      errors.push(`Baris ${i + 1}: Error tidak diketahui`);
      skipped++;
    }
  }

  revalidatePath("/dashboard/crm");
  return { imported, skipped, errors };
}
