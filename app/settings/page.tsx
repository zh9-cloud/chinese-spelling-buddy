"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useEntitlement } from "@/lib/useEntitlement";
import { isSupabaseConfigured } from "@/lib/supabase";

function Row({ href, onClick, icon, label, sub, danger }: {
  href?: string; onClick?: () => void; icon: string; label: string; sub?: string; danger?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-xl w-6 text-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-red-500" : "text-gray-700"}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {!onClick && <span className="text-gray-300">›</span>}
    </div>
  );
  if (href) return <Link href={href} className="block hover:bg-gray-50">{inner}</Link>;
  return <button onClick={onClick} className="block w-full text-left hover:bg-gray-50">{inner}</button>;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, authLoading, signOut } = useAuth();
  const { billingOn, isPro, plan, currentPeriodEnd } = useEntitlement();
  const supaOn = isSupabaseConfigured();

  const validUntil = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })
    : null;

  return (
    <AppShell title="设置 Settings" backHref="/parent/dashboard">
      <div className="space-y-5 page-enter">

        {/* Account */}
        {supaOn && !authLoading && (
          user ? (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                <span className="w-11 h-11 rounded-full bg-brand-500 text-white flex items-center justify-center font-black">
                  {(user.email ?? "?").charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400">已登录 Signed in</p>
                </div>
                {billingOn && isPro && (
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded-full px-2.5 py-1">💎 Pro</span>
                )}
              </div>
              <Row icon="🚪" label="退出登录 Sign out" danger onClick={async () => { await signOut(); router.push("/parent/dashboard"); }} />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <p className="text-sm font-bold text-gray-800 mb-1">登录 / 注册</p>
              <p className="text-xs text-gray-400 mb-4">登录后云端保存,换设备不丢失</p>
              <div className="space-y-2">
                <Link href="/auth/login" className="block bg-brand-500 text-white font-bold rounded-xl py-3 text-sm hover:bg-brand-600">
                  登录 Log in
                </Link>
                <Link href="/auth/signup" className="block border border-gray-200 text-gray-700 font-bold rounded-xl py-3 text-sm hover:bg-gray-50">
                  注册新账户 Sign up
                </Link>
              </div>
              <Link href="/auth/forgot" className="inline-block mt-3 text-xs text-gray-400 hover:text-brand-500">
                忘记密码 Forgot password?
              </Link>
            </div>
          )
        )}

        {/* Subscription */}
        {billingOn && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <Row
              href="/parent/upgrade"
              icon="💎"
              label={isPro ? "订阅管理 Subscription" : "升级 Pro Upgrade"}
              sub={isPro ? `${plan === "monthly" ? "月付" : "年付"}${validUntil ? ` · 有效期至 ${validUntil}` : ""}` : "解锁 AI 与提醒"}
            />
          </div>
        )}

        {/* App settings */}
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          <Row href="/parent/children" icon="👨‍👧" label="孩子管理 Children" />
          <Row href="/parent/dashboard" icon="🏠" label="返回家长主页 Home" />
        </div>

        <p className="text-center text-[11px] text-gray-300">Chinese Spelling Buddy · 华文听写助手</p>
      </div>
    </AppShell>
  );
}
