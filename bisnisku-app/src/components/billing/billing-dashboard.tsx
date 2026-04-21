"use client";

import { useState, useEffect } from "react";
import {
  getCurrentSubscription,
  getSubscriptionPlans,
  getInvoices,
  subscribeToPlan,
  cancelSubscription,
} from "@/lib/supabase/payment-actions";
import {
  PLAN_PRICING,
  formatIDR,
  type BusinessPlan,
} from "@/lib/validations/payment";
import {
  CreditCard,
  Crown,
  Check,
  Loader2,
  ExternalLink,
  Receipt,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function BillingDashboard() {
  const [currentPlan, setCurrentPlan] = useState<BusinessPlan>("free");
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadData();
    // Check URL params for success/failed redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setSuccessMsg("Pembayaran berhasil! Plan Anda akan diaktifkan dalam beberapa menit.");
    }
  }, []);

  async function loadData() {
    try {
      const [subData, invData] = await Promise.all([
        getCurrentSubscription(),
        getInvoices(10),
      ]);
      setCurrentPlan(subData.currentPlan);
      setSubscription(subData.subscription as Record<string, unknown> | null);
      setInvoices(invData.invoices);
    } catch (e) {
      console.error("Failed to load billing data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planKey: BusinessPlan) {
    setSubscribing(planKey);
    try {
      const result = await subscribeToPlan(planKey);
      // Redirect to Xendit payment page
      window.location.href = result.invoiceUrl;
    } catch (e) {
      console.error("Subscribe error:", e);
      alert("Gagal membuat invoice. Silakan coba lagi.");
    } finally {
      setSubscribing(null);
    }
  }

  async function handleCancel() {
    if (!confirm("Yakin ingin membatalkan langganan? Anda akan di-downgrade ke Free.")) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      setCurrentPlan("free");
      setSubscription(null);
      setSuccessMsg("Langganan berhasil dibatalkan.");
      loadData();
    } catch (e) {
      console.error("Cancel error:", e);
      alert("Gagal membatalkan langganan.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const plans: BusinessPlan[] = ["free", "starter", "growth", "business", "enterprise"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Billing & Langganan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola plan dan riwayat pembayaran Anda
        </p>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {successMsg}
          <button
            onClick={() => setSuccessMsg("")}
            className="ml-auto text-emerald-500 hover:text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-brand-primary" />
              <span className="text-sm font-medium text-muted-foreground">Plan Saat Ini</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-brand-dark">
              {PLAN_PRICING[currentPlan].label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPlan === "free"
                ? "Gratis selamanya"
                : `${formatIDR(PLAN_PRICING[currentPlan].priceMonthly)}/bulan`}
            </p>
          </div>
          {currentPlan !== "free" && subscription && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Batalkan Langganan"
              )}
            </button>
          )}
        </div>

        {/* Subscription details */}
        {subscription && (
          <div className="mt-4 flex gap-6 border-t border-border pt-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Status:</span>{" "}
              <StatusBadge status={subscription.status as string} />
            </div>
            {typeof subscription.current_period_end === "string" && (
              <div>
                <span className="font-medium">Berakhir:</span>{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("id-ID")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <h3 className="mb-4 text-lg font-semibold text-brand-dark">Pilih Plan</h3>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.filter((p) => p !== "free").map((planKey) => {
          const plan = PLAN_PRICING[planKey];
          const isCurrent = planKey === currentPlan;
          const isUpgrade =
            plans.indexOf(planKey) > plans.indexOf(currentPlan);

          return (
            <div
              key={planKey}
              className={`relative flex flex-col rounded-2xl border-2 p-5 transition-colors ${
                isCurrent
                  ? "border-brand-primary bg-yellow-50/50"
                  : "border-border bg-white hover:border-slate-300"
              }`}
            >
              {planKey === "growth" && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-brand-primary px-3 py-0.5 text-[10px] font-bold text-white">
                  <Sparkles className="h-3 w-3" /> POPULER
                </div>
              )}

              <h4 className="text-lg font-bold text-brand-dark">{plan.label}</h4>
              <div className="mt-2">
                <span className="text-2xl font-bold text-brand-dark">
                  {formatIDR(plan.priceMonthly)}
                </span>
                <span className="text-sm text-muted-foreground">/bulan</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Fee transaksi: {plan.txFeePercent}%
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && isUpgrade && handleSubscribe(planKey)}
                disabled={isCurrent || subscribing !== null || !isUpgrade}
                className={`mt-4 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isCurrent
                    ? "bg-slate-100 text-slate-400"
                    : isUpgrade
                      ? "bg-brand-dark text-white hover:bg-brand-dark/90"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {subscribing === planKey ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  "Plan Saat Ini"
                ) : isUpgrade ? (
                  <>
                    Upgrade <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  "Downgrade"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice History */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-brand-dark" />
          <h3 className="text-lg font-semibold text-brand-dark">Riwayat Invoice</h3>
        </div>

        {invoices.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada invoice
          </p>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((inv) => (
              <div
                key={inv.id as string}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-brand-dark">
                    {inv.description as string}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.created_at as string).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-dark">
                    {formatIDR(inv.total_amount as number)}
                  </span>
                  <StatusBadge status={inv.status as string} />
                  {typeof inv.invoice_url === "string" && inv.status === "pending" && (
                    <a
                      href={inv.invoice_url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-full bg-brand-primary px-3 py-1 text-xs font-medium text-white hover:bg-brand-primary/90"
                    >
                      Bayar <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    trialing: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    past_due: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-500",
    expired: "bg-slate-100 text-slate-500",
    failed: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    active: "Aktif",
    trialing: "Trial",
    paid: "Lunas",
    pending: "Menunggu",
    past_due: "Terlambat",
    cancelled: "Dibatalkan",
    expired: "Kedaluwarsa",
    failed: "Gagal",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
