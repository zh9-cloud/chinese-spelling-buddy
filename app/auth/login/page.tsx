"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import { OAuthButtons } from "@/components/ui/OAuthButtons";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Already logged in → redirect
  useEffect(() => {
    if (!authLoading && user) router.replace("/parent/dashboard");
  }, [user, authLoading, router]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">⚙️</span>
        <h1 className="text-xl font-black text-gray-800 mb-2">账户系统未配置</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          请将 Supabase 环境变量添加到 <code className="bg-gray-100 px-1 rounded">.env.local</code> 文件后重启服务。
        </p>
        <Link href="/" className="text-brand-500 font-semibold text-sm">← 返回首页</Link>
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setError(err.message === "Invalid login credentials"
        ? "邮箱或密码错误 · Invalid credentials"
        : err.message);
      setLoading(false);
    } else {
      router.push("/parent/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-sm mx-auto w-full">

        <div className="mb-6">
          <AppIcon size={72} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">家长登录</h1>
        <p className="text-sm text-gray-400 mb-8">Parent Login</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
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
              密码 Password
            </label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
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
            {loading ? "登录中…" : "登录 Sign In"}
          </button>
        </form>

        <OAuthButtons onError={setError} />

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            还没有账户？{" "}
            <Link href="/auth/signup" className="text-brand-500 font-semibold hover:underline">
              注册 Sign Up
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
