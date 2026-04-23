"use server";

/**
 * Media Generation Pipeline Actions
 * Orchestrates fal.ai (image/video) + ElevenLabs (audio) + ffmpeg (compositor)
 * for each content format: Image+Article, Image, Video, Article (text-only).
 *
 * Each action:
 * 1. Generates AI text (Claude) for copy/script/captions
 * 2. Generates media via fal.ai
 * 3. (Video) Generates audio via ElevenLabs + composites via ffmpeg
 * 4. Uploads results to Supabase Storage
 * 5. Returns URLs + text for the Create form to display
 */

import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/config/env";

// ── fal.ai client ──
import {
  generateImage,
  imageToImage,
  upscaleImage,
  imageToVideo,
  textToVideo,
} from "@/lib/fal/client";

// ── ElevenLabs client ──
import { textToSpeech } from "@/lib/elevenlabs/client";

// ── Video compositor ──
import {
  compositeVideo,
  motionGraphicsVideo,
  type CaptionSegment,
} from "@/lib/video/compositor";

// ── Types ──

export interface GenerateImageArticleParams {
  description: string;
  descriptionMode: "manual" | "auto";
  article: string;
  type: string; // carousel, single_post, quiz, etc.
  referenceImageUrl?: string;
  businessName: string;
  businessVertical: string;
  businessDescription?: string;
}

export interface GenerateImageArticleResult {
  success: true;
  title: string;
  article: string;
  imageUrls: string[];
  prompt: string;
}

export interface GenerateImageParams {
  description: string;
  descriptionMode: "manual" | "auto";
  quantity: 1 | 2 | 3 | 4;
  objective: "edit" | "variasi" | "upscale" | "recreate_new";
  referenceImageUrl?: string;
  businessName: string;
  businessVertical: string;
}

export interface GenerateImageResult {
  success: true;
  imageUrls: string[];
  prompt: string;
}

export interface GenerateVideoParams {
  description: string;
  descriptionMode: "manual" | "auto";
  length: 10 | 15 | 20;
  audio: boolean;
  caption: boolean;
  objective: string;
  referenceImageUrl?: string;
  businessName: string;
  businessVertical: string;
  businessDescription?: string;
  /** Video generation mode based on subscription tier:
   * - "motion_graphics": Motion control/effects only (Starter/Growth tiers — cheaper)
   * - "kling_full": Full Kling v3 cinematic video (Business/Enterprise tiers)
   * - "mixed": Motion graphics for B-roll + Kling v3 main (Business/Enterprise)
   */
  videoMode?: "motion_graphics" | "kling_full" | "mixed";
}

export interface GenerateVideoResult {
  success: true;
  videoUrl: string;
  script: string;
  captions: CaptionSegment[];
  durationSec: number;
  prompt: string;
}

type ActionError = { success: false; error: string };

// ── Helpers ──

async function getBusinessInfo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, description, vertical, category, city")
    .eq("owner_id", user.id)
    .single();

  if (!business) throw new Error("No business found");
  return { business, userId: user.id };
}

async function callClaude(
  prompt: string,
  model: "haiku" | "sonnet" = "haiku",
  maxTokens = 1500
): Promise<string> {
  const apiKey = serverEnv.ANTHROPIC_API;

  if (!apiKey) {
    // Dev mode: return a mock response
    console.log("[Claude DEV MODE] Mock generation");
    return JSON.stringify({
      title: "Konten Demo",
      article: "Ini adalah konten demo yang digenerate dalam mode development. Konten lengkap akan muncul saat API key dikonfigurasi.",
      prompt: "demo product image, professional photography",
      script: "Selamat datang di bisnis kami. Kami menyediakan layanan terbaik untuk Anda.",
      captions: [
        { text: "Selamat datang", startSec: 0, endSec: 3 },
        { text: "di bisnis kami", startSec: 3, endSec: 6 },
      ],
    });
  }

  const modelId =
    model === "sonnet" ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

function parseJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Gagal parsing JSON dari AI response");
  return JSON.parse(match[0]) as T;
}

async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  businessId: string
): Promise<string> {
  const supabase = await createClient();
  const storagePath = `content/${businessId}/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from("content-media")
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("content-media")
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

// ── Pipeline: Image + Article ──

export async function generateImageArticle(
  params: GenerateImageArticleParams
): Promise<GenerateImageArticleResult | ActionError> {
  try {
    const { business } = await getBusinessInfo();

    // Step 1: Generate article text + image prompt via Claude
    const aiPrompt = `Kamu adalah copywriter + art director profesional untuk bisnis lokal Indonesia.

Buat konten ${params.type} (Image + Article) untuk bisnis:
- Nama: ${params.businessName || business.name}
- Kategori: ${params.businessVertical || business.vertical}
${params.businessDescription || business.description ? `- Deskripsi: ${params.businessDescription || business.description}` : ""}

${params.descriptionMode === "manual" && params.description ? `Instruksi user: ${params.description}` : "Buat konten menarik secara otomatis berdasarkan info bisnis."}
${params.article ? `Referensi artikel: ${params.article}` : ""}

Type konten: ${params.type}

Buat dalam format JSON (tanpa markdown):
{
  "title": "Judul konten (max 80 char, menarik)",
  "article": "Isi artikel/caption (max 800 karakter, engaging, include CTA)",
  "image_prompt": "Detailed English prompt for AI image generation. Professional, high-quality product/business photo style. Include: subject, setting, lighting, mood, composition. Max 200 words."
}`;

    const aiText = await callClaude(aiPrompt, "haiku", 1500);
    const parsed = parseJson<{
      title: string;
      article: string;
      image_prompt: string;
    }>(aiText);

    // Step 2: Generate image via fal.ai
    let imageUrls: string[];

    if (params.referenceImageUrl) {
      // Use reference image as base (Nano Banana 2 Edit)
      const result = await imageToImage({
        imageUrl: params.referenceImageUrl,
        prompt: parsed.image_prompt,
        numImages: params.type === "carousel" ? 4 : 1,
      });
      imageUrls = result.images.map((img) => img.url);
    } else {
      // Generate from scratch
      const numImages = params.type === "carousel" ? 4 : 1;
      const result = await generateImage({
        prompt: parsed.image_prompt,
        resolution: "2K",
        numImages,
      });
      imageUrls = result.images.map((img) => img.url);
    }

    return {
      success: true,
      title: parsed.title,
      article: parsed.article,
      imageUrls,
      prompt: parsed.image_prompt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal generate Image + Article";
    return { success: false, error: msg };
  }
}

// ── Pipeline: Image Only ──

export async function generateImageOnly(
  params: GenerateImageParams
): Promise<GenerateImageResult | ActionError> {
  try {
    const { business } = await getBusinessInfo();

    // For upscale: no AI prompt needed, just upscale reference image
    if (params.objective === "upscale") {
      if (!params.referenceImageUrl) {
        return { success: false, error: "Upscale membutuhkan referensi gambar" };
      }
      const result = await upscaleImage({
        imageUrl: params.referenceImageUrl,
        scale: 2,
        prompt: params.description || undefined,
      });
      return {
        success: true,
        imageUrls: result.images.map((img) => img.url),
        prompt: "upscale",
      };
    }

    // For edit/variasi: use image-to-image with reference
    if (
      (params.objective === "edit" || params.objective === "variasi") &&
      params.referenceImageUrl
    ) {
      // Generate prompt via Claude if auto mode
      let imagePrompt = params.description;
      if (params.descriptionMode === "auto" || !params.description) {
        const aiText = await callClaude(
          `Buat image prompt dalam bahasa Inggris untuk AI image generation.
Bisnis: ${params.businessName || business.name} (${params.businessVertical || business.vertical})
Objective: ${params.objective === "edit" ? "Edit/enhance the image" : "Create visual variations"}
${params.description ? `Instruksi: ${params.description}` : ""}

Jawab hanya prompt saja (max 150 kata), tanpa formatting:`,
          "haiku",
          300
        );
        imagePrompt = aiText.trim();
      }

      const result = await imageToImage({
        imageUrl: params.referenceImageUrl,
        prompt: imagePrompt,
        numImages: params.quantity,
      });

      return {
        success: true,
        imageUrls: result.images.map((img) => img.url),
        prompt: imagePrompt,
      };
    }

    // For recreate_new or no reference: generate from scratch
    let imagePrompt = params.description;
    if (params.descriptionMode === "auto" || !params.description) {
      const aiText = await callClaude(
        `Buat image prompt dalam bahasa Inggris untuk AI image generation.
Bisnis: ${params.businessName || business.name} (${params.businessVertical || business.vertical})
${params.description ? `Instruksi: ${params.description}` : "Buat gambar produk/bisnis yang profesional dan menarik."}

Jawab hanya prompt saja (max 150 kata), tanpa formatting:`,
        "haiku",
        300
      );
      imagePrompt = aiText.trim();
    }

    const result = await generateImage({
      prompt: imagePrompt,
      resolution: "2K",
      numImages: params.quantity,
    });

    return {
      success: true,
      imageUrls: result.images.map((img) => img.url),
      prompt: imagePrompt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal generate gambar";
    return { success: false, error: msg };
  }
}

// ── Pipeline: Short Video 9:16 ──

export async function generateShortVideo(
  params: GenerateVideoParams
): Promise<GenerateVideoResult | ActionError> {
  try {
    const { business } = await getBusinessInfo();

    // Step 1: Generate video script + image prompt + captions via Claude
    const durationSec = params.length;
    const wordsPerSec = 2.5; // Approx for Indonesian speech
    const maxWords = Math.floor(durationSec * wordsPerSec);

    const aiPrompt = `Kamu adalah video content creator profesional untuk bisnis lokal Indonesia.

Buat script video pendek (${durationSec} detik, format 9:16 vertikal) untuk bisnis:
- Nama: ${params.businessName || business.name}
- Kategori: ${params.businessVertical || business.vertical}
${params.businessDescription || business.description ? `- Deskripsi: ${params.businessDescription || business.description}` : ""}

Objective: ${params.objective}
${params.descriptionMode === "manual" && params.description ? `Instruksi: ${params.description}` : "Buat konten menarik secara otomatis."}
${params.audio ? `Audio: Ya (voiceover Bahasa Indonesia, max ${maxWords} kata)` : "Audio: Tidak (silent video)"}
${params.caption ? "Caption: Ya (burnt-in subtitle)" : "Caption: Tidak"}

Jawab dalam format JSON (tanpa markdown):
{
  "script": "Narasi voiceover lengkap dalam Bahasa Indonesia (${maxWords} kata max). Buat engaging dan natural.",
  "image_prompt": "Detailed English prompt for the KEY FRAME of this video. Professional, cinematic, 9:16 vertical format. Include subject, setting, lighting, mood. Max 100 words.",
  "captions": [
    {"text": "kalimat caption 1", "startSec": 0, "endSec": 3},
    {"text": "kalimat caption 2", "startSec": 3, "endSec": 6}
  ],
  "title": "Judul pendek video (max 60 char)"
}

Pastikan total durasi captions = ${durationSec} detik. Setiap caption max 2-4 detik.`;

    const aiText = await callClaude(aiPrompt, "sonnet", 2000);
    const parsed = parseJson<{
      script: string;
      image_prompt: string;
      captions: CaptionSegment[];
      title: string;
    }>(aiText);

    // Step 2: Generate video
    const videoMode = params.videoMode ?? "motion_graphics";
    const videoDuration = Math.min(durationSec, 15);

    // Step 2a: Generate audio via ElevenLabs (if enabled) — done early so
    // motion graphics can embed it directly
    let audioBuffer: Buffer | undefined;
    if (params.audio && parsed.script) {
      const ttsResult = await textToSpeech({
        text: parsed.script,
        outputFormat: "mp3_44100_128",
        stability: 0.5,
        similarityBoost: 0.75,
      });
      audioBuffer = ttsResult.audioBuffer;
    }

    const captionSegments = params.caption ? parsed.captions : undefined;
    let finalVideoUrl: string;

    if (videoMode === "motion_graphics") {
      // ── Motion Graphics: generate 4-6 images → ffmpeg slideshow ──
      // Much cheaper than Kling v3 — only image generation cost + CPU

      // 2b-i: Generate multi-angle image prompts via Claude
      const numImages = videoDuration <= 10 ? 4 : 6;
      const multiAnglePrompt = `You are an art director creating a motion-graphics slideshow for a short video (${videoDuration}s, 9:16 vertical).

Based on this key frame concept:
"${parsed.image_prompt}"

Business: ${params.businessName || "Local business"} (${params.businessVertical || "general"})

Generate ${numImages} image prompts, each from a DIFFERENT angle/perspective of the same subject:
- Angle 1: Wide establishing shot
- Angle 2: Close-up detail
- Angle 3: Side/profile view
- Angle 4: Top-down / overhead
${numImages >= 5 ? "- Angle 5: Customer perspective / in-use" : ""}
${numImages >= 6 ? "- Angle 6: Artistic / dramatic angle" : ""}

Each prompt should be a detailed English prompt (max 80 words) for AI image generation.
Professional, high-quality, consistent style and lighting across all angles.

Respond as JSON array only (no markdown):
["prompt 1", "prompt 2", "prompt 3", "prompt 4"${numImages >= 5 ? ', "prompt 5"' : ""}${numImages >= 6 ? ', "prompt 6"' : ""}]`;

      const multiAngleText = await callClaude(multiAnglePrompt, "haiku", 1500);
      let imagePrompts: string[];
      try {
        const match = multiAngleText.match(/\[[\s\S]*\]/);
        imagePrompts = match ? JSON.parse(match[0]) as string[] : [];
      } catch {
        // Fallback: use single prompt repeated with variations
        imagePrompts = Array.from({ length: numImages }, (_, i) =>
          `${parsed.image_prompt}, angle ${i + 1}, different perspective`
        );
      }

      // 2b-ii: Generate images via Nano Banana 2 (one per prompt)
      const imageUrls: string[] = [];
      if (params.referenceImageUrl) {
        // If reference image provided, use it as first image, generate rest
        imageUrls.push(params.referenceImageUrl);
        for (let i = 1; i < imagePrompts.length; i++) {
          const imgResult = await generateImage({
            prompt: imagePrompts[i],
            resolution: "2K",
            numImages: 1,
          });
          imageUrls.push(imgResult.images[0].url);
        }
      } else {
        for (const prompt of imagePrompts) {
          const imgResult = await generateImage({
            prompt,
            resolution: "2K",
            numImages: 1,
          });
          imageUrls.push(imgResult.images[0].url);
        }
      }

      // 2b-iii: Create slideshow via ffmpeg with Ken Burns + transitions
      const mgResult = await motionGraphicsVideo({
        imageUrls,
        totalDurationSec: videoDuration,
        audioBuffer,
        captions: captionSegments,
        width: 1080,
        height: 1920,
        crossfadeSec: 0.8,
      });

      // Upload to Supabase Storage
      const { business: biz } = await getBusinessInfo();
      finalVideoUrl = await uploadBufferToStorage(
        mgResult.outputBuffer,
        `mgfx_${Date.now()}.mp4`,
        "video/mp4",
        biz.id
      );
    } else {
      // ── Kling v3 Cinematic (kling_full / mixed) ──
      let videoResult;
      if (params.referenceImageUrl) {
        videoResult = await imageToVideo({
          imageUrl: params.referenceImageUrl,
          prompt: parsed.image_prompt,
          duration: videoDuration,
          aspectRatio: "9:16",
          generateAudio: false,
        });
      } else {
        videoResult = await textToVideo({
          prompt: parsed.image_prompt,
          duration: videoDuration,
          aspectRatio: "9:16",
          generateAudio: false,
        });
      }

      const rawVideoUrl = videoResult.video.url;

      // Composite video + audio + captions via ffmpeg if needed
      const needsComposite = audioBuffer || captionSegments;
      finalVideoUrl = rawVideoUrl;

      if (needsComposite) {
        try {
          const compositeResult = await compositeVideo({
            videoUrl: rawVideoUrl,
            audioBuffer,
            captions: captionSegments,
            outputFormat: "mp4",
            maxDurationSec: durationSec,
          });

          const { business: biz } = await getBusinessInfo();
          finalVideoUrl = await uploadBufferToStorage(
            compositeResult.outputBuffer,
            `video_${Date.now()}.mp4`,
            "video/mp4",
            biz.id
          );
        } catch (compositeErr) {
          console.warn(
            "[Video Compositor] Fallback to raw video:",
            compositeErr instanceof Error ? compositeErr.message : compositeErr
          );
        }
      }
    }

    return {
      success: true,
      videoUrl: finalVideoUrl,
      script: parsed.script,
      captions: parsed.captions,
      durationSec,
      prompt: parsed.image_prompt,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal generate video";
    return { success: false, error: msg };
  }
}

// ── Pipeline: Audio / Voiceover ──

export interface GenerateAudioParams {
  description: string;
  descriptionMode: "manual" | "auto";
  script: string;                   // User-provided or AI will generate
  objective: string;                // narasi, iklan, podcast_snippet, greeting, promo, edukasi
  lengthSec: number;                // 15, 30, or 60
  voiceId?: string;                 // ElevenLabs voice ID (empty = default Aria)
  businessName: string;
  businessVertical: string;
  businessDescription?: string;
}

export interface GenerateAudioResult {
  success: true;
  audioUrl: string;
  script: string;
  title: string;
  durationEstimate: number;
}

export async function generateAudioVoiceover(
  params: GenerateAudioParams
): Promise<GenerateAudioResult | ActionError> {
  try {
    const { business } = await getBusinessInfo();

    // Step 1: Generate or polish script via Claude
    let script = params.script;
    let title = "";

    if (!script || params.descriptionMode === "auto") {
      // Generate script from scratch
      const wordsPerSec = 2.5;
      const maxWords = Math.floor(params.lengthSec * wordsPerSec);

      const aiPrompt = `Kamu adalah copywriter audio profesional untuk bisnis lokal Indonesia.

Buat script audio (${params.lengthSec} detik) untuk bisnis:
- Nama: ${params.businessName || business.name}
- Kategori: ${params.businessVertical || business.vertical}
${params.businessDescription || business.description ? `- Deskripsi: ${params.businessDescription || business.description}` : ""}

Tipe: ${params.objective}
${params.description ? `Instruksi: ${params.description}` : "Buat audio yang menarik dan profesional."}

Batasan: max ${maxWords} kata. Bahasa Indonesia, natural, engaging.
Harus cocok untuk didengarkan (bukan dibaca).

Jawab dalam format JSON (tanpa markdown):
{
  "title": "Judul pendek audio (max 60 char)",
  "script": "Script lengkap narasi dalam Bahasa Indonesia. Harus natural, engaging, dan pas ${params.lengthSec} detik."
}`;

      const aiText = await callClaude(aiPrompt, "haiku", 1000);
      const parsed = parseJson<{ title: string; script: string }>(aiText);
      script = parsed.script;
      title = parsed.title;
    } else {
      // Script provided by user — just generate a title
      const titlePrompt = `Buat judul pendek (max 60 char) untuk audio narasi bisnis ini:
"${script.slice(0, 200)}"
Jawab hanya judul saja, tanpa tanda kutip.`;
      title = (await callClaude(titlePrompt, "haiku", 100)).trim().replace(/"/g, "");
    }

    // Step 2: Generate audio via ElevenLabs
    const ttsResult = await textToSpeech({
      text: script,
      voiceId: params.voiceId || undefined,
      outputFormat: "mp3_44100_128",
      stability: 0.5,
      similarityBoost: 0.75,
    });

    // Step 3: Upload to Supabase Storage
    const { business: biz } = await getBusinessInfo();
    const audioUrl = await uploadBufferToStorage(
      ttsResult.audioBuffer,
      `audio_${Date.now()}.mp3`,
      "audio/mpeg",
      biz.id
    );

    return {
      success: true,
      audioUrl,
      script,
      title,
      durationEstimate: ttsResult.durationEstimate,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal generate audio";
    return { success: false, error: msg };
  }
}

// ── Pipeline: Save Generated Media as Content Draft ──

export async function saveGeneratedContent(params: {
  title: string;
  body: string;
  contentType: string;
  mediaUrls: string[];
  thumbnailUrl?: string;
  format: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: true; id: string } | ActionError> {
  try {
    const supabase = await createClient();
    const { business } = await getBusinessInfo();

    const { data, error } = await supabase
      .from("contents")
      .insert({
        business_id: business.id,
        title: params.title,
        body: params.body,
        content_type: params.contentType,
        channel: "social",
        status: "draft",
        media_urls: params.mediaUrls,
        thumbnail_url: params.thumbnailUrl ?? params.mediaUrls[0] ?? null,
        tags: [],
        ai_generated: true,
        ai_prompt: params.prompt,
        ai_model: "pipeline",
        metadata: {
          format: params.format,
          ai_generated: true,
          generation_pipeline: true,
          ...params.metadata,
        },
      })
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, id: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan konten";
    return { success: false, error: msg };
  }
}
