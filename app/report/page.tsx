"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/context/StoreContext";
import { computeWeeklyReport, shareText } from "@/lib/report";

function Stat({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="bg-white/70 rounded-2xl px-3 py-3 text-center">
      <p className={`text-2xl font-black tabular-nums ${accent ?? "text-gray-800"}`}>{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function ReportContent() {
  const params = useSearchParams();
  const { store } = useStore();
  const childId = params.get("child") ?? store.children[0]?.id ?? "";
  const child = store.children.find((c) => c.id === childId);
  const [copied, setCopied] = useState(false);

  if (!child) {
    return (
      <AppShell title="本周报告 Weekly Report" backHref="/parent/dashboard">
        <EmptyState icon="📊" title="找不到孩子" description="请先选择一个孩子。" />
      </AppShell>
    );
  }

  const r = computeWeeklyReport(store, childId);

  async function share() {
    const text = shareText(r);
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "华文听写助手 · 本周报告", text }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <AppShell title="本周报告 Weekly Report" backHref={`/student/dashboard?child=${childId}`}>
      <div className="space-y-4 page-enter pb-24">

        {/* Shareable card */}
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-5">
          <div className="text-center mb-4">
            <p className="calligraphy text-lg font-black text-gray-800">本周学习报告</p>
            <p className="text-sm font-bold text-brand-600 mt-1">{r.childName} · {r.grade}</p>
            <p className="text-xs text-gray-400">{r.rangeLabel}</p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <Stat value={r.sessions} label="练习次数" accent="text-brand-600" />
            <Stat value={r.sessions > 0 ? `${r.accuracy}%` : "—"} label="平均正确率" accent="text-jade-600" />
            <Stat value={r.streakDays} label="连续打卡(天)" accent="text-orange-500" />
          </div>

          <div className="bg-white/70 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">本周练习 {r.itemsPracticed} 个词</p>
            {r.weakWords.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-gray-600 mt-2 mb-1">📕 需要复习的字</p>
                <p className="text-sm text-gray-700 cjk">{r.weakWords.join(" · ")}</p>
              </>
            ) : (
              <p className="text-sm text-jade-600 font-semibold mt-1">🎉 本周没有错字，太棒了！</p>
            )}
          </div>

          <p className="text-center text-[11px] text-gray-300 mt-4">华文听写助手 · sgspellingbuddy.com</p>
        </div>

        {r.sessions === 0 && (
          <p className="text-center text-xs text-gray-400">本周还没有练习记录，去练一练就有数据啦！</p>
        )}

        {/* Share */}
        <button onClick={share}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 bg-jade-500 hover:bg-jade-600 active:scale-95 text-white font-bold transition-all shadow-lg shadow-jade-200">
          <i className="ti ti-share text-xl" aria-hidden="true" />
          {copied ? "已复制 Copied!" : "分享成绩 Share"}
        </button>
        <p className="text-center text-[11px] text-gray-400">
          分享给家人或老师 · 也可截图保存 · Share to WhatsApp or screenshot
        </p>
      </div>
    </AppShell>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>}>
      <ReportContent />
    </Suspense>
  );
}
