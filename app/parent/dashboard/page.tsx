"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ChildSelector } from "@/components/shared/ChildSelector";
import { UpcomingDictationCard } from "@/components/parent/UpcomingDictationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getUpcomingDictation, weekdayLabel } from "@/lib/mockData";
import { reminderTimes } from "@/lib/sgCalendar";
import { buildIcs, downloadIcs, type IcsEvent } from "@/lib/ics";

// Must match the THEMES array in student/dashboard/page.tsx
const THEMES = [
  { page: "bg-amber-50", cardBorder: "border-amber-400", selectorOn: "border-amber-400 bg-amber-50 text-amber-700", add: "bg-amber-500 hover:bg-amber-600 shadow-amber-200" },
  { page: "bg-teal-50",  cardBorder: "border-teal-400",  selectorOn: "border-teal-400 bg-teal-50 text-teal-700",   add: "bg-teal-600  hover:bg-teal-700  shadow-teal-200"  },
  { page: "bg-purple-50",cardBorder: "border-purple-400",selectorOn: "border-purple-400 bg-purple-50 text-purple-700", add: "bg-purple-500 hover:bg-purple-600 shadow-purple-200" },
];

export default function ParentDashboard() {
  const { store, getCoins, deleteDictationList } = useStore();
  const { user, authLoading } = useAuth();
  const [activeChildId, setActiveChildId] = useState(store.children[0]?.id ?? "");

  // Trial mode = account system available but parent hasn't signed in.
  // Data lives only in this browser; nudge them to register for cloud backup.
  const inTrialMode = isSupabaseConfigured() && !authLoading && !user;

  function handleDelete(id: string, title: string) {
    if (confirm(`确定删除「${title}」吗？此操作不可撤销。`)) {
      deleteDictationList(id);
    }
  }

  // Export every upcoming dictation (all children) to a .ics with two alarms each:
  // weekend review (Sat 09:00) and final review (night before 18:00).
  function handleExportCalendar() {
    const today = new Date().toISOString().split("T")[0];
    const upcomingLists = store.dictationLists
      .filter((d) => d.dictationDate >= today)
      .sort((a, b) => a.dictationDate.localeCompare(b.dictationDate));
    if (upcomingLists.length === 0) {
      alert("暂无即将到来的听写可导出 · No upcoming dictation to export");
      return;
    }
    const childName = (id: string) => store.children.find((c) => c.id === id)?.name ?? "";
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
    downloadIcs(`spelling-${today}.ics`, buildIcs(events));
  }

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

        {/* Trial-mode banner — only when not signed in */}
        {inTrialMode && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-bold text-amber-800 mb-0.5">
              🧪 试用模式 · Trial Mode
            </p>
            <p className="text-xs text-amber-700 leading-relaxed mb-2.5">
              你正在免注册试用。词表与练习记录只保存在这台设备上，清除浏览器数据或更换设备就会丢失。
              <span className="block text-amber-600/80 mt-0.5">
                You&apos;re using the app without an account — data is saved only on this device and isn&apos;t backed up.
              </span>
            </p>
            <div className="flex gap-2">
              <Link href="/auth/signup"
                className="flex-1 text-center text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl py-2 transition-colors">
                免费注册保存 Sign up to save
              </Link>
              <Link href="/auth/login"
                className="flex-1 text-center text-xs font-bold text-amber-700 border border-amber-300 hover:bg-amber-100 rounded-xl py-2 transition-colors">
                已有账户 Log in
              </Link>
            </div>
          </div>
        )}

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
              编辑 Edit Children Profiles
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
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">即将到来的 Upcoming</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Link href="/parent/import"
              className="flex flex-col items-center justify-center bg-brand-50 border border-brand-200 rounded-lg py-2.5 hover:bg-brand-100 active:scale-95 transition-all">
              <span className="text-base font-bold text-brand-700">📷 智能导入</span>
              <span className="text-xs font-bold text-brand-500 mt-0.5">Scan PDF / Photo</span>
            </Link>
            <Link href="/parent/add-dictation"
              className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-100 active:scale-95 transition-all">
              <span className="text-base font-bold text-gray-700">✏️ 手动添加</span>
              <span className="text-xs font-bold text-gray-400 mt-0.5">Type by hand</span>
            </Link>
          </div>
          <button onClick={handleExportCalendar}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg py-2 mb-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
            📅 导出整学期到日历 · Export to Calendar
          </button>

          {upcoming ? (
            <UpcomingDictationCard
              dictation={upcoming}
              accentBorder={theme.cardBorder}
              onDelete={() => handleDelete(upcoming.id, upcoming.title)}
            />
          ) : (
            <EmptyState
              icon="📅"
              title="暂无即将到来的听写"
              description={'点击【添加】按钮来创建第一个听写列表'}
              action={
                <Link href="/parent/add-dictation"
                  className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:bg-brand-600 active:scale-95 transition-all">
                  ＋ 添加听写列表 Add List
                </Link>
              }
            />
          )}
        </section>

        {/* Section: More Lists (other upcoming) */}
        {futureDictations.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">其他听写 More Lists</h2>
            <div className="bg-white rounded-lg border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {futureDictations.map((d) => {
                const preview = d.words.map((w) => w.word).join("　");
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${theme.cardBorder.replace("border-", "bg-")}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate cjk">{d.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d.dictationDate} {weekdayLabel(d.dictationDate)} · {d.words.length} 词</p>
                      {preview && (
                        <p className="text-xs text-gray-800 mt-1 truncate cjk tracking-wide">{preview}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link href={`/parent/add-dictation?edit=${d.id}`}
                        className="text-sm font-semibold text-gray-400 hover:text-brand-600">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(d.id, d.title)}
                        className="text-sm font-semibold text-gray-400 hover:text-red-500">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: Past */}
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
                      <p className="text-xs text-gray-400 mt-0.5">{d.dictationDate} {weekdayLabel(d.dictationDate)} · {d.words.length} 词</p>
                      {preview && (
                        <p className="text-xs text-gray-400 mt-1 truncate cjk tracking-wide">{preview}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Link href={`/parent/add-dictation?edit=${d.id}`}
                        className="text-sm font-semibold text-gray-400 hover:text-brand-600">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(d.id, d.title)}
                        className="text-sm font-semibold text-gray-400 hover:text-red-500">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="h-4" />
      </div>
    </AppShell>
  );
}
