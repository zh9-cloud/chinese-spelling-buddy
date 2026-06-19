"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { OAuthButtons } from "@/components/ui/OAuthButtons";
import { useAuth } from "@/context/AuthContext";
import { useEntitlement } from "@/lib/useEntitlement";
import { isSupabaseConfigured } from "@/lib/supabase";

function Row({ href, onClick, icon, label, sub, value, danger, last }: {
  href?: string; onClick?: () => void; icon: string; label: string; sub?: string; value?: string; danger?: boolean; last?: boolean;
}) {
  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3 ${last ? "" : "border-b border-gray-100"}`}>
      <i className={`ti ${icon} text-xl w-6 text-center ${danger ? "text-red-500" : "text-gray-500"}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-red-500" : "text-gray-700"}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {value && <span className="text-xs text-gray-400 shrink-0">{value}</span>}
      {href && <span className="text-gray-300 shrink-0">›</span>}
    </div>
  );
  if (href) return <Link href={href} className="block hover:bg-gray-50">{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="block w-full text-left hover:bg-gray-50">{inner}</button>;
  return inner;
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{children}</h2>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, authLoading, signOut } = useAuth();
  const { billingOn, isPro, plan, currentPeriodEnd } = useEntitlement();
  const supaOn = isSupabaseConfigured();
  const [error, setError] = useState("");

  const validUntil = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })
    : null;

  return (
    <AppShell title="设置 Settings" backHref="/parent/dashboard">
      <div className="space-y-5 page-enter pb-10">

        {/* ── Account ── */}
        <section>
          <Label>账户 Account</Label>
          {supaOn && !authLoading ? (
            user ? (
              <Group>
                <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                  <span className="w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center font-black">
                    {(user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">已登录 Signed in</p>
                  </div>
                  {billingOn && isPro && (
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded-full px-2.5 py-1"><i className="ti ti-diamond" aria-hidden="true" /> Pro</span>
                  )}
                </div>
                <Row icon="ti-logout" label="退出登录 Sign out" danger last
                  onClick={async () => { await signOut(); router.push("/parent/dashboard"); }} />
              </Group>
            ) : (
              <Group>
                <div className="px-4 py-4">
                  <p className="text-sm text-gray-500 mb-3 text-center">登录后云端保存，换设备不丢失</p>
                  <Link href="/auth/login" className="block bg-brand-500 text-white font-bold rounded-lg py-3 text-sm text-center hover:bg-brand-600 active:scale-95 transition-all">
                    邮箱登录 Email login
                  </Link>
                  <OAuthButtons onError={setError} />
                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">{error}</p>
                  )}
                  <div className="flex justify-center gap-5 mt-4 text-xs">
                    <Link href="/auth/signup" className="text-brand-600 font-semibold">注册新账户</Link>
                    <Link href="/auth/forgot" className="text-gray-400 hover:text-brand-500">忘记密码</Link>
                  </div>
                </div>
              </Group>
            )
          ) : (
            <Group><Row icon="ti-settings" label="账户系统未启用" sub="未配置 Supabase" last /></Group>
          )}
        </section>

        {/* ── Subscription ── */}
        {billingOn && (
          <section>
            <Label>订阅 Subscription</Label>
            <Group>
              {isPro ? (
                <Row href="/parent/upgrade" icon="ti-diamond" label="订阅管理 Manage"
                  sub={`${plan === "monthly" ? "月付 Monthly" : "年付 Annual"}${validUntil ? ` · 有效期至 ${validUntil}` : ""}`} last />
              ) : (
                <Row href="/parent/upgrade" icon="ti-diamond" label="升级 Pro Upgrade" sub="解锁 AI 识别、AI 批改与提醒" last />
              )}
            </Group>
          </section>
        )}

        {/* ── Rewards explainer ── */}
        <section>
          <Label>奖励 Rewards</Label>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <i className="ti ti-diamond text-brand-500" aria-hidden="true" /> 钻石怎么用 How diamonds work
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              孩子每答对一个词就得 1 颗钻石 💎。建议你和孩子约定：攒够一定数量（例如 50 颗）就给一个真实的小奖励——一张贴纸、选周末活动、一次小零食…… 让钻石成为坚持练习的真实动力。
              <span className="block text-gray-400 mt-1">Agree on a reward when your child reaches a diamond goal — it turns practice into a habit.</span>
            </p>
          </div>
        </section>

        {/* ── Referral ── */}
        <section>
          <Label>邀请 Invite</Label>
          <Group>
            <Row href="/referral" icon="ti-gift" label="邀请好友 Invite friends" sub="双方各得 1 个月 Pro · 可叠加" last />
          </Group>
        </section>

        {/* ── Reminders ── */}
        <section>
          <Label>提醒 Reminders</Label>
          <Group>
            <Row icon="ti-mail" label="邮件提醒 Email" sub="听写前周末与前一晚自动发送到你的邮箱" />
            <Row href="/parent/dashboard" icon="ti-calendar" label="日历提醒 Calendar" sub="在主页「导出整学期到日历」生成 .ics" last />
          </Group>
          {billingOn && !isPro && (
            <p className="text-[11px] text-gray-400 mt-2 px-1">提醒为 Pro 功能 · Reminders are a Pro feature.</p>
          )}
        </section>

        {/* ── General ── */}
        <section>
          <Label>通用 General</Label>
          <Group>
            <Row href="/parent/children" icon="ti-users" label="孩子管理 Children" sub="添加 / 编辑孩子资料" />
            <Row href="/feedback" icon="ti-message-circle" label="意见反馈 Feedback" sub="建议、问题、想要的功能 — 发消息给我" />
            <Row icon="ti-world" label="语言 Language" value="中英双语" last />
          </Group>
        </section>

        <p className="text-center text-[11px] text-gray-300">Chinese Spelling Buddy · 华文听写助手</p>
      </div>
    </AppShell>
  );
}
