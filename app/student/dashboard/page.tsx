"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoldCoin } from "@/components/ui/GoldCoin";
import { useStore } from "@/context/StoreContext";
import { getUpcomingDictation, weekdayLabel, getDaysUntil } from "@/lib/mockData";
import { computeStreak } from "@/lib/streak";
import type { Word } from "@/lib/types";

// One theme per child slot (paper hero, accent button, chips).
const CHILD_THEME = [
  { paper: "bg-amber-50 border-amber-200",  btn: "bg-amber-500 hover:bg-amber-600",  chip: "bg-amber-50 text-amber-700",  pill: "bg-amber-50 border-amber-200 text-amber-700" },
  { paper: "bg-teal-50 border-teal-200",    btn: "bg-teal-600 hover:bg-teal-700",    chip: "bg-teal-50 text-teal-700",    pill: "bg-teal-50 border-teal-200 text-teal-700" },
  { paper: "bg-purple-50 border-purple-200",btn: "bg-purple-500 hover:bg-purple-600",chip: "bg-purple-50 text-purple-700",pill: "bg-purple-50 border-purple-200 text-purple-700" },
];

function wordPreview(words: Word[]): { head: string; more: string } {
  const arr = words.map((w) => w.word);
  return { head: arr.slice(0, 4).join(" · "), more: arr.length > 4 ? ` … +${arr.length - 4}` : "" };
}

function StudentDashboardContent() {
  const params = useSearchParams();
  const { store, getCoins } = useStore();
  const activeChildId = params.get("child") ?? store.children[0]?.id ?? "";

  const childIndex = Math.max(0, store.children.findIndex((c) => c.id === activeChildId));
  const child = store.children[childIndex];
  const theme = CHILD_THEME[childIndex % CHILD_THEME.length];
  const coins = getCoins(activeChildId);
  const streak = computeStreak(store.sessions, activeChildId);

  // Hero = the next upcoming dictation, else the most recent one.
  const upcoming = child ? getUpcomingDictation(activeChildId, store.dictationLists) : undefined;
  const childLists = store.dictationLists
    .filter((d) => d.childId === activeChildId)
    .sort((a, b) => b.dictationDate.localeCompare(a.dictationDate));
  const hero = upcoming ?? childLists[0];

  const heroWordIds = new Set(hero?.words.map((w) => w.id) ?? []);
  const hasMistakes = store.mistakes.some((m) => m.childId === activeChildId && heroWordIds.has(m.wordId));

  const today = new Date().toISOString().split("T")[0];
  const days = hero ? getDaysUntil(hero.dictationDate) : null;
  const heroBadge =
    days === null ? "" : days < 0 ? "已过" : days === 0 ? "今天" : days === 1 ? "明天听写" : `${days} 天后`;
  const heroBadgeCls = days !== null && days >= 0 && days <= 1 ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600";

  const sentences = hero ? hero.words.filter((w) => w.isSentence).length : 0;
  const vocab = hero ? hero.words.length - sentences : 0;
  const { head, more } = hero ? wordPreview(hero.words) : { head: "", more: "" };

  const ACTIONS = hero
    ? [
        { href: `/student/learn?list=${hero.id}`, icon: "ti-book-2", color: "text-amber-500", label: "学习", en: "Learn", disabled: false },
        { href: `/student/test?list=${hero.id}`, icon: "ti-pencil", color: "text-teal-600", label: "测验", en: "Test", disabled: false },
        { href: `/student/mistakes?child=${activeChildId}`, icon: "ti-notebook", color: "text-rose-500", label: "错字本", en: "Mistakes", disabled: !hasMistakes },
        { href: `/student/handwriting?list=${hero.id}&child=${activeChildId}`, icon: "ti-camera-check", color: "text-indigo-500", label: "AI 批改", en: "AI grade", disabled: false },
      ]
    : [];

  return (
    <AppShell
      title={child ? `${child.name} · ${child.grade}` : "学生"}
      rightSlot={
        <span className={`flex items-center gap-1 border rounded-full pl-1.5 pr-2.5 py-0.5 text-xs font-black ${theme.pill}`}>
          <GoldCoin size="sm" /> {coins}
        </span>
      }
      bottomBar={<BottomTabBar active={activeChildId} />}
    >
      <div className="space-y-5 page-enter">

        {!child ? (
          <EmptyState icon="👋" title="还没有孩子" description="请家长先在「设置 → 孩子管理」添加孩子。" />
        ) : !hero ? (
          <EmptyState icon="📅" title="暂无听写" description="等待家长添加听写列表后再来练习吧！" />
        ) : (
          <>
            {/* Hero card */}
            <div className={`rounded-2xl border p-4 ${theme.paper}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${heroBadgeCls}`}>{heroBadge}</span>
                <span className="ml-auto text-xs text-gray-500">{hero.dictationDate} {weekdayLabel(hero.dictationDate)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xl font-bold text-gray-800 cjk min-w-0">{hero.title}</p>
                <p className="text-[13px] text-gray-500 shrink-0 whitespace-nowrap">{vocab} 个词{sentences > 0 ? ` · ${sentences} 个句子` : ""}</p>
              </div>
              <p className="text-[14px] text-gray-600 mt-2 cjk truncate">{head}<span className="text-gray-300">{more}</span></p>
              <Link href={`/student/learn?list=${hero.id}`}
                className={`mt-3.5 block text-center text-white font-bold rounded-xl py-3 text-[15px] active:scale-95 transition-all ${theme.btn}`}>
                开始学习 →
              </Link>
            </div>

            {/* Streak / 连续打卡 */}
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <i className={`ti ti-flame text-2xl ${streak.current > 0 ? "text-orange-500" : "text-gray-300"}`} aria-hidden="true" />
                <span className="text-[15px] font-bold text-gray-800">
                  {streak.current > 0 ? <>连续打卡 <span className="text-orange-500">{streak.current}</span> 天</> : "今天还没练，开始打卡！"}
                </span>
                {streak.longest > 1 && (
                  <span className="ml-auto text-[11px] text-gray-400">最长 {streak.longest} 天</span>
                )}
              </div>
              <div className="flex justify-between">
                {streak.last7.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-1">
                    <span className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                      d.practiced ? "bg-orange-500 text-white" : d.isToday ? "border-2 border-orange-300 text-orange-400" : "bg-gray-100 text-gray-300",
                    ].join(" ")}>
                      {d.practiced ? <i className="ti ti-check" aria-hidden="true" /> : ""}
                    </span>
                    <span className={`text-[10px] ${d.isToday ? "text-orange-500 font-bold" : "text-gray-400"}`}>{d.weekday}</span>
                  </div>
                ))}
              </div>
              <Link href={`/report?child=${activeChildId}`}
                className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 border-t border-gray-100 pt-2.5 hover:text-brand-600">
                <i className="ti ti-chart-bar" aria-hidden="true" />本周报告 · 分享成绩
                <i className="ti ti-chevron-right" aria-hidden="true" />
              </Link>
            </div>

            {/* Practice grid */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">练习 Practice</h2>
              <div className="grid grid-cols-2 gap-3">
                {ACTIONS.map((a) => (
                  a.disabled ? (
                    <div key={a.label} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-4 opacity-40">
                      <i className={`ti ${a.icon} text-[2.75rem] leading-none text-gray-400`} aria-hidden="true" />
                      <span className="flex flex-col leading-tight">
                        <span className="text-[15px] font-bold text-gray-500">{a.label}</span>
                        <span className="text-xs text-gray-400">{a.en}</span>
                      </span>
                    </div>
                  ) : (
                    <Link key={a.label} href={a.href}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-4 hover:border-gray-300 active:scale-95 transition-all">
                      <i className={`ti ${a.icon} text-[2.75rem] leading-none ${a.color}`} aria-hidden="true" />
                      <span className="flex flex-col leading-tight">
                        <span className="text-[15px] font-bold text-gray-700">{a.label}</span>
                        <span className="text-xs text-gray-400">{a.en}</span>
                      </span>
                    </Link>
                  )
                ))}
              </div>
            </section>

            {/* Browse by category */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">按分类浏览 Browse</h2>
              <div className="space-y-2.5">
                <Link href={`/student/lists?child=${activeChildId}`}
                  className={`flex items-center gap-2.5 rounded-2xl px-4 py-3.5 font-bold text-[15px] active:scale-[0.99] transition-all ${theme.chip}`}>
                  <i className="ti ti-school text-xl" aria-hidden="true" />老师布置的听写
                  <i className="ti ti-chevron-right ml-auto opacity-60" aria-hidden="true" />
                </Link>
                <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3.5 font-bold text-[15px] bg-indigo-50 text-indigo-600">
                  <i className="ti ti-books text-xl" aria-hidden="true" />课本生词表 P1–P6
                  <span className="ml-auto text-[11px] font-bold bg-white text-indigo-500 rounded-full px-2 py-0.5">即将开放</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2 rounded-2xl px-4 py-3.5 font-bold text-[15px] bg-gray-100 text-gray-400">
                    <i className="ti ti-microphone text-xl" aria-hidden="true" />口语<i className="ti ti-lock ml-auto text-sm" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl px-4 py-3.5 font-bold text-[15px] bg-gray-100 text-gray-400">
                    <i className="ti ti-writing text-xl" aria-hidden="true" />写作<i className="ti ti-lock ml-auto text-sm" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-center text-[11px] text-gray-300">口语、写作 — 敬请期待 coming soon</p>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>}>
      <StudentDashboardContent />
    </Suspense>
  );
}
