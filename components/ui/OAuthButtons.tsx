"use client";

import { getSupabase } from "@/lib/supabase";

// Google / Apple sign-in via Supabase OAuth. On success the browser is
// redirected to the provider and back to /parent/dashboard, where the Supabase
// client picks up the session.
export function OAuthButtons({ onError }: { onError?: (msg: string) => void }) {
  async function handleOAuth(provider: "google" | "apple") {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/parent/dashboard` },
    });
    if (error) onError?.(error.message);
  }

  return (
    <div className="w-full mt-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">或 or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <div className="space-y-2">
        <button type="button" onClick={() => handleOAuth("google")}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg py-3 font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
          <GoogleIcon />
          使用 Google 登录
        </button>
        <button type="button" onClick={() => handleOAuth("apple")}
          className="w-full flex items-center justify-center gap-3 bg-black text-white rounded-lg py-3 font-semibold hover:bg-gray-800 active:scale-95 transition-all">
          <AppleIcon />
          使用 Apple 登录
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 1.43c.06 1.02-.36 2.02-.99 2.74-.66.77-1.74 1.36-2.78 1.28-.08-1 .41-2.04 1.02-2.7.68-.74 1.86-1.3 2.75-1.32zM20.5 17.13c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.53-4.12 3.54-1.54.01-1.94-1.01-4.03-1-2.09.01-2.53 1.02-4.07 1.01-1.73-.02-3.05-1.78-4.04-3.35C-.99 16.5-1.27 11.1 1.13 8.28c1-1.18 2.6-1.92 4.1-1.92 1.54 0 2.5.99 3.77.99 1.23 0 1.98-.99 3.76-.99 1.34 0 2.76.73 3.77 1.99-3.31 1.81-2.77 6.54.97 7.78z" />
    </svg>
  );
}
