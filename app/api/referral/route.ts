// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/referral — the signed-in parent's referral code + stats.
//  Auth: Authorization: Bearer <supabase access token>.
//  Response: { code, inviteCount, proUntil }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/entitlements";
import { getOrCreateCode } from "@/lib/referral";

export async function GET(req: NextRequest) {
  const sb = serviceSupabase();
  if (!sb) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const { data: userData } = token ? await sb.auth.getUser(token) : { data: { user: null } };
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "请先登录 · Not authenticated" }, { status: 401 });

  const code = await getOrCreateCode(sb, user.id);
  const { count } = await sb
    .from("referral_events")
    .select("*", { count: "exact", head: true })
    .eq("referrer_user_id", user.id);
  const { data: grant } = await sb.from("pro_grants").select("pro_until").eq("user_id", user.id).maybeSingle();

  return NextResponse.json({ code, inviteCount: count ?? 0, proUntil: grant?.pro_until ?? null });
}
