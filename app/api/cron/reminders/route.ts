// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/cron/reminders  — run daily by Vercel Cron (vercel.json).
//
//  Sends two kinds of reminder emails to the parent:
//    • weekend review  — on the Saturday before a dictation
//    • final review    — on the day before a dictation
//
//  Uses the Supabase SERVICE ROLE key (server-only) to read every parent's
//  lists + email, and Resend to send. Times are computed in SGT (UTC+8).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const maxDuration = 60;

// Today's calendar date in Singapore (UTC+8).
function sgtToday(): string {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}
// The Saturday on/before a dictation date (date-only, UTC math).
function weekendReviewDate(dictation: string): string {
  const d = new Date(`${dictation}T00:00:00Z`);
  const day = d.getUTCDay();              // 0=Sun … 6=Sat
  const back = day === 6 ? 7 : day + 1;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}
function dayBeforeDate(dictation: string): string {
  const d = new Date(`${dictation}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

interface ListRow { id: string; title: string; child_id: string; dictation_date: string; words: { word: string; isSentence?: boolean }[] | null }
interface ChildRow { id: string; name: string; parent_id: string }

export async function GET(req: NextRequest) {
  // Vercel injects "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !serviceKey || !resendKey) {
    return NextResponse.json({ error: "Reminder service not configured" }, { status: 503 });
  }

  const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
  const resend = new Resend(resendKey);
  const from = process.env.REMINDER_FROM || "Chinese Spelling Buddy <onboarding@resend.dev>";
  const today = sgtToday();

  try {
    const [{ data: lists }, { data: children }] = await Promise.all([
      sb.from("dictation_lists").select("id,title,child_id,dictation_date,words"),
      sb.from("children").select("id,name,parent_id"),
    ]);

    const childMap = new Map<string, ChildRow>((children ?? []).map((c) => [c.id, c as ChildRow]));

    // parent_id → email (via the admin API)
    const emailById = new Map<string, string>();
    const { data: usersData } = await sb.auth.admin.listUsers({ perPage: 1000 });
    for (const u of usersData?.users ?? []) if (u.email) emailById.set(u.id, u.email);

    let sent = 0;
    const results: { to: string; kind: string; title: string }[] = [];

    for (const l of (lists ?? []) as ListRow[]) {
      const child = childMap.get(l.child_id);
      if (!child) continue;
      const to = emailById.get(child.parent_id);
      if (!to) continue;

      let kind: "weekend" | "night" | null = null;
      if (today === weekendReviewDate(l.dictation_date)) kind = "weekend";
      else if (today === dayBeforeDate(l.dictation_date)) kind = "night";
      if (!kind) continue;

      const allItems = l.words ?? [];
      const vocab = allItems.filter((w) => !w.isSentence).map((w) => w.word);
      const sentences = allItems.filter((w) => w.isSentence).map((w) => w.word);
      const subject =
        kind === "weekend"
          ? `📝 周末开始复习：${child.name} · ${l.title}`
          : `📝 明天听写，今晚温习：${child.name} · ${l.title}`;
      const lead =
        kind === "weekend"
          ? "这个周末开始复习下周的听写吧 · Start revising this weekend"
          : "明天就要听写了，今晚再温习一遍 · Dictation tomorrow — review tonight";
      // 词语块：用「、」分隔，行高放大便于阅读
      const vocabBlock = vocab.length
        ? `<p style="margin:14px 0 4px"><strong>词语 Words</strong> <span style="color:#999">(${vocab.length})</span></p>
           <p style="font-size:18px;line-height:1.8;margin:0">${vocab.join("、")}</p>`
        : "";
      // 句子块：每句单独一行，方便逐句听写
      const sentenceBlock = sentences.length
        ? `<p style="margin:14px 0 4px"><strong>句子 Sentences</strong> <span style="color:#999">(${sentences.length})</span></p>
           <ol style="font-size:16px;line-height:1.7;margin:0;padding-left:22px">${sentences.map((s) => `<li>${s}</li>`).join("")}</ol>`
        : "";
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
          <h2 style="margin:0 0 4px">${subject}</h2>
          <p style="color:#666;margin:0 0 12px">${lead}</p>
          <p style="margin:0 0 4px"><strong>孩子 Child:</strong> ${child.name}</p>
          <p style="margin:0 0 4px"><strong>听写日期 Date:</strong> ${l.dictation_date}</p>
          ${vocabBlock}
          ${sentenceBlock}
          <p style="color:#999;font-size:12px;margin-top:20px">Chinese Spelling Buddy · 华文听写助手</p>
        </div>`;

      const { error } = await resend.emails.send({ from, to, subject, html });
      if (!error) { sent++; results.push({ to, kind, title: l.title }); }
      else console.error("[reminders] send error:", error.message, "→", to);
    }

    return NextResponse.json({ ok: true, today, sent, results });
  } catch (e) {
    console.error("[reminders] error:", e);
    return NextResponse.json({ error: "reminder run failed" }, { status: 500 });
  }
}
