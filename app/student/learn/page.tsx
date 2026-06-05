"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AudioButton } from "@/components/student/AudioButton";
import { PinyinMeaning } from "@/components/student/PinyinMeaning";
import { loadStore } from "@/lib/storage";

function wordFontSize(text: string): string {
  const len = text.length;
  if (len <= 2) return "clamp(3.5rem, 18vw, 5.5rem)";
  if (len <= 4) return "clamp(2.5rem, 12vw, 4rem)";
  if (len <= 6) return "clamp(2rem,  9vw, 3rem)";
  return "clamp(1.1rem, 4.5vw, 1.5rem)";
}

function LearnModeContent() {
  const params = useSearchParams();
  const listId = params.get("list") ?? "";

  const store = loadStore();
  const dictation = store.dictationLists.find((d) => d.id === listId);
  const words = dictation?.words ?? [];

  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(1);

  const current = words[index];
  const hasDetails = !!(current?.pinyin || current?.meaning || current?.exampleSentence);

  function goNext() {
    setOpen(false);
    if (index < words.length - 1) { setIndex((i) => i + 1); setPlayTrigger((t) => t + 1); }
    else setFinished(true);
  }

  function goPrev() {
    if (index > 0) { setOpen(false); setIndex((i) => i - 1); setPlayTrigger((t) => t + 1); }
  }

  if (!dictation || words.length === 0) {
    return (
      <AppShell title="学习 Learn" backHref="/student/dashboard">
        <EmptyState icon="😕" title="找不到听写列表 List not found" description="请返回重试 Please go back" />
      </AppShell>
    );
  }

  if (finished) {
    return (
      <AppShell title="学习完成！All Done!" backHref="/student/dashboard">
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <span className="text-7xl mb-6">🎉</span>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">学习完成！</h2>
          <p className="text-gray-500 mb-8">你已经学习了全部 {words.length} 个生词！<br/><span className="text-sm">All {words.length} words reviewed!</span></p>
          <div className="space-y-3 w-full max-w-xs">
            <Button fullWidth size="lg" variant="ghost"
              onClick={() => { setIndex(0); setOpen(false); setFinished(false); }}>
              再学一次 Again
            </Button>
            <Button fullWidth size="lg"
              onClick={() => { window.location.href = `/student/test?list=${listId}`; }}>
              去测试 Test →
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`学习 · ${dictation.title}`} backHref="/student/dashboard">
      <div className="flex flex-col h-[calc(100vh-3.5rem-2.5rem)] gap-3">

        <ProgressBar current={index + 1} total={words.length} color="blue" />

        {/* ── Unified word card ── */}
        <div className="flex-1 min-h-0 bg-gradient-to-br from-brand-400 to-brand-600 rounded-3xl shadow-lg overflow-hidden flex flex-col">

          {/* 1. Orange area: 2/3 of card */}
          <div className="relative flex-[2] min-h-0 flex items-center justify-center px-6">
            <span className="text-white font-bold leading-tight cjk text-center"
              style={{ fontSize: wordFontSize(current.word) }}>
              {current.word}
            </span>
            <div className="absolute bottom-3 right-4">
              <AudioButton text={current.word} size="lg" playTrigger={playTrigger} />
            </div>
          </div>

          {/* 3. White area: 1/3 of card */}
          <div className="flex-[1] min-h-0 bg-white px-6 py-5">
            <PinyinMeaning
              pinyin={current.pinyin}
              meaning={current.meaning}
              exampleSentence={current.exampleSentence}
              text={current.word}
            />
          </div>
        </div>

        {/* Navigation — arrows doubled in weight */}
        <div className="flex gap-3 shrink-0 pb-2">
          <Button variant="ghost" size="lg" fullWidth onClick={goPrev} disabled={index === 0}>
            <span className="text-2xl font-black">←</span>
          </Button>
          <Button size="lg" fullWidth onClick={goNext}>
            <span className="text-2xl font-black">
              {index === words.length - 1 ? "✓" : "→"}
            </span>
          </Button>
        </div>

      </div>
    </AppShell>
  );
}

export default function LearnModePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>}>
      <LearnModeContent />
    </Suspense>
  );
}
