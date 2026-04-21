import { z } from "zod";

// ── Enums (matching DB) ──
export const paymentStatuses = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "expired",
] as const;

export const paymentMethods = [
  "qris",
  "gopay",
  "ovo",
  "dana",
  "shopeepay",
  "va_bca",
  "va_bni",
  "va_mandiri",
  "credit_card",
] as const;

export const subscriptionStatuses = [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
] as const;

export const businessPlans = [
  "free",
  "starter",
  "growth",
  "business",
  "enterprise",
] as const;

export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];
export type BusinessPlan = (typeof businessPlans)[number];

// ── Plan Pricing (IDR) ──
export const PLAN_PRICING: Record<
  BusinessPlan,
  {
    label: string;
    priceMonthly: number;
    txFeePercent: number;
    features: string[];
  }
> = {
  free: {
    label: "Free",
    priceMonthly: 0,
    txFeePercent: 0,
    features: [
      "Bio Page dasar",
      "1 outlet",
      "Listing di directory",
    ],
  },
  starter: {
    label: "Starter",
    priceMonthly: 999_000,
    txFeePercent: 2,
    features: [
      "Semua fitur Free",
      "WhatsApp automation",
      "CRM dasar (100 customers)",
      "Loyalty stamp card",
      "5 voucher aktif",
    ],
  },
  growth: {
    label: "Growth",
    priceMonthly: 2_900_000,
    txFeePercent: 1,
    features: [
      "Semua fitur Starter",
      "CRM lanjutan (unlimited)",
      "A/B testing",
      "Multi-staff (3 users)",
      "AI content generation",
      "Booking system",
    ],
  },
  business: {
    label: "Business",
    priceMonthly: 8_900_000,
    txFeePercent: 0.5,
    features: [
      "Semua fitur Growth",
      "Full automation",
      "Priority support",
      "Multi-staff (10 users)",
      "Advanced analytics",
      "Custom branding",
    ],
  },
  enterprise: {
    label: "Enterprise",
    priceMonthly: 18_900_000,
    txFeePercent: 0.3,
    features: [
      "Semua fitur Business",
      "Multi-outlet",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "API access",
    ],
  },
};

// ── Schemas ──

/** Create a Xendit invoice (one-time payment) */
export const createInvoiceSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  payerEmail: z.string().email().optional(),
  paymentMethods: z
    .array(z.enum(["QRIS", "EWALLET", "VIRTUAL_ACCOUNT", "CREDIT_CARD"]))
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

/** Subscribe to a plan */
export const subscribePlanSchema = z.object({
  plan: z.enum(["starter", "growth", "business", "enterprise"]),
});

export type SubscribePlanInput = z.infer<typeof subscribePlanSchema>;

/** Xendit Invoice webhook payload (key fields) */
export const xenditInvoiceWebhookSchema = z.object({
  id: z.string(),
  external_id: z.string(),
  status: z.enum(["PAID", "EXPIRED", "FAILED"]),
  amount: z.number(),
  paid_amount: z.number().optional(),
  payer_email: z.string().optional(),
  payment_method: z.string().optional(),
  payment_channel: z.string().optional(),
  paid_at: z.string().optional(),
  currency: z.string().default("IDR"),
  merchant_name: z.string().optional(),
});

export type XenditInvoiceWebhook = z.infer<typeof xenditInvoiceWebhookSchema>;

/** Xendit Recurring webhook payload (key fields) */
export const xenditRecurringWebhookSchema = z.object({
  id: z.string(),
  reference_id: z.string(),
  type: z.enum([
    "recurring.plan.activated",
    "recurring.plan.inactivated",
    "recurring.cycle.created",
    "recurring.cycle.succeeded",
    "recurring.cycle.failed",
    "recurring.cycle.retrying",
  ]),
  data: z.object({
    id: z.string(),
    reference_id: z.string(),
    status: z.string(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export type XenditRecurringWebhook = z.infer<
  typeof xenditRecurringWebhookSchema
>;

/** Format IDR currency */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Calculate transaction fee */
export function calcTransactionFee(
  amount: number,
  plan: BusinessPlan
): number {
  const rate = PLAN_PRICING[plan].txFeePercent / 100;
  return Math.round(amount * rate);
}
