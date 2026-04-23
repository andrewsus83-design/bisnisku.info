"use client";

import { useState } from "react";
import { useContentStore } from "@/stores/content-store";
import { deleteContentAsset, getContentAssets, getContentStats } from "@/lib/supabase/content-actions";
import {
  contentTypeLabels,
  channelLabels,
  type ContentType,
  type CampaignChannel,
} from "@/lib/validations/content";
import {
  ImageIcon,
  FileText,
  Film,
  Mic,
  Trash2,
  Download,
  Search,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function ContentAssets() {
  const { contents, assets, setAssets, setTotalAssets, search, setSearch } =
    useContentStore();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"generated" | "media">("generated");

  // Generated content = published + scheduled content (successfully generated)
  const generatedContent = contents.filter(
    (c) => c.status === "published" || c.status === "scheduled"
  );

  const filteredContent = search
    ? generatedContent.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.body.toLowerCase().includes(search.toLowerCase())
      )
    : generatedContent;

  const filteredAssets = search
    ? assets.filter(
        (a) =>
          a.file_name.toLowerCase().includes(search.toLowerCase()) ||
          (a.alt_text?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : assets;

  async function handleDeleteAsset(id: string) {
    if (!confirm("Yakin ingin menghapus asset ini?")) return;
    setDeleting(id);
    try {
      const result = await deleteContentAsset(id);
      if (result.success) {
        const data = await getContentAssets({ limit: 50 });
        setAssets(data.assets);
        setTotalAssets(data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  async function handleCopyContent(id: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith("image/")) return ImageIcon;
    if (fileType.startsWith("video/")) return Film;
    if (fileType.startsWith("audio/")) return Mic;
    return FileText;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setViewMode("generated")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "generated"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-slate-500"
            }`}
          >
            Konten ({generatedContent.length})
          </button>
          <button
            onClick={() => setViewMode("media")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "media"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-slate-500"
            }`}
          >
            Media ({assets.length})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari assets..."
            className="rounded-full border border-border py-2 pl-9 pr-4 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Generated Content View */}
      {viewMode === "generated" && (
        <>
          {filteredContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
              <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Belum ada konten yang berhasil di-generate
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Generate konten baru di tab Create
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredContent.map((content) => (
                <div
                  key={content.id}
                  className="rounded-2xl border border-border bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-brand-dark line-clamp-1">
                      {content.title}
                    </h4>
                    <div className="flex items-center gap-1">
                      {content.ai_generated && (
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          content.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {content.status === "published" ? "Published" : "Scheduled"}
                      </span>
                    </div>
                  </div>
                  <p className="mb-3 line-clamp-3 text-xs text-muted-foreground">
                    {content.body}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {contentTypeLabels[content.content_type as ContentType]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(content.published_at ?? content.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyContent(content.id, content.body)}
                      className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-brand-dark hover:bg-slate-50"
                    >
                      {copiedId === content.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Media Assets View */}
      {viewMode === "media" && (
        <>
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
              <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Belum ada media asset
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload gambar atau video untuk konten Anda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredAssets.map((asset) => {
                const FileIcon = getFileIcon(asset.file_type);
                const isImage = asset.file_type.startsWith("image/");
                const isVideo = asset.file_type.startsWith("video/");
                const isAudio = asset.file_type.startsWith("audio/");

                return (
                  <div
                    key={asset.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                  >
                    {isImage ? (
                      <div className="aspect-square bg-slate-100">
                        <img
                          src={asset.file_url}
                          alt={asset.alt_text ?? asset.file_name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : isVideo ? (
                      <div className="aspect-square bg-black">
                        <video
                          src={asset.file_url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => {
                            const v = e.target as HTMLVideoElement;
                            v.pause();
                            v.currentTime = 0;
                          }}
                        />
                      </div>
                    ) : isAudio ? (
                      <div className="flex aspect-square flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-3">
                        <Mic className="mb-2 h-8 w-8 text-purple-500" />
                        <audio
                          src={asset.file_url}
                          controls
                          preload="metadata"
                          className="w-full"
                          style={{ height: "32px" }}
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-slate-50">
                        <FileIcon className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="truncate text-xs font-medium text-brand-dark">
                        {asset.file_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(asset.file_size)}
                      </p>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={asset.file_url}
                        download
                        className="rounded-full bg-white/90 p-2 text-brand-dark hover:bg-white"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        disabled={deleting === asset.id}
                        className="rounded-full bg-white/90 p-2 text-red-600 hover:bg-white"
                      >
                        {deleting === asset.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
