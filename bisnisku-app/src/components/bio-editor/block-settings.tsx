"use client";

import { useBioEditorStore } from "@/stores/bio-editor-store";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ImageUploadField } from "./image-upload-field";

/** Block settings panel — shown when a block is selected */
export function BlockSettings() {
  const { blocks, selectedBlockId, selectBlock, updateBlockContent } =
    useBioEditorStore();

  const block = blocks.find((b) => b.id === selectedBlockId);
  if (!block) return null;

  const blockLabels: Record<string, string> = {
    hero: "Hero Banner",
    about: "Tentang Bisnis",
    services: "Layanan",
    menu: "Menu",
    gallery: "Galeri Foto",
    reviews: "Ulasan",
    location_map: "Peta Lokasi",
    contact: "Informasi Kontak",
    social_links: "Link Sosial Media",
    custom_html: "Custom HTML",
    promo_banner: "Promo Banner",
    booking_cta: "Tombol Booking",
    links: "Link URL",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with back button */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          onClick={() => selectBlock(null)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="font-heading text-sm font-semibold text-brand-dark">
          {blockLabels[block.type] || block.type}
        </h3>
      </div>

      {/* Block-specific settings */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Hero block */}
          {block.type === "hero" && (
            <>
              <FieldInput
                label="Judul"
                value={(block.content.title as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { title: v })}
                placeholder="Nama bisnis Anda"
              />
              <FieldInput
                label="Tagline"
                value={(block.content.subtitle as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { subtitle: v })}
                placeholder="Deskripsi singkat bisnis"
              />
              <ImageUploadField
                label="Gambar Cover"
                value={(block.content.imageUrl as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { imageUrl: v })}
                folder="hero"
                placeholder="Upload atau masukkan URL gambar"
              />
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  CTA Button
                </p>
                <FieldInput
                  label="Teks Tombol CTA"
                  value={(block.content.ctaText as string) || ""}
                  onChange={(v) => updateBlockContent(block.id, { ctaText: v })}
                  placeholder="Pesan Sekarang"
                />
                <div className="mt-3">
                  <FieldInput
                    label="Link URL Tujuan"
                    value={(block.content.ctaUrl as string) || ""}
                    onChange={(v) => updateBlockContent(block.id, { ctaUrl: v })}
                    placeholder="https://wa.me/6281234567890"
                  />
                </div>
              </div>
            </>
          )}

          {/* About block */}
          {block.type === "about" && (
            <>
              <FieldInput
                label="Judul Seksi"
                value={(block.content.heading as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { heading: v })}
                placeholder="Tentang Kami"
              />
              <FieldTextarea
                label="Deskripsi"
                value={(block.content.description as string) || ""}
                onChange={(v) =>
                  updateBlockContent(block.id, { description: v })
                }
                placeholder="Ceritakan tentang bisnis Anda..."
              />
            </>
          )}

          {/* Services block — auto-populated from services table */}
          {block.type === "services" && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Layanan akan otomatis ditampilkan dari data yang Anda kelola di menu{" "}
                <strong>Layanan</strong>.
              </p>
            </div>
          )}

          {/* Menu block — auto-populated from menu_items */}
          {block.type === "menu" && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Menu akan otomatis ditampilkan dari data yang Anda kelola di menu{" "}
                <strong>Menu</strong>.
              </p>
            </div>
          )}

          {/* Contact block */}
          {block.type === "contact" && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Info kontak otomatis diambil dari profil bisnis Anda (telepon,
                WhatsApp, email, alamat).
              </p>
            </div>
          )}

          {/* Social Links block */}
          {block.type === "social_links" && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Sosial media otomatis diambil dari profil bisnis Anda (Instagram,
                Facebook, TikTok, Website).
              </p>
            </div>
          )}

          {/* Location Map block */}
          {block.type === "location_map" && (
            <>
              <FieldInput
                label="Alamat Lengkap"
                value={(block.content.address as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { address: v })}
                placeholder="Jl. Contoh No. 123, Jakarta"
              />
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Peta Google Maps akan ditampilkan berdasarkan alamat bisnis.
                </p>
              </div>
            </>
          )}

          {/* Gallery block */}
          {block.type === "gallery" && (
            <>
              <FieldInput
                label="Judul Galeri"
                value={(block.content.heading as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { heading: v })}
                placeholder="Galeri Foto"
              />
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Upload foto melalui tombol di preview. Maksimal 12 foto, 5MB per file.
                </p>
              </div>
            </>
          )}

          {/* Custom HTML block */}
          {block.type === "custom_html" && (
            <FieldTextarea
              label="HTML Code"
              value={(block.content.html as string) || ""}
              onChange={(v) => updateBlockContent(block.id, { html: v })}
              placeholder="<div>Custom content...</div>"
              rows={8}
              mono
            />
          )}

          {/* Promo Banner */}
          {block.type === "promo_banner" && (
            <>
              <FieldInput
                label="Judul Promo"
                value={(block.content.title as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { title: v })}
                placeholder="Promo Spesial!"
              />
              <FieldInput
                label="Deskripsi"
                value={(block.content.description as string) || ""}
                onChange={(v) =>
                  updateBlockContent(block.id, { description: v })
                }
                placeholder="Diskon 20% untuk pelanggan baru"
              />
              <FieldInput
                label="Label Tombol"
                value={(block.content.buttonText as string) || ""}
                onChange={(v) =>
                  updateBlockContent(block.id, { buttonText: v })
                }
                placeholder="Klaim Sekarang"
              />
              <FieldInput
                label="Link Redirect Tombol"
                value={(block.content.redirectUrl as string) || ""}
                onChange={(v) =>
                  updateBlockContent(block.id, { redirectUrl: v })
                }
                placeholder="https://wa.me/6281234567890"
              />
              <ImageUploadField
                label="Gambar Background Promo"
                value={(block.content.backgroundImage as string) || ""}
                onChange={(v) =>
                  updateBlockContent(block.id, { backgroundImage: v })
                }
                folder="promo"
                placeholder="Upload background promo"
              />
            </>
          )}

          {/* Links block */}
          {block.type === "links" && (
            <LinksEditor
              links={
                (block.content.links as Array<{ label: string; url: string }>) || []
              }
              onChange={(links) => updateBlockContent(block.id, { links })}
            />
          )}

          {/* Booking CTA */}
          {block.type === "booking_cta" && (
            <>
              <FieldInput
                label="Teks Tombol"
                value={(block.content.buttonText as string) || ""}
                onChange={(v) =>
                  updateBlockContent(block.id, { buttonText: v })
                }
                placeholder="Book Sekarang"
              />
              <FieldInput
                label="Nomor WhatsApp"
                value={(block.content.whatsapp as string) || ""}
                onChange={(v) => updateBlockContent(block.id, { whatsapp: v })}
                placeholder="08123456789"
              />
            </>
          )}

          {/* Reviews — auto */}
          {block.type === "reviews" && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Ulasan akan otomatis ditampilkan dari Google Reviews bisnis Anda
                (tersedia setelah integrasi GBP di Sprint 13).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Links editor ──

function LinksEditor({
  links,
  onChange,
}: {
  links: Array<{ label: string; url: string }>;
  onChange: (links: Array<{ label: string; url: string }>) => void;
}) {
  function addLink() {
    onChange([...links, { label: "", url: "" }]);
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    const updated = links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      {links.map((link, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Link {i + 1}
            </span>
            <button
              onClick={() => removeLink(i)}
              className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-error"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={link.label}
            onChange={(e) => updateLink(i, "label", e.target.value)}
            placeholder="Label (contoh: Website Kami)"
            className="w-full rounded-full border-2 border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
          <input
            type="text"
            value={link.url}
            onChange={(e) => updateLink(i, "url", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-full border-2 border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </div>
      ))}
      <button
        onClick={addLink}
        className="flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-brand-primary hover:text-brand-dark"
      >
        <Plus className="h-4 w-4" />
        Tambah Link
      </button>
    </div>
  );
}

// ── Reusable field components ──

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-dark">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border-2 border-border bg-white px-3 py-2 text-sm text-brand-dark outline-none transition-colors placeholder:text-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-dark">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-lg border-2 border-border bg-white px-3 py-2 text-sm text-brand-dark outline-none transition-colors placeholder:text-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${
          mono ? "font-mono text-xs" : ""
        }`}
      />
    </div>
  );
}
