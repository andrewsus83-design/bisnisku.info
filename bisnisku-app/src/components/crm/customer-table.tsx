"use client";

import { useCrmStore, type CustomerRow } from "@/stores/crm-store";
import { BiIcon } from "@/components/ui/icons";
import type { CustomerStage } from "@/lib/validations/crm";

// ── Stage badge ──
const stageConfig: Record<
  CustomerStage,
  { label: string; className: string }
> = {
  lead: { label: "Lead", className: "bg-slate-100 text-slate-700" },
  prospect: { label: "Prospek", className: "bg-blue-50 text-blue-700" },
  customer: { label: "Pelanggan", className: "bg-emerald-50 text-emerald-700" },
  vip: { label: "VIP", className: "bg-amber-50 text-amber-700" },
  churned: { label: "Churned", className: "bg-red-50 text-red-700" },
};

function StageBadge({ stage }: { stage: CustomerStage }) {
  const cfg = stageConfig[stage];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Tag pill ──
function TagPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      {name}
    </span>
  );
}

// ── Sortable header ──
function SortHeader({
  label,
  field,
}: {
  label: string;
  field: "name" | "created_at" | "last_visit_at" | "total_spent" | "total_visits";
}) {
  const { sortBy, sortDir, setSortBy } = useCrmStore();
  const isActive = sortBy === field;

  return (
    <button
      onClick={() => setSortBy(field)}
      className="flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground hover:text-foreground"
    >
      {label}
      {isActive && (
        <BiIcon
          name={sortDir === "asc" ? "chevron-up" : "chevron-down"}
          size="xs"
        />
      )}
    </button>
  );
}

// ── Format helpers ──
function formatCurrency(amount: number): string {
  if (amount === 0) return "-";
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Table row ──
function CustomerTableRow({ customer }: { customer: CustomerRow }) {
  const { selectCustomer } = useCrmStore();
  const tags =
    customer.customer_tag_assignments?.map((ta) => ta.customer_tags) ?? [];

  return (
    <tr
      onClick={() => selectCustomer(customer.id)}
      className="cursor-pointer border-b border-border/50 hover:bg-muted/50 transition-colors"
    >
      {/* Name + avatar */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {customer.avatar_url ? (
            <img
              src={customer.avatar_url}
              alt={customer.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-dark">
              {getInitials(customer.name)}
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{customer.name}</p>
            <p className="text-xs text-muted-foreground">
              {customer.phone || customer.email || "-"}
            </p>
          </div>
        </div>
      </td>

      {/* Stage */}
      <td className="px-4 py-3">
        <StageBadge stage={customer.stage} />
      </td>

      {/* Tags */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <TagPill key={tag.id} name={tag.name} color={tag.color} />
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
      </td>

      {/* Total spent */}
      <td className="px-4 py-3 text-right text-sm">
        {formatCurrency(customer.total_spent)}
      </td>

      {/* Visits */}
      <td className="px-4 py-3 text-center text-sm">
        {customer.total_visits || "-"}
      </td>

      {/* Last visit */}
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(customer.last_visit_at)}
      </td>
    </tr>
  );
}

// ── Main table ──
export function CustomerTable() {
  const { customers, isLoading, page, totalPages, setPage } = useCrmStore();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <BiIcon name="users" size="lg" className="animate-pulse text-muted-foreground" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <BiIcon name="users" size="lg" className="text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Belum ada pelanggan</p>
          <p className="text-sm text-muted-foreground">
            Tambahkan pelanggan pertama Anda atau import dari CSV.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3">
                <SortHeader label="Nama" field="name" />
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                Tag
              </th>
              <th className="px-4 py-3 text-right">
                <SortHeader label="Total Belanja" field="total_spent" />
              </th>
              <th className="px-4 py-3 text-center">
                <SortHeader label="Kunjungan" field="total_visits" />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Kunjungan Terakhir" field="last_visit_at" />
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <CustomerTableRow key={customer.id} customer={customer} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-full border border-border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-muted"
            >
              <BiIcon name="chevron-left" size="sm" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-full border border-border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-muted"
            >
              <BiIcon name="chevron-right" size="sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
