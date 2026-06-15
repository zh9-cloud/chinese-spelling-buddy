// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/admin/stats  — owner-only metrics dashboard data.
//
//  Auth: Authorization: Bearer <supabase access token>. The caller's email must
//  match ADMIN_EMAIL (server-only env). Anyone else gets 403. Uses the service
//  role to aggregate registered users, subscriptions, engagement, and AI usage.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/entitlements";
import { PLAN_DISPLAY } from "@/lib/billing";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const sb = serviceSupabase();
  if (!sb) return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  if (!adminEmail) return NextResponse.json({ error: "ADMIN_EMAIL not set" }, { status: 503 });

  // Verify the caller is the admin.
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const { data: userData } = token ? await sb.auth.getUser(token) : { data: { user: null } };
  const email = userData?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (email !== adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = Date.now();
  const day = 24 * 3600 * 1000;

  // Registered parents (auth users)
  const { data: usersData } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const users = usersData?.users ?? [];
  const signups7d = users.filter((u) => now - new Date(u.created_at).getTime() < 7 * day).length;
  const signups30d = users.filter((u) => now - new Date(u.created_at).getTime() < 30 * day).length;

  // Subscriptions
  const { data: subs } = await sb.from("subscriptions").select("status,plan,current_period_end");
  const byStatus: Record<string, number> = {};
  let monthly = 0, annual = 0, activeTotal = 0;
  for (const s of subs ?? []) {
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
    const active = (s.status === "active" || s.status === "trialing") &&
      (!s.current_period_end || new Date(s.current_period_end).getTime() > now);
    if (active) {
      activeTotal++;
      if (s.plan === "monthly") monthly++;
      else if (s.plan === "annual") annual++;
    }
  }

  // MRR estimate (SGD): monthly price + annual price / 12.
  const mMonthly = Number(PLAN_DISPLAY.monthly.price.replace(/[^\d.]/g, "")) || 0;
  const mAnnual = Number(PLAN_DISPLAY.annual.price.replace(/[^\d.]/g, "")) || 0;
  const mrr = monthly * mMonthly + annual * (mAnnual / 12);

  // Engagement counts
  const counts = await Promise.all([
    sb.from("children").select("*", { count: "exact", head: true }),
    sb.from("dictation_lists").select("*", { count: "exact", head: true }),
    sb.from("practice_sessions").select("*", { count: "exact", head: true }),
  ]);
  const [children, lists, sessions] = counts.map((c) => c.count ?? 0);

  // AI usage totals (cost proxy)
  const { data: usage } = await sb.from("ai_usage").select("feature,count");
  const aiUsage: Record<string, number> = { import: 0, grade: 0 };
  for (const u of usage ?? []) aiUsage[u.feature] = (aiUsage[u.feature] ?? 0) + (u.count ?? 0);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    parents: { total: users.length, signups7d, signups30d },
    subscriptions: { active: activeTotal, monthly, annual, byStatus, mrr: Math.round(mrr * 100) / 100 },
    engagement: { children, lists, sessions },
    aiUsage,
  });
}
