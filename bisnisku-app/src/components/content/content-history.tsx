"use client";

import { useContentStore } from "@/stores/content-store";
import {
  contentTypeLabels,
  channelLabels,
  type ContentType,
  type CampaignChannel,
} from "@/lib/validations/content";
import {
  CheckCircle2,
  Search,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

export function ContentHistory() {
  const { contents, search, setSearch } = useContentStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Only published content
  const published = contents
    .filter((c) => c.status === "published")
    .sort(
      (a, b) =>
        new Date(b.published_at ?? b.created_at).getTime() -
        new Date(a.published_at ?? a.created_at).getTime()
    );

  const filtered = search
    ? published.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.body.toLowerCase().includes(search.toLowerCase())
      )
    : published;

  async function handleCopy(id: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-dark">
          History Published ({published.length})
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari history..."
            className="rounded-full border border-border py-2 pl-9 pr-4 text-sm text-brand-dark placeholder:text-muted-foreground focus:border-brand-primary focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Belum ada konten yang dipublish
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Publish konten dari tab Draft
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((content) => (
            <div
              key={content.id}
              className="rounded-2xl border border-border bg-white shadow-sm"
            >
              {/* Header */}
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() =>
                  setExpandedId(expandedId === content.id ? null : content.id)
                }
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <h4 className="text-sm font-semibold text-brand-dark">
                      {content.title}
                    </h4>
                    {content.ai_generated && (
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Published
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {contentTypeLabels[content.content_type as ContentType]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {channelLabels[content.channel as CampaignChannel]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(
                        content.published_at ?? content.created_at
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(content.id, content.body);
                  }}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-slate-50"
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

              {/* Expanded Content */}
              {expandedId === content.id && (
                <div className="border-t border-border px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm text-slate-600">
                    {content.body}
                  </p>
                  {content.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {content.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
