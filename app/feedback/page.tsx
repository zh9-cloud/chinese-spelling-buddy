"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!message.trim()) { setError("请填写反馈内容 · Please enter your message"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), contact: contact.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "发送失败");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败，请重试");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AppShell title="意见反馈 Feedback" backHref="/settings">
        <div className="flex flex-col items-center justify-center py-20 text-center px-6 page-enter">
          <span className="text-6xl mb-4">🙏</span>
          <h2 className="text-xl font-black text-gray-800 mb-2">谢谢你的反馈！</h2>
          <p className="text-sm text-gray-500 mb-6">我们已收到，会认真阅读。<br /><span className="text-xs">Thanks — your message has been sent.</span></p>
          <Link href="/settings" className="bg-brand-500 text-white font-bold rounded-lg px-6 py-3 text-sm hover:bg-brand-600 active:scale-95 transition-all">
            返回设置 Back to Settings
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="意见反馈 Feedback" backHref="/settings">
      <form onSubmit={submit} className="space-y-4 page-enter">
        <p className="text-sm text-gray-500">
          有建议、遇到问题、想要的功能？写给我，我会认真看每一条。
          <span className="block text-xs text-gray-400 mt-0.5">Suggestions, bugs, or feature requests — we read every message.</span>
        </p>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">反馈内容 Message</label>
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)}
            rows={6} maxLength={4000} required
            placeholder="想说点什么…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">
            联系方式 Contact <span className="text-gray-400 font-normal">（选填，方便回复你）</span>
          </label>
          <input
            type="text" value={contact} onChange={(e) => setContact(e.target.value)}
            placeholder="邮箱 / 微信 / WhatsApp"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <button type="submit" disabled={busy}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-lg py-4 transition-all active:scale-95 shadow-lg shadow-brand-200">
          {busy ? "发送中…" : "发送 Send"}
        </button>
      </form>
    </AppShell>
  );
}
