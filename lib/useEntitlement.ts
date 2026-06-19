"use client";

// Client hook: reads the signed-in parent's plan + AI usage from Supabase.
// Relies on row-level security (each user can read only their own rows).
// When billing is disabled, everyone is treated as having full access.

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { billingEnabledClient, FREE_AI_QUOTA, type AiFeature } from "@/lib/billing";

export interface Entitlement {
  loading: boolean;
  /** Paywall active at all? */
  billingOn: boolean;
  isPro: boolean;
  /** "monthly" | "annual" | null — the active plan, when Pro. */
  plan: string | null;
  /** ISO date string the current paid period runs until, when Pro. */
  currentPeriodEnd: string | null;
  /** Remaining free uses per feature (only meaningful for free, logged-in users). */
  remaining: Record<AiFeature, number>;
  refresh: () => void;
}

export function useEntitlement(): Entitlement {
  const { user, authLoading } = useAuth();
  const billingOn = billingEnabledClient();
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [used, setUsed] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    // Billing off → full access, nothing to load.
    if (!billingOn) { setLoading(false); setIsPro(false); return; }
    if (authLoading) return;
    if (!user) { setLoading(false); setIsPro(false); setUsed({}); return; }

    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [{ data: sub }, { data: usage }, { data: grant }, { data: iap }] = await Promise.all([
        sb.from("subscriptions").select("status,plan,current_period_end").eq("user_id", user.id).maybeSingle(),
        sb.from("ai_usage").select("feature,count").eq("user_id", user.id),
        sb.from("pro_grants").select("pro_until").eq("user_id", user.id).maybeSingle(),
        sb.from("iap_entitlements").select("active,expires_at").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;

      const subActive = !!sub && (sub.status === "active" || sub.status === "trialing") &&
        (!sub.current_period_end || new Date(sub.current_period_end).getTime() > Date.now());
      const iapActive = !!iap?.active && (!iap.expires_at || new Date(iap.expires_at).getTime() > Date.now());
      const grantActive = !!grant?.pro_until && new Date(grant.pro_until).getTime() > Date.now();
      setIsPro(subActive || iapActive || grantActive);
      // Show the Stripe plan + expiry if subscribed, then IAP, else the referral grant end.
      setPlan(subActive ? (sub!.plan ?? null) : iapActive ? "iap" : grantActive ? "referral" : null);
      setCurrentPeriodEnd(
        subActive ? (sub!.current_period_end ?? null)
        : iapActive ? (iap!.expires_at ?? null)
        : grantActive ? grant!.pro_until
        : null
      );

      const map: Record<string, number> = {};
      for (const row of usage ?? []) map[row.feature] = row.count;
      setUsed(map);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [billingOn, user, authLoading, tick]);

  const remaining = {
    import: Math.max(0, FREE_AI_QUOTA.import - (used.import ?? 0)),
    grade: Math.max(0, FREE_AI_QUOTA.grade - (used.grade ?? 0)),
  } as Record<AiFeature, number>;

  return { loading, billingOn, isPro, plan, currentPeriodEnd, remaining, refresh };
}

/** Get the current Supabase access token (for Authorization headers), or "". */
export async function getAccessToken(): Promise<string> {
  const sb = getSupabase();
  if (!sb) return "";
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? "";
}
