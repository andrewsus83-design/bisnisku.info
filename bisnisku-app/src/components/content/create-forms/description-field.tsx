"use client";

import { Sparkles, PenLine } from "lucide-react";

interface DescriptionFieldProps {
  value: string;
  onChange: (val: string) => void;
  mode: "manual" | "auto";
  onModeChange: (mode: "manual" | "auto") => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
}

export function DescriptionField({
  value,
  onChange,
  mode,
  onModeChange,
  placeholder = "Deskripsikan produk atau konten yang ingin dibuat...",
  maxLength,
  rows = 3,
}: DescriptionFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-brand-dark">Deskripsi</label>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-0.5">
          <button
            onClick={() => onModeChange("auto")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              mode === "auto"
                ? "bg-purple-100 text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Sparkles className="h-3 w-3" /> Auto (AI)
          </button>
          <button
            onClick={() => onModeChange("manual")}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
              mode === "manual"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <PenLine className="h-3 w-3" /> Manual
          </button>
        </div>
      </div>

      {mode === "auto" ? (
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-purple-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium">AI akan generate deskripsi otomatis</span>
          </div>
          <p className="mt-1 text-[10px] text-purple-500">
            Berdasarkan referensi image dan data bisnis Anda
          </p>
        </div>
      ) : (
        <div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
            className="w-full rounded-xl border border-border px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
          {maxLength && (
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {value.length}/{maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
