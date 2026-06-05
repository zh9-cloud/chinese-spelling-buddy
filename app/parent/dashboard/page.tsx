"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ChildSelector } from "@/components/shared/ChildSelector";
import { UpcomingDictationCard } from "@/components/parent/UpcomingDictationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { loadStore } from "@/lib/storage";
import { getUpcomingDictation, getDaysUntil } from "@/lib/mockData";
import { getCoins } from "@/lib/storage";

// Must match the THEMES array in student/dashboard/page.tsx
const THEMES = [
  { page: "bg-amber-50", cardBorder: "border-amber-400", selectorOn: "border-amber-400 bg-amber-50 text-amber-700", add: "bg-amber-500 hover:bg-amber-600 shadow-amber-200" },
  { page: "bg-teal-50",  cardBorder: "border-teal-400",  selectorOn: "border-teal-400 bg-teal-50 text-teal-700",   add: "bg-teal-600  hover:bg-teal-700  shadow-teal-200"  },
  { page: "bg-purple-50",cardBorder: "border-purple-400",selectorOn: "border-purple-400 bg-purple-50 text-purple-700", add: "bg-purple-500 hover:bg-purple-600 shadow-purple-200" },
];

export default function ParentDashboard() {
  const store = loadStore();
  const [activeChildId, setActiveChildId] = useState(store.children[0]?.id ?? "");

  const childIndex = store.children.findIndex((c) => c.id === activeChildId);
  const theme = THEMES[Math.max(0, childIndex) % THEMES.length];

  const upcoming = getUpcomingDictation(activeChildId, store.dictationLists);
  const coinsByChildId = Object.fromEntries(store.children.map((c) => [c.id, getCoins(c.id)]));

  // Most recent completed session per child (for the summary row)
  const lastSessionPerChild = store.children.map((child) => {
    const session = store.sessions
      .filter((s) => s.childId === child.id && s.completedAt)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
    if (!session) return { child, session: null, dictation: null, score: null };
    const dictation = store.dictationLists.find((d) => d.id === session.dictationListId) ?? null;
    const correct = session.wordResults.filter((r) => r.correct).length;
    const total = session.wordResults.length;
    return { child, session, dictation, score: { correct, total } };
  });

  const today = new Date().toISOString().split("T")[0];
  // All dictations except the one already shown in the upcoming card
  const otherDictations = store.dictationLists
    .filter((d) => d.childId === activeChildId && d.id !== upcoming?.id)
    .sort((a, b) => a.dictationDate.localeCompare(b.dictationDate));
  const futureDictations = otherDictations.filter((d) => d.dictationDate >= today);
  const pastDictations = [...otherDictations.filter((d) => d.dictationDate < today)].reverse();

  return (
    <AppShell
      title="家长页面"
      rightSlot={<Link href="/" className="text-sm text-gray-400 hover:text-gray-600">退出 Exit</Link>}
    >
      <div className="space-y-6 page-enter">

        {/* Child selector */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">选择孩子 Children</h2>
            <Link
              href="/parent/children"
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              编辑
            </Link>
          </div>
          <ChildSelector
            childList={store.children}
            activeChildId={activeChildId}
            onSelect={setActiveChildId}
            coinsByChildId={coinsByChildId}
          />

          {/* Most recent practice */}
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">最近练习 Recent Practice</p>
            <div className="space-y-2">
              {lastSessionPerChild.map(({ child, dictation, score, session }, i) => {
                const t = THEMES[i % THEMES.length];
                const borderColor = t.cardBorder; // e.g. "border-amber-400"
                const pct = score ? Math.round((score.correct / score.total) * 100) : 0;
                const barColor = score
                  ? pct === 100 ? "bg-jade-500" : pct >= 60 ? "bg-brand-400" : "bg-red-400"
                  : "bg-gray-200";
                const dateStr = session?.completedAt
                  ? new Date(session.completedAt).toLocaleDateString("zh-SG", { month: "short", day: "numeric" })
                  : null;

                return (
                  <div key={child.id}
                    className={`bg-white rounded-xl border-2 ${borderColor} px-4 py-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-gray-700">{child.name}</span>
                      {dateStr && <span className="text-xs text-gray-400">{dateStr}</span>}
                    </div>

                    {score && dictation ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-600 cjk truncate flex-1">{dictation.title}</p>
                          <span className="text-xs text-gray-400 shrink-0">{dictation.words.length} 词 · {dictation.dictationDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-gray-500 shrink-0">
                            {score.correct}/{score.total} · {pct}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300">暂无练习记录 No records yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming dictation */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">即将到来的听写 Upcoming</h2>
            <Link href="/parent/add-dictation"
              className="text-sm text-brand-600 font-semibold hover:text-brand-700">
              ＋ 添加
            </Link>
          </div>

          {upcoming ? (
            <UpcomingDictationCard dictation={upcoming} accentBorder={theme.cardBorder} />
          ) : (
            <EmptyState
              icon="📅"
              title="暂无即将到来的听写"
              description={'点击【添加】按钮来创建第一个听写列表'}
              action={
                <Link href="/parent/add-dictation"
                  className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:bg-brand-600 active:scale-95 transition-all">
                  ＋ 添加听写列表 Add List
                </Link>
              }
            />
          )}
        </section>

        {/* Other dictations — compact uniform rows, upcoming in colour, past in gray */}
        {otherDictations.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">全部听写列表 All Lists</h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {futureDictations.map((d) => {
                const days = getDaysUntil(d.dictationDate);
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${theme.cardBorder.replace("border-", "bg-")}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate cjk">{d.title}</p>
                      <p className="text-xs text-gray-400">{d.dictationDate} · {d.words.length} 词</p>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${days <= 2 ? "text-red-500" : days <= 5 ? "text-brand-500" : "text-jade-600"}`}>
                      {days === 0 ? "今天" : days < 0 ? "已过期" : `${days}天`}
                    </span>
                    <Link href={`/parent/add-dictation?edit=${d.id}`}
                      className="text-xs font-semibold text-gray-400 hover:text-gray-600 shrink-0 ml-1">
                      编辑
                    </Link>
                  </div>
                );
              })}
              {pastDictations.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 opacity-50">
                  <div className="w-2 h-2 rounded-full shrink-0 bg-gray-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 truncate cjk">{d.title}</p>
                    <p className="text-xs text-gray-400">{d.dictationDate} · {d.words.length} 词</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">已过期</span>
                  <Link href={`/parent/add-dictation?edit=${d.id}`}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 shrink-0 ml-1">
                    编辑
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="h-20" />
      </div>

      {/* Floating add button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-full px-4">
        <Link href="/parent/add-dictation"
          className={`flex items-center justify-center gap-2 w-full text-white font-bold text-base rounded-2xl py-4 shadow-xl transition-all duration-150 active:scale-95 ${theme.add}`}>
          ＋ 添加听写列表 Add List
        </Link>
      </div>
    </AppShell>
  );
}
