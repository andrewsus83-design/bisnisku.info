"use client";

import { useState } from "react";
import {
  useContentStore,
  articleLengths,
  articleLengthLabels,
  articleLengthDescriptions,
} from "@/stores/content-store";
import { aiGenerateContent, createContent } from "@/lib/supabase/content-actions";
import { DescriptionField } from "./description-field";
import {
  Sparkles,
  Loader2,
  Check,
  Copy,
  RotateCw,
} from "lucide-react";

export function ArticleBlogForm() {
  const {
    articleForm: form,
    setArticleForm: setForm,
    isGenerating,
    setIsGenerating,
  } = useContentStore();

  const [step, setStep] = useState<"config" | "result">("config");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");
  const [generatedSeoTitle, setGeneratedSeoTitle] = useState("");
  const [generatedSeoDesc, setGeneratedSeoDesc] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");

    try {
      const topicStr = form.topic ? `Topik: ${form.topic}\n` : "";
      const prompt = form.descriptionMode === "manual" && form.description
        ? form.description
        : `Buat artikel blog untuk bisnis lokal.`;

      const lengthMap = { short: 300, medium: 600, long: 1000 } as const;
      const wordTarget = lengthMap[form.length];

      const result = await aiGenerateContent({
        prompt: `${prompt}\n\n${topicStr}Format: Artikel blog (SEO-friendly)\nPanjang: ~${wordTarget} kata (${articleLengthLabels[form.length]})\nBuat artikel lengkap dengan intro, body, dan conclusion.\nSertakan juga SEO title (max 60 char) dan meta description (max 160 char).`,
        content_type: "blog",
        channel: "bio_page",
        tone: "professional",
        language: "id",
        include_emoji: false,
        include_hashtags: false,
        max_length: wordTarget * 6,
        model: "sonnet", // Artikel menggunakan Sonnet untuk kualitas lebih baik
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setGeneratedTitle(result.title);
      setGeneratedBody(result.body);
      // Auto-generate SEO from title
      setGeneratedSeoTitle(result.title.slice(0, 60));
      setGeneratedSeoDesc(result.body.slice(0, 160));
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
      const result = await createContent({
        title: generatedTitle,
        body: generatedBody,
        content_type: "blog",
        channel: "bio_page",
        status: "draft",
        tags: [],
        media_urls: [],
        seo_title: generatedSeoTitle || undefined,
        seo_description: generatedSeoDesc || undefined,
        slug: generatedTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 80) || undefined,
        metadata: {
          format: "article",
          topic: form.topic,
          ai_generated: true,
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
      await navigator.clipboard.writeText(generatedBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  }

  // ── Config ──
  if (step === "config") {
    return (
      <div className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
        {/* Topic */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-dark">
            Topik Artikel
          </label>
          <input
            value={form.topic}
            onChange={(e) => setForm({ topic: e.target.value })}
            placeholder="Contoh: Tips memilih kopi yang berkualitas, Perawatan rambut di musim kering..."
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        <DescriptionField
          value={form.description}
          onChange={(v) => setForm({ description: v })}
          mode={form.descriptionMode}
          onModeChange={(m) => setForm({ descriptionMode: m })}
          placeholder="Deskripsikan isi artikel yang ingin dibuat, target audience, dan key points..."
          maxLength={500}
          rows={4}
        />

        {/* Length */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark">
            Panjang Artikel
          </label>
          <div className="flex gap-2">
            {articleLengths.map((len) => (
              <button
                key={len}
                onClick={() => setForm({ length: len })}
                className={`flex flex-col items-center rounded-xl px-5 py-3 text-center transition-colors ${
                  form.length === len
                    ? "bg-brand-dark text-white"
                    : "border border-border bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-sm font-semibold">{articleLengthLabels[len]}</span>
                <span className={`mt-0.5 text-[10px] ${form.length === len ? "text-white/70" : "text-muted-foreground"}`}>
                  {articleLengthDescriptions[len]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
          <p className="text-xs font-medium text-blue-700">
            AI akan membuat artikel lengkap dengan SEO title & meta description
          </p>
          <p className="mt-0.5 text-[10px] text-blue-500">
            Cocok untuk blog bisnis, content marketing, bio page
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || (!form.topic && form.descriptionMode === "auto")}
          className="flex items-center gap-2 rounded-full bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark/90 disabled:opacity-50"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate Artikel</>
          )}
        </button>
      </div>
    );
  }

  // ── Result ──
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-brand-dark">Artikel</h4>
        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700">
          AI Generated
        </span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Judul</label>
        <input
          value={generatedTitle}
          onChange={(e) => setGeneratedTitle(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-brand-dark focus:border-brand-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Isi Artikel</label>
        <textarea
          value={generatedBody}
          onChange={(e) => setGeneratedBody(e.target.value)}
          rows={12}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
        />
      </div>

      {/* SEO Fields */}
      <div className="rounded-xl border border-border bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold text-brand-dark">SEO</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>SEO Title</span>
              <span>{generatedSeoTitle.length}/60</span>
            </label>
            <input
              value={generatedSeoTitle}
              onChange={(e) => setGeneratedSeoTitle(e.target.value.slice(0, 60))}
              maxLength={60}
              className="w-full rounded-lg border border-border px-3 py-2 text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Meta Description</span>
              <span>{generatedSeoDesc.length}/160</span>
            </label>
            <textarea
              value={generatedSeoDesc}
              onChange={(e) => setGeneratedSeoDesc(e.target.value.slice(0, 160))}
              maxLength={160}
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-xs text-brand-dark focus:border-brand-primary focus:outline-none"
            />
          </div>
        </div>
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
        <button onClick={handleCopy} className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50">
          {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
        </button>
        <button onClick={() => { setStep("config"); handleGenerate(); }} disabled={isGenerating} className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50 disabled:opacity-50">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />} Regenerate
        </button>
        <button onClick={() => setStep("config")} className="text-sm text-muted-foreground hover:text-brand-dark">Edit Settings</button>
      </div>
    </div>
  );
}
