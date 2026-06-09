"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  Minimal iCalendar (.ics) builder. Each dictation becomes an all-day event
//  with absolute-time DISPLAY alarms (the weekend + night-before reminders).
//  The phone's native calendar then fires the notifications — no server needed.
// ─────────────────────────────────────────────────────────────────────────────

export interface IcsAlarm {
  at: Date;
  label: string;
}

export interface IcsEvent {
  uid: string;
  title: string;
  date: string;        // "YYYY-MM-DD" (the dictation day)
  description?: string;
  alarms?: IcsAlarm[];
}

const pad = (n: number) => String(n).padStart(2, "0");

function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function esc(s: string): string {
  return s.replace(/([\\,;])/g, "\\$1").replace(/\n/g, "\\n");
}

export function buildIcs(events: IcsEvent[]): string {
  const now = utcStamp(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chinese Spelling Buddy//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const e of events) {
    const startCompact = e.date.replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART;VALUE=DATE:${startCompact}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    for (const a of e.alarms ?? []) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${esc(a.label)}`);
      lines.push(`TRIGGER;VALUE=DATE-TIME:${utcStamp(a.at)}`);
      lines.push("END:VALARM");
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
