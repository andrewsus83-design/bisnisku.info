"use client";

import { useState } from "react";
import {
  useContentStore,
  videoObjectives,
  videoObjectiveLabels,
  videoLengths,
} from "@/stores/content-store";
import {
  generateShortVideo,
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
  Volume2,
  VolumeX,
  Captions,
  CaptionsOff,
  Clock,
  Video,
  FileText,
  Music,
  Clapperboard,
  Film,
  Zap,
} from "lucide-react";

type GenerationStep = "idle" | "script" | "video" | "audio" | "composite" | "done";

const stepLabels: Record<GenerationStep, string> = {
  idle: "",
  script: "Generating script & prompt...",
  video: "Generating video (Kling v3)...",
  audio: "Generating voiceover (ElevenLabs)...",
  composite: "Compositing final video...",
  done: "Selesai!",
};

/** Video generation mode — maps to subscription tier */
type VideoMode = "motion_graphics" | "kling_full";

export function VideoForm() {
  const {
    videoForm: form,
    setVideoForm: setForm,
    isGenerating,
    setIsGenerating,
  } = useContentStore();

  const [step, setStep] = useState<"config" | "result">("config");
  const [genStep, setGenStep] = useState<GenerationStep>("idle");
  const [videoMode, setVideoMode] = useState<VideoMode>("motion_graphics");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");
    setGenStep("script");

    try {
      setGenStep("video");

      const result = await generateShortVideo({
        description: form.description,
        descriptionMode: form.descriptionMode,
        length: form.length,
        audio: form.audio,
        caption: form.caption,
        objective: form.objective,
        referenceImageUrl: form.referenceImage ?? undefined,
        businessName: "",
        businessVertical: "",
        videoMode,
      });

      if (!result.success) {
        setError(result.error);
        setGenStep("idle");
        return;
      }

      setGenStep("done");
      setGeneratedTitle(`${videoObjectiveLabels[form.objective]} — ${form.length}s`);
      setGeneratedScript(result.script);
      setGeneratedVideoUrl(result.videoUrl);
      setGeneratedPrompt(result.prompt);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal generate video");
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
        body: generatedScript,
        contentType: "social",
        mediaUrls: generatedVideoUrl ? [generatedVideoUrl] : [],
        format: "short_video",
        prompt: generatedPrompt,
        metadata: {
          length: form.length,
          audio: form.audio,
          caption: form.caption,
          objective: form.objective,
          video_mode: videoMode,
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
      await navigator.clipboard.writeText(generatedScript);
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

        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark">
            Durasi Video
          </label>
          <div className="flex gap-2">
            {videoLengths.map((len) => (
              <button
                key={len}
                onClick={() => setForm({ length: len })}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  form.length === len
                    ? "bg-brand-dark text-white"
                    : "border border-border bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {len}s
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Durasi tergantung tier plan Anda
          </p>
        </div>

        {/* Video Mode (tier-based) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark">
            Mode Video
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setVideoMode("motion_graphics")}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 text-center transition-colors ${
                videoMode === "motion_graphics"
                  ? "bg-brand-dark text-white"
                  : "border border-border bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <Zap className="h-4 w-4" />
              <span className="text-xs font-semibold">Motion Graphics</span>
              <span className={`text-[10px] ${videoMode === "motion_graphics" ? "text-white/70" : "text-muted-foreground"}`}>
                Animasi efek pada gambar
              </span>
            </button>
            <button
              onClick={() => setVideoMode("kling_full")}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 text-center transition-colors ${
                videoMode === "kling_full"
                  ? "bg-brand-dark text-white"
                  : "border border-border bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <Film className="h-4 w-4" />
              <span className="text-xs font-semibold">Cinematic (Kling v3)</span>
              <span className={`text-[10px] ${videoMode === "kling_full" ? "text-white/70" : "text-muted-foreground"}`}>
                Video sinematik penuh
              </span>
            </button>
          </div>
        </div>

        {/* Audio & Caption Toggles */}
        <div className="flex gap-4">
          <button
            onClick={() => setForm({ audio: !form.audio })}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
              form.audio
                ? "bg-emerald-100 text-emerald-700"
                : "border border-border bg-white text-slate-500"
            }`}
          >
            {form.audio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Audio {form.audio ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setForm({ caption: !form.caption })}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
              form.caption
                ? "bg-blue-100 text-blue-700"
                : "border border-border bg-white text-slate-500"
            }`}
          >
            {form.caption ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
            Caption {form.caption ? "ON" : "OFF"}
          </button>
        </div>

        {/* Objective */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark">
            Objective
          </label>
          <div className="flex flex-wrap gap-2">
            {videoObjectives.map((obj) => (
              <button
                key={obj}
                onClick={() => setForm({ objective: obj })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  form.objective === obj
                    ? "bg-brand-dark text-white"
                    : "border border-border bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {videoObjectiveLabels[obj]}
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
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { key: "script", icon: FileText, label: "Script" },
                { key: "video", icon: Video, label: videoMode === "motion_graphics" ? "Motion GFX" : "Kling v3" },
                ...(form.audio ? [{ key: "audio", icon: Music, label: "Audio" }] : []),
                ...(form.audio || form.caption ? [{ key: "composite", icon: Clapperboard, label: "Composite" }] : []),
              ].map(({ key, icon: Icon, label }) => (
                <div key={key} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  genStep === key ? "bg-purple-200 text-purple-800" :
                  ["done"].includes(genStep) ||
                  (key === "script" && ["video", "audio", "composite", "done"].includes(genStep)) ||
                  (key === "video" && ["audio", "composite", "done"].includes(genStep)) ||
                  (key === "audio" && ["composite", "done"].includes(genStep))
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  <Icon className="h-3 w-3" />
                  {label}
                </div>
              ))}
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
            <><Sparkles className="h-4 w-4" /> Generate Video AI</>
          )}
        </button>
      </div>
    );
  }

  // ── Result ──
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-brand-dark">Video Result</h4>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700">
            AI — {videoObjectiveLabels[form.objective]}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {form.length}s
          </span>
          {videoMode === "motion_graphics" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Motion GFX
            </span>
          )}
          {videoMode === "kling_full" && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              Kling v3
            </span>
          )}
          {form.audio && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Audio
            </span>
          )}
          {form.caption && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              Caption
            </span>
          )}
        </div>
      </div>

      {/* Video Preview */}
      {generatedVideoUrl && (
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          <video
            src={generatedVideoUrl}
            controls
            className="mx-auto max-h-[400px] w-auto"
            poster=""
          >
            Browser Anda tidak support video playback.
          </video>
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
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Script / Narasi</label>
        <textarea
          value={generatedScript}
          onChange={(e) => setGeneratedScript(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm text-brand-dark focus:border-brand-primary focus:outline-none"
        />
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
          {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Script</>}
        </button>
        <button onClick={() => { setStep("config"); handleGenerate(); }} disabled={isGenerating} className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50 disabled:opacity-50">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />} Regenerate
        </button>
        <button onClick={() => setStep("config")} className="text-sm text-muted-foreground hover:text-brand-dark">Edit Settings</button>
      </div>
    </div>
  );
}
