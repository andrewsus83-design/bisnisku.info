"use client";

import { useState, useEffect } from "react";
import { useCrmStore, type TagItem } from "@/stores/crm-store";
import { BiIcon } from "@/components/ui/icons";
import {
  getCustomer,
  addCustomerNote,
  logInteraction,
  assignTag,
  removeTag,
  updateCustomerStage,
  updateCustomer,
  deleteCustomer,
} from "@/lib/supabase/crm-actions";
import { TagDropdown } from "@/components/crm/tag-dropdown";
import { ConfirmDialog } from "@/components/crm/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { CustomerStage, InteractionType } from "@/lib/validations/crm";

// ── Stage config ──
const stageConfig: Record<
  CustomerStage,
  { label: string; className: string }
> = {
  lead: { label: "Lead", className: "bg-slate-100 text-slate-700" },
  prospect: { label: "Prospek", className: "bg-blue-50 text-blue-700" },
  customer: {
    label: "Pelanggan",
    className: "bg-emerald-50 text-emerald-700",
  },
  vip: { label: "VIP", className: "bg-amber-50 text-amber-700" },
  churned: { label: "Churned", className: "bg-red-50 text-red-700" },
};

const interactionIcons: Partial<
  Record<InteractionType, Parameters<typeof BiIcon>[0]["name"]>
> = {
  visit: "map-pin",
  purchase: "tag",
  booking: "calendar",
  inquiry: "message-circle",
  wa_message: "whatsapp",
  review: "star",
  referral: "users",
  complaint: "info",
  loyalty_redeem: "gift",
  promo_used: "fire",
};

interface CustomerDetailData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  stage: CustomerStage;
  source: string;
  total_visits: number;
  total_spent: number;
  last_visit_at: string | null;
  first_visit_at: string | null;
  average_spend: number;
  lifetime_points: number;
  birthday: string | null;
  address: string | null;
  created_at: string;
  customer_tag_assignments: Array<{
    tag_id: string;
    customer_tags: { id: string; name: string; color: string };
  }>;
  customer_notes: Array<{
    id: string;
    content: string;
    is_pinned: boolean;
    created_at: string;
  }>;
  customer_interactions: Array<{
    id: string;
    type: InteractionType;
    description: string | null;
    amount: number | null;
    occurred_at: string;
  }>;
}

type DetailTab = "overview" | "notes" | "activity";

export function CustomerDetail() {
  const { selectedCustomerId, isDetailOpen, setIsDetailOpen, tags, optimisticRemoveCustomer } =
    useCrmStore();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", birthday: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load customer data
  useEffect(() => {
    if (!selectedCustomerId || !isDetailOpen) return;
    setLoading(true);
    getCustomer(selectedCustomerId)
      .then((data) => setCustomer(data as unknown as CustomerDetailData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCustomerId, isDetailOpen]);

  if (!isDetailOpen) return null;

  // ── Slide-over panel ──
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setIsDetailOpen(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <h2 className="font-heading text-lg font-semibold">
            Detail Pelanggan
          </h2>
          <div className="flex items-center gap-1">
            {customer && !isEditing && (
              <>
                <button
                  onClick={() => {
                    setEditForm({
                      name: customer.name,
                      phone: customer.phone || "",
                      email: customer.email || "",
                      birthday: customer.birthday || "",
                      address: customer.address || "",
                    });
                    setIsEditing(true);
                  }}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Edit"
                >
                  <BiIcon name="settings" size="sm" />
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  title="Hapus"
                >
                  <BiIcon name="x" size="sm" />
                </button>
              </>
            )}
            <button
              onClick={() => { setIsDetailOpen(false); setIsEditing(false); }}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <BiIcon name="x" size="md" />
            </button>
          </div>
        </div>

        {loading || !customer ? (
          <div className="flex h-64 items-center justify-center">
            <BiIcon
              name="user"
              size="lg"
              className="animate-pulse text-muted-foreground"
            />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Customer header */}
            {isEditing ? (
              <div className="space-y-3 rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium">Nama</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-full border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Telepon</label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-full border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Email</label>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full rounded-full border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={editForm.birthday}
                      onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                      className="w-full rounded-full border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">Alamat</label>
                    <input
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full rounded-full border border-border px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Batal
                  </button>
                  <button
                    onClick={async () => {
                      if (!editForm.name.trim() || editForm.name.trim().length < 2) {
                        toast("error", "Nama minimal 2 karakter");
                        return;
                      }
                      setSaving(true);
                      try {
                        await updateCustomer(customer.id, {
                          name: editForm.name.trim(),
                          phone: editForm.phone.trim() || undefined,
                          email: editForm.email.trim() || undefined,
                          birthday: editForm.birthday || undefined,
                          address: editForm.address.trim() || undefined,
                        });
                        setCustomer((prev) => prev ? {
                          ...prev,
                          name: editForm.name.trim(),
                          phone: editForm.phone.trim() || null,
                          email: editForm.email.trim() || null,
                          birthday: editForm.birthday || null,
                          address: editForm.address.trim() || null,
                        } : null);
                        toast("success", "Data pelanggan diperbarui");
                        setIsEditing(false);
                      } catch {
                        toast("error", "Gagal memperbarui data");
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="rounded-full bg-brand-dark px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-50"
                  >
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                {customer.avatar_url ? (
                  <img
                    src={customer.avatar_url}
                    alt={customer.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-lg font-bold text-brand-dark">
                    {customer.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{customer.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stageConfig[customer.stage].className}`}
                    >
                      {stageConfig[customer.stage].label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      via {customer.source}
                    </span>
                  </div>
                  {customer.phone && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <BiIcon name="phone" size="xs" />
                      {customer.phone}
                    </p>
                  )}
                  {customer.email && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <BiIcon name="mail" size="xs" />
                      {customer.email}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">
                  {customer.total_visits}
                </p>
                <p className="text-xs text-muted-foreground">Kunjungan</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">
                  {customer.total_spent > 0
                    ? `${(customer.total_spent / 1000).toFixed(0)}K`
                    : "0"}
                </p>
                <p className="text-xs text-muted-foreground">Total Belanja</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-lg font-bold">
                  {customer.lifetime_points}
                </p>
                <p className="text-xs text-muted-foreground">Poin</p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="mb-2 text-sm font-medium">Tag</h4>
              <div className="flex flex-wrap gap-1.5">
                {customer.customer_tag_assignments.map((ta) => (
                  <span
                    key={ta.tag_id}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${ta.customer_tags.color}15`,
                      color: ta.customer_tags.color,
                    }}
                  >
                    {ta.customer_tags.name}
                    <button
                      onClick={async () => {
                        await removeTag(customer.id, ta.tag_id);
                        setCustomer((prev) =>
                          prev
                            ? {
                                ...prev,
                                customer_tag_assignments:
                                  prev.customer_tag_assignments.filter(
                                    (a) => a.tag_id !== ta.tag_id
                                  ),
                              }
                            : null
                        );
                      }}
                      className="ml-0.5 opacity-50 hover:opacity-100"
                    >
                      <BiIcon name="x" size="xs" />
                    </button>
                  </span>
                ))}
                <TagDropdown
                  customerId={customer.id}
                  assignedTagIds={customer.customer_tag_assignments.map((ta) => ta.tag_id)}
                  onTagAssigned={(tag: TagItem) => {
                    setCustomer((prev) =>
                      prev
                        ? {
                            ...prev,
                            customer_tag_assignments: [
                              ...prev.customer_tag_assignments,
                              {
                                tag_id: tag.id,
                                customer_tags: { id: tag.id, name: tag.name, color: tag.color },
                              },
                            ],
                          }
                        : null
                    );
                  }}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex gap-4">
                {(
                  [
                    ["overview", "Ikhtisar"],
                    ["notes", "Catatan"],
                    ["activity", "Aktivitas"],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "border-brand-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Kunjungan pertama
                    </span>
                    <p className="font-medium">
                      {customer.first_visit_at
                        ? new Date(
                            customer.first_visit_at
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Kunjungan terakhir
                    </span>
                    <p className="font-medium">
                      {customer.last_visit_at
                        ? new Date(
                            customer.last_visit_at
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Rata-rata belanja
                    </span>
                    <p className="font-medium">
                      Rp{" "}
                      {customer.average_spend.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ulang tahun</span>
                    <p className="font-medium">
                      {customer.birthday
                        ? new Date(customer.birthday).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "long" }
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
                {customer.address && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Alamat</span>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                {/* Add note */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tambah catatan..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && noteText.trim()) {
                        const note = await addCustomerNote(customer.id, {
                          content: noteText.trim(),
                          isPinned: false,
                        });
                        setCustomer((prev) =>
                          prev
                            ? {
                                ...prev,
                                customer_notes: [
                                  note,
                                  ...prev.customer_notes,
                                ],
                              }
                            : null
                        );
                        setNoteText("");
                      }
                    }}
                    className="flex-1 rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
                  />
                </div>

                {/* Notes list */}
                {customer.customer_notes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-lg border p-3 text-sm ${
                      note.is_pinned
                        ? "border-brand-primary/30 bg-brand-primary/5"
                        : "border-border"
                    }`}
                  >
                    <p>{note.content}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}

                {customer.customer_notes.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada catatan.
                  </p>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="space-y-2">
                {customer.customer_interactions.map((interaction) => (
                  <div
                    key={interaction.id}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <BiIcon
                        name={interactionIcons[interaction.type] ?? "info"}
                        size="sm"
                        className="text-muted-foreground"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {interaction.type.replace("_", " ")}
                      </p>
                      {interaction.description && (
                        <p className="text-xs text-muted-foreground">
                          {interaction.description}
                        </p>
                      )}
                      {interaction.amount && (
                        <p className="text-xs font-medium text-emerald-600">
                          Rp {interaction.amount.toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(interaction.occurred_at).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "short" }
                      )}
                    </span>
                  </div>
                ))}

                {customer.customer_interactions.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Belum ada aktivitas.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {customer && (
        <ConfirmDialog
          open={deleteOpen}
          title="Hapus Pelanggan"
          message={`Yakin ingin menghapus "${customer.name}"? Data tidak dapat dikembalikan.`}
          confirmLabel="Hapus"
          confirmVariant="danger"
          loading={deleting}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              await deleteCustomer(customer.id);
              optimisticRemoveCustomer(customer.id);
              toast("success", `"${customer.name}" berhasil dihapus`);
              setDeleteOpen(false);
              setIsDetailOpen(false);
            } catch {
              toast("error", "Gagal menghapus pelanggan");
            } finally {
              setDeleting(false);
            }
          }}
        />
      )}
    </div>
  );
}
