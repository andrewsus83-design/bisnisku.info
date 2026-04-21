"use server";

/**
 * Xendit API Client for Bisnisku
 * Handles Invoice creation (one-time payments) and Recurring Plans (subscriptions).
 *
 * Xendit API v2 — https://developers.xendit.co/api-reference
 * Auth: Basic auth with secret key as username, no password.
 */

import { serverEnv } from "@/config/env";

// ── Types ──

export interface XenditInvoiceParams {
  external_id: string;
  amount: number;
  description: string;
  payer_email?: string;
  customer?: {
    given_names?: string;
    email?: string;
    mobile_number?: string;
  };
  payment_methods?: string[];
  success_redirect_url?: string;
  failure_redirect_url?: string;
  invoice_duration?: number; // seconds, default 86400 (24h)
  currency?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, unknown>;
}

export interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  amount: number;
  invoice_url: string;
  expiry_date: string;
  created: string;
  updated: string;
}

export interface XenditRecurringPlanParams {
  reference_id: string;
  customer_id?: string;
  recurring_action: "PAYMENT";
  currency: string;
  amount: number;
  payment_methods?: Array<{
    payment_method_id: string;
    rank: number;
  }>;
  schedule: {
    reference_id: string;
    interval: "MONTH" | "WEEK" | "DAY";
    interval_count: number;
    total_retry?: number;
    retry_interval?: "DAY";
    retry_interval_count?: number;
    anchor_date?: string; // ISO 8601
  };
  immediate_action_type?: "FULL_AMOUNT";
  notification_config?: {
    recurring_created?: string[];
    recurring_succeeded?: string[];
    recurring_failed?: string[];
  };
  failed_cycle_action?: "STOP" | "RESUME";
  metadata?: Record<string, unknown>;
  description?: string;
}

export interface XenditRecurringPlanResponse {
  id: string;
  reference_id: string;
  customer_id: string | null;
  recurring_action: string;
  currency: string;
  amount: number;
  status: string;
  created: string;
  updated: string;
  schedule_id: string;
  schedule: {
    id: string;
    reference_id: string;
    interval: string;
    interval_count: number;
  };
}

// ── Helpers ──

function getAuthHeader(): string {
  const key = serverEnv.XENDIT_SECRET_KEY;
  if (!key) throw new Error("BISNISKU_XENDIT_SECRET_API_KEY not configured");
  // Xendit uses Basic auth: secret_key as username, empty password
  return `Basic ${Buffer.from(key + ":").toString("base64")}`;
}

async function xenditFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = "https://api.xendit.co";
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Xendit API error ${response.status}: ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

// ── Invoice API (One-time Payments) ──

/** Create a Xendit Invoice — returns a payment page URL */
export async function createInvoice(
  params: XenditInvoiceParams
): Promise<XenditInvoiceResponse> {
  return xenditFetch<XenditInvoiceResponse>("/v2/invoices", {
    method: "POST",
    body: JSON.stringify({
      ...params,
      currency: params.currency ?? "IDR",
      invoice_duration: params.invoice_duration ?? 86400, // 24 hours
    }),
  });
}

/** Get Invoice by Xendit Invoice ID */
export async function getInvoice(
  invoiceId: string
): Promise<XenditInvoiceResponse> {
  return xenditFetch<XenditInvoiceResponse>(`/v2/invoices/${invoiceId}`);
}

/** Expire (cancel) a pending invoice */
export async function expireInvoice(
  invoiceId: string
): Promise<XenditInvoiceResponse> {
  return xenditFetch<XenditInvoiceResponse>(
    `/invoices/${invoiceId}/expire!`,
    { method: "POST" }
  );
}

// ── Recurring API (Subscription Billing) ──

/** Create a Recurring Plan (monthly subscription) */
export async function createRecurringPlan(
  params: XenditRecurringPlanParams
): Promise<XenditRecurringPlanResponse> {
  return xenditFetch<XenditRecurringPlanResponse>("/recurring/plans", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/** Get a Recurring Plan by ID */
export async function getRecurringPlan(
  planId: string
): Promise<XenditRecurringPlanResponse> {
  return xenditFetch<XenditRecurringPlanResponse>(
    `/recurring/plans/${planId}`
  );
}

/** Deactivate (cancel) a Recurring Plan */
export async function deactivateRecurringPlan(
  planId: string
): Promise<XenditRecurringPlanResponse> {
  return xenditFetch<XenditRecurringPlanResponse>(
    `/recurring/plans/${planId}/deactivate`,
    { method: "POST" }
  );
}

// ── Balance API ──

export interface XenditBalance {
  balance: number;
}

/** Get available balance */
export async function getBalance(
  accountType: "CASH" | "HOLDING" | "TAX" = "CASH"
): Promise<XenditBalance> {
  return xenditFetch<XenditBalance>(
    `/balance?account_type=${accountType}`
  );
}
