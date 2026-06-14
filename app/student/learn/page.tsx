"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { AudioButton } from "@/components/student/AudioButton";
import { PinyinMeaning } from "@/components/student/PinyinMeaning";
import { MiZiGeRow, KAI_STACK } from "@/components/student/MiZiGe";
import { SealStamp } from "@/components/ui/SealStamp";
import { useStore } from "@/context/StoreContext";

function wordFontSize(text: string, isSentence?: boolean): string {
  if (isSentence) {
    // Smooth sqrt-based scaling: fills the card without hard breakpoints
    // 8 chars → ~3.4rem, 12 → 2.7rem, 16 → 2.4rem, 20 → 2.1rem, 30 → 1.7rem
    const rem = Math.max(1.5, 9.5 / Math.sqrt(text.length));
    return `${rem.toFixed(2)}rem`;
  }
  const len = text.length;
  if (len <= 2) return "clamp(3.5rem, 18vw, 5.5rem)";
  if (len <= 4) return "clamp(2.5rem, 12vw, 4rem)";
  if (len <= 6) return "clamp(2rem,  9vw, 3rem)";
  return "clamp(1.5rem, 6vw, 2rem)";
}

function LearnModeContent() {
  const params = useSearchParams();
  const listId = params.get("list") ?? "";

  const { store } = useStore();
  const dictation = store.dictationLists.find((d) => d.id === listId);
  const words = dictation?.words ?? [];

  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(1);

  const current = words[index];
  const hasDetails = !!(current?.pinyin || current?.meaning || current?.exampleSentence);
  // Short words (1–4 characters) get the 米字格 writing-grid treatment.
  const charCount = current ? Array.from(current.word).length : 0;
  const useGrid = !!current && !current.isSentence && charCount >= 1 && charCount <= 4;

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
          <div className="mb-6 flex items-center gap-3">
            <span className="text-6xl">🎉</span>
            <SealStamp text="棒" size={92} />
          </div>
          <h2 className="calligraphy text-2xl font-extrabold text-gray-800 mb-2">学习完成！</h2>
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

          {/* Top area: word / sentence display */}
          <div className={[
            "relative min-h-0 flex px-6",
            current.isSentence
              ? "flex-[3] items-center justify-center"   // sentences get more vertical space
              : "flex-[2] items-center justify-center",
          ].join(" ")}>
            {useGrid ? (
              <MiZiGeRow word={current.word} />
            ) : (
              <div
                className="cjk leading-snug text-center bg-[#fdfaf4] rounded-2xl px-4 py-4 max-w-[92%] max-h-full overflow-y-auto"
                style={{
                  fontSize: current.isSentence
                    ? `${Math.max(1.2, 6.8 / Math.sqrt(Array.from(current.word).length)).toFixed(2)}rem`
                    : wordFontSize(current.word, current.isSentence),
                  fontFamily: KAI_STACK, fontWeight: 400, color: "#2a2622",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                }}
              >
                {current.word}
              </div>
            )}
            <div className="absolute bottom-3 right-4">
              <AudioButton text={current.word} size="lg" playTrigger={playTrigger} />
            </div>
          </div>

          {/* White area: pinyin + meaning — sentences get extra height for long pinyin */}
          <div className={current.isSentence ? "flex-[2] min-h-0 bg-white px-6 py-4 overflow-y-auto" : "flex-[1] min-h-0 bg-white px-6 py-5"}>
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
