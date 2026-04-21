"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

// ── Preset solid colors ──
const solidPresets = [
  "#0F172A", "#1E293B", "#334155", "#475569",
  "#1A73E8", "#2563EB", "#3B82F6", "#60A5FA",
  "#10B981", "#059669", "#34D399", "#6EE7B7",
  "#F59E0B", "#FFCC00", "#FCD34D", "#FDE68A",
  "#EF4444", "#DC2626", "#F87171", "#FCA5A5",
  "#EC4899", "#DB2777", "#F472B6", "#FBCFE8",
  "#8B5CF6", "#7C3AED", "#A78BFA", "#C4B5FD",
  "#EA580C", "#F97316", "#FB923C", "#FDBA74",
  "#FFFFFF", "#F8FAFC", "#F1F5F9", "#000000",
];

// ── Preset gradients ──
const gradientPresets = [
  { label: "Sunset", value: "linear-gradient(135deg, #f97316, #ec4899)" },
  { label: "Ocean", value: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
  { label: "Forest", value: "linear-gradient(135deg, #10b981, #059669)" },
  { label: "Purple Haze", value: "linear-gradient(135deg, #8b5cf6, #ec4899)" },
  { label: "Gold", value: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { label: "Night", value: "linear-gradient(135deg, #0f172a, #1e3a5f)" },
  { label: "Rose", value: "linear-gradient(135deg, #f43f5e, #fb7185)" },
  { label: "Teal", value: "linear-gradient(135deg, #14b8a6, #2dd4bf)" },
  { label: "Indigo", value: "linear-gradient(135deg, #4f46e5, #818cf8)" },
  { label: "Warm", value: "linear-gradient(135deg, #ef4444, #f97316)" },
  { label: "Cool", value: "linear-gradient(135deg, #06b6d4, #8b5cf6)" },
  { label: "Mint", value: "linear-gradient(135deg, #6ee7b7, #3b82f6)" },
];

interface ColorPickerProps {
  label: string;
  value: string; // hex color like "#0F172A" or gradient string
  onChange: (value: string) => void;
  showGradients?: boolean;
}

export function ColorPicker({
  label,
  value,
  onChange,
  showGradients = false,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"solid" | "gradient">("solid");
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const isGradient = value.startsWith("linear-gradient");

  return (
    <div ref={ref} className="relative">
      <label className="mb-2 block text-sm font-medium text-brand-dark">
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-full border-2 border-border px-3 py-2 text-sm transition-colors hover:border-brand-primary"
      >
        <div
          className="h-6 w-6 shrink-0 rounded-full border border-border"
          style={
            isGradient
              ? { background: value }
              : { backgroundColor: value }
          }
        />
        <span className="flex-1 truncate text-left font-mono text-xs text-muted-foreground">
          {isGradient ? "Gradient" : value}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-border bg-white p-3 shadow-[var(--shadow-high)]">
          {/* Tabs */}
          {showGradients && (
            <div className="mb-3 flex gap-1 rounded-full bg-muted p-0.5">
              <button
                onClick={() => setTab("solid")}
                className={`flex-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tab === "solid"
                    ? "bg-white text-brand-dark shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Solid
              </button>
              <button
                onClick={() => setTab("gradient")}
                className={`flex-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tab === "gradient"
                    ? "bg-white text-brand-dark shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Gradient
              </button>
            </div>
          )}

          {/* Solid colors */}
          {tab === "solid" && (
            <>
              <div className="grid grid-cols-8 gap-1.5">
                {solidPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onChange(color);
                      setIsOpen(false);
                    }}
                    className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${
                      value === color
                        ? "border-brand-primary ring-2 ring-brand-primary/30"
                        : "border-border"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Spectrum picker */}
              <div className="mt-3 border-t border-border pt-3">
                <SpectrumPicker value={isGradient ? "#0F172A" : value} onChange={onChange} />
              </div>

              {/* Hex input */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">HEX</span>
                <input
                  type="text"
                  value={isGradient ? "" : value}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
                  }}
                  placeholder="#000000"
                  className="flex-1 rounded-full border border-border px-2 py-1 font-mono text-xs outline-none focus:border-brand-primary"
                />
              </div>
            </>
          )}

          {/* Gradient presets */}
          {tab === "gradient" && (
            <div className="grid grid-cols-3 gap-2">
              {gradientPresets.map((g) => (
                <button
                  key={g.value}
                  onClick={() => {
                    onChange(g.value);
                    setIsOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition-colors ${
                    value === g.value
                      ? "border-brand-primary ring-2 ring-brand-primary/30"
                      : "border-border hover:border-slate-300"
                  }`}
                >
                  <div
                    className="h-8 w-full rounded"
                    style={{ background: g.value }}
                  />
                  <span className="text-[9px] font-medium text-muted-foreground">
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Spectrum/hue picker (simplified canvas-based) ──

function SpectrumPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);

  const drawSpectrum = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Horizontal hue gradient
    const hueGrad = ctx.createLinearGradient(0, 0, w, 0);
    hueGrad.addColorStop(0, "#FF0000");
    hueGrad.addColorStop(0.17, "#FFFF00");
    hueGrad.addColorStop(0.33, "#00FF00");
    hueGrad.addColorStop(0.5, "#00FFFF");
    hueGrad.addColorStop(0.67, "#0000FF");
    hueGrad.addColorStop(0.83, "#FF00FF");
    hueGrad.addColorStop(1, "#FF0000");
    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, w, h);

    // White overlay (top)
    const whiteGrad = ctx.createLinearGradient(0, 0, 0, h);
    whiteGrad.addColorStop(0, "rgba(255,255,255,1)");
    whiteGrad.addColorStop(0.5, "rgba(255,255,255,0)");
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, w, h);

    // Black overlay (bottom)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
    blackGrad.addColorStop(0.5, "rgba(0,0,0,0)");
    blackGrad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, w, h);
  }, []);

  useEffect(() => {
    drawSpectrum();
  }, [drawSpectrum]);

  function pickColor(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height);
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
    onChange(hex);
  }

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={80}
      className="w-full cursor-crosshair rounded"
      onMouseDown={(e) => {
        isDragging.current = true;
        pickColor(e);
      }}
      onMouseMove={(e) => {
        if (isDragging.current) pickColor(e);
      }}
      onMouseUp={() => (isDragging.current = false)}
      onMouseLeave={() => (isDragging.current = false)}
    />
  );
}
