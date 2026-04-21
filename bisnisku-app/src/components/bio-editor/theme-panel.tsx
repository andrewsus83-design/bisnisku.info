"use client";

import { useState, useEffect } from "react";
import { useBioEditorStore } from "@/stores/bio-editor-store";
import { backgroundThemes, fontOptions } from "@/lib/validations/bio-page";
import { generateSeoFromProfile, hasBusinessProfile } from "@/lib/supabase/seo-actions";
import { ColorPicker } from "./color-picker";
import { Sparkles, Loader2 } from "lucide-react";

export function ThemePanel() {
  const { theme, setTheme, seoTitle, seoDescription, setSeoTitle, setSeoDescription } =
    useBioEditorStore();

  const [hasProfile, setHasProfile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-brand-dark">
          Tema & SEO
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-5">
          {/* Background Theme */}
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

          {/* Primary Color */}
          <ColorPicker
            label="Warna Utama"
            value={theme.primaryColor}
            onChange={(v) => setTheme({ primaryColor: v })}
            showGradients={false}
          />

          {/* Accent Color */}
          <ColorPicker
            label="Warna Aksen"
            value={theme.accentColor}
            onChange={(v) => setTheme({ accentColor: v })}
            showGradients={true}
          />

          {/* Font Family */}
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-dark">
              Font
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fontOptions.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setTheme({ fontFamily: font.value })}
                  className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${
                    theme.fontFamily === font.value
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
