// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/feedback — parents send suggestions / feedback.
//
//  Body: { message: string, contact?: string }
//  Emails the owner (ADMIN_EMAIL) via Resend. If the parent left a contact
//  email, it's set as reply-to so the owner can reply directly.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  // Prefer ADMIN_EMAIL2 (owner's Vercel var), fall back to ADMIN_EMAIL.
  const to = process.env.ADMIN_EMAIL2 || process.env.ADMIN_EMAIL;
  const from = process.env.REMINDER_FROM || "Chinese Spelling Buddy <onboarding@resend.dev>";
  if (!resendKey || !to) {
    return NextResponse.json({ error: "反馈服务未配置 · Feedback not configured" }, { status: 503 });
  }

  let body: { message?: string; contact?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const contact = (body.contact ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "请填写反馈内容 · Message is required" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "反馈内容过长 · Message too long" }, { status: 400 });
  }

  const safe = (s: string) => s.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"));
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 8px">📩 用户反馈 · Feedback</h2>
      <p style="white-space:pre-wrap;font-size:15px;line-height:1.6;color:#222">${safe(message)}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <p style="color:#666;font-size:13px">联系方式 Contact: ${contact ? safe(contact) : "（未填 not provided）"}</p>
      <p style="color:#999;font-size:12px">Chinese Spelling Buddy · 华文听写助手</p>
    </div>`;

  const resend = new Resend(resendKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "📩 用户反馈 Feedback · 华文听写助手",
    html,
    ...(contact && EMAIL_RE.test(contact) ? { replyTo: contact } : {}),
  });
  if (error) {
    console.error("[feedback] send error:", error.message);
    return NextResponse.json({ error: "发送失败，请稍后再试 · Failed to send" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
