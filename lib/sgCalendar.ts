"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Singapore school-term calendar helpers.
//
//  Teachers express dictation as "Term X, Week Y, 周Z". We convert that to an
//  absolute date using each term's Week-1 Monday. The defaults below are a
//  best-effort guess — parents can correct them (stored per device), since the
//  school hands out the exact dates each semester.
//
//  From the absolute dictation date we also derive the two reminder times:
//    • weekend review  → the Saturday before, 09:00
//    • final review    → the evening before, 18:00
// ─────────────────────────────────────────────────────────────────────────────

export interface TermStarts {
  t1: string; t2: string; t3: string; t4: string; // "YYYY-MM-DD" — Monday of Week 1
}

const KEY = "cdb_term_starts";

// MOE 2026 term first-days (editable per device). Week 1 = the week containing
// this date; its Monday is the anchor for term/week conversion.
export const DEFAULT_TERM_STARTS: TermStarts = {
  t1: "2026-01-02", // Fri 02 Jan 2026
  t2: "2026-03-23", // Mon 23 Mar 2026
  t3: "2026-06-29", // Mon 29 Jun 2026
  t4: "2026-09-14", // Mon 14 Sep 2026
};

export function getTermStarts(): TermStarts {
  if (typeof window === "undefined") return DEFAULT_TERM_STARTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_TERM_STARTS, ...JSON.parse(raw) } : DEFAULT_TERM_STARTS;
  } catch {
    return DEFAULT_TERM_STARTS;
  }
}

export function setTermStarts(t: TermStarts): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch { /* ignore */ }
}

// Monday of the week containing the given date.
function week1Monday(startStr: string): Date | null {
  const d = new Date(`${startStr}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const day = d.getDay();                 // 0=Sun … 6=Sat
  const sinceMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - sinceMonday);
  return d;
}

// term: 1–4, week: 1+, dayOfWeek: 1=Mon … 7=Sun → "YYYY-MM-DD" (or "" if unknown).
export function termWeekToDate(
  term: number, week: number, dayOfWeek: number, starts: TermStarts = getTermStarts()
): string {
  const startStr = [starts.t1, starts.t2, starts.t3, starts.t4][term - 1];
  if (!startStr) return "";
  const mon = week1Monday(startStr);
  if (!mon) return "";
  mon.setDate(mon.getDate() + (week - 1) * 7 + (dayOfWeek - 1));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${mon.getFullYear()}-${p(mon.getMonth() + 1)}-${p(mon.getDate())}`;
}

export interface ReminderTimes {
  weekendReview: Date | null; // Saturday before, 09:00
  finalReview: Date | null;   // evening before, 18:00
}

export function reminderTimes(dictationDate: string): ReminderTimes {
  const d = new Date(`${dictationDate}T00:00:00`);
  if (isNaN(d.getTime())) return { weekendReview: null, finalReview: null };

  // Evening before, 18:00
  const finalReview = new Date(d);
  finalReview.setDate(d.getDate() - 1);
  finalReview.setHours(18, 0, 0, 0);

  // The Saturday on/before the dictation (a Sat dictation uses the prior Sat), 09:00
  const weekendReview = new Date(d);
  const day = d.getDay();               // 0=Sun … 6=Sat
  const back = day === 6 ? 7 : day + 1; // Sun→1, Mon→2 … Fri→6, Sat→7
  weekendReview.setDate(d.getDate() - back);
  weekendReview.setHours(9, 0, 0, 0);

  return { weekendReview, finalReview };
}

// "YYYY-MM-DD" → "周三 Wed" (used to show the auto-computed day)
export function weekdayShort(dateStr: string): string {
  const zh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  return `${zh[d.getDay()]} ${en[d.getDay()]}`;
}
