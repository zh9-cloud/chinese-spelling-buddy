// ─────────────────────────────────────────────────────────────────────────────
//  Server-side entitlement checks for the freemium paywall.
//
//  The AI API routes (/api/import, /api/grade) call checkAiQuota() before doing
//  any OpenAI work. When billing is OFF (no STRIPE_SECRET_KEY) everything is
//  allowed — preserving the current free-for-all behaviour until Stripe is live.
//
//  When billing is ON:
//    • no/invalid auth token  → login_required   (trial users must sign up)
//    • active subscription    → unlimited
//    • free tier under quota  → allowed, caller records usage on success
//    • free tier over quota   → quota_exceeded
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { FREE_AI_QUOTA, type AiFeature } from "@/lib/billing";

/** Billing enforcement is active only when Stripe + Supabase service role exist. */
export function billingEnabledServer(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/** Supabase admin client (service role — bypasses RLS). Null if not configured. */
export function serviceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Read the Bearer token from the request and resolve the Supabase user. */
async function userFromRequest(req: NextRequest, sb: SupabaseClient): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/** True when the user has a currently-valid paid subscription. */
export async function isProUser(sb: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await sb
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const active = data.status === "active" || data.status === "trialing";
  if (!active) return false;
  // Grace: treat missing period end as active; otherwise require it to be in the future.
  if (!data.current_period_end) return true;
  return new Date(data.current_period_end).getTime() > Date.now();
}

export type QuotaCode = "login_required" | "quota_exceeded";

export interface QuotaGate {
  allowed: boolean;
  code?: QuotaCode;
  message?: string;
  userId?: string;
  /** Caller should record one unit of usage after a successful AI call. */
  shouldRecord: boolean;
}

/** Gate an AI feature for the requesting user. */
export async function checkAiQuota(req: NextRequest, feature: AiFeature): Promise<QuotaGate> {
  // Billing off → no gating (current behaviour).
  if (!billingEnabledServer()) return { allowed: true, shouldRecord: false };

  const sb = serviceSupabase();
  if (!sb) return { allowed: true, shouldRecord: false };

  const userId = await userFromRequest(req, sb);
  if (!userId) {
    return {
      allowed: false,
      code: "login_required",
      message: "请先注册或登录后再使用 AI 功能 · Please sign up or log in to use AI features.",
      shouldRecord: false,
    };
  }

  if (await isProUser(sb, userId)) {
    return { allowed: true, userId, shouldRecord: false };
  }

  // Free tier — check lifetime usage for this feature.
  const limit = FREE_AI_QUOTA[feature];
  const { data } = await sb
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .maybeSingle();
  const used = data?.count ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      code: "quota_exceeded",
      message: `免费额度已用完（${limit} 次）· Free ${feature} limit reached. Upgrade to continue.`,
      userId,
      shouldRecord: false,
    };
  }

  return { allowed: true, userId, shouldRecord: true };
}

/** Increment a user's usage counter for a feature (service role; best-effort). */
export async function recordAiUsage(userId: string, feature: AiFeature): Promise<void> {
  const sb = serviceSupabase();
  if (!sb) return;
  const { data } = await sb
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .maybeSingle();
  const next = (data?.count ?? 0) + 1;
  await sb
    .from("ai_usage")
    .upsert({ user_id: userId, feature, count: next, updated_at: new Date().toISOString() }, { onConflict: "user_id,feature" });
}
