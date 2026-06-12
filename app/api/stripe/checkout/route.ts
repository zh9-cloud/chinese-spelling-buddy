// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/stripe/checkout
//
//  Body: { plan: "monthly" | "annual" }
//  Auth: Authorization: Bearer <supabase access token>
//  Response: { url }  — redirect the browser here to pay.
//
//  Creates (or reuses) a Stripe customer for the signed-in parent and opens a
//  subscription Checkout Session for the chosen plan.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { getStripe, priceIdFor } from "@/lib/stripe";
import { serviceSupabase } from "@/lib/entitlements";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sb = serviceSupabase();
  if (!stripe || !sb) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  // Identify the user from the bearer token.
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const { data: userData } = token ? await sb.auth.getUser(token) : { data: { user: null } };
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "请先登录 · Not authenticated" }, { status: 401 });
  }

  let plan: "monthly" | "annual" = "annual";
  try {
    const body = (await req.json()) as { plan?: "monthly" | "annual" };
    if (body.plan === "monthly" || body.plan === "annual") plan = body.plan;
  } catch { /* default to annual */ }

  const priceId = priceIdFor(plan);
  if (!priceId) {
    return NextResponse.json({ error: `Price not configured for ${plan}` }, { status: 503 });
  }

  // Reuse an existing Stripe customer if we have one.
  const { data: existing } = await sb
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await sb.from("subscriptions").upsert(
      { user_id: user.id, stripe_customer_id: customerId, status: "incomplete", updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: { metadata: { supabase_user_id: user.id, plan } },
    metadata: { supabase_user_id: user.id, plan },
    success_url: `${origin}/parent/dashboard?upgraded=1`,
    cancel_url: `${origin}/parent/upgrade`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
