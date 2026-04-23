"use client";

import { useState } from "react";
import {
  useContentStore,
  createFormatLabels,
  createFormatDescriptions,
  type CreateFormat,
} from "@/stores/content-store";
import {
  ImageIcon,
  FileText,
  Film,
  Sparkles,
  ArrowLeft,
  Mic,
} from "lucide-react";
import { ImageArticleForm } from "./create-forms/image-article-form";
import { ImageOnlyForm } from "./create-forms/image-only-form";
import { VideoForm } from "./create-forms/video-form";
import { ArticleBlogForm } from "./create-forms/article-blog-form";
import { AudioVoiceoverForm } from "./create-forms/audio-form";

const formatIcons: Record<CreateFormat, typeof ImageIcon> = {
  image_article: FileText,
  short_video: Film,
  image: ImageIcon,
  article: FileText,
  audio: Mic,
};

export function ContentCreate() {
  const { selectedFormat, setSelectedFormat } = useContentStore();

  const formats: CreateFormat[] = ["image_article", "short_video", "image", "article", "audio"];

  // ── Format Selection ──
  if (!selectedFormat) {
    return (
      <div>
        <h3 className="mb-4 text-lg font-semibold text-brand-dark">
          Pilih Format Konten
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formats.map((f) => {
            const Icon = formatIcons[f];
            return (
              <button
                key={f}
                onClick={() => setSelectedFormat(f)}
                className="flex items-start gap-4 rounded-2xl border-2 border-border bg-white p-5 text-left transition-colors hover:border-brand-primary hover:bg-yellow-50/30"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                  <Icon className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">
                    {createFormatLabels[f]}
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {createFormatDescriptions[f]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Per-format form ──
  return (
    <div>
      <button
        onClick={() => setSelectedFormat(null)}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke pilihan format
      </button>

      <div className="mb-4 flex items-center gap-3">
        {(() => {
          const Icon = formatIcons[selectedFormat];
          return (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10">
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
          );
        })()}
        <div>
          <h3 className="text-lg font-semibold text-brand-dark">
            {createFormatLabels[selectedFormat]}
          </h3>
          <p className="text-xs text-muted-foreground">
            {createFormatDescriptions[selectedFormat]}
          </p>
        </div>
      </div>

      {selectedFormat === "image_article" && <ImageArticleForm />}
      {selectedFormat === "image" && <ImageOnlyForm />}
      {selectedFormat === "short_video" && <VideoForm />}
      {selectedFormat === "article" && <ArticleBlogForm />}
      {selectedFormat === "audio" && <AudioVoiceoverForm />}
    </div>
  );
}
