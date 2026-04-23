/**
 * Content Generation Limits per Subscription Tier
 *
 * Video (per month):
 * - Starter (999rb): 30 motion graphics videos, 10s max
 * - Growth (2.9jt): 30 AI cinematic videos, 10s max
 * - Business (8.9jt): 90 mix (motion + AI cinematic), 15s max
 * - Enterprise (18.9jt): 150 mix (motion + AI cinematic), 15s max
 *
 * Article (using Sonnet, per month):
 * - Starter: 10 | Growth: 20 | Business: 50 | Enterprise: 100
 *
 * Image (Nano Banana 2, 2K resolution, per month):
 * - Starter: 20 | Growth: 50 | Business: 100 | Enterprise: 200
 *
 * Audio (ElevenLabs multilingual_v2, per month):
 * - Starter: 20 (max 30s) | Growth: 50 (max 60s) | Business: 100 (max 60s) | Enterprise: 200 (max 60s)
 */

export type SubscriptionTier = "free" | "starter" | "growth" | "business" | "enterprise";

export interface VideoLimits {
  /** Total videos per month (all modes combined) */
  videosPerMonth: number;
  /** Max video duration in seconds */
  maxDurationSec: number;
  /** Available video modes */
  availableModes: ("motion_graphics" | "kling_full")[];
}

export interface ContentLimits {
  video: VideoLimits;
  /** Max AI-generated images per month */
  imagesPerMonth: number;
  /** Max AI-generated articles per month */
  articlesPerMonth: number;
  /** Max AI-generated audio clips per month */
  audiosPerMonth: number;
  /** Max audio duration per clip in seconds */
  maxAudioDurationSec: number;
  /** AI model for articles */
  articleModel: "haiku" | "sonnet";
}

export const CONTENT_LIMITS: Record<SubscriptionTier, ContentLimits> = {
  free: {
    video: {
      videosPerMonth: 0,
      maxDurationSec: 0,
      availableModes: [],
    },
    imagesPerMonth: 0,
    articlesPerMonth: 0,
    audiosPerMonth: 0,
    maxAudioDurationSec: 0,
    articleModel: "haiku",
  },
  starter: {
    video: {
      videosPerMonth: 30,
      maxDurationSec: 10,
      availableModes: ["motion_graphics"],
    },
    imagesPerMonth: 20,
    articlesPerMonth: 10,
    audiosPerMonth: 20,
    maxAudioDurationSec: 30,
    articleModel: "sonnet",
  },
  growth: {
    video: {
      videosPerMonth: 30,
      maxDurationSec: 10,
      availableModes: ["kling_full"],
    },
    imagesPerMonth: 50,
    articlesPerMonth: 20,
    audiosPerMonth: 50,
    maxAudioDurationSec: 60,
    articleModel: "sonnet",
  },
  business: {
    video: {
      videosPerMonth: 90,
      maxDurationSec: 15,
      availableModes: ["motion_graphics", "kling_full"],
    },
    imagesPerMonth: 100,
    articlesPerMonth: 50,
    audiosPerMonth: 100,
    maxAudioDurationSec: 60,
    articleModel: "sonnet",
  },
  enterprise: {
    video: {
      videosPerMonth: 150,
      maxDurationSec: 15,
      availableModes: ["motion_graphics", "kling_full"],
    },
    imagesPerMonth: 200,
    articlesPerMonth: 100,
    audiosPerMonth: 200,
    maxAudioDurationSec: 60,
    articleModel: "sonnet",
  },
};

/** Get video mode label in Bahasa Indonesia */
export function getVideoModeLabel(mode: "motion_graphics" | "kling_full"): string {
  return mode === "motion_graphics" ? "Motion Graphics" : "Cinematic (Kling v3)";
}

/** Get tier from price (IDR per month) */
export function getTierFromPrice(priceIdr: number): SubscriptionTier {
  if (priceIdr >= 18_900_000) return "enterprise";
  if (priceIdr >= 8_900_000) return "business";
  if (priceIdr >= 2_900_000) return "growth";
  if (priceIdr >= 999_000) return "starter";
  return "free";
}
