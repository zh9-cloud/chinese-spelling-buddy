// ─────────────────────────────────────────────────────────────────────────────
//  Weekly report — derived from the last 7 days of completed sessions + the
//  child's mistake book. No new storage; everything comes from the store.
// ─────────────────────────────────────────────────────────────────────────────

import type { AppStore } from "@/lib/types";
import { computeStreak } from "@/lib/streak";

const DAY = 86_400_000;

export interface WeeklyReport {
  childName: string;
  grade: string;
  rangeLabel: string;       // e.g. "6月12日 – 6月18日"
  sessions: number;         // completed sessions in the last 7 days
  itemsPracticed: number;   // total words attempted
  accuracy: number;         // 0–100
  streakDays: number;
  weakWords: string[];      // current mistake words for review
}

function md(ms: number): string {
  const d = new Date(ms + 8 * 3600 * 1000);
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

export function computeWeeklyReport(store: AppStore, childId: string): WeeklyReport {
  const child = store.children.find((c) => c.id === childId);
  const cutoff = Date.now() - 7 * DAY;

  const weekSessions = store.sessions.filter(
    (s) => s.childId === childId && s.completedAt && new Date(s.completedAt).getTime() >= cutoff
  );

  let correct = 0, total = 0, items = 0;
  for (const s of weekSessions) {
    items += s.wordResults.length;
    total += s.wordResults.length;
    correct += s.wordResults.filter((r) => r.correct).length;
  }
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const weak = store.mistakes
    .filter((m) => m.childId === childId)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .map((m) => m.word)
    .slice(0, 6);

  const streak = computeStreak(store.sessions, childId);

  return {
    childName: child?.name ?? "孩子",
    grade: child?.grade ?? "",
    rangeLabel: `${md(cutoff)} – ${md(Date.now())}`,
    sessions: weekSessions.length,
    itemsPracticed: items,
    accuracy,
    streakDays: streak.current,
    weakWords: weak,
  };
}

/** One-line achievement text for sharing (WhatsApp / copy). */
export function shareText(r: WeeklyReport): string {
  const bits = [`${r.childName} 本周练习了 ${r.sessions} 次`];
  if (r.accuracy > 0) bits.push(`平均正确率 ${r.accuracy}%`);
  if (r.streakDays > 1) bits.push(`连续打卡 ${r.streakDays} 天`);
  return `【华文听写助手】${bits.join("，")}！💪 ${"https://www.sgspellingbuddy.com"}`;
}
