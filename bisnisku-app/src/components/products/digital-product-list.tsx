"use client";

import { useProductStore } from "@/stores/product-store";
import {
  productStatusLabels,
  type ProductWithDigital,
} from "@/lib/validations/product";
import { PlusCircle, Download, MessageCircle } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  out_of_stock: "bg-red-50 text-red-700",
  archived: "bg-slate-100 text-slate-500",
};

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function DigitalProductList() {
  const { products, setSelectedProduct } = useProductStore();

  const digitalProducts = products.filter(
    (p) => p.product_type === "digital"
  ) as ProductWithDigital[];

  return (
    <div>
      {/* Action Bar */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">
          Produk Digital ({digitalProducts.length})
        </h2>
        <button className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90">
          <PlusCircle className="h-4 w-4" />
          Tambah Produk Digital
        </button>
      </div>

      {/* Empty State */}
      {digitalProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-16">
          <Download className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Belum ada produk digital
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Jual e-book, template, panduan, atau file digital lainnya
          </p>
        </div>
      )}

      {/* Product Grid */}
      {digitalProducts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {digitalProducts.map((product) => {
            const dp = product.digital;
            const fileCount = product.files?.length ?? 0;

            return (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="rounded-2xl border border-border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                      <Download className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-brand-dark line-clamp-1">
                      {product.name}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      statusColors[product.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {productStatusLabels[product.status]}
                  </span>
                </div>

                {/* Price */}
                <p className="mb-3 text-sm font-bold text-brand-dark">
                  {formatRupiah(product.price)}
                </p>

                {/* Auto-delivery Badge */}
                {dp?.auto_send_wa && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <MessageCircle className="h-3 w-3" />
                      Auto WA Delivery
                    </span>
                  </div>
                )}

                {/* Footer Stats */}
                <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  {dp && <span>Download: {dp.total_downloads}</span>}
                  {dp && <span>Akses: {dp.access_days} hari</span>}
                  {fileCount > 0 && <span>{fileCount} file</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
