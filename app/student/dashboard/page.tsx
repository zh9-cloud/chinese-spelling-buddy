"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { ModeButton, IconLearn, IconTest, IconMistakes } from "@/components/student/ModeButton";
import { ChildSelector } from "@/components/shared/ChildSelector";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/context/StoreContext";
import { GoldCoin } from "@/components/ui/GoldCoin";
import { getUpcomingDictation, getDaysUntil, weekdayLabel } from "@/lib/mockData";

// Soft, calming colour palette — one theme per child slot
const THEMES = [
  {
    // warm amber — Xiao Ming
    page:        "bg-amber-50",
    cardBorder:  "border-l-4 border-amber-400",
    cardBg:      "bg-white",
    progress:    "orange" as const,
    selectorOn:  "border-amber-400 bg-amber-50 text-amber-700",
    selectorOff: "border-gray-200 bg-white text-gray-500",
    badge:       "orange" as const,
    learnBg:     "bg-sky-100",   learnIcon: "text-sky-600",
    testBg:      "bg-amber-100", testIcon:  "text-amber-700",
    listBorder:  "border-amber-200",
    dot:         "bg-amber-400",
  },
  {
    // soft teal — Mei Ling
    page:        "bg-teal-50",
    cardBorder:  "border-l-4 border-teal-400",
    cardBg:      "bg-white",
    progress:    "green" as const,
    selectorOn:  "border-teal-400 bg-teal-50 text-teal-700",
    selectorOff: "border-gray-200 bg-white text-gray-500",
    badge:       "green" as const,
    learnBg:     "bg-teal-100",   learnIcon: "text-teal-700",
    testBg:      "bg-sky-100",    testIcon:  "text-sky-600",
    listBorder:  "border-teal-200",
    dot:         "bg-teal-400",
  },
  {
    // lavender — 3rd child
    page:        "bg-purple-50",
    cardBorder:  "border-l-4 border-purple-400",
    cardBg:      "bg-white",
    progress:    "blue" as const,
    selectorOn:  "border-purple-400 bg-purple-50 text-purple-700",
    selectorOff: "border-gray-200 bg-white text-gray-500",
    badge:       "purple" as const,
    learnBg:     "bg-purple-100", learnIcon: "text-purple-600",
    testBg:      "bg-sky-100",    testIcon:  "text-sky-600",
    listBorder:  "border-purple-200",
    dot:         "bg-purple-400",
  },
];

export default function StudentDashboard() {
  const { store, getCoins } = useStore();
  const [activeChildId, setActiveChildId] = useState(store.children[0]?.id ?? "");

  const childIndex = store.children.findIndex((c) => c.id === activeChildId);
  const theme = THEMES[Math.max(0, childIndex) % THEMES.length];
  const child = store.children[childIndex];
  const coins = getCoins(activeChildId);
  const coinsByChildId = Object.fromEntries(store.children.map((c) => [c.id, getCoins(c.id)]));
  const upcoming = child ? getUpcomingDictation(activeChildId, store.dictationLists) : undefined;

  const practicedWordIds = new Set(
    store.sessions
      .filter((s) => s.childId === activeChildId && s.dictationListId === upcoming?.id)
      .flatMap((s) => s.wordResults.map((r) => r.wordId))
  );
  const totalWords = upcoming?.words.length ?? 0;
  const practicedCount = upcoming
    ? upcoming.words.filter((w) => practicedWordIds.has(w.id)).length
    : 0;
  const upcomingPct = totalWords === 0 ? 0 : Math.round((practicedCount / totalWords) * 100);

  const upcomingWordIds = new Set(upcoming?.words.map((w) => w.id) ?? []);
  const hasMistakes = store.mistakes.some(
    (m) => m.childId === activeChildId && upcomingWordIds.has(m.wordId)
  );
  const days = upcoming ? getDaysUntil(upcoming.dictationDate) : null;

  const today = new Date().toISOString().split("T")[0];
  // All dictations excluding the one already shown in the top card
  const allDictations = store.dictationLists
    .filter((d) => d.childId === activeChildId && d.id !== upcoming?.id)
    .sort((a, b) => a.dictationDate.localeCompare(b.dictationDate));
  const futureDictations = allDictations.filter((d) => d.dictationDate >= today);
  const pastDictations = [...allDictations.filter((d) => d.dictationDate < today)].reverse();

  return (
    <AppShell
      title={child ? `你好，${child.name}！` : "学生页面"}
      rightSlot={
        <div className="flex items-center gap-2">
          {coins > 0 && (
            <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full pl-1.5 pr-2.5 py-0.5 text-xs font-black text-amber-700">
              <GoldCoin size="sm" /> {coins}
            </span>
          )}
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">退出</Link>
        </div>
      }
    >
      {/* Page-level tinted background */}
      <div className={`-mx-4 -mt-5 px-4 pt-5 pb-1 ${theme.page} mb-4 rounded-b-3xl`}>

        {/* Child selector */}
        <div className="mb-4">
          <ChildSelector
            childList={store.children}
            activeChildId={activeChildId}
            onSelect={setActiveChildId}
            coinsByChildId={coinsByChildId}
          />
        </div>

        {/* Section 1: Upcoming */}
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">即将到来的 Upcoming</h2>
        {upcoming ? (
          <div className={`${theme.cardBg} ${theme.cardBorder} rounded-lg shadow-sm p-4 mb-4`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-lg leading-snug cjk">{upcoming.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {upcoming.dictationDate} {weekdayLabel(upcoming.dictationDate)} · {upcoming.words.length} 个词
                </p>
              </div>
              {days !== null && (
                <Badge variant={days <= 2 ? "red" : days <= 5 ? "orange" : "green"}>
                  {days === 0 ? "今天！" : days < 0 ? "已过期" : `还有 ${days} 天`}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-800 truncate cjk tracking-wide">
              {upcoming.words.map((w) => w.word).join("　")}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${theme.dot} transition-all duration-500`}
                  style={{ width: `${upcomingPct}%` }}
                  role="progressbar"
                  aria-valuenow={practicedCount}
                  aria-valuemin={0}
                  aria-valuemax={totalWords}
                />
              </div>
              <span className="text-xs font-bold text-gray-500 shrink-0">{upcomingPct}%</span>
            </div>
          </div>
        ) : (
          <EmptyState icon="🎉" title="暂无听写任务" description="等待家长添加听写列表后再来练习吧！" />
        )}

        {/* Practice modes — Learn & Test side by side, Mistakes below */}
        {upcoming && (
          <div className="space-y-2 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                href={`/student/learn?list=${upcoming.id}`}
                icon={<IconLearn />} label="学习 Learn"
                accentColor={theme.learnBg} iconColor={theme.learnIcon}
                size="lg"
              />
              <ModeButton
                href={`/student/test?list=${upcoming.id}`}
                icon={<IconTest />} label="测试 Test"
                accentColor={theme.testBg} iconColor={theme.testIcon}
                size="lg"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ModeButton
                href={`/student/mistakes?child=${activeChildId}`}
                icon={<IconMistakes />} label="错字本 Mistakes"
                accentColor="bg-purple-100" iconColor="text-purple-600"
                size="sm"
                disabled={!hasMistakes}
              />
              <ModeButton
                href={`/student/handwriting?list=${upcoming.id}&child=${activeChildId}`}
                icon={<span className="text-xl">✍️</span>} label="AI批改"
                accentColor="bg-rose-100" iconColor="text-rose-600"
                size="sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Section 2: More Lists (other upcoming) */}
      {futureDictations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">其他听写 More Lists</h2>
          <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {futureDictations.map((d) => {
              const preview = d.words.map((w) => w.word).join("　");
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${theme.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate cjk">{d.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.dictationDate} {weekdayLabel(d.dictationDate)} · {d.words.length} 个词</p>
                    {preview && (
                      <p className="text-xs text-gray-800 mt-1 truncate cjk tracking-wide">{preview}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link href={`/student/learn?list=${d.id}`}
                      className={`text-sm font-bold ${theme.learnIcon} hover:opacity-70 active:scale-95 transition-all`}>
                      Learn
                    </Link>
                    <Link href={`/student/test?list=${d.id}`}
                      className={`text-sm font-bold ${theme.testIcon} hover:opacity-70 active:scale-95 transition-all`}>
                      Test
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 3: Completed / past */}
      {pastDictations.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">已经完成的 Past</h2>
          <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {pastDictations.map((d) => {
              const preview = d.words.map((w) => w.word).join("　");
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                  <div className="w-2 h-2 rounded-full shrink-0 bg-gray-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 truncate cjk">{d.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.dictationDate} {weekdayLabel(d.dictationDate)} · {d.words.length} 个词</p>
                    {preview && (
                      <p className="text-xs text-gray-400 mt-1 truncate cjk tracking-wide">{preview}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link href={`/student/learn?list=${d.id}`}
                      className="text-sm font-bold text-gray-400 hover:opacity-70 active:scale-95 transition-all">
                      Learn
                    </Link>
                    <Link href={`/student/test?list=${d.id}`}
                      className="text-sm font-bold text-gray-400 hover:opacity-70 active:scale-95 transition-all">
                      Test
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </AppShell>
  );
}
