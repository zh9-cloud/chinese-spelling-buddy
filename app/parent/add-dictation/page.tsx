"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/context/StoreContext";
import { newId } from "@/lib/storage";
import type { DictationList, Word } from "@/lib/types";
import {
  getTermStarts, setTermStarts, termWeekToDate, reminderTimes, weekdayShort,
  type TermStarts,
} from "@/lib/sgCalendar";

function toDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function autoReminderDate(dictationDate: string): string {
  const { weekendReview } = reminderTimes(dictationDate);
  return weekendReview ? toDateStr(weekendReview) : dictationDate;
}

interface WordRow {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  isSentence?: boolean;
}

function rowsFromWords(words: Word[]): WordRow[] {
  return words.map((w) => ({
    id: w.id,
    word: w.word,
    pinyin: w.pinyin ?? "",
    meaning: w.meaning ?? "",
    isSentence: w.isSentence,
  }));
}

function emptyRow(): WordRow {
  return { id: newId(), word: "", pinyin: "", meaning: "" };
}

// ─────────────────────────────────────────────
//  Inner form — uses useSearchParams so it must
//  be wrapped in <Suspense> by the default export
// ─────────────────────────────────────────────
function AddDictationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");          // present when editing

  const { store, addDictationList, updateDictationList } = useStore();
  const existing = editId
    ? store.dictationLists.find((d) => d.id === editId)
    : undefined;

  // Pre-fill from existing list when editing
  const [title, setTitle] = useState(existing?.title ?? "");
  const [selectedChildId, setSelectedChildId] = useState(
    existing?.childId ?? store.children[0]?.id ?? ""
  );
  const [dictationDate, setDictationDate] = useState(existing?.dictationDate ?? "");

  // Date input: "date" (pick a date) or "term" (Term · Week · Day → auto date)
  const [dateMode, setDateMode] = useState<"date" | "term">("date");
  const [term, setTerm] = useState(1);
  const [week, setWeek] = useState(1);
  const [weekday, setWeekday] = useState(3); // 1=Mon … default Wed
  const [termStartsState, setTermStartsState] = useState<TermStarts>(getTermStarts());
  const [showCalEdit, setShowCalEdit] = useState(false);

  // In term mode, recompute the dictation date from Term/Week/Day.
  useEffect(() => {
    if (dateMode !== "term") return;
    const d = termWeekToDate(term, week, weekday, termStartsState);
    if (d) setDictationDate(d);
  }, [dateMode, term, week, weekday, termStartsState]);

  function updateTermStart(key: keyof TermStarts, value: string) {
    const next = { ...termStartsState, [key]: value };
    setTermStartsState(next);
    setTermStarts(next);
  }

  const [rows, setRows] = useState<WordRow[]>(() =>
    existing?.words.length
      ? rowsFromWords(existing.words)
      : [emptyRow(), emptyRow(), emptyRow()]
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!existing;

  const [lookingUp, setLookingUp] = useState<Set<string>>(new Set());

  // When editing an existing list, auto-fill meanings for any items that are missing them.
  // This catches sentences (and words) saved before the auto-lookup feature was added.
  useEffect(() => {
    if (!isEditing) return;
    const missing = rows.filter((r) => r.word.trim() && !r.meaning);
    if (!missing.length) return;

    missing.forEach(async (row) => {
      setLookingUp((prev) => new Set(prev).add(row.id));
      try {
        const res = await fetch(`/api/lookup?word=${encodeURIComponent(row.word.trim())}`);
        if (!res.ok) return;
        const d = await res.json() as { pinyin?: string; meaning?: string };
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, pinyin: r.pinyin || d.pinyin || "", meaning: r.meaning || d.meaning || "" }
              : r
          )
        );
      } catch {
        // silently ignore
      } finally {
        setLookingUp((prev) => { const s = new Set(prev); s.delete(row.id); return s; });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  function updateRow(id: string, field: keyof WordRow, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // Called when the user finishes typing a Chinese word (onBlur)
  async function autoLookup(id: string, word: string) {
    const trimmed = word.trim();
    if (!trimmed) return;

    // Only auto-fill if pinyin/meaning are still empty
    const row = rows.find((r) => r.id === id);
    if (!row || (row.pinyin && row.meaning)) return;

    setLookingUp((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/lookup?word=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const data = await res.json() as { pinyin?: string; meaning?: string };
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                pinyin:  r.pinyin  || data.pinyin  || "",
                meaning: r.meaning || data.meaning || "",
              }
            : r
        )
      );
    } catch {
      // silently ignore lookup failures
    } finally {
      setLookingUp((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleBulkPaste(raw: string) {
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setRows(
      lines.map((line) => {
        const parts = line.split(/\t|｜|\|/).map((p) => p.trim());
        return { id: newId(), word: parts[0] ?? "", pinyin: parts[1] ?? "", meaning: parts[2] ?? "" };
      })
    );
  }

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim())       e.title = "请输入听写标题 · Enter a title";
    if (!selectedChildId)    e.child = "请选择孩子 · Choose a child";
    if (!dictationDate)      e.dictationDate = "请选择听写日期 · Pick the spelling date";
    if (!rows.some((r) => r.word.trim())) e.words = "请至少输入一个生词 · Add at least one word";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [title, selectedChildId, dictationDate, rows]);

  function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);

    const reminderDate = autoReminderDate(dictationDate); // auto: the Saturday before

    const words: Word[] = rows
      .filter((r) => r.word.trim())
      .map((r) => ({
        id: r.id,
        word: r.word.trim(),
        pinyin: r.pinyin.trim() || undefined,
        meaning: r.meaning.trim() || undefined,
        isSentence: r.isSentence || undefined,
      }));

    if (isEditing && existing) {
      const updated: DictationList = {
        ...existing,
        title: title.trim(),
        childId: selectedChildId,
        dictationDate,
        reminderDate,
        words,
      };
      updateDictationList(updated);
    } else {
      const list: DictationList = {
        id: newId(),
        childId: selectedChildId,
        title: title.trim(),
        dictationDate,
        reminderDate,
        words,
        createdAt: new Date().toISOString(),
      };
      addDictationList(list);
    }

    router.push("/parent/dashboard");
  }

  const today = new Date().toISOString().split("T")[0];
  const filledCount = rows.filter((r) => r.word.trim()).length;

  return (
    <AppShell
      title={isEditing ? "编辑听写列表 Edit List" : "添加听写列表 Add List"}
      backHref="/parent/dashboard"
    >
      <div className="space-y-5 page-enter pb-28">

        {/* Title */}
        <Card>
          <label className="block">
            <span className="text-sm font-semibold text-gray-600 mb-1.5 block">
              听写标题 Title <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：第五课 生词 · e.g. Lesson 5"
              className={[
                "w-full border rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50",
                "focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white placeholder:text-gray-300",
                errors.title ? "border-red-400" : "border-gray-200",
              ].join(" ")}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </label>
        </Card>

        {/* Student */}
        <Card>
          <p className="text-sm font-semibold text-gray-600 mb-2">
            选择学生 Student <span className="text-red-400">*</span>
          </p>
          <div className="space-y-2">
            {store.children.map((child) => (
              <label
                key={child.id}
                className={[
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  selectedChildId === child.id
                    ? "border-brand-400 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300",
                ].join(" ")}
              >
                <input
                  type="radio" name="child" value={child.id}
                  checked={selectedChildId === child.id}
                  onChange={() => setSelectedChildId(child.id)}
                  className="accent-brand-500 w-4 h-4"
                />
                <span className="font-medium text-gray-800">{child.name}</span>
                <span className="text-sm text-gray-400 ml-auto">{child.grade}</span>
              </label>
            ))}
          </div>
          {errors.child && <p className="text-red-500 text-xs mt-1">{errors.child}</p>}
        </Card>

        {/* Spelling date — two input modes */}
        <Card>
          <span className="text-sm font-semibold text-gray-600 mb-2 block">
            听写日期 Spelling Date <span className="text-red-400">*</span>
          </span>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button type="button" onClick={() => setDateMode("date")}
              className={`rounded-lg py-2 text-sm font-semibold border transition-all ${dateMode === "date" ? "bg-brand-500 text-white border-brand-500" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
              📅 选日期 Pick date
            </button>
            <button type="button" onClick={() => setDateMode("term")}
              className={`rounded-lg py-2 text-sm font-semibold border transition-all ${dateMode === "term" ? "bg-brand-500 text-white border-brand-500" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
              🗓️ 按学期 By term
            </button>
          </div>

          {dateMode === "date" ? (
            <input
              type="date" value={dictationDate} min={today}
              onChange={(e) => setDictationDate(e.target.value)}
              className={[
                "w-full border rounded-lg px-4 py-3 text-base text-gray-800 bg-gray-50",
                "focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white",
                errors.dictationDate ? "border-red-400" : "border-gray-200",
              ].join(" ")}
            />
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <select value={term} onChange={(e) => setTerm(+e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300">
                  {[1, 2, 3, 4].map((t) => <option key={t} value={t}>Term {t}</option>)}
                </select>
                <select value={week} onChange={(e) => setWeek(+e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>第{w}周 Wk{w}</option>)}
                </select>
                <select value={weekday} onChange={(e) => setWeekday(+e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300">
                  {[["周一 Mon", 1], ["周二 Tue", 2], ["周三 Wed", 3], ["周四 Thu", 4], ["周五 Fri", 5], ["周六 Sat", 6], ["周日 Sun", 7]].map(([l, v]) => <option key={v as number} value={v as number}>{l}</option>)}
                </select>
              </div>
              {dictationDate && (
                <p className="text-sm text-brand-600 font-bold">→ {dictationDate} {weekdayShort(dictationDate)}</p>
              )}
              <button type="button" onClick={() => setShowCalEdit((v) => !v)}
                className="text-xs text-gray-400 hover:text-brand-500">
                {showCalEdit ? "▾" : "▸"} 校历设置 Term calendar（核对/修改开学日期）
              </button>
              {showCalEdit && (
                <div className="space-y-1.5 bg-gray-50 rounded-lg p-2.5">
                  {([["t1", "Term 1"], ["t2", "Term 2"], ["t3", "Term 3"], ["t4", "Term 4"]] as const).map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 text-xs">
                      <span className="w-14 text-gray-500 shrink-0">{label}</span>
                      <input type="date" value={termStartsState[k]}
                        onChange={(e) => updateTermStart(k, e.target.value)}
                        className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs bg-white" />
                    </label>
                  ))}
                  <p className="text-[0.65rem] text-gray-400">填每学期第 1 天(开学日)· Set each term&apos;s first day</p>
                </div>
              )}
            </div>
          )}
          {errors.dictationDate && <p className="text-red-500 text-xs mt-1">{errors.dictationDate}</p>}

          {dictationDate && (() => {
            const rt = reminderTimes(dictationDate);
            return (
              <div className="mt-3 text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                ⏰ 自动提醒 Auto reminders（系统自动设定 · no need to set）：<br />
                {rt.weekendReview && <>· 周末复习 Start revising：{toDateStr(rt.weekendReview)} 上午 9:00<br /></>}
                {rt.finalReview && <>· 前一晚 Final review：{toDateStr(rt.finalReview)} 18:00</>}
              </div>
            );
          })()}
        </Card>

        {/* Word list */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-600">
                生词列表 Words <span className="text-red-400">*</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">已填 {filledCount} 个词 · {filledCount} filled</p>
            </div>
            <button
              type="button"
              className="text-xs text-brand-600 font-medium border border-brand-200 rounded-lg px-2 py-1"
              onClick={() => {
                const raw = prompt("粘贴词表，每行一个词 · Paste words, one per line（可选 optional：词｜拼音｜意思）");
                if (raw) handleBulkPaste(raw);
              }}
            >
              批量粘贴 Paste
            </button>
          </div>

          {errors.words && <p className="text-red-500 text-xs mb-2">{errors.words}</p>}

          <div className="grid grid-cols-[2fr_2fr_3fr_auto] gap-1.5 mb-1.5 px-1">
            <p className="text-xs font-semibold text-gray-400">汉字 Hanzi</p>
            <p className="text-xs font-semibold text-gray-400">拼音 Pinyin</p>
            <p className="text-xs font-semibold text-gray-400">意思 Meaning</p>
            <p className="w-6" />
          </div>

          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={row.id} className="grid grid-cols-[2fr_2fr_3fr_auto] gap-1.5 items-center">
                {/* Chinese word — auto-lookup on blur */}
                <div className="relative">
                  <input
                    type="text" value={row.word}
                    onChange={(e) => updateRow(row.id, "word", e.target.value)}
                    onBlur={(e) => autoLookup(row.id, e.target.value)}
                    placeholder={`词 ${idx + 1}`}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-lg text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white w-full cjk"
                  />
                  {lookingUp.has(row.id) && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
                  )}
                </div>
                <input
                  type="text" value={row.pinyin}
                  onChange={(e) => updateRow(row.id, "pinyin", e.target.value)}
                  placeholder={lookingUp.has(row.id) ? "查询中…" : "pīn yīn"}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white w-full"
                />
                <input
                  type="text" value={row.meaning}
                  onChange={(e) => updateRow(row.id, "meaning", e.target.value)}
                  placeholder={lookingUp.has(row.id) ? "查询中…" : "English meaning"}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white w-full"
                />
                <button
                  type="button" onClick={() => removeRow(row.id)}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors rounded-lg"
                  aria-label="删除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button" onClick={addRow}
            className="mt-3 w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
          >
            ＋ 添加一行 Add Row
          </button>
        </Card>
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 max-w-md mx-auto">
        <Button fullWidth size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? "保存中… Saving…"
            : isEditing
            ? `✓ 保存修改 Save（${filledCount} 个词）`
            : `✓ 添加听写列表 Add（${filledCount} 个词）`}
        </Button>
      </div>
    </AppShell>
  );
}

// Suspense wrapper required because useSearchParams is used inside
export default function AddDictationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <AddDictationForm />
    </Suspense>
  );
}
