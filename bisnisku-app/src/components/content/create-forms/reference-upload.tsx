"use client";

import { useRef } from "react";
import { ImageIcon, X, Upload } from "lucide-react";

interface ReferenceUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export function ReferenceUpload({
  value,
  onChange,
  label = "Referensi Image / Product",
}: ReferenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for preview (in production → upload to Supabase Storage)
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-dark">
        {label}
      </label>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Reference"
            className="h-32 w-32 rounded-xl border border-border object-cover"
          />
          <button
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-slate-50 text-sm text-muted-foreground transition-colors hover:border-brand-primary hover:bg-yellow-50/30"
        >
          <Upload className="h-5 w-5" />
          <span>Upload gambar referensi</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <p className="mt-1 text-[10px] text-muted-foreground">
        Upload foto produk atau referensi visual untuk AI
      </p>
    </div>
  );
}
