import { create } from "zustand";
import type {
  ContentType,
  ContentStatus,
  CampaignChannel,
  CalendarEvent,
} from "@/lib/validations/content";

// ── Content creation format types ──
export type CreateFormat =
  | "image_article"   // Image + Article (IG feed, LinkedIn)
  | "short_video"     // Short Video 9:16 (Reels, Shorts, TikTok)
  | "image"           // Image only (menu, catalog)
  | "article"         // Article / Blog
  | "audio";          // Audio / Voiceover (narasi, iklan audio, podcast snippet)

export const createFormatLabels: Record<CreateFormat, string> = {
  image_article: "Image + Article",
  short_video: "Short Video 9:16",
  image: "Image",
  article: "Article",
  audio: "Audio / Voiceover",
};

export const createFormatDescriptions: Record<CreateFormat, string> = {
  image_article: "Cocok untuk Instagram Feed, LinkedIn",
  short_video: "Cocok untuk Reels, Shorts, TikTok",
  image: "Cocok untuk menu, catalog",
  article: "Cocok untuk blog",
  audio: "Cocok untuk narasi, iklan audio, podcast snippet",
};

// ── Image + Article types ──
export const imageArticleTypes = [
  "carousel",
  "single_post",
  "quiz",
  "edukasi",
  "tips_tricks",
  "testimoni",
  "quotes",
  "random",
] as const;
export type ImageArticleType = (typeof imageArticleTypes)[number];
export const imageArticleTypeLabels: Record<ImageArticleType, string> = {
  carousel: "Carousel",
  single_post: "Single Post",
  quiz: "Quiz",
  edukasi: "Edukasi",
  tips_tricks: "Tips & Tricks",
  testimoni: "Testimoni",
  quotes: "Quotes",
  random: "Random",
};

// ── Image objectives ──
export const imageObjectives = ["edit", "variasi", "upscale", "recreate_new"] as const;
export type ImageObjective = (typeof imageObjectives)[number];
export const imageObjectiveLabels: Record<ImageObjective, string> = {
  edit: "Edit",
  variasi: "Variasi",
  upscale: "Upscale",
  recreate_new: "Recreate New",
};

// ── Video objectives ──
export const videoObjectives = [
  "edukasi",
  "promosi",
  "new_product",
  "hot",
  "lifestyle",
  "daily",
] as const;
export type VideoObjective = (typeof videoObjectives)[number];
export const videoObjectiveLabels: Record<VideoObjective, string> = {
  edukasi: "Edukasi",
  promosi: "Promosi",
  new_product: "New Product",
  hot: "Hot / Trending",
  lifestyle: "Lifestyle",
  daily: "Daily",
};

// ── Audio objectives ──
export const audioObjectives = [
  "narasi",
  "iklan",
  "podcast_snippet",
  "greeting",
  "promo",
  "edukasi",
] as const;
export type AudioObjective = (typeof audioObjectives)[number];
export const audioObjectiveLabels: Record<AudioObjective, string> = {
  narasi: "Narasi / Storytelling",
  iklan: "Iklan Audio",
  podcast_snippet: "Podcast Snippet",
  greeting: "Greeting / Sapaan",
  promo: "Promo / Penawaran",
  edukasi: "Edukasi / Tips",
};

// ── Audio lengths ──
export const audioLengths = [15, 30, 60] as const;
export type AudioLength = (typeof audioLengths)[number];
export const audioLengthLabels: Record<AudioLength, string> = {
  15: "15 detik",
  30: "30 detik",
  60: "60 detik",
};

// ── Video lengths ──
export const videoLengths = [10, 15, 20] as const;
export type VideoLength = (typeof videoLengths)[number];

// ── Sub-tabs ──
export type ContentTab = "calendar" | "create" | "draft" | "assets" | "history";

export const contentTabLabels: Record<ContentTab, string> = {
  calendar: "Calendar",
  create: "Create",
  draft: "Draft",
  assets: "Assets",
  history: "History",
};

// ── Create form state per format ──

export interface ImageArticleForm {
  referenceImage: string | null;       // URL or base64
  description: string;
  descriptionMode: "manual" | "auto";  // auto = AI recommended
  article: string;                     // AI auto, up to 800 chars
  type: ImageArticleType;
}

export interface ImageForm {
  referenceImage: string | null;
  description: string;
  descriptionMode: "manual" | "auto";
  quantity: 1 | 2 | 3 | 4;
  objective: ImageObjective;
}

export interface VideoForm {
  referenceImage: string | null;
  description: string;
  descriptionMode: "manual" | "auto";
  length: VideoLength;
  audio: boolean;
  caption: boolean;
  objective: VideoObjective;
}

// ── Article lengths ──
export const articleLengths = ["short", "medium", "long"] as const;
export type ArticleLength = (typeof articleLengths)[number];
export const articleLengthLabels: Record<ArticleLength, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
};
export const articleLengthDescriptions: Record<ArticleLength, string> = {
  short: "~300 kata",
  medium: "~600 kata",
  long: "~1000 kata",
};

export interface ArticleForm {
  description: string;
  descriptionMode: "manual" | "auto";
  topic: string;
  length: ArticleLength;
}

export interface AudioForm {
  description: string;
  descriptionMode: "manual" | "auto";
  script: string;               // User-provided or AI-generated script text
  objective: AudioObjective;
  length: AudioLength;           // Target duration in seconds
  voiceId: string;               // ElevenLabs voice ID (empty = default Aria)
}

// ── Store types ──

interface ContentItem {
  id: string;
  title: string;
  body: string;
  content_type: ContentType;
  channel: CampaignChannel;
  status: ContentStatus;
  ai_generated: boolean;
  media_urls: string[];
  thumbnail_url: string | null;
  tags: string[];
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  content_templates?: { name: string } | null;
}

interface ContentAsset {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  alt_text: string | null;
  tags: string[];
  created_at: string;
}

interface ContentState {
  // Active tab
  activeTab: ContentTab;
  setActiveTab: (tab: ContentTab) => void;

  // Create flow
  selectedFormat: CreateFormat | null;
  setSelectedFormat: (f: CreateFormat | null) => void;

  // Per-format form state
  imageArticleForm: ImageArticleForm;
  setImageArticleForm: (f: Partial<ImageArticleForm>) => void;
  resetImageArticleForm: () => void;

  imageForm: ImageForm;
  setImageForm: (f: Partial<ImageForm>) => void;
  resetImageForm: () => void;

  videoForm: VideoForm;
  setVideoForm: (f: Partial<VideoForm>) => void;
  resetVideoForm: () => void;

  articleForm: ArticleForm;
  setArticleForm: (f: Partial<ArticleForm>) => void;
  resetArticleForm: () => void;

  audioForm: AudioForm;
  setAudioForm: (f: Partial<AudioForm>) => void;
  resetAudioForm: () => void;

  // Contents list
  contents: ContentItem[];
  setContents: (c: ContentItem[]) => void;
  totalContents: number;
  setTotalContents: (n: number) => void;

  // Assets
  assets: ContentAsset[];
  setAssets: (a: ContentAsset[]) => void;
  totalAssets: number;
  setTotalAssets: (n: number) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (e: CalendarEvent[]) => void;
  calendarMonth: number;
  calendarYear: number;
  setCalendarMonth: (m: number, y: number) => void;

  // Filters
  search: string;
  setSearch: (s: string) => void;
  typeFilter: ContentType | "";
  setTypeFilter: (t: ContentType | "") => void;
  channelFilter: CampaignChannel | "";
  setChannelFilter: (c: CampaignChannel | "") => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (l: boolean) => void;

  // AI generation
  isGenerating: boolean;
  setIsGenerating: (g: boolean) => void;

  // Selected content for editing
  selectedContentId: string | null;
  setSelectedContentId: (id: string | null) => void;

  // Stats
  stats: {
    total: number;
    draft: number;
    scheduled: number;
    published: number;
    archived: number;
    aiGenerated: number;
  };
  setStats: (s: ContentState["stats"]) => void;
}

const now = new Date();

const defaultImageArticleForm: ImageArticleForm = {
  referenceImage: null,
  description: "",
  descriptionMode: "auto",
  article: "",
  type: "single_post",
};

const defaultImageForm: ImageForm = {
  referenceImage: null,
  description: "",
  descriptionMode: "auto",
  quantity: 1,
  objective: "edit",
};

const defaultVideoForm: VideoForm = {
  referenceImage: null,
  description: "",
  descriptionMode: "auto",
  length: 15,
  audio: true,
  caption: true,
  objective: "promosi",
};

const defaultArticleForm: ArticleForm = {
  description: "",
  descriptionMode: "auto",
  topic: "",
  length: "medium",
};

const defaultAudioForm: AudioForm = {
  description: "",
  descriptionMode: "auto",
  script: "",
  objective: "narasi",
  length: 30,
  voiceId: "",
};

export const useContentStore = create<ContentState>((set) => ({
  activeTab: "create",
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedFormat: null,
  setSelectedFormat: (f) => set({ selectedFormat: f }),

  // Image + Article form
  imageArticleForm: { ...defaultImageArticleForm },
  setImageArticleForm: (f) =>
    set((state) => ({ imageArticleForm: { ...state.imageArticleForm, ...f } })),
  resetImageArticleForm: () => set({ imageArticleForm: { ...defaultImageArticleForm } }),

  // Image form
  imageForm: { ...defaultImageForm },
  setImageForm: (f) =>
    set((state) => ({ imageForm: { ...state.imageForm, ...f } })),
  resetImageForm: () => set({ imageForm: { ...defaultImageForm } }),

  // Video form
  videoForm: { ...defaultVideoForm },
  setVideoForm: (f) =>
    set((state) => ({ videoForm: { ...state.videoForm, ...f } })),
  resetVideoForm: () => set({ videoForm: { ...defaultVideoForm } }),

  // Article form
  articleForm: { ...defaultArticleForm },
  setArticleForm: (f) =>
    set((state) => ({ articleForm: { ...state.articleForm, ...f } })),
  resetArticleForm: () => set({ articleForm: { ...defaultArticleForm } }),

  // Audio form
  audioForm: { ...defaultAudioForm },
  setAudioForm: (f) =>
    set((state) => ({ audioForm: { ...state.audioForm, ...f } })),
  resetAudioForm: () => set({ audioForm: { ...defaultAudioForm } }),

  contents: [],
  setContents: (c) => set({ contents: c }),
  totalContents: 0,
  setTotalContents: (n) => set({ totalContents: n }),

  assets: [],
  setAssets: (a) => set({ assets: a }),
  totalAssets: 0,
  setTotalAssets: (n) => set({ totalAssets: n }),

  calendarEvents: [],
  setCalendarEvents: (e) => set({ calendarEvents: e }),
  calendarMonth: now.getMonth() + 1,
  calendarYear: now.getFullYear(),
  setCalendarMonth: (m, y) => set({ calendarMonth: m, calendarYear: y }),

  search: "",
  setSearch: (s) => set({ search: s }),
  typeFilter: "",
  setTypeFilter: (t) => set({ typeFilter: t }),
  channelFilter: "",
  setChannelFilter: (c) => set({ channelFilter: c }),

  isLoading: true,
  setIsLoading: (l) => set({ isLoading: l }),

  isGenerating: false,
  setIsGenerating: (g) => set({ isGenerating: g }),

  selectedContentId: null,
  setSelectedContentId: (id) => set({ selectedContentId: id }),

  stats: { total: 0, draft: 0, scheduled: 0, published: 0, archived: 0, aiGenerated: 0 },
  setStats: (s) => set({ stats: s }),
}));
