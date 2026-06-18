"use client";

// Captures a ?ref=CODE from the URL into localStorage, then redeems it once the
// user is signed in (handles the email-verification gap). Renders nothing.

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/useEntitlement";

const KEY = "pendingRef";

export function ReferralRedeemer() {
  const { user, authLoading } = useAuth();

  // Capture ?ref as early as possible (survives email verification redirect).
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem(KEY, ref.trim().toUpperCase());
  }, []);

  // Redeem once signed in.
  useEffect(() => {
    if (authLoading || !user) return;
    const code = localStorage.getItem(KEY);
    if (!code) return;
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      try {
        await fetch("/api/referral/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code }),
        });
      } catch { /* ignore */ }
      localStorage.removeItem(KEY); // one-shot regardless of outcome
    })();
  }, [user, authLoading]);

  return null;
}
