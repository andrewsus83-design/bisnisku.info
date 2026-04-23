/**
 * fal.ai API Client for Bisnisku
 * Handles image generation (Nano Banana 2), image-to-image, upscale,
 * and image-to-video / text-to-video (Kling v3).
 *
 * Models:
 * - Image: fal-ai/nano-banana-2 (Google Gemini 3.1 Flash Image — reasoning-guided)
 * - Image Edit: fal-ai/nano-banana-2/edit (natural language editing)
 * - Video: fal-ai/kling-video/v3/standard (Kling 3.0 — cinematic, native audio, multi-shot)
 * - Motion Control: fal-ai/kling-video/v3/standard/motion-control (effects/motion graphics)
 * - Upscale: fal-ai/creative-upscaler
 *
 * Auth: Key-based header → Authorization: Key {FAL_KEY}
 * Pattern: Submit to queue → poll status → get result
 *
 * NOTE: Server-only module. Not a server action.
 */

import { serverEnv } from "@/config/env";

// ── Types ──

export interface FalImageResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
}

export interface FalVideoResult {
  video: {
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
  };
}

export interface FalQueueResponse {
  request_id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  response_url?: string;
}

export interface FalStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  queue_position?: number;
  logs?: Array<{ message: string; timestamp: string }>;
}

// ── Helpers ──

function getAuthHeader(): Record<string, string> {
  const key = serverEnv.FAL_KEY;
  if (!key) throw new Error("BISNISKU_FAL_AI_API_KEY not configured");
  return {
    Authorization: `Key ${key}`,
    "Content-Type": "application/json",
  };
}

function isDevMode(): boolean {
  return !serverEnv.FAL_KEY;
}

// ── Queue-based execution ──

/** Submit a request to fal.ai queue */
async function submitToQueue(
  modelId: string,
  input: Record<string, unknown>
): Promise<FalQueueResponse> {
  // Dev mode: return mock
  if (isDevMode()) {
    console.log(`[fal.ai DEV MODE] Mock submit to ${modelId}`);
    return {
      request_id: `dev_req_${Date.now()}`,
      status: "COMPLETED",
    };
  }

  const response = await fetch(`https://queue.fal.run/${modelId}`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`fal.ai queue error ${response.status}: ${errBody}`);
  }

  return response.json() as Promise<FalQueueResponse>;
}

/** Poll queue status */
async function getQueueStatus(
  modelId: string,
  requestId: string
): Promise<FalStatusResponse> {
  const response = await fetch(
    `https://queue.fal.run/${modelId}/requests/${requestId}/status`,
    { headers: getAuthHeader() }
  );

  if (!response.ok) {
    throw new Error(`fal.ai status error: ${response.status}`);
  }

  return response.json() as Promise<FalStatusResponse>;
}

/** Get completed result */
async function getQueueResult<T>(
  modelId: string,
  requestId: string
): Promise<T> {
  const response = await fetch(
    `https://queue.fal.run/${modelId}/requests/${requestId}`,
    { headers: getAuthHeader() }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`fal.ai result error ${response.status}: ${errBody}`);
  }

  return response.json() as Promise<T>;
}

/** Submit and wait for result (with polling) */
async function submitAndWait<T>(
  modelId: string,
  input: Record<string, unknown>,
  maxWaitMs = 120_000,
  pollIntervalMs = 2_000
): Promise<T> {
  const queue = await submitToQueue(modelId, input);

  if (queue.status === "COMPLETED" && isDevMode()) {
    // Return mock data in dev mode (handled per-function)
    throw new Error("DEV_MODE_COMPLETE");
  }

  const startTime = Date.now();
  const requestId = queue.request_id;

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getQueueStatus(modelId, requestId);

    if (status.status === "COMPLETED") {
      return getQueueResult<T>(modelId, requestId);
    }

    if (status.status === "FAILED") {
      throw new Error("fal.ai generation failed");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("fal.ai generation timed out");
}

// ── Public API: Image Generation (Nano Banana 2) ──

/** Text-to-Image using Nano Banana 2 (Google Gemini 3.1 Flash Image) */
export async function generateImage(params: {
  prompt: string;
  resolution?: "1K" | "2K" | "4K";
  numImages?: number;
  seed?: number;
  enableWebSearch?: boolean;
}): Promise<FalImageResult> {
  if (isDevMode()) {
    console.log("[fal.ai DEV MODE] Mock image generation (Nano Banana 2)");
    return {
      images: Array.from({ length: params.numImages ?? 1 }, (_, i) => ({
        url: `https://placehold.co/1080x1080/EAB308/1E293B?text=NanoBanana2+${i + 1}`,
        width: 1080,
        height: 1080,
        content_type: "image/png",
      })),
      seed: params.seed ?? Math.floor(Math.random() * 999999),
      prompt: params.prompt,
    };
  }

  // Nano Banana 2 generates 1 image per call, so we loop for multiple
  const numImages = params.numImages ?? 1;
  const images: FalImageResult["images"] = [];

  for (let i = 0; i < numImages; i++) {
    const result = await submitAndWait<{
      images: Array<{ url: string; width: number; height: number; content_type: string }>;
    }>("fal-ai/nano-banana-2", {
      prompt: params.prompt,
      resolution: params.resolution ?? "2K",
      limit_generations: true,
      enable_web_search: params.enableWebSearch ?? false,
    });

    images.push(...result.images);
  }

  return {
    images,
    seed: params.seed ?? 0,
    prompt: params.prompt,
  };
}

/** Image Editing using Nano Banana 2 Edit (natural language editing) */
export async function imageToImage(params: {
  imageUrl: string;
  prompt: string;
  strength?: number; // Not used for Nano Banana 2 — prompt-based editing
  width?: number;
  height?: number;
  numImages?: number;
}): Promise<FalImageResult> {
  if (isDevMode()) {
    console.log("[fal.ai DEV MODE] Mock image-to-image (Nano Banana 2 Edit)");
    return {
      images: Array.from({ length: params.numImages ?? 1 }, (_, i) => ({
        url: `https://placehold.co/1080x1080/8B5CF6/FFFFFF?text=Edited+${i + 1}`,
        width: params.width ?? 1080,
        height: params.height ?? 1080,
        content_type: "image/png",
      })),
      seed: Math.floor(Math.random() * 999999),
      prompt: params.prompt,
    };
  }

  const numImages = params.numImages ?? 1;
  const images: FalImageResult["images"] = [];

  for (let i = 0; i < numImages; i++) {
    const result = await submitAndWait<{
      images: Array<{ url: string; width: number; height: number; content_type: string }>;
    }>("fal-ai/nano-banana-2/edit", {
      image_url: params.imageUrl,
      prompt: params.prompt,
      resolution: "2K",
    });

    images.push(...result.images);
  }

  return {
    images,
    seed: 0,
    prompt: params.prompt,
  };
}

/** AI Upscale */
export async function upscaleImage(params: {
  imageUrl: string;
  scale?: number; // 2 or 4
  prompt?: string;
}): Promise<FalImageResult> {
  if (isDevMode()) {
    console.log("[fal.ai DEV MODE] Mock upscale");
    return {
      images: [
        {
          url: `https://placehold.co/2160x2160/10B981/FFFFFF?text=Upscaled`,
          width: 2160,
          height: 2160,
          content_type: "image/png",
        },
      ],
      seed: 0,
      prompt: params.prompt ?? "",
    };
  }

  return submitAndWait<FalImageResult>("fal-ai/creative-upscaler", {
    image_url: params.imageUrl,
    scale: params.scale ?? 2,
    prompt: params.prompt,
  });
}

// ── Public API: Video Generation (Kling v3) ──

/** Image-to-Video using Kling v3 Standard */
export async function imageToVideo(params: {
  imageUrl: string;
  prompt: string;
  duration?: number; // 3-15 seconds, default 5
  aspectRatio?: "9:16" | "16:9" | "1:1";
  generateAudio?: boolean;
}): Promise<FalVideoResult> {
  if (isDevMode()) {
    console.log("[fal.ai DEV MODE] Mock video generation (Kling v3)");
    return {
      video: {
        url: "https://placehold.co/1080x1920.mp4",
        content_type: "video/mp4",
        file_name: `dev_video_${Date.now()}.mp4`,
        file_size: 0,
      },
    };
  }

  return submitAndWait<FalVideoResult>(
    "fal-ai/kling-video/v3/standard/image-to-video",
    {
      image_url: params.imageUrl,
      prompt: params.prompt,
      duration: params.duration ?? 5,
      aspect_ratio: params.aspectRatio ?? "9:16",
      generate_audio: params.generateAudio ?? false,
    },
    180_000, // 3 min timeout for video
    5_000    // poll every 5s
  );
}

/** Text-to-Video using Kling v3 Standard (no reference image) */
export async function textToVideo(params: {
  prompt: string;
  duration?: number; // 3-15 seconds, default 5
  aspectRatio?: "9:16" | "16:9" | "1:1";
  generateAudio?: boolean;
}): Promise<FalVideoResult> {
  if (isDevMode()) {
    console.log("[fal.ai DEV MODE] Mock text-to-video (Kling v3)");
    return {
      video: {
        url: "https://placehold.co/1080x1920.mp4",
        content_type: "video/mp4",
        file_name: `dev_video_${Date.now()}.mp4`,
        file_size: 0,
      },
    };
  }

  return submitAndWait<FalVideoResult>(
    "fal-ai/kling-video/v3/standard/text-to-video",
    {
      prompt: params.prompt,
      duration: params.duration ?? 5,
      aspect_ratio: params.aspectRatio ?? "9:16",
      generate_audio: params.generateAudio ?? false,
    },
    180_000,
    5_000
  );
}

/** Motion Control Video using Kling v3 (motion graphics / effects) */
export async function motionControlVideo(params: {
  imageUrl: string;
  prompt: string;
  referenceVideoUrl?: string;
  duration?: number;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  generateAudio?: boolean;
  cfgScale?: number; // 0.0-1.0, default 0.5
}): Promise<FalVideoResult> {
  if (isDevMode()) {
    console.log("[fal.ai DEV MODE] Mock motion control video (Kling v3)");
    return {
      video: {
        url: "https://placehold.co/1080x1920.mp4",
        content_type: "video/mp4",
        file_name: `dev_motion_${Date.now()}.mp4`,
        file_size: 0,
      },
    };
  }

  const input: Record<string, unknown> = {
    image_url: params.imageUrl,
    prompt: params.prompt,
    duration: params.duration ?? 5,
    aspect_ratio: params.aspectRatio ?? "9:16",
    generate_audio: params.generateAudio ?? false,
    cfg_scale: params.cfgScale ?? 0.5,
  };

  if (params.referenceVideoUrl) {
    input.reference_video_url = params.referenceVideoUrl;
  }

  return submitAndWait<FalVideoResult>(
    "fal-ai/kling-video/v3/standard/motion-control",
    input,
    180_000,
    5_000
  );
}
