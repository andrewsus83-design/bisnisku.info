"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, ChevronLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarNav } from "@/config/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";
import { signOut } from "@/lib/supabase/auth-actions";

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isCollapsed, close, toggleCollapse } = useSidebarStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar-bg text-sidebar-text transition-all duration-300",
          "lg:relative lg:z-auto",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          isOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700/50 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={close}
          >
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Bisnisku"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full"
              priority
            />
            {!isCollapsed && (
              <span className="font-heading text-sm font-semibold text-white">
                bisnisku.info
              </span>
            )}
          </Link>

          {/* Mobile close */}
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Desktop collapse */}
          <button
            onClick={toggleCollapse}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-white lg:block"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sidebarNav.map((group) => (
            <div key={group.title} className="mb-6">
              {!isCollapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.title}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.disabled ? "#" : item.href}
                        onClick={close}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                          item.disabled &&
                            "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-300",
                          isCollapsed && "justify-center px-0"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isActive
                              ? "text-brand-primary"
                              : "text-slate-400"
                          )}
                        />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="rounded-full bg-brand-primary/20 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
                                {item.badge}
                              </span>
                            )}
                            {item.sprint && item.sprint > 1 && (
                              <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                                S{item.sprint}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="border-t border-slate-700/50 p-3">
          <form action={signOut}>
            <button
              type="submit"
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-white",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? "Keluar" : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Keluar</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
