// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/referral/redeem — a newly-signed-up user applies a referral code.
//  Body: { code }. Auth: Authorization: Bearer <new user's access token>.
//
//  Grants +1 month Pro to BOTH the referrer and the new user. A user can be
//  referred only once (unique referred_user_id); self-referral is rejected.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/entitlements";
import { extendProGrant } from "@/lib/referral";

const REWARD_MONTHS = 1;

export async function POST(req: NextRequest) {
  const sb = serviceSupabase();
  if (!sb) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const { data: userData } = token ? await sb.auth.getUser(token) : { data: { user: null } };
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let code = "";
  try {
    const body = (await req.json()) as { code?: string };
    code = (body.code ?? "").trim().toUpperCase();
  } catch { /* empty */ }
  if (!code) return NextResponse.json({ error: "缺少邀请码 · Missing code" }, { status: 400 });

  // Already referred? Idempotent success (no double reward).
  const { data: existing } = await sb
    .from("referral_events")
    .select("id")
    .eq("referred_user_id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, already: true });

  // Resolve the code → referrer.
  const { data: codeRow } = await sb.from("referral_codes").select("user_id").eq("code", code).maybeSingle();
  if (!codeRow) return NextResponse.json({ error: "邀请码无效 · Invalid code" }, { status: 400 });
  const referrerId = codeRow.user_id as string;
  if (referrerId === user.id) return NextResponse.json({ error: "不能使用自己的邀请码" }, { status: 400 });

  // Record the referral, then reward both sides.
  const { error: evErr } = await sb.from("referral_events").insert({
    referrer_user_id: referrerId,
    referred_user_id: user.id,
    code,
  });
  if (evErr) {
    // Unique race — treat as already redeemed.
    return NextResponse.json({ ok: true, already: true });
  }

  await extendProGrant(sb, referrerId, REWARD_MONTHS);
  const proUntil = await extendProGrant(sb, user.id, REWARD_MONTHS);

  return NextResponse.json({ ok: true, grantedMonths: REWARD_MONTHS, proUntil });
}
