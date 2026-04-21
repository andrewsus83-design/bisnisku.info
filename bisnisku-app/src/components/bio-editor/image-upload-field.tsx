"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image-compress";
import { uploadImage } from "@/lib/supabase/storage-actions";

interface ImageUploadFieldProps {
  label: string;
  value: string; // current image URL
  onChange: (url: string) => void;
  folder: string; // storage folder path e.g. "hero", "promo"
  placeholder?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  placeholder = "Upload gambar atau masukkan URL",
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      // Compress client-side to max 200KB
      const compressed = await compressImage(file, 200);

      // Upload to Supabase Storage
      const result = await uploadImage(compressed, folder, file.name.split(".")[0]);

      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        onChange(result.url);
      }
    } catch {
      setError("Gagal upload gambar. Coba lagi.");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-dark">
        {label}
      </label>

      {/* Preview */}
      {value && (
        <div className="relative mb-2 overflow-hidden rounded-lg border border-border">
          <img
            src={value}
            alt="Preview"
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Upload button + URL input */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 rounded-full border-2 border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-brand-primary hover:text-brand-dark disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? "Uploading..." : "Upload"}
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full border-2 border-border bg-white px-3 py-2 text-sm text-brand-dark outline-none transition-colors placeholder:text-slate-300 focus:border-brand-primary"
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1 text-xs text-error">{error}</p>
      )}

      <p className="mt-1 text-[10px] text-muted-foreground">
        Gambar otomatis dikompresi ke maks 200KB
      </p>
    </div>
  );
}
