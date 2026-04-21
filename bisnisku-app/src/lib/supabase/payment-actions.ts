"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/config/env";
import { createInvoice, deactivateRecurringPlan } from "@/lib/xendit/client";
import {
  PLAN_PRICING,
  type BusinessPlan,
  formatIDR,
} from "@/lib/validations/payment";
import { revalidatePath } from "next/cache";

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

async function getBusinessWithPlan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, plan, email, phone")
    .eq("owner_id", user.id)
    .single();

  if (!business) throw new Error("No business found");
  return { ...business, userId: user.id, userEmail: user.email };
}

// ── Get Current Plan & Subscription ──

export async function getCurrentSubscription() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, subscription_plans(*)")
    .eq("business_id", businessId)
    .in("status", ["active", "trialing", "past_due"])
    .single();

  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .single();

  return {
    subscription,
    currentPlan: (business?.plan ?? "free") as BusinessPlan,
    planDetails: PLAN_PRICING[(business?.plan ?? "free") as BusinessPlan],
  };
}

// ── Subscribe to a Plan ──

export async function subscribeToPlan(planKey: BusinessPlan) {
  if (planKey === "free") throw new Error("Cannot subscribe to free plan");

  const supabase = await createClient();
  const business = await getBusinessWithPlan();
  const pricing = PLAN_PRICING[planKey];

  if (!pricing || pricing.priceMonthly === 0) {
    throw new Error("Invalid plan");
  }

  // Get plan record from DB
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("plan_key", planKey)
    .single();

  if (!plan) throw new Error("Plan not found in database");

  // Generate external ID
  const externalId = `INV-${business.id}-${Date.now()}`;

  // Create Xendit invoice for first payment
  const invoice = await createInvoice({
    external_id: externalId,
    amount: pricing.priceMonthly,
    description: `Bisnisku ${pricing.label} — Langganan Bulanan`,
    payer_email: business.userEmail ?? business.email ?? undefined,
    payment_methods: ["QRIS", "EWALLET", "VIRTUAL_ACCOUNT", "CREDIT_CARD"],
    success_redirect_url: `${env.APP_URL}/dashboard/settings/billing?success=true`,
    failure_redirect_url: `${env.APP_URL}/dashboard/settings/billing?failed=true`,
    metadata: {
      business_id: business.id,
      plan_key: planKey,
      type: "subscription",
    },
  });

  // Create subscription record (pending until payment confirmed via webhook)
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .upsert(
      {
        business_id: business.id,
        plan_id: plan.id,
        status: "trialing" as const,
        metadata: { pending_plan: planKey },
      },
      { onConflict: "business_id" }
    )
    .select()
    .single();

  if (subError) throw subError;

  // Create invoice record
  const { error: invError } = await supabase.from("invoices").insert({
    business_id: business.id,
    subscription_id: subscription.id,
    xendit_invoice_id: invoice.id,
    external_id: externalId,
    amount: pricing.priceMonthly,
    tax_amount: 0,
    total_amount: pricing.priceMonthly,
    status: "pending" as const,
    description: `Langganan ${pricing.label}`,
    invoice_url: invoice.invoice_url,
    metadata: { plan_key: planKey },
  });

  if (invError) throw invError;

  revalidatePath("/dashboard/settings/billing");

  return {
    invoiceUrl: invoice.invoice_url,
    externalId,
  };
}

// ── Cancel Subscription ──

export async function cancelSubscription() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, xendit_plan_id, status")
    .eq("business_id", businessId)
    .in("status", ["active", "trialing", "past_due"])
    .single();

  if (!subscription) throw new Error("No active subscription found");

  // Cancel in Xendit if there's a recurring plan
  if (subscription.xendit_plan_id) {
    try {
      await deactivateRecurringPlan(subscription.xendit_plan_id);
    } catch (e) {
      console.error("Failed to deactivate Xendit plan:", e);
      // Continue with local cancellation even if Xendit fails
    }
  }

  // Update subscription
  await supabase
    .from("subscriptions")
    .update({
      status: "cancelled" as const,
      cancelled_at: new Date().toISOString(),
      cancel_at_period_end: true,
    })
    .eq("id", subscription.id);

  // Downgrade to free
  await supabase
    .from("businesses")
    .update({ plan: "free" })
    .eq("id", businessId);

  revalidatePath("/dashboard/settings/billing");
  return { success: true };
}

// ── Create One-Time Payment (for vouchers, products, bookings) ──

export async function createOneTimePayment(params: {
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  customerEmail?: string;
}) {
  const supabase = await createClient();
  const business = await getBusinessWithPlan();
  const plan = (business.plan ?? "free") as BusinessPlan;

  // Calculate platform fee
  const feePercent = PLAN_PRICING[plan].txFeePercent / 100;
  const feeAmount = Math.round(params.amount * feePercent);
  const netAmount = params.amount - feeAmount;

  const externalId = `PAY-${business.id}-${Date.now()}`;

  // Create Xendit invoice
  const invoice = await createInvoice({
    external_id: externalId,
    amount: params.amount,
    description: params.description,
    payer_email: params.customerEmail,
    payment_methods: ["QRIS", "EWALLET", "VIRTUAL_ACCOUNT", "CREDIT_CARD"],
    success_redirect_url: `${env.APP_URL}/payment/success?id=${externalId}`,
    failure_redirect_url: `${env.APP_URL}/payment/failed?id=${externalId}`,
    metadata: {
      business_id: business.id,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
    },
  });

  // Create invoice record
  const { data: invoiceRecord } = await supabase
    .from("invoices")
    .insert({
      business_id: business.id,
      xendit_invoice_id: invoice.id,
      external_id: externalId,
      amount: params.amount,
      tax_amount: 0,
      total_amount: params.amount,
      status: "pending" as const,
      description: params.description,
      invoice_url: invoice.invoice_url,
      metadata: {
        reference_type: params.referenceType,
        reference_id: params.referenceId,
      },
    })
    .select()
    .single();

  // Create payment record
  await supabase.from("payments").insert({
    business_id: business.id,
    invoice_id: invoiceRecord?.id,
    external_id: externalId,
    amount: params.amount,
    fee_amount: feeAmount,
    net_amount: netAmount,
    status: "pending" as const,
    description: params.description,
    reference_type: params.referenceType ?? null,
    reference_id: params.referenceId ?? null,
    metadata: { fee_percent: feePercent },
  });

  return {
    invoiceUrl: invoice.invoice_url,
    externalId,
    feeAmount,
    netAmount,
  };
}

// ── Get Payment History ──

export async function getPaymentHistory(limit = 20, offset = 0) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: payments, error, count } = await supabase
    .from("payments")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { payments: payments ?? [], total: count ?? 0 };
}

// ── Get Invoices ──

export async function getInvoices(limit = 20, offset = 0) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: invoices, error, count } = await supabase
    .from("invoices")
    .select("*", { count: "exact" })
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { invoices: invoices ?? [], total: count ?? 0 };
}

// ── Get Subscription Plans ──

export async function getSubscriptionPlans() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

// ── Revenue Stats ──

export async function getRevenueStats() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Total revenue (all time)
  const { data: totalData } = await supabase
    .from("payments")
    .select("amount")
    .eq("business_id", businessId)
    .eq("status", "paid");

  const totalRevenue =
    totalData?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;

  // This month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthData } = await supabase
    .from("payments")
    .select("amount")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .gte("paid_at", startOfMonth.toISOString());

  const monthlyRevenue =
    monthData?.reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0;

  // Total fees collected
  const totalFees =
    totalData?.reduce((sum, p) => sum + ((p as Record<string, number>).fee_amount ?? 0), 0) ?? 0;

  // Transaction count
  const { count: txCount } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "paid");

  return {
    totalRevenue,
    monthlyRevenue,
    totalFees,
    transactionCount: txCount ?? 0,
    formatted: {
      totalRevenue: formatIDR(totalRevenue),
      monthlyRevenue: formatIDR(monthlyRevenue),
      totalFees: formatIDR(totalFees),
    },
  };
}
