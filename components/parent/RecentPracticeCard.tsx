"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { PracticeSession, DictationList } from "@/lib/types";

interface Props {
  session: PracticeSession;
  dictation: DictationList;
}

export function RecentPracticeCard({ session, dictation }: Props) {
  const correct = session.wordResults.filter((r) => r.correct).length;
  const total = session.wordResults.length;
  const date = new Date(session.completedAt ?? session.startedAt);
  const dateStr = date.toLocaleDateString("zh-SG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const modeLabel: Record<string, string> = {
    learn: "📖 学习",
    practice: "🔊 练习",
    test: "✏️ 测试",
  };

  return (
    <Card accent="blue">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{modeLabel[session.mode] ?? "练习"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{dictation.title}</p>
          <p className="text-xs text-gray-400">{dateStr}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold text-jade-600">{correct}</span>
          <span className="text-sm text-gray-400">/{total}</span>
        </div>
      </div>
      <ProgressBar current={correct} total={total} color="blue" />
    </Card>
  );
}
