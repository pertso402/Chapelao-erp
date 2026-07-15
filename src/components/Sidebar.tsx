"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";
import { BrandMark } from "@/components/BrandMark";

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="chap-stripe" />
      <div className="p-4">
        <BrandMark />
      </div>
      <nav className="flex-1 space-y-1 px-2 pb-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-marino text-white"
                  : "text-marino hover:bg-black/5"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.demo && (
                <span className="rounded bg-amarillo px-1.5 py-0.5 text-[10px] font-bold text-marino">
                  DEMO
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
