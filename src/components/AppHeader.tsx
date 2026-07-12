"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Tracker" },
  { href: "/logs", label: "Logs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/changelog", label: "Changelog" },
  { href: "/settings", label: "Settings" },
];

export const AppHeader = () => {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-900 bg-black">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            Stalq Lite
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/products")
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Link
          href="/products/new"
          className="rounded-md bg-[#0080FF] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0066cc]"
        >
          Add product
        </Link>
      </div>
    </header>
  );
};
