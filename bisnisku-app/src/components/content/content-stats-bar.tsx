"use client";

import { useContentStore } from "@/stores/content-store";
import { FileText, FileEdit, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";

export function ContentStatsBar() {
  const { stats } = useContentStore();

  const items = [
    { label: "Total", value: stats.total, icon: FileText, color: "text-slate-600" },
    { label: "Draft", value: stats.draft, icon: FileEdit, color: "text-amber-600" },
    { label: "Dijadwalkan", value: stats.scheduled, icon: CalendarClock, color: "text-blue-600" },
    { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "AI Generated", value: stats.aiGenerated, icon: Sparkles, color: "text-purple-600" },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
        >
          <item.icon className={`h-5 w-5 ${item.color}`} />
          <div>
            <p className="text-lg font-bold text-brand-dark">{item.value}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
