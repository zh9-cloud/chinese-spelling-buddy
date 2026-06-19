// ─────────────────────────────────────────────────────────────────────────────
//  Owner-only "gift Pro" tool — grant free Pro to colleagues by email.
//
//  Auth: Authorization: Bearer <supabase token>, caller's email must equal
//  ADMIN_EMAIL (same gate as /api/admin/stats). Writes the existing pro_grants
//  table (reason "teacher_gift"), which isProUser / useEntitlement already OR in.
//
//    GET                      → list current teacher gifts (email, until, active)
//    POST { email, months }   → grant / extend Pro (default 12 months)
//    POST { email, revoke:true } → expire the gift now
//
//  The colleague must already have a (free) account — we resolve their email to
//  a Supabase user; if none exists we return 404 so the owner asks them to sign up.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceSupabase } from "@/lib/entitlements";

export const maxDuration = 30;

const DAY = 86_400_000;
const MONTH_DAYS = 30;
const GIFT_REASON = "teacher_gift";

/** Verify the caller is the configured admin. Returns null on success, else a response. */
async function requireAdmin(req: NextRequest, sb: SupabaseClient): Promise<NextResponse | null> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return NextResponse.json({ error: "ADMIN_EMAIL not set" }, { status: 503 });
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const { data } = token ? await sb.auth.getUser(token) : { data: { user: null } };
  const email = data?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (email !== adminEmail) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

/** Resolve an email (case-insensitive) to a Supabase user id, or null. */
async function findUserIdByEmail(sb: SupabaseClient, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  const { data } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const u = (data?.users ?? []).find((x) => x.email?.toLowerCase() === target);
  return u?.id ?? null;
}

export async function GET(req: NextRequest) {
  const sb = serviceSupabase();
  if (!sb) return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  const denied = await requireAdmin(req, sb);
  if (denied) return denied;

  const { data: grants } = await sb
    .from("pro_grants")
    .select("user_id,pro_until,reason")
    .eq("reason", GIFT_REASON);

  // Map user ids → emails for display.
  const { data: usersData } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((usersData?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const now = Date.now();

  const gifts = (grants ?? [])
    .map((g) => ({
      email: emailById.get(g.user_id) ?? "(unknown)",
      proUntil: g.pro_until as string,
      active: new Date(g.pro_until).getTime() > now,
    }))
    .sort((a, b) => (a.email < b.email ? -1 : 1));

  return NextResponse.json({ gifts });
}

export async function POST(req: NextRequest) {
  const sb = serviceSupabase();
  if (!sb) return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  const denied = await requireAdmin(req, sb);
  if (denied) return denied;

  let body: { email?: string; months?: number; revoke?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "请输入有效邮箱 · Enter a valid email" }, { status: 400 });
  }

  const userId = await findUserIdByEmail(sb, email);
  if (!userId) {
    return NextResponse.json(
      { error: "该邮箱还没注册账号 · No account for this email. Ask them to sign up (free) first." },
      { status: 404 }
    );
  }

  // Revoke: expire the grant immediately.
  if (body.revoke) {
    await sb.from("pro_grants").upsert(
      { user_id: userId, pro_until: new Date().toISOString(), reason: GIFT_REASON, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    return NextResponse.json({ ok: true, revoked: true, email });
  }

  // Grant / extend: stack from the later of now / existing end.
  const months = Math.min(60, Math.max(1, Math.round(body.months ?? 12)));
  const { data: existing } = await sb.from("pro_grants").select("pro_until").eq("user_id", userId).maybeSingle();
  const base = Math.max(Date.now(), existing?.pro_until ? new Date(existing.pro_until).getTime() : 0);
  const proUntil = new Date(base + months * MONTH_DAYS * DAY).toISOString();
  await sb.from("pro_grants").upsert(
    { user_id: userId, pro_until: proUntil, reason: GIFT_REASON, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ ok: true, email, months, proUntil });
}
