"use client";

import { useProductStore } from "@/stores/product-store";
import { Package, Gift, RotateCcw, Banknote } from "lucide-react";

function formatRupiah(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function ProductStatsBar() {
  const { stats } = useProductStore();

  const items = [
    { label: "Total Produk", value: stats.totalProducts, icon: Package, color: "text-slate-600" },
    { label: "Voucher Aktif", value: stats.activeVouchers, icon: Gift, color: "text-emerald-600" },
    { label: "Total Redemption", value: stats.totalRedemptions, icon: RotateCcw, color: "text-blue-600" },
    { label: "Revenue Produk", value: formatRupiah(stats.totalRevenue), icon: Banknote, color: "text-amber-600" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
        >
          <item.icon className={`h-5 w-5 ${item.color}`} />
          <div>
            <p className="text-lg font-bold text-brand-dark">{item.value}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
