"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/useEntitlement";

interface Stats {
  generatedAt: string;
  parents: { total: number; signups7d: number; signups30d: number };
  subscriptions: { active: number; monthly: number; annual: number; byStatus: Record<string, number>; mrr: number };
  engagement: { children: number; lists: number; sessions: number };
  aiUsage: Record<string, number>;
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { user, authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setError("请先登录 · Please log in"); return; }
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 403) { setError("无权限 · You are not the admin"); return; }
        if (!res.ok) { const e = await res.json() as { error?: string }; setError(e.error ?? "加载失败"); return; }
        setStats(await res.json() as Stats);
      } catch {
        setError("加载失败，请重试");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  return (
    <AppShell title="📊 数据后台 Admin" backHref="/parent/dashboard">
      <div className="space-y-5 page-enter pb-24 max-w-lg mx-auto">

        {loading && <p className="text-sm text-gray-400 text-center py-10">加载中… Loading…</p>}

        {!loading && error && (
          <div className="text-center py-10">
            <span className="text-4xl">🔒</span>
            <p className="text-sm text-gray-500 mt-3">{error}</p>
            {!user && (
              <Link href="/auth/login" className="inline-block mt-4 text-sm font-bold text-brand-500">前往登录 Log in →</Link>
            )}
          </div>
        )}

        {stats && (
          <>
            {/* Revenue */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">收入 Revenue</p>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="月经常性收入 MRR" value={`S$${stats.subscriptions.mrr.toFixed(2)}`} sub="估算 · estimated" />
                <Stat label="付费会员 Pro" value={stats.subscriptions.active} sub={`月付 ${stats.subscriptions.monthly} · 年付 ${stats.subscriptions.annual}`} />
              </div>
            </div>

            {/* Users */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">注册家长 Parents</p>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="总数 Total" value={stats.parents.total} />
                <Stat label="近 7 天 7d" value={`+${stats.parents.signups7d}`} />
                <Stat label="近 30 天 30d" value={`+${stats.parents.signups30d}`} />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                付费转化率 conversion:{" "}
                <strong className="text-gray-600">
                  {stats.parents.total ? Math.round((stats.subscriptions.active / stats.parents.total) * 100) : 0}%
                </strong>{" "}
                (付费 / 注册)
              </p>
            </div>

            {/* Engagement */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">使用 Engagement</p>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="孩子 Children" value={stats.engagement.children} />
                <Stat label="听写单 Lists" value={stats.engagement.lists} />
                <Stat label="练习 Sessions" value={stats.engagement.sessions} />
              </div>
            </div>

            {/* AI usage (cost proxy) */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">AI 调用 Usage（OpenAI 成本）</p>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="拍照识别 OCR" value={stats.aiUsage.import ?? 0} sub="累计次数 total calls" />
                <Stat label="AI 批改 Grade" value={stats.aiUsage.grade ?? 0} sub="累计次数 total calls" />
              </div>
            </div>

            {/* Subscription status breakdown */}
            {Object.keys(stats.subscriptions.byStatus).length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">订阅状态 Subscription status</p>
                <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
                  {Object.entries(stats.subscriptions.byStatus).map(([status, n]) => (
                    <div key={status} className="flex justify-between px-4 py-2 text-sm">
                      <span className="text-gray-500">{status}</span>
                      <span className="font-bold text-gray-800 tabular-nums">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 leading-relaxed">
              ⚠️ <strong>未注册的试用家长无法统计</strong>（匿名 localStorage）。要看「访问 → 注册 → 付费」漏斗，需接入 Vercel Web Analytics。
              <br />💳 准确收入/流失请以 <strong>Stripe Dashboard → Billing</strong> 为准。
            </div>

            <p className="text-center text-[11px] text-gray-300">
              更新于 {new Date(stats.generatedAt).toLocaleString("en-CA", { timeZone: "Asia/Singapore" })} SGT
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
