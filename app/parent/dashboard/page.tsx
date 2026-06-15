"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useEntitlement } from "@/lib/useEntitlement";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getUpcomingDictation, weekdayLabel, getDaysUntil } from "@/lib/mockData";
import { reminderTimes } from "@/lib/sgCalendar";
import { buildIcs, downloadIcs, type IcsEvent } from "@/lib/ics";
import type { DictationList, Word } from "@/lib/types";

// One accent colour (dot) per child slot.
const CHILD_DOT = ["bg-amber-400", "bg-teal-400", "bg-purple-400"];

function wordPreview(words: Word[]): { head: string; more: string } {
  const arr = words.map((w) => w.word);
  const head = arr.slice(0, 4).join(" · ");
  const more = arr.length > 4 ? ` … +${arr.length - 4}` : "";
  return { head, more };
}

export default function ParentDashboard() {
  const { store, getCoins, deleteDictationList } = useStore();
  const { user, authLoading } = useAuth();
  const { billingOn, isPro } = useEntitlement();
  const [justUpgraded, setJustUpgraded] = useState(false);

  const inTrialMode = isSupabaseConfigured() && !authLoading && !user;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("upgraded") === "1") {
      setJustUpgraded(true);
      window.history.replaceState({}, "", "/parent/dashboard");
    }
  }, []);

  const children = store.children.filter((c) => c.name.trim());
  const childName = (id: string) => store.children.find((c) => c.id === id)?.name ?? "";
  const childIdx = (id: string) => Math.max(0, store.children.findIndex((c) => c.id === id));

  function handleDelete(id: string, title: string) {
    if (confirm(`确定删除「${title}」吗？此操作不可撤销。`)) deleteDictationList(id);
  }

  // Export every upcoming dictation (all children) to .ics with two alarms each.
  function handleExportCalendar() {
    const today = new Date().toISOString().split("T")[0];
    const upcomingLists = store.dictationLists
      .filter((d) => d.dictationDate >= today)
      .sort((a, b) => a.dictationDate.localeCompare(b.dictationDate));
    if (upcomingLists.length === 0) {
      alert("暂无即将到来的听写可导出 · No upcoming dictation to export");
      return;
    }
    const events: IcsEvent[] = upcomingLists.map((d) => {
      const who = childName(d.childId);
      const label = [who, d.title].filter(Boolean).join(" · ");
      const { weekendReview, finalReview } = reminderTimes(d.dictationDate);
      const alarms = [];
      if (weekendReview) alarms.push({ at: weekendReview, label: `周末开始复习 Start revising · ${label}` });
      if (finalReview) alarms.push({ at: finalReview, label: `今晚最后温习 Final review tonight · ${label}` });
      return {
        uid: `${d.id}@chinese-spelling-buddy`,
        title: `📝 听写 Spelling · ${label}`,
        date: d.dictationDate,
        description: (() => {
          const vocab = d.words.filter((w) => !w.isSentence).map((w) => w.word);
          const sentences = d.words.filter((w) => w.isSentence).map((w) => w.word);
          const parts: string[] = [];
          if (vocab.length) parts.push(`词语 Words：\n${vocab.join("、")}`);
          if (sentences.length) parts.push(`句子 Sentences：\n${sentences.map((s, i) => `${i + 1}. ${s}`).join("\n")}`);
          return parts.join("\n\n");
        })(),
        alarms,
      };
    });
    const today2 = new Date().toISOString().split("T")[0];
    downloadIcs(`spelling-${today2}.ics`, buildIcs(events));
  }

  // Each child's soonest upcoming dictation.
  const nextByChild = children
    .map((c) => ({ child: c, dict: getUpcomingDictation(c.id, store.dictationLists) }))
    .filter((x): x is { child: typeof x.child; dict: DictationList } => !!x.dict);
  const nextIds = new Set(nextByChild.map((x) => x.dict.id));

  // All other lists (future + past), excluding the per-child "next" ones.
  const today = new Date().toISOString().split("T")[0];
  const others = store.dictationLists.filter((d) => !nextIds.has(d.id));
  const future = others.filter((d) => d.dictationDate >= today).sort((a, b) => a.dictationDate.localeCompare(b.dictationDate));
  const past = others.filter((d) => d.dictationDate < today).sort((a, b) => b.dictationDate.localeCompare(a.dictationDate));
  const otherLists = [...future, ...past];

  function scoreForList(listId: string): { correct: number; total: number } | null {
    const s = store.sessions
      .filter((x) => x.dictationListId === listId && x.completedAt)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
    if (!s) return null;
    return { correct: s.wordResults.filter((r) => r.correct).length, total: s.wordResults.length };
  }

  return (
    <AppShell
      title="家长 Parent"
      leftSlot={
        <Link href="/settings" aria-label="设置" className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      }
      rightSlot={
        <Link href="/parent/add-dictation" aria-label="添加听写单" className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      }
      bottomBar={<BottomTabBar active="parent" />}
    >
      <div className="space-y-5 page-enter">

        {justUpgraded && (
          <div className="rounded-2xl border border-jade-300 bg-jade-50 px-4 py-3 text-center">
            <p className="text-sm font-bold text-jade-700">🎉 升级成功，感谢支持！</p>
            <p className="text-xs text-jade-600/80">Welcome to Pro — all features unlocked.</p>
          </div>
        )}

        {inTrialMode && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-bold text-amber-800 mb-0.5">🧪 试用模式 · Trial Mode</p>
            <p className="text-xs text-amber-700 leading-relaxed mb-2.5">
              你正在免注册试用。词表与练习记录只保存在这台设备上，清除浏览器数据或更换设备就会丢失。
              <span className="block text-amber-600/80 mt-0.5">
                You&apos;re using the app without an account — data is saved only on this device and isn&apos;t backed up.
              </span>
            </p>
            <div className="flex gap-2">
              <Link href="/auth/signup" className="flex-1 text-center text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl py-2 transition-colors">免费注册保存 Sign up</Link>
              <Link href="/auth/login" className="flex-1 text-center text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 rounded-xl py-2 transition-colors">已有账户 Log in</Link>
            </div>
          </div>
        )}

        {billingOn && user && !inTrialMode && !isPro && (
          <Link href="/parent/upgrade" className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 hover:border-brand-300 transition-colors">
            <span className="text-sm font-bold text-gray-700">💎 升级 Pro · 解锁 AI 与提醒</span>
            <span className="text-xs font-bold text-white bg-brand-500 rounded-full px-3 py-1">升级</span>
          </Link>
        )}

        {/* ── Next up: each child's soonest dictation ── */}
        {nextByChild.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">下一次听写 Next up</h2>
            <div className="space-y-3">
              {nextByChild.map(({ child, dict }) => {
                const days = getDaysUntil(dict.dictationDate);
                const badge = days <= 0 ? "今天" : days === 1 ? "明天" : `${days} 天后`;
                const badgeCls = days <= 1 ? "bg-red-50 text-red-500" : days <= 5 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500";
                const { head, more } = wordPreview(dict.words);
                const sentences = dict.words.filter((w) => w.isSentence).length;
                const vocab = dict.words.length - sentences;
                return (
                  <Link key={dict.id} href={`/student/dashboard?child=${child.id}`}
                    className="block bg-white rounded-2xl border border-gray-200 p-4 hover:border-gray-300 active:scale-[0.99] transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${CHILD_DOT[childIdx(child.id) % CHILD_DOT.length]}`} />
                      <span className="text-xs font-bold text-gray-500">{child.name} · {child.grade} {child.chineseType === "Higher" ? "高级华文" : "华文"}</span>
                      <span className={`ml-auto text-[11px] font-semibold rounded-full px-2.5 py-0.5 ${badgeCls}`}>{badge}</span>
                    </div>
                    <p className="text-base font-bold text-gray-800 cjk mb-1.5">{dict.title}</p>
                    <p className="flex items-center gap-1.5 text-xs text-gray-400">
                      <span>🗓</span>{dict.dictationDate} {weekdayLabel(dict.dictationDate)} · {vocab} 词{sentences > 0 ? ` / ${sentences} 句` : ""}
                    </p>
                    <p className="text-[13px] text-gray-500 mt-2 cjk truncate">{head}<span className="text-gray-300">{more}</span></p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Add ── */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">添加 Add</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Link href="/parent/import" className="flex flex-col items-start gap-1.5 bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3.5 hover:bg-brand-100 active:scale-95 transition-all">
              <span className="text-2xl">📷</span>
              <span className="text-sm font-bold text-brand-700">拍照 / PDF</span>
            </Link>
            <Link href="/parent/add-dictation" className="flex flex-col items-start gap-1.5 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 hover:bg-gray-50 active:scale-95 transition-all">
              <span className="text-2xl">✏️</span>
              <span className="text-sm font-bold text-gray-700">手动录入</span>
            </Link>
          </div>
          <button onClick={handleExportCalendar}
            className="w-full flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-all">
            <span className="text-lg">📅</span>导出整学期到日历 (.ics)
            <span className="ml-auto text-gray-300">›</span>
          </button>
        </section>

        {/* ── Other lists ── */}
        {otherLists.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">其他听写 All lists</h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {otherLists.map((d) => {
                const isPast = d.dictationDate < today;
                const score = isPast ? scoreForList(d.id) : null;
                return (
                  <div key={d.id} className={`flex items-center gap-3 px-4 py-3 ${isPast ? "opacity-70" : ""}`}>
                    <div className="text-center w-11 shrink-0">
                      <p className="text-sm font-black text-gray-700">{Number(d.dictationDate.slice(8, 10))}</p>
                      <p className="text-[11px] text-gray-400">{weekdayLabel(d.dictationDate)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate cjk">{d.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{childName(d.childId)} · {d.dictationDate}</p>
                    </div>
                    {score ? (
                      <span className="text-[11px] font-bold text-jade-600 bg-jade-50 rounded-full px-2 py-0.5 shrink-0">{score.correct}/{score.total}</span>
                    ) : !isPast ? (
                      <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 shrink-0">未到</span>
                    ) : null}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <Link href={`/parent/add-dictation?edit=${d.id}`} className="text-xs font-semibold text-gray-400 hover:text-brand-600">Edit</Link>
                      <button onClick={() => handleDelete(d.id, d.title)} className="text-xs font-semibold text-gray-400 hover:text-red-500">Del</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {children.length === 0 ? (
          <EmptyState icon="👨‍👧" title="先添加一个孩子" description="到「设置 → 孩子管理」添加孩子后再创建听写。"
            action={<Link href="/parent/children" className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-5 py-3 rounded-lg hover:bg-brand-600">添加孩子 Add child</Link>} />
        ) : nextByChild.length === 0 && otherLists.length === 0 ? (
          <EmptyState icon="📅" title="暂无听写" description="点右上角 ＋ 创建第一个听写列表。" />
        ) : null}

        <div className="h-2" />
      </div>
    </AppShell>
  );
}
