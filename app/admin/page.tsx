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

interface Gift { email: string; proUntil: string; active: boolean }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
}

/** Owner tool: gift / revoke free Pro for colleagues by email. */
function GiftPro() {
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState(12);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);

  async function load() {
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/admin/grant", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGifts(((await res.json()) as { gifts: Gift[] }).gifts ?? []);
    } catch { /* ignore */ }
  }
  useEffect(() => { load(); }, []);

  async function post(payload: Record<string, unknown>): Promise<{ ok: boolean; data: Record<string, unknown> }> {
    const token = await getAccessToken();
    const res = await fetch("/api/admin/grant", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, data: (await res.json()) as Record<string, unknown> };
  }

  async function grant() {
    if (!email.trim()) { setMsg({ ok: false, text: "请输入邮箱" }); return; }
    setBusy(true); setMsg(null);
    const { ok, data } = await post({ email, months });
    if (ok) {
      setMsg({ ok: true, text: `✓ 已赠送 ${data.email} ${data.months} 个月 Pro（有效期至 ${fmtDate(String(data.proUntil))}）` });
      setEmail("");
      await load();
    } else {
      setMsg({ ok: false, text: String(data.error ?? "操作失败") });
    }
    setBusy(false);
  }

  async function revoke(target: string) {
    if (!confirm(`确定收回 ${target} 的 Pro？`)) return;
    setBusy(true); setMsg(null);
    const { ok, data } = await post({ email: target, revoke: true });
    setMsg(ok ? { ok: true, text: `已收回 ${target} 的 Pro` } : { ok: false, text: String(data.error ?? "操作失败") });
    await load();
    setBusy(false);
  }

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">🎁 老师赠送 Pro · Gift Pro</p>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-xs text-gray-500">
          同事需先用该邮箱<strong>免费注册</strong>，再在这里输入邮箱即可赠送 Pro。
        </p>
        <div className="flex gap-2">
          <input
            type="email" inputMode="email" autoCapitalize="none" placeholder="同事的邮箱 colleague@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm bg-white shrink-0">
            {[1, 3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} 个月</option>)}
          </select>
        </div>
        <button onClick={grant} disabled={busy}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-lg py-2.5 text-sm transition-all active:scale-95">
          {busy ? "处理中…" : "赠送 / 续期 Pro"}
        </button>
        {msg && (
          <p className={`text-xs rounded-lg px-3 py-2 ${msg.ok ? "text-jade-700 bg-jade-50 border border-jade-200" : "text-red-600 bg-red-50 border border-red-200"}`}>
            {msg.text}
          </p>
        )}

        {gifts.length > 0 && (
          <div className="pt-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">已赠送 {gifts.length} 人</p>
            <div className="divide-y divide-gray-100">
              {gifts.map((g) => (
                <div key={g.email} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{g.email}</p>
                    <p className="text-[11px] text-gray-400">
                      {g.active ? `有效至 ${fmtDate(g.proUntil)}` : `已过期 ${fmtDate(g.proUntil)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${g.active ? "text-jade-700 bg-jade-50" : "text-gray-400 bg-gray-100"}`}>
                      {g.active ? "Pro" : "—"}
                    </span>
                    {g.active && (
                      <button onClick={() => revoke(g.email)} disabled={busy}
                        className="text-[11px] font-semibold text-red-500 hover:underline disabled:opacity-60">收回</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

            {/* Gift Pro to colleagues */}
            <GiftPro />

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
