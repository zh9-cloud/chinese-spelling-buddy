"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/context/StoreContext";
import { weekdayLabel } from "@/lib/mockData";

function AssignedListsContent() {
  const params = useSearchParams();
  const { store } = useStore();
  const childId = params.get("child") ?? store.children[0]?.id ?? "";
  const child = store.children.find((c) => c.id === childId);
  const [filter, setFilter] = useState<"all" | "done">("all");

  function scoreForList(listId: string): { correct: number; total: number } | null {
    const s = store.sessions
      .filter((x) => x.dictationListId === listId && x.completedAt)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
    if (!s) return null;
    return { correct: s.wordResults.filter((r) => r.correct).length, total: s.wordResults.length };
  }

  const today = new Date().toISOString().split("T")[0];
  const lists = store.dictationLists
    .filter((d) => d.childId === childId)
    .map((d) => ({ d, score: scoreForList(d.id) }))
    .sort((a, b) => {
      // Upcoming (future) first ascending, then past descending.
      const af = a.d.dictationDate >= today, bf = b.d.dictationDate >= today;
      if (af !== bf) return af ? -1 : 1;
      return af ? a.d.dictationDate.localeCompare(b.d.dictationDate) : b.d.dictationDate.localeCompare(a.d.dictationDate);
    });
  const doneCount = lists.filter((x) => x.score).length;
  const shown = filter === "done" ? lists.filter((x) => x.score) : lists;

  return (
    <AppShell title="老师布置的听写" backHref={`/student/dashboard?child=${childId}`}>
      <div className="space-y-4 page-enter">
        {child && (
          <p className="text-xs text-gray-400 px-1">{child.name} · {child.grade}</p>
        )}

        <div className="flex gap-2">
          {([["all", `全部 ${lists.length}`], ["done", `已完成 ${doneCount}`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={[
                "flex-1 rounded-xl py-2 text-sm font-bold transition-all",
                filter === key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500",
              ].join(" ")}>
              {label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState icon="📭" title={filter === "done" ? "还没有完成的听写" : "暂无听写"} description="" />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {shown.map(({ d, score }) => {
              const isPast = d.dictationDate < today;
              return (
                <div key={d.id} className={`flex items-center gap-3 px-4 py-3 ${isPast && !score ? "opacity-70" : ""}`}>
                  <div className="text-center w-11 shrink-0">
                    <p className="text-sm font-black text-gray-700">{Number(d.dictationDate.slice(8, 10))}</p>
                    <p className="text-[11px] text-gray-400">{weekdayLabel(d.dictationDate)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate cjk">{d.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.dictationDate} · {d.words.length} 词</p>
                  </div>
                  {score && (
                    <span className="text-[11px] font-bold text-jade-600 bg-jade-50 rounded-full px-2 py-0.5 shrink-0">{score.correct}/{score.total}</span>
                  )}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Link href={`/student/learn?list=${d.id}`} className="text-xs font-bold text-brand-500 hover:opacity-70">学</Link>
                    <Link href={`/student/test?list=${d.id}`} className="text-xs font-bold text-jade-600 hover:opacity-70">测</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function AssignedListsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>}>
      <AssignedListsContent />
    </Suspense>
  );
}
