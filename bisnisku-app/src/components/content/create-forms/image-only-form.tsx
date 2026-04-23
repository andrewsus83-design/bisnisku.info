"use client";

import { useState } from "react";
import {
  useContentStore,
  imageObjectives,
  imageObjectiveLabels,
} from "@/stores/content-store";
import {
  generateImageOnly,
  saveGeneratedContent,
} from "@/lib/supabase/media-generation-actions";
import { ReferenceUpload } from "./reference-upload";
import { DescriptionField } from "./description-field";
import {
  Sparkles,
  Loader2,
  Check,
  Copy,
  RotateCw,
  Minus,
  Plus,
  Image as ImageIcon,
  Download,
} from "lucide-react";

export function ImageOnlyForm() {
  const {
    imageForm: form,
    setImageForm: setForm,
    isGenerating,
    setIsGenerating,
  } = useContentStore();

  const [step, setStep] = useState<"config" | "result">("config");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    // Validate: upscale/edit/variasi needs reference image
    if (
      (form.objective === "upscale" || form.objective === "edit" || form.objective === "variasi") &&
      !form.referenceImage
    ) {
      setError(`${imageObjectiveLabels[form.objective]} membutuhkan referensi gambar`);
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const result = await generateImageOnly({
        description: form.description,
        descriptionMode: form.descriptionMode,
        quantity: form.quantity,
        objective: form.objective,
        referenceImageUrl: form.referenceImage ?? undefined,
        businessName: "",
        businessVertical: "",
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setGeneratedImages(result.imageUrls);
      setGeneratedPrompt(result.prompt);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal generate");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSaveAsDraft() {
    setSaving(true);
    setSavedMsg("");
    try {
      const result = await saveGeneratedContent({
        title: `${imageObjectiveLabels[form.objective]} — ${form.quantity} Gambar`,
        body: form.description || generatedPrompt,
        contentType: "menu_update",
        mediaUrls: generatedImages,
        thumbnailUrl: generatedImages[0],
        format: "image",
        prompt: generatedPrompt,
        metadata: {
          quantity: form.quantity,
          objective: form.objective,
        },
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSavedMsg("Tersimpan ke Draft!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(generatedImages.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }

  // ── Config ──
  if (step === "config") {
    return (
      <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <ReferenceUpload
          value={form.referenceImage}
          onChange={(url) => setForm({ referenceImage: url })}
        />

        <DescriptionField
          value={form.description}
          onChange={(v) => setForm({ description: v })}
          mode={form.descriptionMode}
          onModeChange={(m) => setForm({ descriptionMode: m })}
          maxLength={300}
        />

        {/* Quantity */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => form.quantity > 1 && setForm({ quantity: (form.quantity - 1) as 1 | 2 | 3 | 4 })}
              disabled={form.quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-brand-dark hover:bg-slate-50 disabled:opacity-30"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-bold text-brand-dark">
              {form.quantity}
            </span>
            <button
              onClick={() => form.quantity < 4 && setForm({ quantity: (form.quantity + 1) as 1 | 2 | 3 | 4 })}
              disabled={form.quantity >= 4}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-brand-dark hover:bg-slate-50 disabled:opacity-30"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">gambar (1–4)</span>
          </div>
        </div>

        {/* Objective */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark">
            Objective
          </label>
          <div className="flex flex-wrap gap-2">
            {imageObjectives.map((obj) => (
              <button
                key={obj}
                onClick={() => setForm({ objective: obj })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  form.objective === obj
                    ? "bg-brand-dark text-white"
                    : "border border-border bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {imageObjectiveLabels[obj]}
              </button>
            ))}
          </div>
        </div>

        {/* Info hint for reference-dependent objectives */}
        {(form.objective === "upscale" || form.objective === "edit" || form.objective === "variasi") && !form.referenceImage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-2.5">
            <p className="text-xs font-medium text-amber-700">
              {imageObjectiveLabels[form.objective]} membutuhkan gambar referensi
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Generating gambar...</span>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-full bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-50"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate dengan AI</>
          )}
        </button>
      </div>
    );
  }

  // ── Result ──
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-brand-dark">Hasil Generate</h4>
        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700">
          AI — {imageObjectiveLabels[form.objective]} × {generatedImages.length}
        </span>
      </div>

      {/* Generated Images Grid */}
      <div className={`grid gap-3 ${
        generatedImages.length === 1 ? "grid-cols-1 max-w-sm" :
        generatedImages.length === 2 ? "grid-cols-2" :
        "grid-cols-2"
      }`}>
        {generatedImages.map((url, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-border bg-slate-50">
            <img
              src={url}
              alt={`Generated ${i + 1}`}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-brand-dark"
              >
                <Download className="h-3 w-3" /> Open
              </a>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> {savedMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleSaveAsDraft} disabled={saving} className="flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Simpan ke Draft
        </button>
        <button onClick={handleCopyUrl} className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50">
          {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy URLs</>}
        </button>
        <button onClick={() => { setStep("config"); handleGenerate(); }} disabled={isGenerating} className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50 disabled:opacity-50">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />} Regenerate
        </button>
        <button onClick={() => setStep("config")} className="text-sm text-muted-foreground hover:text-brand-dark">Edit Settings</button>
      </div>
    </div>
  );
}
