"use client";

import { useProductStore } from "@/stores/product-store";
import {
  discountTypeLabels,
  productStatusLabels,
  type ProductWithVoucher,
} from "@/lib/validations/product";
import { PlusCircle, Gift, Tag } from "lucide-react";

const typeColors: Record<string, string> = {
  percentage: "bg-blue-50 text-blue-700",
  fixed: "bg-emerald-50 text-emerald-700",
  bogo: "bg-purple-50 text-purple-700",
  free_service: "bg-amber-50 text-amber-700",
  bundle: "bg-rose-50 text-rose-700",
  cashback: "bg-teal-50 text-teal-700",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  out_of_stock: "bg-red-50 text-red-700",
  archived: "bg-slate-100 text-slate-500",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDiscount(type: string, value: number): string {
  if (type === "percentage") return `${value}%`;
  if (type === "fixed" || type === "cashback") {
    return `Rp ${value.toLocaleString("id-ID")}`;
  }
  if (type === "bogo") return `Beli ${value} Gratis 1`;
  return String(value);
}

export function VoucherList() {
  const { products, setSelectedProduct } = useProductStore();

  const vouchers = products.filter(
    (p) => p.product_type === "voucher"
  ) as ProductWithVoucher[];

  return (
    <div>
      {/* Action Bar */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">
          Voucher ({vouchers.length})
        </h2>
        <button className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90">
          <PlusCircle className="h-4 w-4" />
          Buat Voucher Baru
        </button>
      </div>

      {/* Empty State */}
      {vouchers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16">
          <Gift className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Belum ada voucher
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buat voucher pertama untuk menarik pelanggan baru
          </p>
        </div>
      )}

      {/* Voucher Grid */}
      {vouchers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vouchers.map((product) => {
            const v = product.voucher;
            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-sm font-semibold text-brand-dark line-clamp-1">
                    {product.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      statusColors[product.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {productStatusLabels[product.status]}
                  </span>
                </div>

                {/* Discount Badge */}
                {v && (
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        typeColors[v.discount_type] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Tag className="h-3 w-3" />
                      {discountTypeLabels[v.discount_type]}
                    </span>
                    <span className="text-sm font-bold text-brand-dark">
                      {formatDiscount(v.discount_type, v.discount_value)}
                    </span>
                  </div>
                )}

                {/* Dates */}
                {v && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {formatDate(v.valid_from)} — {formatDate(v.valid_until)}
                  </p>
                )}

                {/* Footer Stats */}
                {v && (
                  <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Terbit: {v.total_issued}</span>
                    <span>Dipakai: {v.total_redeemed}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
