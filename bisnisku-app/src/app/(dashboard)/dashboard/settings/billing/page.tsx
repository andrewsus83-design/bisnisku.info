import { Suspense } from "react";
import { BillingDashboard } from "@/components/billing/billing-dashboard";

export const metadata = {
  title: "Billing & Langganan — Bisnisku",
};

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        </div>
      }
    >
      <BillingDashboard />
    </Suspense>
  );
}
