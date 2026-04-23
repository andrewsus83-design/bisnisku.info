/**
 * Video Compositor using ffmpeg
 * Composites fal.ai video + ElevenLabs audio + caption overlay.
 *
 * Pipeline:
 * 1. Download video from fal.ai URL
 * 2. Generate audio from ElevenLabs
 * 3. ffmpeg: merge video + audio + burnt-in captions
 * 4. Upload result to Supabase Storage
 *
 * NOTE: Server-only module. Requires ffmpeg on the server.
 *       On Vercel, use Serverless Functions with ffmpeg layer or
 *       process in an Edge Function / external worker.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execFileAsync = promisify(execFile);

// ── Types ──

export interface CompositeVideoParams {
  videoUrl: string;            // Source video URL (from fal.ai)
  audioBuffer?: Buffer;        // Audio buffer (from ElevenLabs)
  captions?: CaptionSegment[]; // Caption segments for burn-in
  outputFormat?: "mp4" | "webm";
  maxDurationSec?: number;     // Trim to this length
}

export interface CaptionSegment {
  text: string;
  startSec: number;
  endSec: number;
}

export interface CompositeResult {
  outputBuffer: Buffer;
  outputPath: string;
  durationSec: number;
  fileSizeBytes: number;
}

// ── Helpers ──

async function downloadToFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);
}

function generateAssSubtitles(captions: CaptionSegment[]): string {
  // ASS subtitle format for ffmpeg drawtext filter
  let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,56,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const seg of captions) {
    const start = formatAssTime(seg.startSec);
    const end = formatAssTime(seg.endSec);
    // Escape special ASS characters
    const text = seg.text.replace(/\\/g, "\\\\").replace(/\n/g, "\\N");
    ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
  }

  return ass;
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

// ── Main Compositor ──

/**
 * Composite video + audio + captions using ffmpeg.
 *
 * Returns the output buffer and metadata.
 * Caller is responsible for uploading to storage.
 */
export async function compositeVideo(
  params: CompositeVideoParams
): Promise<CompositeResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bisnisku-video-"));
  const videoPath = path.join(tmpDir, "input.mp4");
  const audioPath = path.join(tmpDir, "audio.mp3");
  const subsPath = path.join(tmpDir, "captions.ass");
  const outputPath = path.join(tmpDir, `output.${params.outputFormat ?? "mp4"}`);

  try {
    // 1. Download video
    await downloadToFile(params.videoUrl, videoPath);

    // 2. Build ffmpeg command
    const ffmpegArgs: string[] = [];

    // Input: video
    ffmpegArgs.push("-i", videoPath);

    // Input: audio (if provided)
    if (params.audioBuffer && params.audioBuffer.length > 20) {
      await fs.writeFile(audioPath, params.audioBuffer);
      ffmpegArgs.push("-i", audioPath);
    }

    // Filter complex
    const filters: string[] = [];

    // Captions: burn in using ASS subtitles
    if (params.captions && params.captions.length > 0) {
      const assContent = generateAssSubtitles(params.captions);
      await fs.writeFile(subsPath, assContent);
      filters.push(`ass='${subsPath.replace(/'/g, "'\\''")}'`);
    }

    if (filters.length > 0) {
      ffmpegArgs.push("-vf", filters.join(","));
    }

    // Audio mapping
    if (params.audioBuffer && params.audioBuffer.length > 20) {
      // Mix original video audio (if any) with voiceover
      // Use audio from ElevenLabs as primary, mute original
      ffmpegArgs.push("-map", "0:v:0", "-map", "1:a:0");
    }

    // Output settings
    ffmpegArgs.push(
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-y" // overwrite
    );

    // Duration limit
    if (params.maxDurationSec) {
      ffmpegArgs.push("-t", String(params.maxDurationSec));
    }

    ffmpegArgs.push(outputPath);

    // 3. Execute ffmpeg
    await execFileAsync("ffmpeg", ffmpegArgs, {
      timeout: 120_000, // 2 min timeout
    });

    // 4. Read output
    const outputBuffer = await fs.readFile(outputPath);
    const stats = await fs.stat(outputPath);

    // Get duration using ffprobe
    let durationSec = 0;
    try {
      const { stdout } = await execFileAsync("ffprobe", [
        "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        outputPath,
      ]);
      durationSec = parseFloat(stdout.trim()) || 0;
    } catch {
      durationSec = params.maxDurationSec ?? 0;
    }

    return {
      outputBuffer,
      outputPath,
      durationSec,
      fileSizeBytes: stats.size,
    };
  } finally {
    // Cleanup tmp files (best effort)
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ── Motion Graphics Effects ──

/**
 * Effect types for Ken Burns / motion graphics slideshow.
 * Each effect is a ffmpeg filter expression applied per image.
 */
type MotionEffect = "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "pan_up" | "pan_down";

const MOTION_EFFECTS: MotionEffect[] = [
  "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down",
];

/**
 * Build zoompan filter for a single image with a given effect.
 *
 * zoompan params:
 * - z: zoom level expression (1.0 = no zoom)
 * - x, y: pan position expressions
 * - d: duration in frames (25fps)
 * - s: output size
 * - fps: frames per second
 */
function buildZoompanFilter(
  effect: MotionEffect,
  durationFrames: number,
  width: number,
  height: number,
): string {
  const s = `${width}x${height}`;
  const fps = 25;

  switch (effect) {
    case "zoom_in":
      // Slow zoom in from 1.0 to 1.3
      return `zoompan=z='min(1.0+0.3*on/${durationFrames},1.3)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${durationFrames}:s=${s}:fps=${fps}`;
    case "zoom_out":
      // Slow zoom out from 1.3 to 1.0
      return `zoompan=z='max(1.3-0.3*on/${durationFrames},1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${durationFrames}:s=${s}:fps=${fps}`;
    case "pan_left":
      // Pan from right to left at zoom 1.2
      return `zoompan=z=1.2:x='max(0,(iw-iw/zoom)*(1-on/${durationFrames}))':y='(ih-ih/zoom)/2':d=${durationFrames}:s=${s}:fps=${fps}`;
    case "pan_right":
      // Pan from left to right at zoom 1.2
      return `zoompan=z=1.2:x='(iw-iw/zoom)*on/${durationFrames}':y='(ih-ih/zoom)/2':d=${durationFrames}:s=${s}:fps=${fps}`;
    case "pan_up":
      // Pan from bottom to top at zoom 1.2
      return `zoompan=z=1.2:x='(iw-iw/zoom)/2':y='max(0,(ih-ih/zoom)*(1-on/${durationFrames}))':d=${durationFrames}:s=${s}:fps=${fps}`;
    case "pan_down":
      // Pan from top to bottom at zoom 1.2
      return `zoompan=z=1.2:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*on/${durationFrames}':d=${durationFrames}:s=${s}:fps=${fps}`;
  }
}

export interface MotionGraphicsParams {
  /** Image URLs to download (4-6 images from different angles) */
  imageUrls: string[];
  /** Total target duration in seconds */
  totalDurationSec: number;
  /** Audio buffer (voiceover from ElevenLabs) */
  audioBuffer?: Buffer;
  /** Caption segments for burn-in */
  captions?: CaptionSegment[];
  /** Output resolution width (default 1080) */
  width?: number;
  /** Output resolution height (default 1920 for 9:16) */
  height?: number;
  /** Crossfade duration between slides in seconds (default 0.8) */
  crossfadeSec?: number;
}

/**
 * Create a motion graphics video from multiple images.
 *
 * Pipeline:
 * 1. Download all images
 * 2. Apply Ken Burns effects (zoompan) per image with varied effects
 * 3. Crossfade transitions (xfade) between slides
 * 4. Add overlay effects (vignette, color grading)
 * 5. Merge with audio if provided
 * 6. Burn in captions if provided
 *
 * Returns the output buffer and metadata.
 */
export async function motionGraphicsVideo(
  params: MotionGraphicsParams
): Promise<CompositeResult> {
  const {
    imageUrls,
    totalDurationSec,
    audioBuffer,
    captions,
    width = 1080,
    height = 1920,
    crossfadeSec = 0.8,
  } = params;

  if (imageUrls.length < 2) {
    throw new Error("Motion graphics requires at least 2 images");
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bisnisku-mgfx-"));
  const audioPath = path.join(tmpDir, "audio.mp3");
  const subsPath = path.join(tmpDir, "captions.ass");
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    const imageCount = imageUrls.length;
    // Duration per slide (accounting for crossfade overlap)
    const totalCrossfadeTime = (imageCount - 1) * crossfadeSec;
    const perSlideSec = (totalDurationSec + totalCrossfadeTime) / imageCount;
    const perSlideFrames = Math.round(perSlideSec * 25); // 25fps
    const fps = 25;

    // 1. Download all images
    const imagePaths: string[] = [];
    for (let i = 0; i < imageCount; i++) {
      const imgPath = path.join(tmpDir, `img_${i}.jpg`);
      await downloadToFile(imageUrls[i], imgPath);
      imagePaths.push(imgPath);
    }

    // 2. Write audio if provided
    if (audioBuffer && audioBuffer.length > 20) {
      await fs.writeFile(audioPath, audioBuffer);
    }

    // 3. Build ffmpeg filter_complex
    //
    // Strategy:
    // - Each image → scale to fill → zoompan effect → setpts/format
    // - Chain xfade transitions between consecutive slides
    // - Apply final overlay effects (vignette + slight color boost)
    // - Burn in ASS captions if provided

    const ffmpegArgs: string[] = [];

    // Inputs: all images
    for (const imgPath of imagePaths) {
      ffmpegArgs.push("-loop", "1", "-t", String(perSlideSec), "-i", imgPath);
    }

    // Input: audio (if provided)
    const audioInputIdx = audioBuffer && audioBuffer.length > 20 ? imageCount : -1;
    if (audioInputIdx >= 0) {
      ffmpegArgs.push("-i", audioPath);
    }

    // Build filter_complex
    const filterParts: string[] = [];

    // Step A: Apply zoompan + scale to each image
    for (let i = 0; i < imageCount; i++) {
      const effect = MOTION_EFFECTS[i % MOTION_EFFECTS.length];
      const zpFilter = buildZoompanFilter(effect, perSlideFrames, width, height);
      filterParts.push(
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},${zpFilter},setsar=1,format=yuv420p[slide${i}]`
      );
    }

    // Step B: Chain xfade transitions between slides
    if (imageCount === 2) {
      // Simple: 2 slides → 1 xfade
      const offset = perSlideSec - crossfadeSec;
      filterParts.push(
        `[slide0][slide1]xfade=transition=fade:duration=${crossfadeSec}:offset=${offset.toFixed(2)},setpts=PTS-STARTPTS[merged]`
      );
    } else {
      // Multiple slides: chain xfade sequentially
      let prevLabel = "slide0";
      for (let i = 1; i < imageCount; i++) {
        const offset = perSlideSec - crossfadeSec;
        const outLabel = i === imageCount - 1 ? "merged" : `xf${i}`;
        filterParts.push(
          `[${prevLabel}][slide${i}]xfade=transition=${getTransition(i)}:duration=${crossfadeSec}:offset=${offset.toFixed(2)},setpts=PTS-STARTPTS[${outLabel}]`
        );
        prevLabel = outLabel;
      }
    }

    // Step C: Apply overlay effects (subtle vignette + slight saturation boost)
    let finalLabel = "merged";

    // Vignette for cinematic look
    filterParts.push(
      `[${finalLabel}]vignette=PI/5,eq=saturation=1.1:contrast=1.05[graded]`
    );
    finalLabel = "graded";

    // Step D: Burn in captions if provided
    if (captions && captions.length > 0) {
      const assContent = generateAssSubtitles(captions);
      await fs.writeFile(subsPath, assContent);
      filterParts.push(
        `[${finalLabel}]ass='${subsPath.replace(/'/g, "'\\''")}'[captioned]`
      );
      finalLabel = "captioned";
    }

    ffmpegArgs.push("-filter_complex", filterParts.join(";\n"));

    // Map video
    ffmpegArgs.push("-map", `[${finalLabel}]`);

    // Map audio
    if (audioInputIdx >= 0) {
      ffmpegArgs.push("-map", `${audioInputIdx}:a:0`);
    }

    // Output settings
    ffmpegArgs.push(
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "22",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-t", String(totalDurationSec),
      "-y",
      outputPath
    );

    // 4. Execute ffmpeg
    await execFileAsync("ffmpeg", ffmpegArgs, {
      timeout: 180_000, // 3 min timeout for multi-image processing
    });

    // 5. Read output
    const outputBuffer = await fs.readFile(outputPath);
    const stats = await fs.stat(outputPath);

    // Get duration using ffprobe
    let durationSec = 0;
    try {
      const { stdout } = await execFileAsync("ffprobe", [
        "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        outputPath,
      ]);
      durationSec = parseFloat(stdout.trim()) || 0;
    } catch {
      durationSec = totalDurationSec;
    }

    return {
      outputBuffer,
      outputPath,
      durationSec,
      fileSizeBytes: stats.size,
    };
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}

/** Cycle through different xfade transitions for variety */
function getTransition(index: number): string {
  const transitions = [
    "fade",
    "slideright",
    "slideleft",
    "slideup",
    "dissolve",
    "smoothleft",
  ];
  return transitions[index % transitions.length];
}

/**
 * Simple trim: cut video to specified duration
 */
export async function trimVideo(
  videoUrl: string,
  durationSec: number
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bisnisku-trim-"));
  const inputPath = path.join(tmpDir, "input.mp4");
  const outputPath = path.join(tmpDir, "output.mp4");

  try {
    await downloadToFile(videoUrl, inputPath);

    await execFileAsync("ffmpeg", [
      "-i", inputPath,
      "-t", String(durationSec),
      "-c", "copy",
      "-y",
      outputPath,
    ], { timeout: 60_000 });

    return fs.readFile(outputPath);
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}
