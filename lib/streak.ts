// ─────────────────────────────────────────────────────────────────────────────
//  Practice streak — computed purely from completed sessions (no extra storage).
//  A "practice day" = any day (SGT) with at least one completed session.
//  The current streak stays alive if the last practice was today or yesterday.
// ─────────────────────────────────────────────────────────────────────────────

import type { PracticeSession } from "@/lib/types";

const DAY = 86_400_000;

/** Date (YYYY-MM-DD) in Singapore time for a given epoch ms. */
function sgtDate(ms: number): string {
  return new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export interface StreakInfo {
  current: number;
  longest: number;
  /** Last 7 days, oldest → today: weekday label + whether practiced. */
  last7: { date: string; weekday: string; practiced: boolean; isToday: boolean }[];
  practicedToday: boolean;
}

const WD = ["日", "一", "二", "三", "四", "五", "六"];

export function computeStreak(sessions: PracticeSession[], childId: string): StreakInfo {
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.childId === childId && s.completedAt) {
      days.add(sgtDate(new Date(s.completedAt).getTime()));
    }
  }

  const today = sgtDate(Date.now());
  const yesterday = sgtDate(Date.now() - DAY);

  // Current streak — anchor on today, else yesterday (grace), else broken.
  let current = 0;
  const anchor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  if (anchor) {
    let t = Date.parse(anchor + "T00:00:00Z");
    while (days.has(new Date(t).toISOString().slice(0, 10))) {
      current++;
      t -= DAY;
    }
  }

  // Longest run of consecutive days.
  const sorted = [...days].sort();
  let longest = 0, run = 0, prev: number | null = null;
  for (const d of sorted) {
    const t = Date.parse(d + "T00:00:00Z");
    run = prev !== null && t - prev === DAY ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const ms = Date.now() - (6 - i) * DAY;
    const date = sgtDate(ms);
    const wd = new Date(ms + 8 * 3600 * 1000).getUTCDay();
    return { date, weekday: WD[wd], practiced: days.has(date), isToday: date === today };
  });

  return { current, longest, last7, practicedToday: days.has(today) };
}
