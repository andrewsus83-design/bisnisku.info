"use client";

import { useState } from "react";
import {
  useContentStore,
  imageArticleTypes,
  imageArticleTypeLabels,
} from "@/stores/content-store";
import {
  generateImageArticle,
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
  Image as ImageIcon,
  FileText,
} from "lucide-react";

type GenerationStep = "idle" | "text" | "image" | "done";

const stepLabels: Record<GenerationStep, string> = {
  idle: "",
  text: "Generating artikel & prompt...",
  image: "Generating gambar...",
  done: "Selesai!",
};

export function ImageArticleForm() {
  const {
    imageArticleForm: form,
    setImageArticleForm: setForm,
    isGenerating,
    setIsGenerating,
  } = useContentStore();

  const [step, setStep] = useState<"config" | "result">("config");
  const [genStep, setGenStep] = useState<GenerationStep>("idle");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedArticle, setGeneratedArticle] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setGenStep("text");

    try {
      setGenStep("image");

      const result = await generateImageArticle({
        description: form.description,
        descriptionMode: form.descriptionMode,
        article: form.article,
        type: form.type,
        referenceImageUrl: form.referenceImage ?? undefined,
        businessName: "",
        businessVertical: "",
      });

      if (!result.success) {
        setError(result.error);
        setGenStep("idle");
        return;
      }

      setGenStep("done");
      setGeneratedTitle(result.title);
      setGeneratedArticle(result.article);
      setGeneratedImages(result.imageUrls);
      setGeneratedPrompt(result.prompt);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal generate konten");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenStep("idle"), 1500);
    }
  }

  async function handleSaveAsDraft() {
    setSaving(true);
    setSavedMsg("");
    try {
      const result = await saveGeneratedContent({
        title: generatedTitle,
        body: generatedArticle,
        contentType: "social",
        mediaUrls: generatedImages,
        thumbnailUrl: generatedImages[0],
        format: "image_article",
        prompt: generatedPrompt,
        metadata: {
          post_type: form.type,
          description: form.description,
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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(generatedArticle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }

  // ── Config Step ──
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
          maxLength={500}
        />

        {/* Article Info */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
          <p className="text-xs font-medium text-blue-700">
            Article akan di-generate otomatis oleh AI (max 800 karakter)
          </p>
          <p className="mt-0.5 text-[10px] text-blue-500">
            Gambar juga akan di-generate — Anda bisa mengedit semua hasilnya
          </p>
        </div>

        {/* Type Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark">
            Tipe Konten
          </label>
          <div className="flex flex-wrap gap-2">
            {imageArticleTypes.map((t) => (
              <button
                key={t}
                onClick={() => setForm({ type: t })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  form.type === t
                    ? "bg-brand-dark text-white"
                    : "border border-border bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {imageArticleTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        {/* Generation Progress */}
        {isGenerating && genStep !== "idle" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{stepLabels[genStep]}</span>
            </div>
            <div className="mt-2 flex gap-2">
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                genStep === "text" ? "bg-purple-200 text-purple-800" :
                genStep === "image" || genStep === "done" ? "bg-emerald-100 text-emerald-700" :
                "bg-slate-100 text-slate-500"
              }`}>
                <FileText className="h-3 w-3" />
                Artikel
              </div>
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                genStep === "image" ? "bg-purple-200 text-purple-800" :
                genStep === "done" ? "bg-emerald-100 text-emerald-700" :
                "bg-slate-100 text-slate-500"
              }`}>
                <ImageIcon className="h-3 w-3" />
                Gambar
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-full bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark/90 disabled:opacity-50"
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

  // ── Result Step ──
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-brand-dark">Hasil Generate</h4>
        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700">
          AI — {imageArticleTypeLabels[form.type]}
        </span>
      </div>

      {/* Generated Images Preview */}
      {generatedImages.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Generated Images ({generatedImages.length})
          </label>
          <div className={`grid gap-2 ${
            generatedImages.length === 1 ? "grid-cols-1" :
            generatedImages.length === 2 ? "grid-cols-2" :
            "grid-cols-2 sm:grid-cols-4"
          }`}>
            {generatedImages.map((url, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-slate-50">
                <img
                  src={url}
                  alt={`Generated ${i + 1}`}
                  className="aspect-square w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Judul</label>
        <input
          value={generatedTitle}
          onChange={(e) => setGeneratedTitle(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-brand-dark focus:border-brand-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Article</span>
          <span>{generatedArticle.length}/800</span>
        </label>
        <textarea
          value={generatedArticle}
          onChange={(e) => setGeneratedArticle(e.target.value.slice(0, 800))}
          rows={8}
          maxLength={800}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
      )}
      {savedMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> {savedMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSaveAsDraft}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Simpan ke Draft
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50"
        >
          {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
        </button>
        <button
          onClick={() => { setStep("config"); handleGenerate(); }}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          Regenerate
        </button>
        <button
          onClick={() => setStep("config")}
          className="text-sm text-muted-foreground hover:text-brand-dark"
        >
          Edit Settings
        </button>
      </div>
    </div>
  );
}
