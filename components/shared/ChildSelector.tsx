"use client";

import type { Child } from "@/lib/types";
import { GoldCoin } from "@/components/ui/GoldCoin";

const THEMES = [
  {
    activeBg:        "bg-amber-400",
    inactiveBg:      "bg-amber-50",
    activeText:      "text-white",
    inactiveText:    "text-amber-700",
    gradeBg:         "bg-amber-200/60 text-amber-900",
    inactiveGradeBg: "bg-amber-100 text-amber-600",
    ring:            "ring-amber-400",
  },
  {
    activeBg:        "bg-teal-500",
    inactiveBg:      "bg-teal-50",
    activeText:      "text-white",
    inactiveText:    "text-teal-700",
    gradeBg:         "bg-teal-200/60 text-teal-900",
    inactiveGradeBg: "bg-teal-100 text-teal-600",
    ring:            "ring-teal-400",
  },
  {
    activeBg:        "bg-purple-400",
    inactiveBg:      "bg-purple-50",
    activeText:      "text-white",
    inactiveText:    "text-purple-700",
    gradeBg:         "bg-purple-200/60 text-purple-900",
    inactiveGradeBg: "bg-purple-100 text-purple-600",
    ring:            "ring-purple-400",
  },
];

function chineseTypeLabel(type: string): string {
  if (type === "Higher")     return "高级华文";
  if (type === "Foundation") return "基础华文";
  return "华文";
}

interface ChildSelectorProps {
  childList: Child[];
  activeChildId: string;
  onSelect: (id: string) => void;
  /** Optional map of childId → coin count */
  coinsByChildId?: Record<string, number>;
}

export function ChildSelector({ childList, activeChildId, onSelect, coinsByChildId = {} }: ChildSelectorProps) {
  if (childList.length === 0) return null;

  const gridClass = childList.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {childList.map((child, i) => {
        const t = THEMES[i % THEMES.length];
        const active = child.id === activeChildId;

        return (
          <button
            key={child.id}
            onClick={() => onSelect(child.id)}
            className={[
              "rounded-2xl p-4 text-left transition-all duration-150",
              "active:scale-[0.97] focus:outline-none",
              active
                ? `${t.activeBg} shadow-lg ring-2 ${t.ring} ring-offset-1`
                : `${t.inactiveBg} border border-gray-100 hover:shadow-md`,
            ].join(" ")}
          >
            {/* Grade pill — top right */}
            <div className="flex justify-end mb-2">
              <span className={[
                "text-xs font-bold px-2 py-0.5 rounded-full",
                active ? t.gradeBg : t.inactiveGradeBg,
              ].join(" ")}>
                {child.grade}
              </span>
            </div>

            {/* Name */}
            <p className={`font-black text-lg leading-tight truncate ${active ? t.activeText : t.inactiveText}`}>
              {child.name}
            </p>

            {/* Course type + coins */}
            <div className="flex items-center justify-between mt-0.5">
              <p className={`text-xs font-semibold ${active ? "text-white/80" : "text-gray-400"}`}>
                {chineseTypeLabel(child.chineseType)}
              </p>
              {(coinsByChildId[child.id] ?? 0) > 0 && (
                <span className={`flex items-center gap-1 text-xs font-black ${active ? "text-white" : "text-amber-600"}`}>
                  <GoldCoin size="sm" />
                  {coinsByChildId[child.id]}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
