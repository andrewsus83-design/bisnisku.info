"use server";

/**
 * Xendit Webhook Verification & Processing
 * Verifies callback token and handles idempotent event processing.
 */

import { serverEnv } from "@/config/env";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Verify webhook signature ──

export function verifyWebhookToken(token: string): boolean {
  const expected = serverEnv.XENDIT_WEBHOOK_TOKEN;
  if (!expected) {
    console.error("BISNISKU_XENDIT_VERIFICATION_TOKEN not configured");
    return false;
  }
  return token === expected;
}

// ── Idempotency check ──

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("xendit_webhook_events")
    .select("id, status")
    .eq("event_id", eventId)
    .single();

  return data?.status === "processed";
}

export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("xendit_webhook_events").upsert(
    {
      event_id: eventId,
      event_type: eventType,
      payload,
      status: "received",
    },
    { onConflict: "event_id" }
  );
}

export async function markEventProcessed(eventId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("xendit_webhook_events")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("event_id", eventId);
}

export async function markEventFailed(
  eventId: string,
  error: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("xendit_webhook_events")
    .update({
      status: "failed",
      error_message: error,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
}

// ── Invoice webhook handler ──

export async function handleInvoicePaid(payload: {
  id: string;
  external_id: string;
  status: string;
  amount: number;
  paid_amount?: number;
  payment_method?: string;
  payment_channel?: string;
  paid_at?: string;
}): Promise<void> {
  const supabase = createAdminClient();

  // Update invoice status
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: payload.paid_at ?? new Date().toISOString(),
      payment_method: payload.payment_method ?? null,
      payment_channel: payload.payment_channel ?? null,
      xendit_invoice_id: payload.id,
    })
    .eq("external_id", payload.external_id)
    .select("id, business_id, subscription_id")
    .single();

  if (invError) {
    console.error("Failed to update invoice:", invError);
    throw invError;
  }

  // Update related payment record if exists
  await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: payload.paid_at ?? new Date().toISOString(),
    })
    .eq("invoice_id", invoice.id);

  // If this invoice is for a subscription, activate it
  if (invoice.subscription_id) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq("id", invoice.subscription_id);

    // Update business plan
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id, subscription_plans(plan_key)")
      .eq("id", invoice.subscription_id)
      .single();

    if (sub?.subscription_plans) {
      const plans = sub.subscription_plans as unknown as { plan_key: string } | { plan_key: string }[];
      const planKey = Array.isArray(plans) ? plans[0]?.plan_key : plans.plan_key;
      await supabase
        .from("businesses")
        .update({ plan: planKey })
        .eq("id", invoice.business_id);
    }
  }
}

export async function handleInvoiceExpired(payload: {
  external_id: string;
}): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("invoices")
    .update({ status: "expired", expired_at: new Date().toISOString() })
    .eq("external_id", payload.external_id);
}

// ── Recurring webhook handler ──

export async function handleRecurringEvent(payload: {
  type: string;
  data: {
    id: string;
    reference_id: string;
    status: string;
    amount?: number;
    metadata?: Record<string, unknown>;
  };
}): Promise<void> {
  const supabase = createAdminClient();

  switch (payload.type) {
    case "recurring.cycle.succeeded": {
      // Payment succeeded — update subscription period
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, business_id")
        .eq("xendit_plan_id", payload.data.reference_id)
        .single();

      if (sub) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq("id", sub.id);
      }
      break;
    }

    case "recurring.cycle.failed": {
      // Payment failed — mark as past_due
      await supabase
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("xendit_plan_id", payload.data.reference_id);
      break;
    }

    case "recurring.plan.inactivated": {
      // Plan cancelled/deactivated
      await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("xendit_plan_id", payload.data.reference_id);

      // Downgrade business to free
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("business_id")
        .eq("xendit_plan_id", payload.data.reference_id)
        .single();

      if (sub) {
        await supabase
          .from("businesses")
          .update({ plan: "free" })
          .eq("id", sub.business_id);
      }
      break;
    }
  }
}
