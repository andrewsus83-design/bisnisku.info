"use client";

import { useEffect } from "react";
import { useProductStore, productTabLabels, type ProductTab } from "@/stores/product-store";
import { getProducts, getProductStats } from "@/lib/supabase/product-actions";
import { ProductStatsBar } from "@/components/products/product-stats-bar";
import { VoucherList } from "@/components/products/voucher-list";
import { SpecialProductList } from "@/components/products/special-product-list";
import { DigitalProductList } from "@/components/products/digital-product-list";
import { VoucherRedeem } from "@/components/products/voucher-redeem";
import {
  Gift,
  ShoppingBag,
  Download,
  QrCode,
  Loader2,
} from "lucide-react";

const tabIcons: Record<ProductTab, typeof Gift> = {
  voucher: Gift,
  special: ShoppingBag,
  digital: Download,
  redeem: QrCode,
};

export default function ProductsPage() {
  const {
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    setProducts,
    setTotalProducts,
    setStats,
  } = useProductStore();

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [productData, statsData] = await Promise.all([
          getProducts({ limit: 50 }),
          getProductStats(),
        ]);
        setProducts(productData.products);
        setTotalProducts(productData.total);
        setStats(statsData);
      } catch (e) {
        console.error("Failed to load product data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Produk & Voucher
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola voucher, produk spesial, dan produk digital bisnis Anda
        </p>
      </div>

      {/* Stats Bar */}
      <ProductStatsBar />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
        {(Object.keys(productTabLabels) as ProductTab[]).map((tab) => {
          const Icon = tabIcons[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {productTabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "voucher" && <VoucherList />}
      {activeTab === "special" && <SpecialProductList />}
      {activeTab === "digital" && <DigitalProductList />}
      {activeTab === "redeem" && <VoucherRedeem />}
    </div>
  );
}
