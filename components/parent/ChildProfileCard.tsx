"use client";

import { Badge } from "@/components/ui/Badge";
import type { Child } from "@/lib/types";

interface Props {
  child: Child;
  isActive?: boolean;
  onClick?: () => void;
  /** Left-border accent colour, e.g. "border-amber-400" */
  accentBorder?: string;
}

const gradeEmoji: Record<string, string> = {
  P3: "🌱", P4: "🌿", P5: "🌳", P6: "🎓",
};

export function ChildProfileCard({ child, isActive, onClick, accentBorder = "border-amber-400" }: Props) {
  return (
    <div
      className={[
        "bg-white rounded-lg shadow-sm border border-gray-100 p-4",
        "border-l-4",
        isActive ? accentBorder : "border-l-gray-200",
        onClick ? "cursor-pointer hover:shadow-md active:scale-[0.98] transition-all" : "",
      ].join(" ")}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">
          {gradeEmoji[child.grade] ?? "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{child.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="gray">{child.grade}</Badge>
            <Badge variant={child.chineseType === "Higher" ? "green" : child.chineseType === "Foundation" ? "purple" : "blue"}>
              {child.chineseType === "Higher" ? "高级华文" : child.chineseType === "Foundation" ? "基础华文" : "华文"}
            </Badge>
          </div>
        </div>
        {isActive && (
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
}
