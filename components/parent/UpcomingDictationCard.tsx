"use client";

import Link from "next/link";
import { getDaysUntil } from "@/lib/mockData";
import type { DictationList } from "@/lib/types";

interface Props {
  dictation: DictationList;
  accentBorder?: string;
}

function DaysBadge({ days }: { days: number }) {
  const color = days < 0
    ? "bg-gray-100 text-gray-400"
    : days === 0
    ? "bg-red-100 text-red-600"
    : days <= 2
    ? "bg-red-100 text-red-600"
    : days <= 5
    ? "bg-amber-100 text-amber-700"
    : "bg-jade-100 text-jade-700";

  const label = days < 0 ? "已过期" : days === 0 ? "今天！" : `${days} 天`;

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${color}`}>
      {label}
    </span>
  );
}

export function UpcomingDictationCard({ dictation, accentBorder = "border-amber-400" }: Props) {
  const days = getDaysUntil(dictation.dictationDate);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${accentBorder} px-4 py-3`}>
      {/* Single row: title + badge + edit */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate text-sm cjk">{dictation.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {dictation.dictationDate} · {dictation.words.length} 个词
          </p>
        </div>
        <DaysBadge days={days} />
        <Link
          href={`/parent/add-dictation?edit=${dictation.id}`}
          className="text-xs font-semibold text-gray-400 hover:text-brand-600 transition-colors shrink-0 ml-1"
        >
          编辑
        </Link>
      </div>
    </div>
  );
}
