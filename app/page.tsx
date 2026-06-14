"use client";

import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import { InkDivider } from "@/components/ui/InkDivider";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function LandingPage() {
  const { user, authLoading, signOut } = useAuth();
  const supabaseOn = isSupabaseConfigured();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center max-w-sm mx-auto w-full">

        {/* App icon */}
        <div className="mb-8" style={{ filter: "drop-shadow(0 16px 40px rgba(99,102,241,0.35))" }}>
          <AppIcon size={112} />
        </div>

        {/* English title */}
        <p className="font-black tracking-tight text-gray-900 mb-1"
          style={{ fontSize: "clamp(1.5rem, 7.5vw, 2rem)" }}>
          Chinese Spelling{" "}
          <span className="text-brand-500">Buddy</span>
        </p>

        {/* Chinese title — calligraphic 楷体 */}
        <h1 className="font-black calligraphy tracking-tight text-gray-700 mb-3"
          style={{ fontSize: "clamp(1.7rem, 8vw, 2.2rem)", lineHeight: 1.2 }}>
          华文听写助手
        </h1>

        {/* Ink-wash divider */}
        <InkDivider tone="cinnabar" className="max-w-[180px] mb-3" />

        {/* Tagline */}
        <div className="flex items-center gap-2 mb-10">
          <span style={{ fontSize: "0.75rem", color: "var(--cinnabar)" }}>◆</span>
          <p className="font-black uppercase text-gray-400"
            style={{ fontSize: "0.68rem", letterSpacing: "0.15em" }}>
            SG Primary 3–6
          </p>
          <span style={{ fontSize: "0.75rem", color: "var(--cinnabar)" }}>◆</span>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: "📖", text: "学习模式" },
            { icon: "✏️", text: "测试模式" },
            { icon: "📷", text: "AI识别词表" },
          ].map(({ icon, text }) => (
            <span key={text}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3.5 py-1.5 text-sm font-semibold text-gray-500 shadow-sm">
              {icon} {text}
            </span>
          ))}
        </div>

        {/* Entry buttons */}
        <div className="w-full space-y-3">

          {/* Parent section */}
          <div className="space-y-2">

            {/* Auth row — ABOVE the Parent button (login first) */}
            {supabaseOn && (
              !authLoading && user ? (
                <button
                  onClick={signOut}
                  className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1"
                >
                  退出登录 Sign out
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login"
                    className="flex-1 text-center text-xs font-semibold text-brand-500 border border-brand-200 rounded-xl py-2 hover:bg-brand-50 transition-colors">
                    登录 Login
                  </Link>
                  <Link href="/auth/signup"
                    className="flex-1 text-center text-xs font-semibold text-brand-500 border border-brand-200 rounded-xl py-2 hover:bg-brand-50 transition-colors">
                    注册 Sign Up
                  </Link>
                </div>
              )
            )}

            {/* Parent button */}
            <Link href="/parent/dashboard"
              className="flex items-center justify-center gap-3 w-full rounded-lg py-4 transition-all duration-150 active:scale-95 bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-200 text-white">
              <span className="text-2xl">👨‍👧</span>
              <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>家长</span>
              <span style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "0.02em" }}>
                Parent
              </span>
              {!authLoading && user && (
                <span className="text-xs opacity-70 truncate max-w-[7rem]">{user.email}</span>
              )}
            </Link>
          </div>

          <Link href="/student/dashboard"
            className="flex items-center justify-center gap-3 w-full rounded-lg py-4 transition-all duration-150 active:scale-95 bg-jade-500 hover:bg-jade-600 shadow-lg shadow-jade-200 text-white">
            <span className="text-2xl">🧒</span>
            <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>学生</span>
            <span style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "0.02em" }}>Student</span>
          </Link>
        </div>

        <p className="text-xs font-semibold tracking-widest uppercase text-gray-300 mt-5">
          {supabaseOn && !authLoading && user
            ? "✓ 已登录 · Data synced to cloud"
            : supabaseOn
            ? "账户系统已启用"
            : "本地模式 · Data saved on this device"}
        </p>
      </div>
    </div>
  );
}
