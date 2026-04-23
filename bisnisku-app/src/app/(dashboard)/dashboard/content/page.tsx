"use client";

import { useEffect } from "react";
import { useContentStore, contentTabLabels, type ContentTab } from "@/stores/content-store";
import { getContents, getContentStats, getContentAssets, getCalendarEvents } from "@/lib/supabase/content-actions";
import { ContentCalendar } from "@/components/content/content-calendar";
import { ContentCreate } from "@/components/content/content-create";
import { ContentDrafts } from "@/components/content/content-drafts";
import { ContentAssets } from "@/components/content/content-assets";
import { ContentHistory } from "@/components/content/content-history";
import { ContentStatsBar } from "@/components/content/content-stats-bar";
import {
  CalendarDays,
  PlusCircle,
  FileEdit,
  ImageIcon,
  Clock,
  Loader2,
} from "lucide-react";

const tabIcons: Record<ContentTab, typeof CalendarDays> = {
  calendar: CalendarDays,
  create: PlusCircle,
  draft: FileEdit,
  assets: ImageIcon,
  history: Clock,
};

export default function ContentPage() {
  const {
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    setContents,
    setTotalContents,
    setStats,
    setAssets,
    setTotalAssets,
    setCalendarEvents,
    calendarMonth,
    calendarYear,
  } = useContentStore();

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [contentData, statsData, assetData] = await Promise.all([
          getContents({ limit: 50 }),
          getContentStats(),
          getContentAssets({ limit: 50 }),
        ]);
        setContents(contentData.contents);
        setTotalContents(contentData.total);
        setStats(statsData);
        setAssets(assetData.assets);
        setTotalAssets(assetData.total);
      } catch (e) {
        console.error("Failed to load content data:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load calendar events when month changes
  useEffect(() => {
    getCalendarEvents(calendarMonth, calendarYear)
      .then(setCalendarEvents)
      .catch(console.error);
  }, [calendarMonth, calendarYear, setCalendarEvents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Konten & Marketing
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat, kelola, dan jadwalkan konten marketing bisnis Anda
        </p>
      </div>

      {/* Stats Bar */}
      <ContentStatsBar />

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
        {(Object.keys(contentTabLabels) as ContentTab[]).map((tab) => {
          const Icon = tabIcons[tab];
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {contentTabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "calendar" && <ContentCalendar />}
      {activeTab === "create" && <ContentCreate />}
      {activeTab === "draft" && <ContentDrafts />}
      {activeTab === "assets" && <ContentAssets />}
      {activeTab === "history" && <ContentHistory />}
    </div>
  );
}
