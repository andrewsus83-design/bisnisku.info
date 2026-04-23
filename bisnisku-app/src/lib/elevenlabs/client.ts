/**
 * ElevenLabs TTS API Client for Bisnisku
 * Generates voiceover audio from text using multilingual_v2 model (supports Bahasa Indonesia).
 *
 * Auth: xi-api-key header
 * Output: mp3 audio buffer
 *
 * NOTE: Server-only module. Not a server action.
 */

import { serverEnv } from "@/config/env";

// ── Types ──

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string;
}

export interface TTSParams {
  text: string;
  voiceId?: string;        // Default: a multilingual voice
  modelId?: string;        // Default: eleven_multilingual_v2
  stability?: number;      // 0.0 - 1.0, default 0.5
  similarityBoost?: number; // 0.0 - 1.0, default 0.75
  style?: number;          // 0.0 - 1.0, default 0
  outputFormat?: "mp3_44100_128" | "mp3_22050_32" | "pcm_16000" | "pcm_44100";
}

export interface TTSResult {
  audioBuffer: Buffer;
  contentType: string;
  durationEstimate: number; // rough estimate in seconds
}

// ── Helpers ──

function getHeaders(): Record<string, string> {
  const key = serverEnv.ELEVENLABS_API_KEY;
  if (!key) throw new Error("BISNISKU_ELEVENLABS_API_KEY not configured");
  return {
    "xi-api-key": key,
    "Content-Type": "application/json",
  };
}

function isDevMode(): boolean {
  return !serverEnv.ELEVENLABS_API_KEY;
}

// Default voice ID — "Aria" multilingual (good for Indonesian)
const DEFAULT_VOICE_ID = "9BWtsMINqrJLrRacOk9x"; // Aria

// ── Public API ──

/** Generate speech audio from text */
export async function textToSpeech(params: TTSParams): Promise<TTSResult> {
  const voiceId = params.voiceId ?? DEFAULT_VOICE_ID;
  const outputFormat = params.outputFormat ?? "mp3_44100_128";

  // Rough duration estimate: ~150 words per minute for Indonesian
  const wordCount = params.text.split(/\s+/).length;
  const durationEstimate = Math.ceil((wordCount / 150) * 60);

  if (isDevMode()) {
    console.log("[ElevenLabs DEV MODE] Mock TTS generation");
    console.log(`  Text: ${params.text.slice(0, 100)}...`);
    console.log(`  Est. duration: ${durationEstimate}s`);

    // Return a minimal silent mp3 buffer (dev only)
    // In production, this returns actual audio
    return {
      audioBuffer: Buffer.from("mock_audio_data"),
      contentType: "audio/mpeg",
      durationEstimate,
    };
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${outputFormat}`;

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      text: params.text,
      model_id: params.modelId ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: params.stability ?? 0.5,
        similarity_boost: params.similarityBoost ?? 0.75,
        style: params.style ?? 0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`ElevenLabs TTS error ${response.status}: ${errBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  return {
    audioBuffer,
    contentType: outputFormat.startsWith("mp3") ? "audio/mpeg" : "audio/wav",
    durationEstimate,
  };
}

/** List available voices */
export async function listVoices(): Promise<ElevenLabsVoice[]> {
  if (isDevMode()) {
    return [
      {
        voice_id: DEFAULT_VOICE_ID,
        name: "Aria (Multilingual)",
        category: "premade",
        labels: { accent: "neutral", language: "multilingual" },
        preview_url: "",
      },
    ];
  }

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs voices error: ${response.status}`);
  }

  const data = await response.json();
  return (data.voices ?? []) as ElevenLabsVoice[];
}

/** Get remaining character quota */
export async function getUsage(): Promise<{
  characterCount: number;
  characterLimit: number;
  remainingCharacters: number;
}> {
  if (isDevMode()) {
    return {
      characterCount: 0,
      characterLimit: 10000,
      remainingCharacters: 10000,
    };
  }

  const response = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs usage error: ${response.status}`);
  }

  const data = await response.json();
  return {
    characterCount: data.character_count ?? 0,
    characterLimit: data.character_limit ?? 0,
    remainingCharacters: (data.character_limit ?? 0) - (data.character_count ?? 0),
  };
}
