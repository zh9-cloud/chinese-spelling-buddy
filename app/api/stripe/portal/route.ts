// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/stripe/portal
//
//  Opens the Stripe Billing Portal so a subscriber can update payment details
//  or cancel. Auth: Authorization: Bearer <supabase access token>.
//  Response: { url }.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { serviceSupabase } from "@/lib/entitlements";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sb = serviceSupabase();
  if (!stripe || !sb) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const { data: userData } = token ? await sb.auth.getUser(token) : { data: { user: null } };
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "请先登录 · Not authenticated" }, { status: 401 });
  }

  const { data } = await sb
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${origin}/parent/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
