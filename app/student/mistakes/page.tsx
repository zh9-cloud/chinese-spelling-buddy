"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AudioButton } from "@/components/student/AudioButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChildSelector } from "@/components/shared/ChildSelector";
import { loadStore, getCoins } from "@/lib/storage";
import { getUpcomingDictation } from "@/lib/mockData";

function MistakesContent() {
  const params = useSearchParams();
  const store = loadStore();
  const initialChildId = params.get("child") ?? store.children[0]?.id ?? "";
  const [activeChildId, setActiveChildId] = useState(initialChildId);

  const coinsByChildId = Object.fromEntries(
    store.children.map((c) => [c.id, getCoins(c.id)])
  );

  const activeDictation = getUpcomingDictation(activeChildId, store.dictationLists);
  const activeWordIds = new Set(activeDictation?.words.map((w) => w.id) ?? []);

  const mistakes = [...store.mistakes]
    .filter((m) => m.childId === activeChildId && activeWordIds.has(m.wordId))
    .sort((a, b) => b.wrongCount - a.wrongCount);

  return (
    <AppShell title="错字本 📚" backHref="/student/dashboard">
      <div className="space-y-4 page-enter">

        {store.children.length > 1 && (
          <ChildSelector
            childList={store.children}
            activeChildId={activeChildId}
            onSelect={setActiveChildId}
            coinsByChildId={coinsByChildId}
          />
        )}

        {activeDictation && (
          <p className="text-xs text-gray-400 px-1">
            当前练习：
            <span className="font-semibold text-gray-500 cjk">{activeDictation.title}</span>
            <span className="ml-1">（{activeDictation.words.length} 词）</span>
          </p>
        )}

        {!activeDictation ? (
          <EmptyState
            icon="📅"
            title="暂无听写任务"
            description="等待家长添加听写列表后再来练习吧！"
          />
        ) : mistakes.length === 0 ? (
          <EmptyState
            icon="🎉"
            title="错字本是空的！"
            description="太棒了！这份听写没有写错过任何字。继续加油！"
          />
        ) : (
          <>
            <p className="text-sm text-gray-500 px-1">
              共 {mistakes.length} 个需要复习的字 · 从错误最多的开始
            </p>

            <div className="space-y-3">
              {mistakes.map((entry) => (
                <Card key={entry.wordId} accent={entry.wrongCount >= 3 ? "red" : "orange"}>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl font-bold text-brand-600 cjk">
                        {entry.word}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {entry.pinyin && (
                        <p className="text-base font-medium text-gray-600">{entry.pinyin}</p>
                      )}
                      {entry.meaning && (
                        <p className="text-sm text-gray-400 truncate">{entry.meaning}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant={entry.wrongCount >= 3 ? "red" : "orange"}>
                          错了 {entry.wrongCount} 次
                        </Badge>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <AudioButton text={entry.word} size="sm" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 pt-2 pb-4">
              在学习模式和测试模式中多练习这些词，错字本会自动更新
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function MistakesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <MistakesContent />
    </Suspense>
  );
}
