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
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path fill="none" strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path fill="none" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-semibold">设置</span>
        </Link>
      </div>
    </nav>
  );
}
