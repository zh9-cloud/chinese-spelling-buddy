"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { AudioButton } from "@/components/student/AudioButton";
import { PinyinMeaning } from "@/components/student/PinyinMeaning";
import { MiZiGeRow, KAI_STACK } from "@/components/student/MiZiGe";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/context/StoreContext";
import { GoldCoin } from "@/components/ui/GoldCoin";
import { SealStamp } from "@/components/ui/SealStamp";
import type { WordResult } from "@/lib/types";

type WordStatus = "pending" | "revealed" | "correct" | "wrong";

// Smooth sqrt-based scaling for sentences; fixed steps for words
function wordFontSize(text: string, isSentence?: boolean): string {
  if (isSentence) {
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

function TestModeContent() {
  const params = useSearchParams();
  const listId = params.get("list") ?? "";

  const { store, saveSession, addMistake, addCoins, newId } = useStore();
  const dictation = store.dictationLists.find((d) => d.id === listId);
  // Identify the child from the dictation's childId, not always index 0
  const child = store.children.find((c) => c.id === dictation?.childId) ?? store.children[0];
  const words = dictation?.words ?? [];

  const initials = child?.name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("") ?? "";
  const pageTitle = [initials, "测试 Test", dictation?.title].filter(Boolean).join(" · ");

  const [index, setIndex] = useState(0);
  const [statuses, setStatuses] = useState<WordStatus[]>(() => words.map(() => "pending"));
  const [finished, setFinished] = useState(false);
  // Start at 1 so the first word auto-plays on mount
  const [playTrigger, setPlayTrigger] = useState(1);
  const sessionId = useRef(newId());
  // Guard so coins are awarded exactly once per completed test (not on every re-render)
  const coinsAwardedRef = useRef(false);

  useEffect(() => {
    if (finished) {
      if (!coinsAwardedRef.current) {
        coinsAwardedRef.current = true;
        const correct = statuses.filter((s) => s === "correct").length;
        if (child?.id && correct > 0) addCoins(child.id, correct);
      }
    } else {
      coinsAwardedRef.current = false; // reset so a retry awards again
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const current = words[index];
  const currentStatus = statuses[index];
  // Short words (1–4 chars) use the 米字格 — blank frame while pending, filled when revealed.
  const charCount = current ? Array.from(current.word).length : 0;
  const useGrid = !!current && !current.isSentence && charCount >= 1 && charCount <= 4;
  const answeredCount = statuses.filter((s) => s === "correct" || s === "wrong").length;
  const allAnswered = answeredCount === words.length;

  function markDontKnow() {
    // Reveal the character and mark wrong
    const next = [...statuses];
    next[index] = "wrong";
    setStatuses(next);
    addMistake({
      wordId: current.id,
      childId: child?.id ?? "",
      word: current.word,
      pinyin: current.pinyin,
      meaning: current.meaning,
      wrongCount: 1,
      lastPracticed: new Date().toISOString(),
    });
  }

  function markKnow() {
    const next = [...statuses];
    next[index] = "correct";
    setStatuses(next);
    if (index < words.length - 1) {
      setIndex((i) => i + 1);
      setPlayTrigger((t) => t + 1);
    } else {
      // Last word — auto-submit after a brief moment
      setTimeout(() => {
        const results = words.map((w, i) => ({
          wordId: w.id,
          correct: (i < index ? next[i] : "correct") === "correct",
          attempts: 1,
        }));
        saveSession({
          id: sessionId.current,
          dictationListId: listId,
          childId: child?.id ?? "",
          mode: "test",
          startedAt: new Date(Date.now() - words.length * 10000).toISOString(),
          completedAt: new Date().toISOString(),
          wordResults: results,
        });
        setFinished(true);
      }, 400);
    }
  }

  function submitTest() {
    const results: WordResult[] = words.map((w, i) => ({
      wordId: w.id,
      correct: statuses[i] === "correct",
      attempts: 1,
    }));
    saveSession({
      id: sessionId.current,
      dictationListId: listId,
      childId: child?.id ?? "",
      mode: "test",
      startedAt: new Date(Date.now() - words.length * 10000).toISOString(),
      completedAt: new Date().toISOString(),
      wordResults: results,
    });
    setFinished(true);
  }

  if (!dictation || words.length === 0) {
    return (
      <AppShell title="测试 Test" backHref="/student/dashboard">
        <EmptyState icon="😕" title="找不到听写列表 List not found" />
      </AppShell>
    );
  }

  if (finished) {
    const correct = statuses.filter((s) => s === "correct").length;
    const score = Math.round((correct / words.length) * 100);
    const emoji = score === 100 ? "🏆" : score >= 80 ? "🌟" : score >= 60 ? "😊" : "💪";
    const sealText = score === 100 ? "优" : score >= 80 ? "棒" : score >= 60 ? "赞" : null;
    const coinsEarned = correct;
    // NOTE: coins are awarded in the useEffect above (once), not here in render.

    function handleShare() {
      const text = `我在 Chinese Spelling Buddy 答对了 ${correct}/${words.length} 个词，得了 ${score} 分！${emoji}`;
      if (navigator.share) {
        navigator.share({ title: "Chinese Spelling Buddy 成就", text }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(text).then(() => alert("已复制！Copied!"));
      }
    }

    return (
      <AppShell title="测试完成！Test Complete!" backHref="/student/dashboard">
        <div className="flex flex-col items-center py-8 text-center px-4 page-enter">
          {sealText ? (
            <div className="mb-3 flex items-center gap-3">
              <span className="text-6xl">{emoji}</span>
              <SealStamp text={sealText} size={92} />
            </div>
          ) : (
            <span className="text-7xl mb-3">{emoji}</span>
          )}
          <h2 className="calligraphy text-2xl font-extrabold text-gray-800 mb-1">测试完成！</h2>
          <p className="text-sm text-gray-400 mb-4">Test Complete</p>

          <p className="text-gray-600 text-sm mb-2">
            答对 <strong className="text-jade-600">{correct}</strong> 个 / 共 <strong>{words.length}</strong> 个
            &nbsp;·&nbsp; {correct}/{words.length} correct
          </p>
          {words.length - correct > 0 && (
            <p className="text-xs text-gray-400 mb-4">{words.length - correct} 个错误已加入错字本 · Added to Mistakes</p>
          )}

          {/* Coins earned */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4 mb-5 w-full max-w-xs">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3">
              获得金币 Coins Earned
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 min-h-[2rem]">
              {Array.from({ length: coinsEarned }).map((_, i) => (
                <span key={i} className="coin-drop inline-flex"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <GoldCoin size="lg" />
                </span>
              ))}
            </div>
            <p className="text-lg font-black text-amber-700 mt-3 flex items-center justify-center gap-1.5">
              +{coinsEarned} <GoldCoin size="sm" />
            </p>
          </div>

          {/* Word breakdown */}
          <div className="w-full max-w-sm space-y-1.5 mb-6 text-left">
            {words.map((w, i) => (
              <div key={w.id}
                className={["px-4 py-2.5 rounded-xl", statuses[i] === "correct" ? "bg-jade-50" : "bg-red-50"].join(" ")}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold cjk text-gray-800">{w.word}</span>
                  <Badge variant={statuses[i] === "correct" ? "green" : "red"}>
                    {statuses[i] === "correct" ? "✓" : "✗"}
                  </Badge>
                </div>
                {w.pinyin && <p className="text-sm text-brand-500 mt-0.5">{w.pinyin}</p>}
                {w.meaning && <p className="text-xs font-bold text-gray-500">{w.meaning}</p>}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 w-full max-w-xs">
            <Button fullWidth size="lg" variant="ghost"
              onClick={() => { setIndex(0); setStatuses(words.map(() => "pending")); setFinished(false); sessionId.current = newId(); setPlayTrigger(1); }}>
              重新测试 Retry
            </Button>
            <Button fullWidth size="lg"
              onClick={() => { window.location.href = "/student/dashboard"; }}>
              返回主页 Home
            </Button>
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-amber-300 bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 active:scale-95 transition-all"
            >
              <span className="text-lg">🌟</span>
              分享成就 Share Achievement
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={pageTitle} backHref="/student/dashboard">
      <div className="flex flex-col h-[calc(100vh-3.5rem-2.5rem)] gap-3">

        <ProgressBar current={answeredCount} total={words.length} color="orange" />

        {/* Score tally */}
        <div className="flex justify-between text-sm px-1 shrink-0">
          <span className="text-jade-600 font-semibold">
            ✓ <strong>{statuses.filter((s) => s === "correct").length}</strong> 对 Correct
          </span>
          <span className="text-gray-400">
            <strong className="text-gray-600">{index + 1}</strong> / <strong className="text-gray-600">{words.length}</strong>
          </span>
          <span className="text-red-400 font-semibold">
            ✗ <strong>{statuses.filter((s) => s === "wrong").length}</strong> 错 Wrong
          </span>
        </div>

        {/* ── Unified word card ── */}
        <div className="flex-1 min-h-0 bg-gradient-to-br from-brand-400 to-brand-600 rounded-3xl shadow-lg overflow-hidden flex flex-col">

          {/* 1. Orange area — blank 米字格 / underscores when pending, answer revealed after */}
          <div className={["relative min-h-0 flex items-center justify-center px-6", current.isSentence ? "flex-[3]" : "flex-[2]"].join(" ")}>
            {useGrid ? (
              // Short word: empty writing grid while pending, filled when revealed.
              currentStatus === "pending"
                ? <MiZiGeRow blanks={charCount} />
                : <MiZiGeRow word={current.word} />
            ) : currentStatus === "pending" ? (
              <span className="font-bold text-white/30 cjk select-none text-center"
                style={{ fontSize: wordFontSize(current.word, current.isSentence), lineHeight: 1.3 }}>
                {"＿".repeat(Math.min(current.word.length, 20))}
              </span>
            ) : (
              <span className="leading-snug cjk text-center"
                style={{ fontSize: wordFontSize(current.word, current.isSentence), fontFamily: KAI_STACK, fontWeight: 400, color: "#2a2622" }}>
                {current.word}
              </span>
            )}
            <div className="absolute bottom-3 right-4">
              <AudioButton text={current.word} size="lg" playTrigger={playTrigger} />
            </div>
          </div>

          {/* White area: sentences get extra height for long pinyin */}
          <div className={[
            "min-h-0 bg-white px-6 pt-4 pb-3 flex flex-col justify-between",
            current.isSentence ? "flex-[2] overflow-y-auto" : "flex-[1]",
          ].join(" ")}>
            <PinyinMeaning pinyin={current.pinyin} meaning={current.meaning} text={current.word} />

            <div className="mt-3">
              {/* 不会 / 会了 — shown while pending */}
              {currentStatus === "pending" && (
                <div className="flex gap-2">
                  <button onClick={markDontKnow}
                    className="flex-1 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-semibold text-sm rounded-lg py-2.5 border-2 border-red-200 transition-all">
                    不会 <span className="text-xs opacity-70">Don&apos;t know</span>
                  </button>
                  <button onClick={markKnow}
                    className="flex-1 bg-jade-50 hover:bg-jade-100 active:scale-95 text-jade-600 font-semibold text-sm rounded-lg py-2.5 border-2 border-jade-200 transition-all">
                    会了 <span className="text-xs opacity-70">Got it!</span>
                  </button>
                </div>
              )}
              {/* After 不会: show status, user presses → to continue */}
              {currentStatus === "wrong" && (
                <div className="py-2 rounded-lg text-center font-bold text-sm bg-red-50 text-red-500">
                  已显示答案 Answer shown · 按 → 继续
                </div>
              )}
              {currentStatus === "correct" && (
                <div className="py-2 rounded-lg text-center font-bold text-sm bg-jade-50 text-jade-600">
                  ✓ 会了 Got it
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prev / Next */}
        <div className="flex gap-3 shrink-0 pb-2">
          <Button variant="ghost" size="lg" fullWidth
            onClick={() => { setIndex((i) => Math.max(0, i - 1)); setPlayTrigger((t) => t + 1); }}
            disabled={index === 0}>
            <span className="text-2xl font-black">←</span>
          </Button>
          {index < words.length - 1 ? (
            <Button size="lg" fullWidth onClick={() => { setIndex((i) => i + 1); setPlayTrigger((t) => t + 1); }}>
              <span className="text-2xl font-black">→</span>
            </Button>
          ) : (
            <Button size="lg" fullWidth variant={allAnswered ? "primary" : "ghost"}
              disabled={!allAnswered} onClick={submitTest}>
              {allAnswered ? "提交 Submit ✓" : `还有 ${words.length - answeredCount} 个 left`}
            </Button>
          )}
        </div>

        {allAnswered && index < words.length - 1 && (
          <Button fullWidth size="lg" onClick={submitTest} className="shrink-0">提交测试 Submit ✓</Button>
        )}

      </div>
    </AppShell>
  );
}

export default function TestModePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>}>
      <TestModeContent />
    </Suspense>
  );
}
