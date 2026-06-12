"use client";

import { useState } from "react";
import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">⚙️</span>
        <h1 className="text-xl font-black text-gray-800 mb-2">账户系统未配置</h1>
        <Link href="/" className="text-brand-500 font-semibold text-sm">← 返回首页</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-6xl mb-4">📧</span>
        <h1 className="text-xl font-black text-gray-800 mb-2">请查收重设邮件</h1>
        <p className="text-sm text-gray-500 mb-2 max-w-xs">
          如果 <strong>{email}</strong> 已注册，我们已向它发送了一封重设密码邮件。<br />
          点击邮件中的链接即可设置新密码。
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Check your inbox — click the link to set a new password.
        </p>
        <Link href="/auth/login"
          className="bg-brand-500 text-white font-bold rounded-lg px-6 py-3 text-sm hover:bg-brand-600 transition-all">
          返回登录 Back to Login
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      // Always show success (don't leak which emails are registered)
      setDone(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-sm mx-auto w-full">

        <div className="mb-6">
          <AppIcon size={72} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">忘记密码</h1>
        <p className="text-sm text-gray-400 mb-8">Reset Password</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <p className="text-sm text-gray-500 text-center">
            输入注册邮箱，我们会发送重设密码链接。<br />
            <span className="text-gray-400">Enter your email to receive a reset link.</span>
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              邮箱 Email
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email"
              placeholder="your@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold rounded-lg py-4 transition-all active:scale-95 shadow-lg shadow-brand-200"
          >
            {loading ? "发送中…" : "发送重设链接 Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-sm text-brand-500 font-semibold hover:underline">
            ← 返回登录 Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
