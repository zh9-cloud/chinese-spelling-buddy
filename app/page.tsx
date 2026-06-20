"use client";

import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import { InkDivider } from "@/components/ui/InkDivider";
import { useAuth } from "@/context/AuthContext";

const BENEFITS = [
  { icon: "ti-camera", text: "拍照导入词表" },
  { icon: "ti-volume", text: "AI 自动听写" },
  { icon: "ti-circle-check", text: "即时批改纠错" },
  { icon: "ti-chart-line", text: "学习进度追踪" },
  { icon: "ti-trophy", text: "培养自主学习" },
  { icon: "ti-users", text: "无需家长陪读" },
];

export default function LandingPage() {
  const { user, authLoading } = useAuth();
  const loggedIn = !authLoading && !!user;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      <div className="flex-1 max-w-md mx-auto w-full px-6 pt-14 pb-8 flex flex-col items-center text-center">

        <div className="mb-5" style={{ filter: "drop-shadow(0 16px 40px rgba(99,102,241,0.3))" }}>
          <AppIcon size={92} />
        </div>

        <h1 className="font-black tracking-tight text-gray-900 leading-tight"
          style={{ fontSize: "clamp(1.7rem, 8vw, 2.2rem)" }}>
          Chinese Spelling <span className="text-brand-500">Buddy</span>
        </h1>
        <p className="text-sm text-gray-500 mt-2.5">专为新加坡小学华文设计 · P1–P6</p>
        <p className="text-xs text-gray-400 mb-5">Self-paced Chinese 听写 for SG primary kids</p>

        <InkDivider tone="cinnabar" className="max-w-[160px] mb-6" />

        {/* Benefit keywords */}
        <div className="grid grid-cols-2 gap-2.5 w-full mb-7">
          {BENEFITS.map((b) => (
            <div key={b.text} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <i className={`ti ${b.icon} text-xl text-brand-500 shrink-0`} aria-hidden="true" />
              <span className="text-[13px] font-semibold text-gray-700 text-left leading-tight">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <Link href="/parent/dashboard"
          className="w-full flex items-center justify-center gap-2 rounded-xl py-4 bg-brand-500 hover:bg-brand-600 active:scale-95 shadow-lg shadow-brand-200 text-white font-bold text-lg transition-all">
          {loggedIn ? "进入应用" : "免费试用 · 立即开始"}
          <i className="ti ti-arrow-right text-xl" aria-hidden="true" />
        </Link>
        {loggedIn && (
          <p className="text-xs text-gray-400 mt-2.5">
            <span className="truncate">已登录 {user?.email}</span>
          </p>
        )}

        {/* Brand + slogan */}
        <div className="mt-5 flex flex-col items-center gap-0.5">
          <p className="calligraphy text-base font-bold text-[#b83b2e]">板栗老师</p>
          <p className="text-xs text-gray-400 tracking-wide">用心教，智能学 · Taught with care, learn with AI</p>
        </div>
      </div>

      {/* Brand name at the very bottom */}
      <p className="calligraphy text-center text-gray-300 text-sm tracking-widest pb-8">华文听写助手</p>
    </div>
  );
}
