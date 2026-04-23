"use client";

import { useState } from "react";
import { useProductStore } from "@/stores/product-store";
import { redeemVoucher } from "@/lib/supabase/product-actions";
import { QrCode, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface RedeemResult {
  success: boolean;
  message: string;
  discountApplied?: number;
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VoucherRedeem() {
  const { redemptions } = useProductStore();

  const [code, setCode] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [staffName, setStaffName] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);

  async function handleRedeem() {
    if (!code.trim()) return;

    setIsRedeeming(true);
    setResult(null);

    try {
      const response = await redeemVoucher({
        code: code.trim(),
        transaction_amount: transactionAmount
          ? parseFloat(transactionAmount)
          : undefined,
        staff_name: staffName.trim() || undefined,
      });
      setResult({
        success: true,
        message: "Voucher berhasil digunakan!",
        discountApplied: response.discount_applied,
      });
      setCode("");
      setTransactionAmount("");
    } catch (e) {
      setResult({
        success: false,
        message:
          e instanceof Error ? e.message : "Gagal redeem voucher. Coba lagi.",
      });
    } finally {
      setIsRedeeming(false);
    }
  }

  return (
    <div>
      {/* Redeem Form */}
      <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-brand-dark">
          Redeem Voucher
        </h2>

        {/* Code Input */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-brand-dark">
            Kode Voucher
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="BISNISKU-XXXX-XXXX"
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-center text-lg font-mono font-semibold tracking-wider text-brand-dark placeholder:text-slate-300 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>

        {/* Optional Fields */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-dark">
              Jumlah Transaksi (opsional)
            </label>
            <input
              type="number"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              placeholder="Rp 0"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-brand-dark placeholder:text-slate-300 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-dark">
              Nama Staff (opsional)
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Nama kasir/staff"
              className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-brand-dark placeholder:text-slate-300 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
        </div>

        {/* Redeem Button */}
        <button
          onClick={handleRedeem}
          disabled={!code.trim() || isRedeeming}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRedeeming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <QrCode className="h-4 w-4" />
          )}
          {isRedeeming ? "Memproses..." : "Redeem Voucher"}
        </button>

        {/* Result Display */}
        {result && (
          <div
            className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
              result.success
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium">{result.message}</p>
              {result.discountApplied != null && (
                <p className="mt-1 text-xs">
                  Diskon: {formatRupiah(result.discountApplied)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Redemptions */}
      <div className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-sm font-semibold text-brand-dark">
            Riwayat Redemption Terbaru
          </h3>
        </div>

        {redemptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <QrCode className="mb-3 h-10 w-10 text-slate-200" />
            <p className="text-sm text-muted-foreground">
              Belum ada riwayat redemption
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Waktu</th>
                  <th className="px-6 py-3 font-medium">Diskon</th>
                  <th className="px-6 py-3 font-medium">Transaksi</th>
                  <th className="px-6 py-3 font-medium">Staff</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-6 py-3 text-brand-dark">
                      {formatDateTime(r.redeemed_at)}
                    </td>
                    <td className="px-6 py-3 font-medium text-emerald-600">
                      {formatRupiah(r.discount_applied)}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {r.transaction_amount
                        ? formatRupiah(r.transaction_amount)
                        : "-"}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {r.staff_name || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
