"use client";

import { useBioEditorStore } from "@/stores/bio-editor-store";
import type { BlockType } from "@/lib/validations/bio-page";
import {
  GripVertical,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Image,
  FileText,
  Utensils,
  Star,
  MapPin,
  Phone,
  Share2,
  Code,
  Megaphone,
  CalendarCheck,
  Layout,
  LinkIcon,
} from "lucide-react";

const blockMeta: Record<
  BlockType,
  { label: string; icon: typeof Layout; color: string }
> = {
  hero: { label: "Hero Banner", icon: Layout, color: "#3B82F6" },
  about: { label: "Tentang", icon: FileText, color: "#8B5CF6" },
  services: { label: "Layanan", icon: Star, color: "#10B981" },
  menu: { label: "Menu", icon: Utensils, color: "#F59E0B" },
  gallery: { label: "Galeri", icon: Image, color: "#EC4899" },
  reviews: { label: "Ulasan", icon: Star, color: "#FFCC00" },
  location_map: { label: "Peta Lokasi", icon: MapPin, color: "#EF4444" },
  contact: { label: "Kontak", icon: Phone, color: "#06B6D4" },
  social_links: { label: "Sosial Media", icon: Share2, color: "#8B5CF6" },
  custom_html: { label: "Custom HTML", icon: Code, color: "#64748B" },
  promo_banner: { label: "Promo Banner", icon: Megaphone, color: "#EA580C" },
  booking_cta: { label: "Booking CTA", icon: CalendarCheck, color: "#10B981" },
  links: { label: "Link URL", icon: LinkIcon, color: "#3B82F6" },
};

const addableBlocks: BlockType[] = [
  "hero",
  "about",
  "services",
  "menu",
  "gallery",
  "reviews",
  "location_map",
  "contact",
  "social_links",
  "promo_banner",
  "booking_cta",
  "links",
  "custom_html",
];

export function BlockList() {
  const { blocks, selectBlock, removeBlock, toggleBlockVisibility, addBlock, moveBlock } =
    useBioEditorStore();

  return (
    <div className="flex h-full flex-col">
      {/* Block list header */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-brand-dark">
          Blok Halaman
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Klik blok untuk edit, drag untuk urut ulang
        </p>
      </div>

      {/* Existing blocks */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1.5">
          {blocks.map((block, index) => {
            const meta = blockMeta[block.type];
            const Icon = meta.icon;
            return (
              <div
                key={block.id}
                className={`group flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 transition-all hover:border-brand-primary hover:shadow-[var(--shadow-low)] ${
                  !block.isVisible ? "opacity-50" : ""
                }`}
              >
                {/* Drag handle */}
                <button
                  className="cursor-grab text-muted-foreground hover:text-brand-dark"
                  title="Drag untuk urut ulang"
                  onPointerDown={() => {}}
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                {/* Block icon + name */}
                <button
                  onClick={() => selectBlock(block.id)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                  </div>
                  <span className="text-sm font-medium text-brand-dark">
                    {meta.label}
                  </span>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Move up */}
                  {index > 0 && (
                    <button
                      onClick={() => moveBlock(index, index - 1)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-brand-dark"
                      title="Pindah ke atas"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2v8M2 6l4-4 4 4" />
                      </svg>
                    </button>
                  )}
                  {/* Move down */}
                  {index < blocks.length - 1 && (
                    <button
                      onClick={() => moveBlock(index, index + 1)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-brand-dark"
                      title="Pindah ke bawah"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 10V2M2 6l4 4 4-4" />
                      </svg>
                    </button>
                  )}
                  {/* Toggle visibility */}
                  <button
                    onClick={() => toggleBlockVisibility(block.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-brand-dark"
                    title={block.isVisible ? "Sembunyikan" : "Tampilkan"}
                  >
                    {block.isVisible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => removeBlock(block.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-error"
                    title="Hapus blok"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add block button */}
      <div className="border-t border-border p-3">
        <div className="grid grid-cols-3 gap-1.5">
          {addableBlocks.map((type) => {
            const meta = blockMeta[type];
            const Icon = meta.icon;
            return (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 text-center transition-colors hover:border-brand-primary hover:bg-yellow-50"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
