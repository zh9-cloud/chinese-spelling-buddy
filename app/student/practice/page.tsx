"use client";

// ─────────────────────────────────────────────
//  Practice Mode
//  Audio plays automatically. Student listens and
//  tries to recall the character before tapping to reveal.
//  Repeat button plays the word again.
// ─────────────────────────────────────────────

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AudioButton } from "@/components/student/AudioButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/context/StoreContext";

function PracticeModeContent() {
  const params = useSearchParams();
  const listId = params.get("list") ?? "";

  const { store } = useStore();
  const dictation = store.dictationLists.find((d) => d.id === listId);
  const words = dictation?.words ?? [];

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = words[index];

  const goNext = useCallback(() => {
    setRevealed(false);
    if (index < words.length - 1) {
      setIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  }, [index, words.length]);

  if (!dictation || words.length === 0) {
    return (
      <AppShell title="练习模式" backHref="/student/dashboard">
        <EmptyState icon="😕" title="找不到听写列表" />
      </AppShell>
    );
  }

  if (finished) {
    return (
      <AppShell title="练习完成！" backHref="/student/dashboard">
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <span className="text-7xl mb-6">🌟</span>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">练习完成！</h2>
          <p className="text-gray-500 mb-8">你已经完成了全部 {words.length} 个词的练习！</p>
          <div className="space-y-3 w-full max-w-xs">
            <Button
              fullWidth size="lg" variant="ghost"
              onClick={() => { setIndex(0); setRevealed(false); setFinished(false); }}
            >
              再练一次
            </Button>
            <Button
              fullWidth size="lg"
              onClick={() => { window.location.href = `/student/test?list=${listId}`; }}
            >
              去测试模式 →
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`练习模式 · ${dictation.title}`} backHref="/student/dashboard">
      <div className="space-y-5 page-enter">

        {/* ── Progress ── */}
        <ProgressBar current={index + 1} total={words.length} color="green" />

        {/* ── Hidden word panel ── */}
        <Card className="text-center py-10">
          <p className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
            {current.isSentence ? "听一听，想一想这句话怎么写？" : "听一听，想一想这是哪个词？"}
          </p>

          {/* Audio button — the primary interaction */}
          <div className="flex justify-center mb-6">
            <AudioButton text={current.word} size="lg" />
          </div>

          {revealed ? (
            <div className="animate-pulse-once">
              <p
                className="font-bold text-brand-600 cjk"
                style={{
                  fontSize: current.isSentence
                    ? `${Math.max(1.5, 9.5 / Math.sqrt(current.word.length)).toFixed(2)}rem`
                    : "clamp(3rem, 18vw, 5.5rem)",
                  lineHeight: 1.3,
                }}
              >
                {current.word}
              </p>
              {current.pinyin && (
                current.isSentence
                  ? <p className="text-sm leading-relaxed text-brand-400 font-medium mt-2 break-words">{current.pinyin}</p>
                  : <p className="text-xl text-gray-500 mt-2">{current.pinyin}</p>
              )}
              {current.meaning && (
                <p className="text-sm font-bold text-gray-600 mt-1">{current.meaning}</p>
              )}
            </div>
          ) : (
            <div
              className="font-bold text-gray-200 cjk select-none"
              style={{
                fontSize: current.isSentence
                  ? `${Math.max(1.5, 9.5 / Math.sqrt(current.word.length)).toFixed(2)}rem`
                  : "clamp(3rem, 18vw, 5.5rem)",
                lineHeight: 1.3,
              }}
              aria-hidden
            >
              {current.isSentence
                ? "＿".repeat(Math.min(current.word.length, 20))
                : "？".repeat(current.word.length)}
            </div>
          )}
        </Card>

        {/* ── Action buttons ── */}
        <div className="space-y-3">
          {!revealed ? (
            <Button fullWidth size="lg" variant="ghost" onClick={() => setRevealed(true)}>
              👁 揭示答案
            </Button>
          ) : (
            <Button fullWidth size="lg" onClick={goNext}>
              {index === words.length - 1 ? "完成 ✓" : "下一个 →"}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-gray-400">
          第 {index + 1} 个 / 共 {words.length} 个
        </p>
      </div>
    </AppShell>
  );
}

export default function PracticeModePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>}>
      <PracticeModeContent />
    </Suspense>
  );
}
