"use client";

import { useState } from "react";
import {
  useContentStore,
  audioObjectiveLabels,
  audioLengthLabels,
  type AudioObjective,
  type AudioLength,
} from "@/stores/content-store";
import { generateAudioVoiceover, saveGeneratedContent } from "@/lib/supabase/media-generation-actions";
import { DescriptionField } from "./description-field";
import {
  Mic,
  Play,
  Pause,
  Loader2,
  Check,
  Download,
  Save,
  Clock,
  Volume2,
} from "lucide-react";

type Step = "form" | "generating" | "result";

interface AudioResult {
  audioUrl: string;
  script: string;
  title: string;
  durationEstimate: number;
}

export function AudioVoiceoverForm() {
  const { audioForm, setAudioForm, resetAudioForm, setIsGenerating } =
    useContentStore();

  const [step, setStep] = useState<Step>("form");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<AudioResult | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  async function handleGenerate() {
    setError("");
    setStep("generating");
    setIsGenerating(true);
    setProgress("Membuat script audio...");

    try {
      const res = await generateAudioVoiceover({
        description: audioForm.description,
        descriptionMode: audioForm.descriptionMode,
        script: audioForm.script,
        objective: audioForm.objective,
        lengthSec: audioForm.length,
        voiceId: audioForm.voiceId || undefined,
        businessName: "",
        businessVertical: "",
      });

      if (!res.success) {
        setError(res.error);
        setStep("form");
        return;
      }

      setResult(res);
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setStep("form");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await saveGeneratedContent({
        title: result.title,
        body: result.script,
        contentType: "social",
        mediaUrls: [result.audioUrl],
        format: "audio",
        prompt: audioForm.description || audioForm.objective,
        metadata: {
          audio_duration: result.durationEstimate,
          audio_objective: audioForm.objective,
          audio_length: audioForm.length,
        },
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => {
          resetAudioForm();
          setStep("form");
          setResult(null);
          setSaved(false);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function togglePlay() {
    if (!result?.audioUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(result.audioUrl);
      audio.addEventListener("ended", () => setIsPlaying(false));
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  }

  // ── Generating step ──
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-16">
        <div className="relative mb-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
          <Mic className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-brand-primary" />
        </div>
        <p className="text-sm font-medium text-brand-dark">{progress}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Mohon tunggu sebentar...
        </p>
      </div>
    );
  }

  // ── Result step ──
  if (step === "result" && result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-brand-dark">{result.title}</h4>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700">
              AI Generated
            </span>
          </div>

          {/* Audio player */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
            <button
              onClick={togglePlay}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-md hover:bg-brand-primary/90"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="ml-0.5 h-5 w-5" />
              )}
            </button>
            <div className="flex-1">
              <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full bg-brand-primary transition-all ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                  style={{ width: isPlaying ? "60%" : "0%" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> ~{result.durationEstimate}s
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Volume2 className="h-3 w-3" /> MP3 128kbps
                </span>
              </div>
            </div>
          </div>

          {/* Script preview */}
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">
              Script
            </p>
            <p className="text-xs leading-relaxed text-brand-dark">
              {result.script}
            </p>
          </div>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
              {audioObjectiveLabels[audioForm.objective]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
              {audioForm.length}s
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-primary py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Tersimpan
              </>
            ) : saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Simpan ke Draft
              </>
            )}
          </button>
          <a
            href={result.audioUrl}
            download
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Download
          </a>
          <button
            onClick={() => {
              setStep("form");
              setResult(null);
              setAudioElement(null);
              setIsPlaying(false);
            }}
            className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50"
          >
            Buat Lagi
          </button>
        </div>
      </div>
    );
  }

  // ── Form step ──
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Objective */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
          Tipe Audio
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.entries(audioObjectiveLabels) as [AudioObjective, string][]).map(
            ([key, label]) => (
              <button
                key={key}
                onClick={() => setAudioForm({ objective: key })}
                className={`rounded-xl border-2 px-3 py-2 text-xs font-medium transition-colors ${
                  audioForm.objective === key
                    ? "border-brand-primary bg-yellow-50 text-brand-dark"
                    : "border-border text-muted-foreground hover:border-slate-300"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
          Durasi
        </label>
        <div className="flex gap-2">
          {(Object.entries(audioLengthLabels) as [string, string][]).map(
            ([key, label]) => {
              const numKey = Number(key) as AudioLength;
              return (
                <button
                  key={key}
                  onClick={() => setAudioForm({ length: numKey })}
                  className={`flex-1 rounded-xl border-2 px-3 py-2.5 text-center text-xs font-medium transition-colors ${
                    audioForm.length === numKey
                      ? "border-brand-primary bg-yellow-50 text-brand-dark"
                      : "border-border text-muted-foreground hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Description / Prompt */}
      <DescriptionField
        value={audioForm.description}
        onChange={(v) => setAudioForm({ description: v })}
        mode={audioForm.descriptionMode}
        onModeChange={(m) => setAudioForm({ descriptionMode: m })}
        placeholder="Deskripsikan audio yang ingin dibuat... (contoh: narasi tentang promo spesial Lebaran)"
      />

      {/* Manual script (optional) */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-brand-dark">
          Script (opsional)
        </label>
        <textarea
          value={audioForm.script}
          onChange={(e) => setAudioForm({ script: e.target.value })}
          rows={4}
          placeholder="Tulis script narasi sendiri, atau biarkan kosong agar AI yang membuat..."
          className="w-full rounded-xl border border-border px-4 py-3 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none"
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          Jika dikosongkan, AI akan generate script berdasarkan deskripsi dan tipe audio.
        </p>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary py-3 text-sm font-bold text-brand-dark hover:bg-brand-primary/90"
      >
        <Mic className="h-4 w-4" /> Generate Audio
      </button>
    </div>
  );
}
