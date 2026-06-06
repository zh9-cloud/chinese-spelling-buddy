"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  AI 批改手写 — Handwriting Grading Page
//
//  Flow:
//  1. Student selects a dictation list (via ?list= param or from a picker)
//  2. Student writes answers on paper
//  3. Student photographs the paper using this page
//  4. GPT-4o Vision grades each handwritten answer
//  5. Results are shown word-by-word, then saved as a session
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AudioButton } from "@/components/student/AudioButton";
import { GoldCoin } from "@/components/ui/GoldCoin";
import { useStore } from "@/context/StoreContext";
import type { WordResult } from "@/lib/types";

interface GradeResult {
  index: number;
  expected: string;
  written: string;
  correct: boolean;
}

// ── Step 1: Pick a list ───────────────────────────────────────────────────────

function ListPicker({ childId, onSelect }: { childId: string; onSelect: (listId: string) => void }) {
  const { store } = useStore();
  const lists = store.dictationLists.filter((d) => d.childId === childId);

  if (!lists.length) {
    return (
      <EmptyState icon="📋" title="暂无听写列表" description="请家长先添加听写列表" />
    );
  }

  return (
    <div className="space-y-2">
      {lists.map((d) => (
        <button key={d.id}
          onClick={() => onSelect(d.id)}
          className="w-full text-left bg-white border border-gray-200 rounded-2xl px-4 py-3 hover:border-brand-300 hover:bg-brand-50 transition-all active:scale-[0.98]">
          <p className="font-bold text-gray-800 cjk">{d.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{d.dictationDate} · {d.words.length} 个词</p>
        </button>
      ))}
    </div>
  );
}

// ── Step 2: Shoot + Grade ─────────────────────────────────────────────────────

function GradeFlow({ listId, childId }: { listId: string; childId: string }) {
  const { store, saveSession, addMistake, addCoins, newId } = useStore();
  const dictation = store.dictationLists.find((d) => d.id === listId);
  const words = dictation?.words ?? [];

  const [phase, setPhase] = useState<"shoot" | "grading" | "results">("shoot");
  const [preview, setPreview]     = useState<string>("");
  const [results, setResults]     = useState<GradeResult[]>([]);
  const [score, setScore]         = useState(0);
  const [notes, setNotes]         = useState("");
  const [gradeError, setGradeError] = useState("");
  const sessionSaved = useRef(false);

  // Handle photo selection / capture
  const handlePhoto = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    setPhase("grading");
    setGradeError("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type,
          expectedWords: words.map((w) => w.word),
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? "批改失败");
      }

      const data = await res.json() as {
        results: GradeResult[];
        score: number;
        notes: string;
      };
      setResults(data.results);
      setScore(data.score);
      setNotes(data.notes);
      setPhase("results");

      // Persist session + mistakes
      if (!sessionSaved.current) {
        sessionSaved.current = true;
        const wordResults: WordResult[] = data.results.map((r) => ({
          wordId: words[r.index]?.id ?? `word-${r.index}`,
          correct: r.correct,
          attempts: 1,
        }));
        saveSession({
          id: newId(),
          dictationListId: listId,
          childId,
          mode: "handwriting",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          wordResults,
        });
        data.results.filter((r) => !r.correct).forEach((r) => {
          const w = words[r.index];
          if (w) addMistake({
            wordId: w.id,
            childId,
            word: w.word,
            pinyin: w.pinyin,
            meaning: w.meaning,
            wrongCount: 1,
            lastPracticed: new Date().toISOString(),
          });
        });
        const coinsEarned = data.results.filter((r) => r.correct).length;
        if (coinsEarned > 0) addCoins(childId, coinsEarned);
      }
    } catch (e) {
      setGradeError(e instanceof Error ? e.message : "批改失败，请重试");
      setPhase("shoot");
    }
  }, [words, listId, childId, saveSession, addMistake, addCoins, newId]);

  if (!dictation || words.length === 0) {
    return <EmptyState icon="😕" title="找不到听写列表" />;
  }

  // ── Shoot phase ───────────────────────────────────────────────────────────
  if (phase === "shoot") {
    return (
      <div className="space-y-5 page-enter">
        <Card>
          <p className="text-sm font-semibold text-gray-700 mb-1 cjk">{dictation.title}</p>
          <p className="text-xs text-gray-400 mb-4">{words.length} 个词 · {dictation.dictationDate}</p>

          <div className="space-y-1.5 mb-4">
            {words.map((w, i) => (
              <div key={w.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-300 w-4 text-right">{i + 1}.</span>
                <span className="text-base font-bold cjk text-gray-700">{w.word}</span>
                {w.pinyin && <span className="text-xs text-brand-400">{w.pinyin}</span>}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            📝 在纸上按顺序写出以上 {words.length} 个词语，然后拍照上传
          </p>
        </Card>

        {gradeError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            {gradeError}
          </p>
        )}

        <label className="flex items-center justify-center gap-3 w-full rounded-2xl py-5 bg-brand-500 hover:bg-brand-600 active:scale-95 transition-all cursor-pointer shadow-lg shadow-brand-200 text-white font-bold">
          <input
            type="file" accept="image/*" capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhoto(f);
              e.target.value = "";
            }}
          />
          <span className="text-2xl">📷</span>
          拍照上传答案
        </label>

        <label className="flex items-center justify-center gap-3 w-full rounded-2xl py-3 bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer border border-gray-200 text-gray-600 font-semibold text-sm">
          <input
            type="file" accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhoto(f);
              e.target.value = "";
            }}
          />
          从相册选择
        </label>
      </div>
    );
  }

  // ── Grading phase ─────────────────────────────────────────────────────────
  if (phase === "grading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="手写答案" className="max-h-48 rounded-2xl object-contain mb-6 opacity-60" />
        )}
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4" />
        <p className="font-bold text-gray-700 cjk">AI 正在批改中…</p>
        <p className="text-sm text-gray-400 mt-1">请稍候，通常需要 5–15 秒</p>
      </div>
    );
  }

  // ── Results phase ─────────────────────────────────────────────────────────
  const correctCount = results.filter((r) => r.correct).length;
  const emoji = score === 100 ? "🏆" : score >= 80 ? "🌟" : score >= 60 ? "😊" : "💪";
  const coinsEarned = correctCount;

  return (
    <div className="space-y-5 page-enter">
      {/* Score summary */}
      <div className="text-center py-4">
        <span className="text-6xl">{emoji}</span>
        <p className="text-2xl font-black text-gray-800 mt-3">
          {correctCount} / {words.length}
        </p>
        <p className="text-gray-400 text-sm">个词写对了</p>
        {notes && <p className="text-xs text-gray-500 mt-2 italic">{notes}</p>}
      </div>

      {/* Coins */}
      {coinsEarned > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-bold text-amber-700">获得金币</span>
          <span className="flex items-center gap-1 font-black text-amber-700">
            +{coinsEarned} <GoldCoin size="sm" />
          </span>
        </div>
      )}

      {/* Photo thumbnail */}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="手写答案" className="w-full max-h-48 rounded-2xl object-contain bg-gray-50 border border-gray-200" />
      )}

      {/* Word-by-word breakdown */}
      <div className="space-y-2">
        {results.map((r) => {
          const word = words[r.index];
          return (
            <div key={r.index}
              className={["rounded-2xl px-4 py-3 flex items-center gap-3", r.correct ? "bg-jade-50 border border-jade-200" : "bg-red-50 border border-red-200"].join(" ")}>
              <Badge variant={r.correct ? "green" : "red"}>
                {r.correct ? "✓" : "✗"}
              </Badge>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold cjk text-gray-800">{r.expected}</span>
                  {!r.correct && r.written && (
                    <span className="text-sm text-red-500 cjk">（写了：{r.written}）</span>
                  )}
                </div>
                {word?.pinyin && <p className="text-xs text-brand-400">{word.pinyin}</p>}
                {word?.meaning && <p className="text-xs text-gray-400">{word.meaning}</p>}
              </div>
              <AudioButton text={r.expected} size="sm" />
            </div>
          );
        })}
      </div>

      {/* Retry / Home buttons */}
      <div className="space-y-2 pb-4">
        <Button fullWidth size="lg" variant="ghost"
          onClick={() => { setPhase("shoot"); setPreview(""); sessionSaved.current = false; }}>
          重新拍照 Retry
        </Button>
        <Button fullWidth size="lg"
          onClick={() => { window.location.href = "/student/dashboard"; }}>
          返回主页 Home
        </Button>
      </div>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────

function HandwritingContent() {
  const params = useSearchParams();
  const { store } = useStore();

  const paramListId  = params.get("list")  ?? "";
  const paramChildId = params.get("child") ?? store.children[0]?.id ?? "";

  const [listId, setListId]   = useState(paramListId);
  const [childId]             = useState(paramChildId);

  const child = store.children.find((c) => c.id === childId);

  if (!listId) {
    return (
      <AppShell title="AI 批改手写" backHref="/student/dashboard">
        <div className="space-y-4 page-enter">
          <p className="text-sm text-gray-500">选择要听写的词表：</p>
          <ListPicker childId={childId} onSelect={setListId} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`AI 批改 · ${child?.name ?? "学生"}`}
      backHref="/student/dashboard"
    >
      <GradeFlow listId={listId} childId={childId} />
    </AppShell>
  );
}

export default function HandwritingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <HandwritingContent />
    </Suspense>
  );
}
