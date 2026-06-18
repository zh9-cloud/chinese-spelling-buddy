"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/useEntitlement";

interface RefData { code: string; inviteCount: number; proUntil: string | null }

export default function ReferralPage() {
  const { user, authLoading } = useAuth();
  const [data, setData] = useState<RefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch("/api/referral", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setData(await res.json() as RefData);
      } finally { setLoading(false); }
    })();
  }, [user, authLoading]);

  const link = data ? `https://www.sgspellingbuddy.com/?ref=${data.code}` : "";
  const msg = data ? `我在用「华文听写助手」帮孩子练华文听写,孩子自己练、不用陪读。用我的邀请码 ${data.code} 注册,我们各得 1 个月 Pro!${link}` : "";

  async function copy(text: string, which: string) {
    try { await navigator.clipboard.writeText(text); setCopied(which); setTimeout(() => setCopied(""), 2000); } catch { /* ignore */ }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: "华文听写助手 · 邀请", text: msg }); return; } catch { /* cancelled */ } }
    copy(msg, "msg");
  }

  return (
    <AppShell title="邀请好友 Invite" backHref="/settings">
      <div className="space-y-5 page-enter pb-24">

        <div className="text-center pt-2">
          <span className="text-5xl">🎁</span>
          <h1 className="text-xl font-black text-gray-900 mt-2">邀请好友，双方各得 1 个月 Pro</h1>
          <p className="text-sm text-gray-400 mt-1">每成功邀请 1 位家长,你和好友各 +1 个月。可叠加。</p>
        </div>

        {!authLoading && !user ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-500 mb-4">登录后才能生成你的专属邀请码</p>
            <Link href="/auth/login" className="inline-block bg-brand-500 text-white font-bold rounded-xl px-6 py-3 text-sm hover:bg-brand-600">登录 Log in</Link>
          </div>
        ) : loading ? (
          <p className="text-center text-sm text-gray-400 py-10">加载中…</p>
        ) : data ? (
          <>
            {/* Code */}
            <div className="rounded-2xl border-2 border-brand-300 bg-brand-50 p-5 text-center">
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mb-1">你的邀请码</p>
              <p className="text-3xl font-black text-brand-700 tracking-[0.2em] mb-3">{data.code}</p>
              <button onClick={() => copy(data.code, "code")}
                className="text-xs font-bold text-brand-600 border border-brand-300 rounded-lg px-4 py-1.5 hover:bg-brand-100">
                {copied === "code" ? "已复制 ✓" : "复制邀请码"}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center">
                <p className="text-2xl font-black text-gray-800">{data.inviteCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">已成功邀请</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center">
                <p className="text-2xl font-black text-jade-600">{data.inviteCount}</p>
                <p className="text-xs text-gray-400 mt-0.5">已获得月数 Pro</p>
              </div>
            </div>
            {data.proUntil && (
              <p className="text-center text-xs text-gray-400">
                赠送 Pro 有效期至 {new Date(data.proUntil).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })}
              </p>
            )}

            {/* Share */}
            <button onClick={share}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-4 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold transition-all shadow-lg shadow-brand-200">
              <i className="ti ti-share text-xl" aria-hidden="true" />分享邀请 Share
            </button>
            <button onClick={() => copy(link, "link")}
              className="w-full text-center text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl py-2.5 hover:bg-gray-50">
              {copied === "link" ? "链接已复制 ✓" : "复制邀请链接"}
            </button>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-gray-500 leading-relaxed">
              💡 好友用你的链接或邀请码注册后,系统自动给你们**各加 1 个月 Pro**。邀请越多,叠加越多。
            </div>
          </>
        ) : (
          <p className="text-center text-sm text-gray-400 py-10">加载失败,请稍后再试。</p>
        )}
      </div>
    </AppShell>
  );
}
