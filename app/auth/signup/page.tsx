"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace("/parent/dashboard");
  }, [user, authLoading, router]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">⚙️</span>
        <h1 className="text-xl font-black text-gray-800 mb-2">账户系统未配置</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          请将 Supabase 环境变量添加到{" "}
          <code className="bg-gray-100 px-1 rounded">.env.local</code> 后重启开发服务器。
        </p>
        <Link href="/" className="text-brand-500 font-semibold text-sm">← 返回首页</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-6xl mb-4">📧</span>
        <h1 className="text-xl font-black text-gray-800 mb-2">请查收验证邮件</h1>
        <p className="text-sm text-gray-500 mb-2 max-w-xs">
          我们已向 <strong>{email}</strong> 发送了一封验证邮件。<br />
          点击邮件中的链接完成注册后即可登录。
        </p>
        <p className="text-xs text-gray-400 mb-6">
          Check your inbox — click the verification link to activate your account.
        </p>
        <Link href="/auth/login"
          className="bg-brand-500 text-white font-bold rounded-lg px-6 py-3 text-sm hover:bg-brand-600 transition-all">
          前往登录 Go to Login
        </Link>
      </div>
    );
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("两次密码不一致 · Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位 · Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.auth.signUp({ email: email.trim(), password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-sm mx-auto w-full">

        <div className="mb-6">
          <AppIcon size={72} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">创建账户</h1>
        <p className="text-sm text-gray-400 mb-8">Sign Up · Free Forever</p>

        <form onSubmit={handleSignup} className="w-full space-y-4">
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

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              密码 Password <span className="text-gray-400 font-normal">（至少 6 位）</span>
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password"
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              确认密码 Confirm Password
            </label>
            <input
              type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required autoComplete="new-password"
              placeholder="••••••••"
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
            {loading ? "注册中…" : "注册 Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            已有账户？{" "}
            <Link href="/auth/login" className="text-brand-500 font-semibold hover:underline">
              登录 Sign In
            </Link>
          </p>
          <Link href="/" className="block text-xs text-gray-300 hover:text-gray-500 mt-2">
            ← 返回首页 Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
