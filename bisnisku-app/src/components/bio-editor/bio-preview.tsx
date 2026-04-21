"use client";

import { useBioEditorStore } from "@/stores/bio-editor-store";
import { backgroundThemes, type BackgroundTheme } from "@/lib/validations/bio-page";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Clock,
  MessageSquare,
} from "lucide-react";

/** Map background theme value to inline CSS gradient */
function getBackgroundStyle(bgTheme: BackgroundTheme, darkMode: boolean): React.CSSProperties {
  const map: Record<string, string> = {
    none: "",
    glitter: "linear-gradient(to bottom right, #fef9c3, #fce7f3, #f3e8ff)",
    arts: "linear-gradient(to bottom right, #ffe4e6, #fff7ed, #fef3c7)",
    candies: "linear-gradient(to bottom right, #fbcfe8, #f5d0fe, #ddd6fe)",
    spaces: "linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)",
    cloud: "linear-gradient(to bottom, #e0f2fe, #eff6ff, #ffffff)",
  };
  const gradient = map[bgTheme] || "";
  if (!gradient) return {};
  return { background: gradient };
}

/** Live preview of the bio page inside the editor */
export function BioPreview() {
  const { blocks, theme, selectedBlockId, selectBlock } = useBioEditorStore();

  const visibleBlocks = blocks.filter((b) => b.isVisible);

  const bgTheme = (theme.backgroundTheme ?? "none") as BackgroundTheme;
  const isSpaces = bgTheme === "spaces";
  const bg = isSpaces ? "#0F172A" : theme.darkMode ? "#0F172A" : "#FFFFFF";
  const text = isSpaces || theme.darkMode ? "#F1F5F9" : "#0F172A";
  const muted = isSpaces || theme.darkMode ? "#334155" : "#F1F5F9";
  const mutedText = isSpaces || theme.darkMode ? "#94A3B8" : "#64748B";
  const borderRadius =
    theme.buttonStyle === "pill"
      ? "9999px"
      : theme.buttonStyle === "square"
        ? "0px"
        : "8px";

  const bgStyle = getBackgroundStyle(bgTheme, theme.darkMode);

  return (
    <div
      className="overflow-hidden rounded-xl shadow-[var(--shadow-high)] transition-colors"
      style={{
        backgroundColor: bg,
        color: text,
        fontFamily: theme.fontFamily,
        ...bgStyle,
      }}
    >
      {visibleBlocks.length === 0 && (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Tambahkan blok untuk memulai
        </div>
      )}

      {visibleBlocks.map((block) => {
        const isSelected = selectedBlockId === block.id;
        return (
          <div
            key={block.id}
            onClick={() => selectBlock(block.id)}
            className={`cursor-pointer transition-all ${
              isSelected ? "ring-2 ring-brand-primary ring-offset-2" : ""
            }`}
          >
            {/* ── Hero ── */}
            {block.type === "hero" && (
              <div
                className="relative flex min-h-[200px] flex-col items-center justify-center px-6 py-12 text-center"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: "#FFFFFF",
                }}
              >
                {(block.content.imageUrl as string) && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                      backgroundImage: `url(${block.content.imageUrl})`,
                    }}
                  />
                )}
                <div className="relative z-10">
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: theme.fontFamily }}
                  >
                    {(block.content.title as string) || "Nama Bisnis Anda"}
                  </h1>
                  <p className="mt-2 text-sm opacity-80">
                    {(block.content.subtitle as string) ||
                      "Deskripsi singkat bisnis Anda"}
                  </p>
                </div>
              </div>
            )}

            {/* ── About ── */}
            {block.type === "about" && (
              <div className="px-6 py-8">
                <h2
                  className="mb-3 text-lg font-bold"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {(block.content.heading as string) || "Tentang Kami"}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: mutedText }}>
                  {(block.content.description as string) ||
                    "Deskripsi tentang bisnis Anda akan tampil di sini. Ceritakan apa yang membuat bisnis Anda unik dan mengapa pelanggan harus memilih Anda."}
                </p>
              </div>
            )}

            {/* ── Services ── */}
            {block.type === "services" && (
              <div className="px-6 py-8" style={{ backgroundColor: muted }}>
                <h2
                  className="mb-4 text-lg font-bold"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  Layanan Kami
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white p-3 shadow-sm"
                      style={{
                        backgroundColor: theme.darkMode ? "#1E293B" : "#FFFFFF",
                      }}
                    >
                      <div
                        className="mb-2 h-2 w-20 rounded"
                        style={{ backgroundColor: theme.accentColor + "40" }}
                      />
                      <div
                        className="h-2 w-12 rounded"
                        style={{ backgroundColor: mutedText + "30" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Menu ── */}
            {block.type === "menu" && (
              <div className="px-6 py-8">
                <h2
                  className="mb-4 text-lg font-bold"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  Menu
                </h2>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b pb-3"
                      style={{ borderColor: muted }}
                    >
                      <div>
                        <div
                          className="h-2 w-24 rounded"
                          style={{ backgroundColor: text + "30" }}
                        />
                        <div
                          className="mt-1.5 h-2 w-16 rounded"
                          style={{ backgroundColor: mutedText + "30" }}
                        />
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: theme.accentColor }}
                      >
                        Rp --
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gallery ── */}
            {block.type === "gallery" && (
              <div className="px-6 py-8" style={{ backgroundColor: muted }}>
                <h2
                  className="mb-4 text-lg font-bold"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {(block.content.heading as string) || "Galeri"}
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg"
                      style={{
                        backgroundColor: theme.darkMode ? "#334155" : "#CBD5E1",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Reviews ── */}
            {block.type === "reviews" && (
              <div className="px-6 py-8">
                <h2
                  className="mb-4 text-lg font-bold"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  Ulasan Pelanggan
                </h2>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{ backgroundColor: muted }}
                    >
                      <div className="mb-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="h-3 w-3"
                            fill={theme.accentColor}
                            stroke={theme.accentColor}
                          />
                        ))}
                      </div>
                      <div
                        className="h-2 w-full rounded"
                        style={{ backgroundColor: mutedText + "20" }}
                      />
                      <div
                        className="mt-1 h-2 w-2/3 rounded"
                        style={{ backgroundColor: mutedText + "20" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Location Map ── */}
            {block.type === "location_map" && (
              <div className="px-6 py-8" style={{ backgroundColor: muted }}>
                <h2
                  className="mb-4 text-lg font-bold"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  Lokasi Kami
                </h2>
                <div className="flex h-40 items-center justify-center rounded-lg border border-border">
                  <MapPin className="mr-2 h-5 w-5" style={{ color: mutedText }} />
                  <span className="text-sm" style={{ color: mutedText }}>
                    {(block.content.address as string) || "Google Maps Preview"}
                  </span>
                </div>
              </div>
            )}

            {/* ── Contact ── */}
            {block.type === "contact" && (
              <div className="px-6 py-8">
                <h2
                  className="mb-4 text-lg font-bold"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  Hubungi Kami
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm" style={{ color: mutedText }}>
                    <Phone className="h-4 w-4" /> 08xx-xxxx-xxxx
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: mutedText }}>
                    <Mail className="h-4 w-4" /> email@bisnis.com
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: mutedText }}>
                    <MapPin className="h-4 w-4" /> Jakarta, Indonesia
                  </div>
                </div>
              </div>
            )}

            {/* ── Social Links ── */}
            {block.type === "social_links" && (
              <div
                className="flex justify-center gap-4 px-6 py-6"
                style={{ backgroundColor: muted }}
              >
                {["Instagram", "Facebook", "TikTok", "Website"].map((s) => (
                  <div
                    key={s}
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.primaryColor, color: "#FFFFFF" }}
                  >
                    <Globe className="h-4 w-4" />
                  </div>
                ))}
              </div>
            )}

            {/* ── Promo Banner ── */}
            {block.type === "promo_banner" && (
              <div
                className="relative px-6 py-8 text-center"
                style={{
                  backgroundColor: (block.content.backgroundImage as string)
                    ? undefined
                    : theme.accentColor + "15",
                }}
              >
                {(block.content.backgroundImage as string) && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${block.content.backgroundImage})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                )}
                <div className="relative z-10">
                  <h2
                    className="text-lg font-bold"
                    style={{
                      color: (block.content.backgroundImage as string)
                        ? "#FFFFFF"
                        : undefined,
                    }}
                  >
                    {(block.content.title as string) || "Promo Spesial!"}
                  </h2>
                  <p
                    className="mt-1 text-sm"
                    style={{
                      color: (block.content.backgroundImage as string)
                        ? "#FFFFFFCC"
                        : mutedText,
                    }}
                  >
                    {(block.content.description as string) ||
                      "Diskon 20% untuk pelanggan baru"}
                  </p>
                  <button
                    className="mt-3 px-5 py-2 text-sm font-semibold text-white"
                    style={{
                      backgroundColor: theme.primaryColor,
                      borderRadius,
                    }}
                  >
                    {(block.content.buttonText as string) || "Klaim Sekarang"}
                    {(block.content.redirectUrl as string) && (
                      <span className="ml-1 text-[10px] opacity-60">↗</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Booking CTA ── */}
            {block.type === "booking_cta" && (
              <div className="px-6 py-8 text-center">
                <button
                  className="w-full px-6 py-3 text-sm font-semibold text-white"
                  style={{
                    backgroundColor: "#25D366",
                    borderRadius,
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {(block.content.buttonText as string) || "Book via WhatsApp"}
                  </span>
                </button>
              </div>
            )}

            {/* ── Links ── */}
            {block.type === "links" && (
              <div className="px-6 py-6">
                <div className="space-y-2">
                  {((block.content.links as Array<{ label: string; url: string }>) || []).length > 0 ? (
                    (block.content.links as Array<{ label: string; url: string }>).map(
                      (link, i) => (
                        <a
                          key={i}
                          href={link.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                          style={{
                            backgroundColor: theme.primaryColor,
                            borderRadius,
                          }}
                        >
                          {link.label || "Link"}
                          <span className="ml-2 text-xs opacity-60">↗</span>
                        </a>
                      )
                    )
                  ) : (
                    <div
                      className="rounded-lg border border-dashed border-border p-4 text-center text-sm"
                      style={{ color: mutedText }}
                    >
                      Tambahkan link URL
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Custom HTML ── */}
            {block.type === "custom_html" && (
              <div className="px-6 py-6">
                {(block.content.html as string) ? (
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{
                      __html: block.content.html as string,
                    }}
                  />
                ) : (
                  <div
                    className="rounded-lg border border-dashed border-border p-4 text-center text-sm"
                    style={{ color: mutedText }}
                  >
                    Custom HTML content
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Floating WhatsApp button */}
      <div className="pointer-events-none sticky bottom-0 flex justify-end p-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: "#25D366" }}
        >
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
