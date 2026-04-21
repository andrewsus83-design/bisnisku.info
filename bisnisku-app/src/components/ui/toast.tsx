"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { BiIcon } from "@/components/ui/icons";

// ── Types ──

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ── Toast item ──

const iconMap: Record<ToastType, Parameters<typeof BiIcon>[0]["name"]> = {
  success: "check",
  error: "x",
  info: "info",
  warning: "info",
};

const colorMap: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const iconColorMap: Record<ToastType, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-blue-600",
  warning: "text-amber-600",
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-full border px-4 py-3 shadow-md animate-in slide-in-from-right ${colorMap[t.type]}`}
      style={{ animation: "slideInRight 0.3s ease-out" }}
    >
      <BiIcon
        name={iconMap[t.type]}
        size="sm"
        className={iconColorMap[t.type]}
      />
      <p className="flex-1 text-sm font-medium">{t.message}</p>
      <button
        onClick={() => onDismiss(t.id)}
        className="opacity-50 hover:opacity-100"
      >
        <BiIcon name="x" size="xs" />
      </button>
    </div>
  );
}

// ── Provider ──

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
        ))}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
