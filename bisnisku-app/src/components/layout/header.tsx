"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Bell, Search, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/supabase/auth-actions";

export function Header() {
  const { toggle } = useSidebarStore();
  const { isAuthenticated } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={toggle}
        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-brand-dark lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari pelanggan, produk, atau fitur..."
            className="w-full rounded-full border border-border bg-muted/50 py-2 pl-10 pr-4 text-sm text-brand-dark placeholder:text-slate-400 focus:border-brand-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-brand-dark">
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
        </button>

        {/* User menu */}
        {isAuthenticated && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm hover:bg-muted"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10">
                <User className="h-4 w-4 text-brand-primary" />
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  userMenuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-white py-1 shadow-[var(--shadow-medium)]">
                <a
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-dark hover:bg-muted"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Pengaturan
                </a>
                <div className="my-1 border-t border-border" />
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
