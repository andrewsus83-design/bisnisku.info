"use client";

import { useEffect, useState } from "react";
import { useCrmStore } from "@/stores/crm-store";
import { getCustomers, getCustomerTags, getCrmStats } from "@/lib/supabase/crm-actions";
import { CustomerStats } from "@/components/crm/customer-stats";
import { CustomerFilters } from "@/components/crm/customer-filters";
import { CustomerTable } from "@/components/crm/customer-table";
import { CustomerDetail } from "@/components/crm/customer-detail";
import { AddCustomerModal } from "@/components/crm/add-customer-modal";
import { ImportCSVModal } from "@/components/crm/import-csv-modal";
import { BiIcon } from "@/components/ui/icons";

export default function CustomersPage() {
  const {
    setCustomers,
    setIsLoading,
    setTags,
    tagsLoaded,
    getQuery,
    search,
    stageFilter,
    tagFilter,
    sortBy,
    sortDir,
    page,
  } = useCrmStore();

  const [stats, setStats] = useState({ totalCustomers: 0, newThisMonth: 0, atRiskCount: 0 });

  // Load tags once
  useEffect(() => {
    if (!tagsLoaded) {
      getCustomerTags()
        .then((tags) => setTags(tags))
        .catch(console.error);
    }
  }, [tagsLoaded, setTags]);

  // Load stats
  useEffect(() => {
    getCrmStats()
      .then((s) =>
        setStats({
          totalCustomers: s.totalCustomers,
          newThisMonth: s.newThisMonth,
          atRiskCount: s.atRiskCount,
        })
      )
      .catch(console.error);
  }, []);

  // Load customers when filters change
  useEffect(() => {
    const query = getQuery();
    setIsLoading(true);
    getCustomers(query)
      .then((result) => {
        setCustomers(result.customers, result.total, result.totalPages);
        // Update total in stats too
        setStats((prev) => ({ ...prev, totalCustomers: result.total }));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [search, stageFilter, tagFilter, sortBy, sortDir, page, setCustomers, setIsLoading, getQuery]);

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Pelanggan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola database pelanggan, tag, dan pipeline penjualan Anda.
        </p>
      </div>

      {/* Stats */}
      <CustomerStats
        totalCustomers={stats.totalCustomers}
        newThisMonth={stats.newThisMonth}
        atRiskCount={stats.atRiskCount}
      />

      {/* Filters & actions */}
      <CustomerFilters />

      {/* Table */}
      <CustomerTable />

      {/* Detail slide-over */}
      <CustomerDetail />

      {/* Modals */}
      <AddCustomerModal />
      <ImportCSVModal />
    </div>
  );
}
