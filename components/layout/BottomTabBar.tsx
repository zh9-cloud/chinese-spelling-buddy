"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Bottom tab bar — the app's primary navigation: 家长 (Parent) + one tab per
//  child (by name + coloured avatar). Children with no name are skipped, so the
//  bar adapts to 1 or 2 children automatically.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useStore } from "@/context/StoreContext";

const CHILD_COLORS = [
  { bg: "bg-amber-400" },
  { bg: "bg-teal-400" },
  { bg: "bg-purple-400" },
];

export function BottomTabBar({ active }: { active: "parent" | string }) {
  const { store } = useStore();
  const children = store.children.filter((c) => c.name.trim());

  return (
    <nav className="bg-white/95 backdrop-blur border-t border-gray-100">
      <div className="max-w-md mx-auto flex">
        <Link
          href="/parent/dashboard"
          className={[
            "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5",
            active === "parent" ? "text-gray-900" : "text-gray-400",
          ].join(" ")}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" />
          </svg>
          <span className="text-[11px] font-semibold">家长</span>
        </Link>

        {children.map((c, i) => {
          const on = active === c.id;
          const color = CHILD_COLORS[i % CHILD_COLORS.length];
          return (
            <Link
              key={c.id}
              href={`/student/dashboard?child=${c.id}`}
              className={[
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5",
                on ? "text-gray-900" : "text-gray-400",
              ].join(" ")}
            >
              <span
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white",
                  color.bg,
                  on ? "" : "opacity-50",
                ].join(" ")}
              >
                {c.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="text-[11px] font-semibold max-w-[5rem] truncate">{c.name}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
