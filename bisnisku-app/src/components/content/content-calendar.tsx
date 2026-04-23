"use client";

import { useState } from "react";
import { useContentStore } from "@/stores/content-store";
import { contentTypeLabels, type ContentType, type CalendarEvent } from "@/lib/validations/content";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  Megaphone,
  ExternalLink,
  X,
} from "lucide-react";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const typeColors: Record<string, string> = {
  promo: "bg-amber-100 text-amber-700 border-amber-200",
  blog: "bg-blue-100 text-blue-700 border-blue-200",
  testimonial: "bg-purple-100 text-purple-700 border-purple-200",
  menu_update: "bg-emerald-100 text-emerald-700 border-emerald-200",
  event: "bg-pink-100 text-pink-700 border-pink-200",
  social: "bg-sky-100 text-sky-700 border-sky-200",
};

/** Build Google Calendar URL for an event */
function buildGCalUrl(event: CalendarEvent): string {
  const title = encodeURIComponent(event.title);
  // Parse date — format: YYYY-MM-DD or YYYY-MM-DDTHH:mm
  const dateClean = event.date.replace(/[-:]/g, "").replace("T", "T");
  // All-day event: use date format YYYYMMDD/YYYYMMDD
  const startDate = dateClean.slice(0, 8);
  // End date = next day for all-day events
  const d = new Date(event.date);
  d.setDate(d.getDate() + 1);
  const endDate = d.toISOString().slice(0, 10).replace(/-/g, "");

  const details = encodeURIComponent(
    `[${event.type === "content" ? "Konten" : "Campaign"}] ${contentTypeLabels[event.content_type] ?? event.content_type}\nStatus: ${event.status}\n\nDibuat oleh Bisnisku.info`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&sf=true`;
}

export function ContentCalendar() {
  const { calendarEvents, calendarMonth, calendarYear, setCalendarMonth } =
    useContentStore();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  function prevMonth() {
    if (calendarMonth === 1) {
      setCalendarMonth(12, calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1, calendarYear);
    }
  }

  function nextMonth() {
    if (calendarMonth === 12) {
      setCalendarMonth(1, calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1, calendarYear);
    }
  }

  // Build calendar grid
  const firstDay = new Date(calendarYear, calendarMonth - 1, 1);
  const lastDay = new Date(calendarYear, calendarMonth, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() + 1 === calendarMonth && today.getFullYear() === calendarYear;

  // Build array of weeks
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  // Fill leading blanks
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill trailing blanks
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Map events by day
  function getEventsForDay(day: number) {
    const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarEvents.filter((e) => e.date?.startsWith(dateStr));
  }

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-dark">
          {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-full border border-border p-2 text-muted-foreground hover:bg-slate-50 hover:text-brand-dark"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              setCalendarMonth(now.getMonth() + 1, now.getFullYear());
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-slate-50"
          >
            Hari ini
          </button>
          <button
            onClick={nextMonth}
            className="rounded-full border border-border p-2 text-muted-foreground hover:bg-slate-50 hover:text-brand-dark"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-border bg-slate-50">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="px-2 py-2.5 text-center text-[11px] font-semibold text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={di} className="min-h-[80px] bg-slate-50/50" />;
              }

              const events = getEventsForDay(day);
              const isToday = isCurrentMonth && today.getDate() === day;

              return (
                <div
                  key={di}
                  className={`min-h-[80px] border-r border-border p-1.5 last:border-r-0 ${
                    isToday ? "bg-yellow-50/50" : ""
                  }`}
                >
                  <div
                    className={`mb-1 text-xs font-medium ${
                      isToday
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={`flex w-full items-center gap-1 truncate rounded border px-1 py-0.5 text-left text-[9px] font-medium transition-opacity hover:opacity-80 ${
                          typeColors[ev.content_type] ?? "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {ev.type === "content" ? (
                          <FileText className="h-2.5 w-2.5 shrink-0" />
                        ) : (
                          <Megaphone className="h-2.5 w-2.5 shrink-0" />
                        )}
                        <span className="truncate">{ev.title}</span>
                      </button>
                    ))}
                    {events.length > 2 && (
                      <button
                        onClick={() => setSelectedEvent(events[2])}
                        className="text-[9px] text-muted-foreground hover:text-brand-dark"
                      >
                        +{events.length - 2} lagi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(contentTypeLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                typeColors[key]?.split(" ")[0] ?? "bg-slate-200"
              }`}
            />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {selectedEvent.type === "content" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100">
                    <Megaphone className="h-4 w-4 text-pink-600" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">
                    {selectedEvent.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedEvent.type === "content" ? "Konten" : "Campaign"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-slate-100 hover:text-brand-dark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Tanggal</span>
                <span className="text-xs font-medium text-brand-dark">
                  {new Date(selectedEvent.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Tipe</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    typeColors[selectedEvent.content_type] ?? "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {contentTypeLabels[selectedEvent.content_type] ?? selectedEvent.content_type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Status</span>
                <span className="text-xs font-medium text-brand-dark capitalize">
                  {selectedEvent.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Channel</span>
                <span className="text-xs font-medium text-brand-dark capitalize">
                  {selectedEvent.channel}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={buildGCalUrl(selectedEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-primary py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-primary/90"
              >
                <CalendarDays className="h-4 w-4" />
                Add to Google Calendar
              </a>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-brand-dark hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
