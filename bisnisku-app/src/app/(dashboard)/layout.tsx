"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToastProvider } from "@/components/ui/toast";

/**
 * Dashboard layout — wraps all merchant-facing dashboard pages.
 * Responsive sidebar (collapsible on desktop, overlay on mobile) + sticky header.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-muted">
        <Sidebar />

        {/* Main content area — flex-1 fills remaining space next to sidebar */}
        <div className="flex flex-1 flex-col transition-all duration-300">
          <Header />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
