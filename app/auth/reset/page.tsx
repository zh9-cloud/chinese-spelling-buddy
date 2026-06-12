"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppIcon } from "@/components/ui/AppIcon";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [ready,    setReady]    = useState(false);   // recovery session established?
  const [checking, setChecking] = useState(true);    // verifying the link
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Establish the recovery session from the link Supabase sent.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setChecking(false); return; }

    // Fires when the recovery link is processed (implicit/hash flow).
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecking(false);
      }
    });

    (async () => {
      // PKCE flow: the link comes back as ?code=...
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error: err } = await sb.auth.exchangeCodeForSession(code);
        if (!err) { setReady(true); setChecking(false); return; }
      }
      // Otherwise detectSessionInUrl handled the hash — confirm we have a session.
      const { data } = await sb.auth.getSession();
      if (data.session) setReady(true);
      setChecking(false);
    })();

    return () => subscription.unsubscribe();
  }, []);

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
        <span className="text-6xl mb-4">✅</span>
        <h1 className="text-xl font-black text-gray-800 mb-2">密码已重设</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          新密码已生效，正在带你进入。<br />
          <span className="text-gray-400">Password updated — redirecting…</span>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
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
    const { error: err } = await sb.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.replace("/parent/dashboard"), 1500);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 max-w-sm mx-auto w-full">

        <div className="mb-6">
          <AppIcon size={72} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">设置新密码</h1>
        <p className="text-sm text-gray-400 mb-8">Set a New Password</p>

        {checking ? (
          <p className="text-sm text-gray-400">验证链接中… Verifying link…</p>
        ) : !ready ? (
          <div className="text-center">
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              链接无效或已过期。请重新申请。<br />
              <span className="text-xs">This reset link is invalid or has expired.</span>
            </p>
            <Link href="/auth/forgot" className="text-sm text-brand-500 font-semibold hover:underline">
              重新申请 Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                新密码 New Password <span className="text-gray-400 font-normal">（至少 6 位）</span>
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
                确认新密码 Confirm Password
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
              {loading ? "保存中…" : "保存新密码 Save Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
