"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useEntitlement, getAccessToken } from "@/lib/useEntitlement";
import { PLAN_DISPLAY, type Plan } from "@/lib/billing";

const FREE_FEATURES = [
  "1 个孩子 · 1 child",
  "手动录入词表 · Manual word lists",
  "学习 & 测试模式 · Learn & Test",
];
const PRO_FEATURES = [
  "📷 拍照 / PDF 识别词表 · Photo & PDF OCR",
  "✍️ AI 批改手写 · AI handwriting grading",
  "🔔 邮件 & 日历提醒 · Email & calendar reminders",
  "👨‍👧‍👦 多个孩子 · Multiple children",
  "📊 进度分析 · Progress analytics",
];

export default function UpgradePage() {
  const { user } = useAuth();
  const { isPro, loading } = useEntitlement();
  const [plan, setPlan] = useState<Plan>("annual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    if (!user) { setError("请先登录后再升级 · Please log in first."); return; }
    setBusy(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "无法开始结账");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "出错了，请重试");
      setBusy(false);
    }
  }

  async function openPortal() {
    setBusy(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "无法打开管理页");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "出错了，请重试");
      setBusy(false);
    }
  }

  return (
    <AppShell title="升级 Pro" backHref="/parent/dashboard">
      <div className="space-y-6 page-enter pb-28 max-w-md mx-auto">

        <div className="text-center pt-2">
          <span className="text-5xl">💎</span>
          <h1 className="text-2xl font-black text-gray-900 mt-2">解锁全部功能</h1>
          <p className="text-sm text-gray-400">Unlock AI features & reminders</p>
        </div>

        {!loading && isPro ? (
          <div className="rounded-2xl border-2 border-jade-400 bg-jade-50 p-5 text-center">
            <p className="text-lg font-black text-jade-700">✓ 你已是 Pro 会员</p>
            <p className="text-sm text-jade-600/80 mt-1 mb-4">You&apos;re a Pro member — thank you!</p>
            <button onClick={openPortal} disabled={busy}
              className="text-sm font-bold text-jade-700 border border-jade-300 rounded-xl px-5 py-2.5 hover:bg-jade-100 disabled:opacity-60">
              {busy ? "打开中…" : "管理订阅 Manage subscription"}
            </button>
          </div>
        ) : (
          <>
            {/* Plan toggle */}
            <div className="grid grid-cols-2 gap-3">
              {(["annual", "monthly"] as Plan[]).map((p) => {
                const d = PLAN_DISPLAY[p];
                const on = plan === p;
                return (
                  <button key={p} onClick={() => setPlan(p)}
                    className={[
                      "rounded-2xl border-2 p-4 text-left transition-all active:scale-95",
                      on ? "border-brand-500 bg-brand-50 shadow-md" : "border-gray-200 bg-white",
                    ].join(" ")}>
                    <p className="text-xs font-bold text-gray-500">{d.label}</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{d.price}</p>
                    <p className="text-xs text-gray-400">{d.per}</p>
                    <p className={["text-[11px] font-semibold mt-1", p === "annual" ? "text-jade-600" : "text-gray-400"].join(" ")}>{d.note}</p>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <button onClick={startCheckout} disabled={busy}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-lg py-4 transition-all active:scale-95 shadow-lg shadow-brand-200">
              {busy ? "前往结账…" : `升级 Pro · ${PLAN_DISPLAY[plan].price}${PLAN_DISPLAY[plan].per}`}
            </button>

            {!user && (
              <p className="text-center text-xs text-gray-400">
                还没有账户？{" "}
                <Link href="/auth/signup" className="text-brand-500 font-semibold">先免费注册 Sign up</Link>
              </p>
            )}
          </>
        )}

        {/* Feature comparison */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">免费版 Free</p>
            <ul className="mt-2 space-y-1.5">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-gray-300">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
          <div className="px-5 py-3 bg-brand-50/40">
            <p className="text-xs font-bold text-brand-500 uppercase tracking-wide">Pro 💎</p>
            <ul className="mt-2 space-y-1.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="text-brand-500">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-300">
          通过 Stripe 安全付款 · Secure payment via Stripe
        </p>
      </div>
    </AppShell>
  );
}
