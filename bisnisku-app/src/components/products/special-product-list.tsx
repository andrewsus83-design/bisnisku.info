"use client";

import { useProductStore } from "@/stores/product-store";
import {
  productStatusLabels,
  type ProductWithSpecial,
} from "@/lib/validations/product";
import { PlusCircle, ShoppingBag, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  out_of_stock: "bg-red-50 text-red-700",
  archived: "bg-slate-100 text-slate-500",
};

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function SpecialProductList() {
  const { products, setSelectedProduct } = useProductStore();

  const specialProducts = products.filter(
    (p) => p.product_type === "special"
  ) as ProductWithSpecial[];

  return (
    <div>
      {/* Action Bar */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">
          Produk Spesial ({specialProducts.length})
        </h2>
        <button className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90">
          <PlusCircle className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Empty State */}
      {specialProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16">
          <ShoppingBag className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Belum ada produk spesial
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tambahkan produk fisik atau layanan spesial untuk dijual
          </p>
        </div>
      )}

      {/* Product Grid */}
      {specialProducts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {specialProducts.map((product) => {
            const sp = product.special;
            const isLowStock =
              sp && sp.track_stock && sp.total_stock <= sp.low_stock_alert;

            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="rounded-2xl border border-border bg-white text-left shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image */}
                {product.image_url ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-slate-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                    {isLowStock && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                        <AlertTriangle className="h-3 w-3" />
                        Stok Rendah
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative flex h-40 w-full items-center justify-center rounded-t-2xl bg-slate-50">
                    <ShoppingBag className="h-10 w-10 text-slate-200" />
                    {isLowStock && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-medium text-white">
                        <AlertTriangle className="h-3 w-3" />
                        Stok Rendah
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between">
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

                  <p className="mb-3 text-sm font-bold text-brand-dark">
                    {formatRupiah(product.price)}
                    {product.compare_price && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                        {formatRupiah(product.compare_price)}
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    {sp && sp.track_stock && (
                      <span>Stok: {sp.total_stock}</span>
                    )}
                    {product.total_sold > 0 && (
                      <span>Terjual: {product.total_sold}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
