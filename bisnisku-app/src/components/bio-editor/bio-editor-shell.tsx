"use client";

import { useEffect, useState } from "react";
import { useBioEditorStore, type EditorBlock } from "@/stores/bio-editor-store";
import { getBioPage, saveBioPage, publishBioPage, getBusinessSlug } from "@/lib/supabase/bio-page-actions";
import { BlockList } from "./block-list";
import { BlockSettings } from "./block-settings";
import { ThemePanel } from "./theme-panel";
import { BioPreview } from "./bio-preview";
import {
  Eye,
  Save,
  Globe,
  Palette,
  Layers,
  Monitor,
  Smartphone,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";

type Tab = "blocks" | "theme" | "settings";

export function BioEditorShell() {
  const [activeTab, setActiveTab] = useState<Tab>("blocks");
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    setPageData,
    setBlocks,
    isDirty,
    isSaving,
    setIsSaving,
    markClean,
    blocks,
    theme,
    status,
    seoTitle,
    seoDescription,
    previewMode,
    setPreviewMode,
    selectedBlockId,
  } = useBioEditorStore();

  // Load bio page data
  useEffect(() => {
    async function load() {
      try {
        const page = await getBioPage();
        setPageData({
          pageId: page.id,
          theme: page.theme || {
            primaryColor: "#0F172A",
            accentColor: "#FFCC00",
            fontFamily: "Inter",
            buttonStyle: "rounded",
            darkMode: false,
            backgroundTheme: "none",
          },
          status: page.status,
          seoTitle: page.seo_title || "",
          seoDescription: page.seo_description || "",
        });
        setBlocks(
          (page.bio_blocks || []).map(
            (b: {
              id: string;
              type: EditorBlock["type"];
              content: Record<string, unknown>;
              settings: Record<string, unknown>;
              is_visible: boolean;
            }) => ({
              id: b.id,
              type: b.type,
              content: b.content || {},
              settings: b.settings || {},
              isVisible: b.is_visible,
            })
          )
        );
      } catch {
        // If no bio page exists yet, the action will create one
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [setPageData, setBlocks]);

  // Save handler
  async function handleSave() {
    setIsSaving(true);
    try {
      await saveBioPage({
        page: {
          status,
          theme,
          seoTitle,
          seoDescription,
        },
        blocks: blocks.map((b, i) => ({
          type: b.type,
          content: b.content,
          settings: b.settings,
          sortOrder: i,
          isVisible: b.isVisible,
        })),
      });
      markClean();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  }

  // Publish handler
  async function handlePublish() {
    setIsSaving(true);
    try {
      // Save first, then publish
      await saveBioPage({
        page: {
          status: "published",
          theme,
          seoTitle,
          seoDescription,
        },
        blocks: blocks.map((b, i) => ({
          type: b.type,
          content: b.content,
          settings: b.settings,
          sortOrder: i,
          isVisible: b.isVisible,
        })),
      });
      await publishBioPage();
      markClean();

      // Show published URL
      const slug = await getBusinessSlug();
      if (slug) {
        const url = `${window.location.origin}/${slug}`;
        setPublishedUrl(url);
        setCopied(false);
      }
    } catch (err) {
      console.error("Publish failed:", err);
    } finally {
      setIsSaving(false);
    }
  }

  // Copy URL to clipboard
  async function handleCopyUrl() {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = publishedUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* ── Top toolbar ── */}
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <button
            onClick={() => setActiveTab("blocks")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "blocks"
                ? "bg-brand-primary text-brand-dark"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Layers className="h-4 w-4" />
            Blok
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "theme"
                ? "bg-brand-primary text-brand-dark"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Palette className="h-4 w-4" />
            Tema
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`rounded-l-lg p-1.5 ${previewMode === "desktop" ? "bg-muted" : ""}`}
              title="Desktop preview"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`rounded-r-lg p-1.5 ${previewMode === "mobile" ? "bg-muted" : ""}`}
              title="Mobile preview"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Simpan
          </button>

          {/* Publish */}
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-full bg-brand-dark px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark-hover"
          >
            <Globe className="h-4 w-4" />
            Publish
          </button>
        </div>
      </div>

      {/* ── Published URL banner ── */}
      {publishedUrl && (
        <div className="flex items-center gap-3 border-b border-green-200 bg-green-50 px-4 py-2.5">
          <Check className="h-4 w-4 shrink-0 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Bio page dipublikasi!
          </span>
          <div className="flex flex-1 items-center gap-1.5 rounded-full border border-green-200 bg-white px-3 py-1.5">
            <Globe className="h-3.5 w-3.5 shrink-0 text-green-600" />
            <span className="flex-1 truncate font-mono text-xs text-brand-dark">
              {publishedUrl}
            </span>
          </div>
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Salin URL
              </>
            )}
          </button>
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Buka
          </a>
          <button
            onClick={() => setPublishedUrl(null)}
            className="rounded p-1 text-green-600 hover:bg-green-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Split view: sidebar + preview ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — block list / theme / settings */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-r border-border bg-white">
          {activeTab === "blocks" && !selectedBlockId && <BlockList />}
          {activeTab === "blocks" && selectedBlockId && <BlockSettings />}
          {activeTab === "theme" && <ThemePanel />}
        </div>

        {/* Right — Live preview */}
        <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted p-6">
          <div
            className={`transition-all duration-300 ${
              previewMode === "mobile" ? "w-[375px]" : "w-full max-w-[800px]"
            }`}
          >
            <BioPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
