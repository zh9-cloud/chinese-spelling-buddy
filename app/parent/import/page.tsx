"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Batch import: upload a PDF (multi-page) and/or several photos of dictation
//  sheets. AI detects every 听写单, then the parent assigns a child + dates to
//  each and saves them all at once.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/context/StoreContext";
import { newId } from "@/lib/storage";
import { filesToImages } from "@/lib/pdfToImages";
import type { DictationList, Word } from "@/lib/types";

interface WordRow {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  isSentence?: boolean;
}

interface ImportedList {
  id: string;
  childId: string;
  title: string;
  dictationDate: string;
  reminderDate: string;
  dayOfWeek: string; // OCR hint, display-only
  rows: WordRow[];
}

type Phase = "pick" | "processing" | "review";

interface ApiList {
  lesson: string;
  title: string;
  date: string;
  dayOfWeek: string;
  words: { word: string; pinyin?: string; meaning?: string; isSentence?: boolean }[];
}

export default function ImportPage() {
  const router = useRouter();
  const { store, addDictationList } = useStore();

  const [phase, setPhase] = useState<Phase>("pick");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [lists, setLists] = useState<ImportedList[]>([]);

  const today = new Date().toISOString().split("T")[0];
  const onlyChild = store.children.length === 1 ? store.children[0].id : "";

  // ── Upload + detect ────────────────────────────────────────────────────────
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      setPhase("processing");
      setError("");
      try {
        setProgress("正在读取文件…");
        const images = await filesToImages(files);
        if (!images.length) throw new Error("没有可识别的页面");

        setProgress(`正在识别 ${images.length} 页…`);
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images }),
        });
        if (!res.ok) {
          const e = (await res.json()) as { error?: string };
          throw new Error(e.error ?? "识别失败");
        }
        const data = (await res.json()) as { lists: ApiList[] };
        if (!data.lists?.length) throw new Error("未检测到任何听写单，请确认文件清晰");

        setProgress("正在补全拼音和意思…");
        const built: ImportedList[] = await Promise.all(
          data.lists.map(async (l) => {
            const rows: WordRow[] = await Promise.all(
              l.words.map(async (w) => {
                const base: WordRow = {
                  id: newId(),
                  word: w.word,
                  pinyin: w.pinyin ?? "",
                  meaning: w.meaning ?? "",
                  isSentence: w.isSentence,
                };
                if (base.meaning) return base;
                try {
                  const r = await fetch(`/api/lookup?word=${encodeURIComponent(base.word)}`);
                  if (!r.ok) return base;
                  const d = (await r.json()) as { pinyin?: string; meaning?: string };
                  return {
                    ...base,
                    pinyin: base.pinyin || d.pinyin || "",
                    meaning: d.meaning || "",
                  };
                } catch {
                  return base;
                }
              })
            );
            return {
              id: newId(),
              childId: onlyChild,
              title: l.title || l.lesson || "",
              dictationDate: l.date || "",
              reminderDate: "",
              dayOfWeek: l.dayOfWeek || "",
              rows,
            };
          })
        );
        setLists(built);
        setPhase("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : "识别失败，请重试");
        setPhase("pick");
      }
    },
    [onlyChild]
  );

  // ── Per-list editing ────────────────────────────────────────────────────────
  function patchList(id: string, patch: Partial<ImportedList>) {
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function patchRow(listId: string, rowId: string, field: keyof WordRow, value: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, rows: l.rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)) }
          : l
      )
    );
  }
  function addRow(listId: string) {
    setLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? { ...l, rows: [...l.rows, { id: newId(), word: "", pinyin: "", meaning: "" }] }
          : l
      )
    );
  }
  function removeRow(listId: string, rowId: string) {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, rows: l.rows.filter((r) => r.id !== rowId) } : l))
    );
  }
  function removeList(listId: string) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  // ── Validation + save ─────────────────────────────────────────────────────
  function listIsValid(l: ImportedList): boolean {
    return !!(
      l.title.trim() &&
      l.childId &&
      l.dictationDate &&
      l.reminderDate &&
      l.rows.some((r) => r.word.trim())
    );
  }
  const allValid = lists.length > 0 && lists.every(listIsValid);

  function saveAll() {
    if (!allValid) return;
    for (const l of lists) {
      const words: Word[] = l.rows
        .filter((r) => r.word.trim())
        .map((r) => ({
          id: r.id,
          word: r.word.trim(),
          pinyin: r.pinyin.trim() || undefined,
          meaning: r.meaning.trim() || undefined,
          isSentence: r.isSentence || undefined,
        }));
      const dl: DictationList = {
        id: newId(),
        childId: l.childId,
        title: l.title.trim(),
        dictationDate: l.dictationDate,
        reminderDate: l.reminderDate,
        words,
        createdAt: new Date().toISOString(),
      };
      addDictationList(dl);
    }
    router.push("/parent/dashboard");
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (phase === "processing") {
    return (
      <AppShell title="批量导入" backHref="/parent/dashboard">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-5" />
          <p className="font-semibold text-gray-700">{progress || "AI 识别中…"}</p>
          <p className="text-xs text-gray-400 mt-2">多页 PDF 可能需要十几秒，请稍候</p>
        </div>
      </AppShell>
    );
  }

  if (phase === "pick") {
    return (
      <AppShell title="批量导入听写单" backHref="/parent/dashboard">
        <div className="space-y-5 page-enter">
          <Card>
            <p className="text-sm font-semibold text-gray-700 mb-1">📄 上传 PDF 或多张照片</p>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              支持多页 PDF（每页一个或多个听写单），也可一次选多张照片。AI 会自动识别每个听写单的课次、词语和句子，
              并忽略学校名、孩子姓名和鼓励语。识别后你可以逐个核对、分配孩子。
            </p>

            <label
              className={[
                "flex flex-col items-center justify-center gap-2 w-full rounded-2xl py-10 border-2 border-dashed cursor-pointer transition-all",
                "border-gray-200 hover:border-brand-300 hover:bg-brand-50",
              ].join(" ")}
            >
              <input
                type="file"
                accept="application/pdf,image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const fs = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  handleFiles(fs);
                }}
              />
              <span className="text-4xl">📄</span>
              <span className="text-gray-600 font-semibold text-sm">选择 PDF / 图片</span>
              <span className="text-xs text-gray-400">可多选</span>
            </label>

            {error && (
              <p className="text-xs text-red-500 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </Card>

          {store.children.length === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              你还没有添加孩子，导入后需要先到「孩子管理」添加孩子才能分配。
            </p>
          )}
        </div>
      </AppShell>
    );
  }

  // phase === "review"
  return (
    <AppShell title={`核对 ${lists.length} 个听写单`} backHref="/parent/dashboard">
      <div className="space-y-5 page-enter pb-28">
        <p className="text-sm text-gray-500">
          检测到 <strong className="text-brand-600">{lists.length}</strong> 个听写单。
          请给每个听写单选择孩子、确认日期，删掉多余内容后一键保存。
        </p>

        {lists.map((l, idx) => {
          const valid = listIsValid(l);
          return (
            <Card key={l.id} className={valid ? "" : "ring-1 ring-amber-300"}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  听写单 {idx + 1}
                  {l.dayOfWeek && <span className="ml-2 text-brand-500">· 老师注明：{l.dayOfWeek}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => removeList(l.id)}
                  className="text-xs text-gray-400 hover:text-red-500 font-semibold"
                >
                  删除此单 ✕
                </button>
              </div>

              {/* Child selector */}
              <p className="text-xs font-semibold text-gray-500 mb-1.5">分配给孩子 *</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {store.children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => patchList(l.id, { childId: c.id })}
                    className={[
                      "px-3 py-1.5 rounded-full text-sm font-semibold border transition-all",
                      l.childId === c.id
                        ? "bg-brand-500 text-white border-brand-500"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-brand-300",
                    ].join(" ")}
                  >
                    {c.name} <span className="opacity-60 text-xs">{c.grade}</span>
                  </button>
                ))}
                {store.children.length === 0 && (
                  <span className="text-xs text-amber-600">请先添加孩子</span>
                )}
              </div>

              {/* Title */}
              <input
                type="text"
                value={l.title}
                onChange={(e) => patchList(l.id, { title: e.target.value })}
                placeholder="听写标题，例如：第六课 生词"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white mb-3 cjk"
              />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 mb-1 block">听写日期 *</span>
                  <input
                    type="date"
                    value={l.dictationDate}
                    min={today}
                    onChange={(e) => patchList(l.id, { dictationDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-500 mb-1 block">提醒日期 *</span>
                  <input
                    type="date"
                    value={l.reminderDate}
                    min={today}
                    max={l.dictationDate || undefined}
                    onChange={(e) => patchList(l.id, { reminderDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-2.5 py-2 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white"
                  />
                </label>
              </div>

              {/* Words */}
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                词语 / 句子（{l.rows.filter((r) => r.word.trim()).length}）
              </p>
              <div className="space-y-1.5">
                {l.rows.map((r) => (
                  <div key={r.id} className="grid grid-cols-[2fr_2fr_3fr_auto] gap-1.5 items-center">
                    <input
                      type="text"
                      value={r.word}
                      onChange={(e) => patchRow(l.id, r.id, "word", e.target.value)}
                      placeholder="汉字"
                      className="border border-gray-200 rounded-lg px-2.5 py-2 text-base text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white w-full cjk"
                    />
                    <input
                      type="text"
                      value={r.pinyin}
                      onChange={(e) => patchRow(l.id, r.id, "pinyin", e.target.value)}
                      placeholder="拼音"
                      className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white w-full"
                    />
                    <input
                      type="text"
                      value={r.meaning}
                      onChange={(e) => patchRow(l.id, r.id, "meaning", e.target.value)}
                      placeholder="意思"
                      className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white w-full"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(l.id, r.id)}
                      className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 rounded-lg"
                      aria-label="删除"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addRow(l.id)}
                className="mt-2 w-full border-2 border-dashed border-gray-200 rounded-lg py-2 text-xs text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
              >
                ＋ 添加一行
              </button>
            </Card>
          );
        })}

        {lists.length === 0 && (
          <Card>
            <p className="text-sm text-gray-400 text-center py-6">没有听写单了。返回重新上传。</p>
          </Card>
        )}
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 max-w-md mx-auto">
        <Button fullWidth size="lg" onClick={saveAll} disabled={!allValid}>
          {allValid
            ? `✓ 保存全部（${lists.length} 个听写单）`
            : "请为每个听写单填好孩子和日期"}
        </Button>
      </div>
    </AppShell>
  );
}
