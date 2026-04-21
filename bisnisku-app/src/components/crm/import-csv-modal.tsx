"use client";

import { useState, useRef } from "react";
import { useCrmStore } from "@/stores/crm-store";
import { BiIcon } from "@/components/ui/icons";
import { importCustomersFromCsv, type ImportResult } from "@/lib/supabase/crm-actions";
import { useToast } from "@/components/ui/toast";

interface ParsedRow {
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
  address?: string;
  gender?: string;
  tags?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    if (row.name || row.nama) {
      rows.push({
        name: row.name || row.nama,
        phone: row.phone || row.telepon || row.hp,
        email: row.email,
        birthday: row.birthday || row.tanggal_lahir,
        address: row.address || row.alamat,
        gender: row.gender || row.jenis_kelamin,
        tags: row.tags || row.tag,
      });
    }
  }
  return rows;
}

export function ImportCSVModal() {
  const { isImportModalOpen, setIsImportModalOpen } = useCrmStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!isImportModalOpen) return null;

  const handleClose = () => {
    setIsImportModalOpen(false);
    setRows([]);
    setFileName("");
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      if (parsed.length === 0) {
        toast("error", "CSV tidak memiliki data yang valid");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const res = await importCustomersFromCsv(rows);
      setResult(res);
      toast(
        "success",
        `${res.imported} pelanggan berhasil diimport${res.skipped > 0 ? `, ${res.skipped} dilewati` : ""}`
      );
      // Trigger refresh
      useCrmStore.getState().setSearch(useCrmStore.getState().search);
    } catch (err) {
      toast(
        "error",
        err instanceof Error ? err.message : "Gagal mengimport CSV"
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />

      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-lg font-semibold">Import CSV</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <BiIcon name="x" size="md" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border px-6 py-8 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BiIcon name="arrow-left" size="lg" className="text-muted-foreground rotate-90" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {fileName || "Klik untuk upload file CSV"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Format: nama, telepon, email, birthday, alamat, gender, tags
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div>
              <p className="mb-2 text-sm font-medium">
                Preview ({rows.length} baris)
              </p>
              <div className="max-h-48 overflow-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Nama</th>
                      <th className="px-3 py-2 font-medium">Telepon</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {row.phone || "-"}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {row.email || "-"}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {row.tags || "-"}
                        </td>
                      </tr>
                    ))}
                    {rows.length > 10 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-1.5 text-center text-muted-foreground"
                        >
                          ...dan {rows.length - 10} baris lainnya
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <BiIcon name="check" size="sm" className="text-emerald-600" />
                <span className="text-sm font-medium">
                  {result.imported} pelanggan berhasil diimport
                </span>
              </div>
              {result.skipped > 0 && (
                <div className="flex items-center gap-2">
                  <BiIcon name="info" size="sm" className="text-amber-600" />
                  <span className="text-sm text-muted-foreground">
                    {result.skipped} baris dilewati
                  </span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-24 overflow-auto text-xs text-red-600">
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {result ? "Tutup" : "Batal"}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={rows.length === 0 || importing}
                className="flex items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <BiIcon
                      name="clock"
                      size="sm"
                      className="animate-spin"
                    />
                    Mengimport...
                  </>
                ) : (
                  <>
                    <BiIcon name="arrow-left" size="sm" className="rotate-90" />
                    Import {rows.length} Pelanggan
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
