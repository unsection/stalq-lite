"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  ChartLine,
  Gear,
  House,
  Newspaper,
  Scroll,
  SidebarSimple,
  Tag,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "stalq-sidebar-collapsed";

/** localStorage-backed store so the collapsed state survives reloads (SSR renders expanded). */
const collapsedListeners = new Set<() => void>();

const collapsedStore = {
  subscribe: (listener: () => void) => {
    collapsedListeners.add(listener);
    return () => collapsedListeners.delete(listener);
  },
  getSnapshot: () => window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true",
  getServerSnapshot: () => false,
  set: (collapsed: boolean) => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    collapsedListeners.forEach((listener) => listener());
  },
};

const navItems = [
  { href: "/", label: "Tracker", icon: ChartLine },
  { href: "/logs", label: "Logs", icon: Scroll },
  { href: "/pricing", label: "Pricing", icon: Tag },
  { href: "/changelog", label: "Changelog", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Gear },
] as const;

export const AppSidebar = () => {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    collapsedStore.subscribe,
    collapsedStore.getSnapshot,
    collapsedStore.getServerSnapshot,
  );

  const handleToggleCollapse = () => {
    collapsedStore.set(!collapsed);
  };

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col bg-black transition-[width] duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-[68px] sm:w-[180px]",
      )}
      aria-label="Main navigation"
    >
      <div className={cn("px-2 pt-4", !collapsed && "sm:px-3")}>
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 rounded-lg bg-zinc-900/80 px-2.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800",
            collapsed ? "justify-center px-2" : "justify-center px-2 sm:justify-start sm:px-2.5",
          )}
          aria-label="Stalq home"
        >
          <House className="h-4 w-4 shrink-0 text-zinc-300" weight="duotone" />
          {!collapsed && (
            <div className="contents max-sm:hidden">
              <span className="min-w-0 flex-1 truncate">Stalq</span>
            </div>
          )}
        </Link>
      </div>

      <nav className={cn("mt-6 flex flex-1 flex-col justify-center gap-1 px-2", !collapsed && "sm:px-3")}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/products")
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-base text-white transition-opacity",
                collapsed ? "justify-center px-2" : "justify-center px-2 sm:justify-start sm:px-2.5",
                isActive ? "opacity-100" : "opacity-60 hover:opacity-100",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" weight="duotone" />
              {!collapsed && <span className="max-sm:hidden">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={cn("mt-auto space-y-1 px-2 py-3", !collapsed && "sm:px-3")}>
        <button
          type="button"
          onClick={handleToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand" : "Collapse"}
          className={cn(
            "hidden w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900/60 hover:text-white sm:flex",
            collapsed ? "justify-center px-2" : "justify-center px-2 sm:justify-start sm:px-2.5",
          )}
        >
          <SidebarSimple
            className={cn("h-4 w-4 shrink-0 transition-transform", collapsed && "rotate-180")}
            weight="duotone"
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2",
            collapsed && "justify-center px-2",
          )}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5C518] text-xs font-bold text-black"
            aria-hidden
          >
            G
          </span>
          {!collapsed && (
            <div className="contents max-sm:hidden">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">Gita</p>
                <p className="truncate text-xs text-zinc-500">gita@stalq.dev</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
