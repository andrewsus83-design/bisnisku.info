"use client";

import { useState, useEffect } from "react";
import { useBioEditorStore } from "@/stores/bio-editor-store";
import {
  backgroundThemes,
  backgroundTextures,
  fontOptions,
  getFontFamily,
} from "@/lib/validations/bio-page";
import { generateSeoFromProfile, hasBusinessProfile } from "@/lib/supabase/seo-actions";
import { ColorPicker } from "./color-picker";
import { Sparkles, Loader2, Type, Heading } from "lucide-react";

export function ThemePanel() {
  const { theme, setTheme, seoTitle, seoDescription, setSeoTitle, setSeoDescription } =
    useBioEditorStore();

  const [hasProfile, setHasProfile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [textureTab, setTextureTab] = useState<"paper" | "stone" | "pattern">("paper");

  useEffect(() => {
    hasBusinessProfile().then(setHasProfile);
  }, []);

  async function handleAutoSeo() {
    setIsGenerating(true);
    try {
      const result = await generateSeoFromProfile();
      if (result.title) setSeoTitle(result.title);
      if (result.description) setSeoDescription(result.description);
    } catch {
      // silently fail
    } finally {
      setIsGenerating(false);
    }
  }

  // Resolve legacy fontFamily → primaryFont/secondaryFont
  const primaryFont = theme.primaryFont || theme.fontFamily || "Plus Jakarta Sans";
  const secondaryFont = theme.secondaryFont || "Inter";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-brand-dark">
          Tema & SEO
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {/* Background Theme (gradients) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-dark">
              Background
            </label>
            <div className="grid grid-cols-3 gap-2">
              {backgroundThemes.map((bg) => (
                <button
                  key={bg.value}
                  onClick={() => setTheme({ backgroundTheme: bg.value })}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                    theme.backgroundTheme === bg.value
                      ? "border-brand-primary ring-2 ring-brand-primary/30"
                      : "border-border hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`h-8 w-full rounded ${bg.preview}`}
                    style={bg.value === "none" ? { border: "1px solid #E2E8F0" } : undefined}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {bg.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Texture */}
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-dark">
              Texture
            </label>
            {/* Tabs */}
            <div className="mb-2 flex gap-1">
              {(["paper", "stone", "pattern"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTextureTab(tab)}
                  className={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
                    textureTab === tab
                      ? "bg-brand-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-slate-200"
                  }`}
                >
                  {tab === "paper" ? "Paper & Fabric" : tab === "stone" ? "Stone & Wood" : "Pattern"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* None option always shown */}
              <button
                onClick={() => setTheme({ backgroundTexture: "none" })}
                className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                  (theme.backgroundTexture ?? "none") === "none"
                    ? "border-brand-primary ring-2 ring-brand-primary/30"
                    : "border-border hover:border-slate-300"
                }`}
              >
                <div className="flex h-8 w-full items-center justify-center rounded border border-slate-200 bg-white text-[9px] text-slate-400">
                  ✕
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">None</span>
              </button>
              {backgroundTextures
                .filter((t) => t.category === textureTab)
                .map((tex) => (
                  <button
                    key={tex.value}
                    onClick={() => setTheme({ backgroundTexture: tex.value })}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                      theme.backgroundTexture === tex.value
                        ? "border-brand-primary ring-2 ring-brand-primary/30"
                        : "border-border hover:border-slate-300"
                    }`}
                  >
                    <div className="h-8 w-full rounded bg-slate-100"
                      style={{
                        backgroundImage: getTexturePreview(tex.value),
                        backgroundSize: tex.value === "dots" ? "10px 10px" : tex.value === "grid" ? "12px 12px" : undefined,
                      }}
                    />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {tex.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Primary Color */}
          <ColorPicker
            label="Warna Utama"
            value={theme.primaryColor}
            onChange={(v) => setTheme({ primaryColor: v })}
            showGradients={true}
          />

          {/* Accent Color */}
          <ColorPicker
            label="Warna Aksen"
            value={theme.accentColor}
            onChange={(v) => setTheme({ accentColor: v })}
            showGradients={true}
          />

          {/* Primary Font (Headings) */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-dark">
              <Heading className="h-3.5 w-3.5" />
              Font Judul
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setTheme({ primaryFont: font.value })}
                  className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                    primaryFont === font.value
                      ? "border-brand-primary bg-yellow-50 font-medium text-brand-dark"
                      : "border-border text-muted-foreground hover:border-slate-300"
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Font (Body) */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-brand-dark">
              <Type className="h-3.5 w-3.5" />
              Font Body
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fontOptions
                .filter((f) => f.category === "sans" || f.category === "serif")
                .map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setTheme({ secondaryFont: font.value })}
                    className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                      secondaryFont === font.value
                        ? "border-brand-primary bg-yellow-50 font-medium text-brand-dark"
                        : "border-border text-muted-foreground hover:border-slate-300"
                    }`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Button Style */}
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-dark">
              Gaya Tombol
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: "rounded", label: "Rounded" },
                  { value: "pill", label: "Pill" },
                  { value: "square", label: "Square" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme({ buttonStyle: opt.value })}
                  className={`border-2 px-3 py-1.5 text-sm transition-colors ${
                    theme.buttonStyle === opt.value
                      ? "border-brand-primary bg-yellow-50 font-medium text-brand-dark"
                      : "border-border text-muted-foreground hover:border-slate-300"
                  } ${
                    opt.value === "pill"
                      ? "rounded-full"
                      : opt.value === "square"
                        ? "rounded-none"
                        : "rounded-lg"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-brand-dark">
              Dark Mode
            </label>
            <button
              onClick={() => setTheme({ darkMode: !theme.darkMode })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                theme.darkMode ? "bg-brand-dark" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  theme.darkMode ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-brand-dark">SEO</h4>
              <button
                onClick={handleAutoSeo}
                disabled={!hasProfile || isGenerating}
                title={
                  !hasProfile
                    ? "Selesaikan onboarding untuk menggunakan fitur ini"
                    : "Generate SEO otomatis dari profil bisnis"
                }
                className="flex items-center gap-1 rounded-full bg-brand-primary/10 px-2.5 py-1 text-[10px] font-semibold text-brand-dark transition-colors hover:bg-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Auto AI
              </button>
            </div>

            {/* SEO Title */}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Judul Halaman ({seoTitle.length}/60)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={60}
                placeholder="Nama bisnis — tagline singkat"
                className="w-full rounded-full border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </div>

            {/* SEO Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Deskripsi ({seoDescription.length}/160)
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Deskripsi bisnis untuk mesin pencari..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simple texture preview background for the picker thumbnails */
function getTexturePreview(value: string): string {
  const map: Record<string, string> = {
    linen: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)",
    canvas: "repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px), repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)",
    kraft: "repeating-linear-gradient(0deg, rgba(139,90,43,0.1), transparent 1px), repeating-linear-gradient(90deg, rgba(139,90,43,0.08), transparent 2px)",
    crumpled: "radial-gradient(ellipse at 20% 50%, rgba(0,0,0,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0,0,0,0.08) 0%, transparent 40%)",
    watercolor: "radial-gradient(ellipse at 30% 30%, rgba(120,120,120,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(120,120,120,0.1) 0%, transparent 50%)",
    marble: "repeating-linear-gradient(115deg, transparent, transparent 10px, rgba(0,0,0,0.08) 10px, rgba(0,0,0,0.08) 11px)",
    concrete: "radial-gradient(circle at 25% 25%, rgba(0,0,0,0.1) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(0,0,0,0.08) 1px, transparent 1px)",
    wood: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,90,43,0.12) 3px, rgba(139,90,43,0.12) 4px)",
    slate: "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.03) 100%)",
    terrazzo: "radial-gradient(circle 4px at 20% 30%, rgba(120,120,120,0.2) 0%, transparent 100%), radial-gradient(circle 3px at 60% 60%, rgba(120,120,120,0.15) 0%, transparent 100%)",
    dots: "radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)",
    grid: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
    diagonal: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 6px)",
    noise: "radial-gradient(circle at 10% 20%, rgba(0,0,0,0.08) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(0,0,0,0.06) 0%, transparent 25%)",
    geometric: "linear-gradient(30deg, rgba(0,0,0,0.08) 12%, transparent 12.5%, transparent 87%, rgba(0,0,0,0.08) 87.5%), linear-gradient(150deg, rgba(0,0,0,0.08) 12%, transparent 12.5%, transparent 87%, rgba(0,0,0,0.08) 87.5%)",
  };
  return map[value] || "";
}
