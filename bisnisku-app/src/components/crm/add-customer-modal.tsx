"use client";

import { useState } from "react";
import { useCrmStore } from "@/stores/crm-store";
import { BiIcon } from "@/components/ui/icons";
import { createCustomer } from "@/lib/supabase/crm-actions";
import { useToast } from "@/components/ui/toast";
import type { CustomerStage } from "@/lib/validations/crm";

const stages: Array<{ value: CustomerStage; label: string }> = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospek" },
  { value: "customer", label: "Pelanggan" },
  { value: "vip", label: "VIP" },
];

export function AddCustomerModal() {
  const { isAddModalOpen, setIsAddModalOpen } = useCrmStore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<CustomerStage>("lead");
  const [birthday, setBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "">("");

  if (!isAddModalOpen) return null;

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setStage("lead");
    setBirthday("");
    setAddress("");
    setGender("");
  };

  const handleClose = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast("error", "Nama pelanggan minimal 2 karakter");
      return;
    }

    setSaving(true);
    try {
      await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        stage,
        source: "manual",
        birthday: birthday || undefined,
        address: address.trim() || undefined,
        gender: gender || undefined,
      });
      toast("success", `Pelanggan "${name.trim()}" berhasil ditambahkan`);
      handleClose();
      // Trigger refresh — page useEffect will re-fetch
      useCrmStore.getState().setSearch(useCrmStore.getState().search);
    } catch (err) {
      toast(
        "error",
        err instanceof Error ? err.message : "Gagal menambahkan pelanggan"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg font-semibold">
            Tambah Pelanggan
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <BiIcon name="x" size="md" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name (required) */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama pelanggan"
              className="w-full rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              required
              autoFocus
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Telepon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812-xxxx-xxxx"
                className="w-full rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          {/* Stage & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CustomerStage)}
                className="w-full rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
              >
                {stages.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "M" | "F" | "")}
                className="w-full rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
              >
                <option value="">— Pilih —</option>
                <option value="M">Laki-laki</option>
                <option value="F">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Birthday */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Tanggal Lahir
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </div>

          {/* Address */}
          <div>
            <label className="mb-1 block text-sm font-medium">Alamat</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Alamat (opsional)"
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none resize-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <BiIcon
                    name="clock"
                    size="sm"
                    className="animate-spin"
                  />
                  Menyimpan...
                </>
              ) : (
                <>
                  <BiIcon name="plus" size="sm" />
                  Tambah Pelanggan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
