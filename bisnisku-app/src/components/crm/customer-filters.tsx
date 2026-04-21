"use client";

import { useCrmStore } from "@/stores/crm-store";
import { BiIcon } from "@/components/ui/icons";
import type { CustomerStage } from "@/lib/validations/crm";

const stages: Array<{ value: CustomerStage; label: string }> = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospek" },
  { value: "customer", label: "Pelanggan" },
  { value: "vip", label: "VIP" },
  { value: "churned", label: "Churned" },
];

export function CustomerFilters() {
  const {
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    tags,
    tagFilter,
    toggleTagFilter,
    resetFilters,
    setIsAddModalOpen,
    setIsImportModalOpen,
  } = useCrmStore();

  const hasActiveFilters = !!stageFilter || tagFilter.length > 0 || !!search;

  return (
    <div className="space-y-3">
      {/* Top bar: search + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <BiIcon
            name="search"
            size="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Cari nama, telepon, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <BiIcon name="arrow-left" size="sm" className="rotate-90" />
            Import CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-brand-dark px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark/90"
          >
            <BiIcon name="plus" size="sm" />
            Tambah Pelanggan
          </button>
        </div>
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Pipeline:
        </span>
        <button
          onClick={() => setStageFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !stageFilter
              ? "bg-brand-dark text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Semua
        </button>
        {stages.map((s) => (
          <button
            key={s.value}
            onClick={() =>
              setStageFilter(stageFilter === s.value ? null : s.value)
            }
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              stageFilter === s.value
                ? "bg-brand-dark text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.label}
          </button>
        ))}

        {/* Tag filters (show first 6) */}
        {tags.length > 0 && (
          <>
            <span className="ml-2 text-xs font-medium text-muted-foreground">
              Tag:
            </span>
            {tags.slice(0, 6).map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tagFilter.includes(tag.id)
                    ? "ring-2 ring-offset-1"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  ...(tagFilter.includes(tag.id)
                    ? { ringColor: tag.color }
                    : {}),
                }}
              >
                {tag.name}
              </button>
            ))}
          </>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <BiIcon name="x" size="xs" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
