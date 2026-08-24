"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Bottom tab bar — the app's primary navigation, symmetric by design:
//    [🏠 家长]  [XM]  [ML]  [⚙️ 设置]
//  The two ends are icon+label tabs; children sit in the middle as coloured
//  avatars with their initials so the bar stays compact. Everything lives down
//  here because on iPhone the top corners sit under the notch / Dynamic Island.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
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

const TAB = "flex-1 flex flex-row items-center justify-center gap-1.5 py-3.5 rounded-xl";

export function BottomTabBar({ active }: { active: "parent" | "settings" | string }) {
  const { store } = useStore();
  const children = store.children.filter((c) => c.name.trim());

  return (
    <nav className="bg-white/95 backdrop-blur border-t border-gray-100 safe-bottom">
      <div className="max-w-md mx-auto flex items-center px-1.5">
        {/* 家长 */}
        <Link
          href="/parent/dashboard"
          className={[TAB, active === "parent" ? "text-gray-900" : "text-gray-400"].join(" ")}
        >
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
          </svg>
          <span className="text-sm font-semibold">家长</span>
        </Link>

        {/* One avatar per child */}
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

        {/* 设置 — always visible, mirrors the 家长 tab */}
        <Link
          href="/settings"
          className={[TAB, active === "settings" ? "text-gray-900" : "text-gray-400"].join(" ")}
        >
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 4.3a1 1 0 011-.8h1.4a1 1 0 011 .8l.2 1.2a6.5 6.5 0 011.5.9l1.2-.5a1 1 0 011.2.4l.7 1.2a1 1 0 01-.2 1.3l-1 .8a6.6 6.6 0 010 1.7l1 .8a1 1 0 01.2 1.3l-.7 1.2a1 1 0 01-1.2.4l-1.2-.5a6.5 6.5 0 01-1.5.9l-.2 1.2a1 1 0 01-1 .8h-1.4a1 1 0 01-1-.8l-.2-1.2a6.5 6.5 0 01-1.5-.9l-1.2.5a1 1 0 01-1.2-.4l-.7-1.2a1 1 0 01.2-1.3l1-.8a6.6 6.6 0 010-1.7l-1-.8a1 1 0 01-.2-1.3l.7-1.2a1 1 0 011.2-.4l1.2.5a6.5 6.5 0 011.5-.9l.2-1.2z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
          <span className="text-sm font-semibold">设置</span>
        </Link>
      </div>
    </nav>
  );
}
