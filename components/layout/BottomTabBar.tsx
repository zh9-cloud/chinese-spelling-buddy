"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Bottom tab bar — the app's primary navigation: 家长 (Parent) + one tab per
//  child, shown as a coloured avatar with the child's initials (e.g. XM) so the
//  bar stays compact. Optional `actions` (e.g. settings / add) are rendered as
//  icon-only buttons at the right end — on iPhone the top corners sit under the
//  notch, so page actions live down here where they are reachable.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { ReactNode } from "react";
import { useStore } from "@/context/StoreContext";

const CHILD_COLORS = [
  { bg: "bg-amber-400" },
  { bg: "bg-teal-400" },
  { bg: "bg-purple-400" },
];

/** "Xiao Ming" → "XM", "Jayden" → "JA", "小明" → "小明". */
function initials(name: string): string {
  const n = name.trim();
  if (!n) return "?";
  // CJK names: keep up to 2 characters as-is.
  if (/[一-鿿]/.test(n)) return n.slice(0, 2);
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export function BottomTabBar({ active, actions }: { active: "parent" | string; actions?: ReactNode }) {
  const { store } = useStore();
  const children = store.children.filter((c) => c.name.trim());

  return (
    <nav className="bg-white/95 backdrop-blur border-t border-gray-100 safe-bottom">
      <div className="max-w-md mx-auto flex items-center px-1.5">
        <Link
          href="/parent/dashboard"
          className={[
            "flex-1 flex flex-row items-center justify-center gap-1.5 py-3.5 rounded-xl",
            active === "parent" ? "text-gray-900" : "text-gray-400",
          ].join(" ")}
        >
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
          </svg>
          <span className="text-sm font-semibold">家长</span>
        </Link>

        {children.map((c, i) => {
          const on = active === c.id;
          const color = CHILD_COLORS[i % CHILD_COLORS.length];
          return (
            <Link
              key={c.id}
              href={`/student/dashboard?child=${c.id}`}
              aria-label={c.name}
              className="flex-1 flex flex-row items-center justify-center py-3.5 rounded-xl"
            >
              <span
                className={[
                  "h-9 min-w-9 px-2 rounded-full flex items-center justify-center text-sm font-black text-white",
                  color.bg,
                  on ? "" : "opacity-45",
                ].join(" ")}
              >
                {initials(c.name)}
              </span>
            </Link>
          );
        })}

        {actions && <div className="flex items-center gap-1 pl-1 shrink-0">{actions}</div>}
      </div>
    </nav>
  );
}
