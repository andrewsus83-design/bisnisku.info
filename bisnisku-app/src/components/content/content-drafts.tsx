"use client";

import { useState } from "react";
import { useContentStore } from "@/stores/content-store";
import { updateContent, deleteContent, getContents, getContentStats } from "@/lib/supabase/content-actions";
import {
  contentTypeLabels,
  channelLabels,
  type ContentType,
  type CampaignChannel,
} from "@/lib/validations/content";
import {
  FileEdit,
  Trash2,
  Send,
  CalendarClock,
  Sparkles,
  Search,
  Loader2,
  MoreVertical,
} from "lucide-react";

export function ContentDrafts() {
  const { contents, setContents, setTotalContents, setStats, search, setSearch } =
    useContentStore();
  const [actionId, setActionId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const drafts = contents.filter((c) => c.status === "draft");
  const filtered = search
    ? drafts.filter(
        (d) =>
          d.title.toLowerCase().includes(search.toLowerCase()) ||
          d.body.toLowerCase().includes(search.toLowerCase())
      )
    : drafts;

  async function handlePublish(id: string) {
    setPublishing(id);
    try {
      const result = await updateContent({ id, status: "published" });
      if (result.success) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(null);
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus konten ini?")) return;
    setDeleting(id);
    try {
      const result = await deleteContent(id);
      if (result.success) {
        await refreshData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
      setActionId(null);
    }
  }

  async function refreshData() {
    const [contentData, statsData] = await Promise.all([
      getContents({ limit: 50 }),
      getContentStats(),
    ]);
    setContents(contentData.contents);
    setTotalContents(contentData.total);
    setStats(statsData);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-dark">
          Draft ({drafts.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari draft..."
            className="rounded-full border border-border py-2 pl-9 pr-4 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <FileEdit className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada draft</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buat konten baru di tab Create
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((draft) => (
            <div
              key={draft.id}
              className="relative rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-slate-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-brand-dark">
                      {draft.title}
                    </h4>
                    {draft.ai_generated && (
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    )}
                  </div>
                  <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                    {draft.body}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {contentTypeLabels[draft.content_type as ContentType]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {channelLabels[draft.channel as CampaignChannel]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(draft.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setActionId(actionId === draft.id ? null : draft.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-brand-dark"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {actionId === draft.id && (
                    <div className="absolute right-0 top-8 z-10 w-40 rounded-xl border border-border bg-white py-1 shadow-lg">
                      <button
                        onClick={() => handlePublish(draft.id)}
                        disabled={publishing === draft.id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-brand-dark hover:bg-slate-50"
                      >
                        {publishing === draft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Publish
                      </button>
                      <button
                        onClick={() => handleDelete(draft.id)}
                        disabled={deleting === draft.id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        {deleting === draft.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
