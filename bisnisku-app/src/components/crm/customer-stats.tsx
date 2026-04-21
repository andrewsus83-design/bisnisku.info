"use client";

import { BiIcon } from "@/components/ui/icons";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: "users" | "trending-up" | "heart" | "eye";
  color: "brand" | "success" | "warning" | "error";
}

const colorMap = {
  brand: "bg-brand-primary/10 text-brand-dark",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
};

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${colorMap[color]}`}
        >
          <BiIcon name={icon} size="md" />
        </div>
      </div>
    </div>
  );
}

interface CustomerStatsProps {
  totalCustomers: number;
  newThisMonth: number;
  atRiskCount: number;
  totalVip?: number;
}

export function CustomerStats({
  totalCustomers,
  newThisMonth,
  atRiskCount,
  totalVip = 0,
}: CustomerStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Pelanggan"
        value={totalCustomers.toLocaleString("id-ID")}
        icon="users"
        color="brand"
      />
      <StatCard
        label="Baru Bulan Ini"
        value={newThisMonth.toLocaleString("id-ID")}
        icon="trending-up"
        color="success"
      />
      <StatCard
        label="VIP"
        value={totalVip.toLocaleString("id-ID")}
        icon="heart"
        color="warning"
      />
      <StatCard
        label="Berisiko Churn"
        value={atRiskCount.toLocaleString("id-ID")}
        icon="eye"
        color="error"
      />
    </div>
  );
}
