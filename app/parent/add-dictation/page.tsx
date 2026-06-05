"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { loadStore, addDictationList, updateDictationList, newId } from "@/lib/storage";
import type { DictationList, Word } from "@/lib/types";

interface WordRow {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
}

function rowsFromWords(words: Word[]): WordRow[] {
  return words.map((w) => ({
    id: w.id,
    word: w.word,
    pinyin: w.pinyin ?? "",
    meaning: w.meaning ?? "",
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

  const store = loadStore();
  const existing = editId
    ? store.dictationLists.find((d) => d.id === editId)
    : undefined;

  // Pre-fill from existing list when editing
  const [title, setTitle] = useState(existing?.title ?? "");
  const [selectedChildId, setSelectedChildId] = useState(
    existing?.childId ?? store.children[0]?.id ?? ""
  );
  const [dictationDate, setDictationDate] = useState(existing?.dictationDate ?? "");
  const [reminderDate, setReminderDate] = useState(existing?.reminderDate ?? "");
  const [rows, setRows] = useState<WordRow[]>(() =>
    existing?.words.length
      ? rowsFromWords(existing.words)
      : [emptyRow(), emptyRow(), emptyRow()]
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!existing;

  const [lookingUp, setLookingUp] = useState<Set<string>>(new Set());

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
    if (!title.trim())       e.title = "请输入听写标题";
    if (!selectedChildId)    e.child = "请选择孩子";
    if (!dictationDate)      e.dictationDate = "请选择听写日期";
    if (!reminderDate)       e.reminderDate = "请选择提醒日期";
    if (!rows.some((r) => r.word.trim())) e.words = "请至少输入一个生词";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [title, selectedChildId, dictationDate, reminderDate, rows]);

  function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);

    const words: Word[] = rows
      .filter((r) => r.word.trim())
      .map((r) => ({
        id: r.id,
        word: r.word.trim(),
        pinyin: r.pinyin.trim() || undefined,
        meaning: r.meaning.trim() || undefined,
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
      title={isEditing ? "编辑听写列表" : "添加听写列表"}
      backHref="/parent/dashboard"
    >
      <div className="space-y-5 page-enter pb-28">

        {/* Title */}
        <Card>
          <label className="block">
            <span className="text-sm font-semibold text-gray-600 mb-1.5 block">
              听写标题 <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：第五课 生词"
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
            选择学生 <span className="text-red-400">*</span>
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

        {/* Dates */}
        <Card>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-600 mb-1.5 block">
                听写日期 <span className="text-red-400">*</span>
              </span>
              <input
                type="date" value={dictationDate} min={today}
                onChange={(e) => setDictationDate(e.target.value)}
                className={[
                  "w-full border rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50",
                  "focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white",
                  errors.dictationDate ? "border-red-400" : "border-gray-200",
                ].join(" ")}
              />
              {errors.dictationDate && <p className="text-red-500 text-xs mt-1">{errors.dictationDate}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-600 mb-1.5 block">
                开始温习提醒日期 <span className="text-red-400">*</span>
              </span>
              <input
                type="date" value={reminderDate} min={today}
                max={dictationDate || undefined}
                onChange={(e) => setReminderDate(e.target.value)}
                className={[
                  "w-full border rounded-xl px-4 py-3 text-base text-gray-800 bg-gray-50",
                  "focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white",
                  errors.reminderDate ? "border-red-400" : "border-gray-200",
                ].join(" ")}
              />
              {errors.reminderDate && <p className="text-red-500 text-xs mt-1">{errors.reminderDate}</p>}
            </label>
          </div>
        </Card>

        {/* Word list */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-600">
                生词列表 <span className="text-red-400">*</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">已填 {filledCount} 个词</p>
            </div>
            <button
              type="button"
              className="text-xs text-brand-600 font-medium border border-brand-200 rounded-lg px-2 py-1"
              onClick={() => {
                const raw = prompt("粘贴词表（每行一个词，可选：词｜拼音｜意思）");
                if (raw) handleBulkPaste(raw);
              }}
            >
              批量粘贴
            </button>
          </div>

          {errors.words && <p className="text-red-500 text-xs mb-2">{errors.words}</p>}

          <div className="grid grid-cols-[2fr_2fr_3fr_auto] gap-1.5 mb-1.5 px-1">
            <p className="text-xs font-semibold text-gray-400">汉字</p>
            <p className="text-xs font-semibold text-gray-400">拼音（选填）</p>
            <p className="text-xs font-semibold text-gray-400">意思（选填）</p>
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
            ＋ 添加一行
          </button>
        </Card>

        {/* Photo upload placeholder */}
        <Card>
          <div className="flex items-center gap-3 text-gray-400">
            <span className="text-3xl">📷</span>
            <div>
              <p className="font-semibold text-gray-500">照片上传（即将推出）</p>
              <p className="text-xs text-gray-400 mt-0.5">拍摄课本自动识别生词 · AI OCR coming soon</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 max-w-md mx-auto">
        <Button fullWidth size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? "保存中…"
            : isEditing
            ? `✓ 保存修改（${filledCount} 个词）`
            : `✓ 添加听写列表（${filledCount} 个词）`}
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
