// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/stripe/webhook
//
//  Stripe → our server. Keeps the `subscriptions` table in sync with Stripe.
//  Configure the endpoint in the Stripe dashboard and set STRIPE_WEBHOOK_SECRET.
//
//  Handled events:
//    • checkout.session.completed          — first payment done
//    • customer.subscription.created/updated/deleted — status / renewal changes
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { serviceSupabase } from "@/lib/entitlements";

// Stripe needs the raw request body to verify the signature.
export const runtime = "nodejs";

function planFromPrice(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ANNUAL) return "annual";
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  return null;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const sb = serviceSupabase();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !sb || !whSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", whSecret);
  } catch (e) {
    console.error("[stripe webhook] signature verification failed:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Upsert a subscription row from a Stripe.Subscription.
  async function syncSubscription(sub: Stripe.Subscription, fallbackUserId?: string) {
    const userId =
      (sub.metadata?.supabase_user_id as string | undefined) ?? fallbackUserId;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const priceId = sub.items.data[0]?.price?.id;
    const periodEnd = sub.items.data[0]?.current_period_end ?? null;

    // Resolve the user from the customer id if metadata is missing.
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const { data } = await sb!
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      resolvedUserId = data?.user_id;
    }
    if (!resolvedUserId) {
      console.error("[stripe webhook] no user for customer", customerId);
      return;
    }

    await sb!.from("subscriptions").upsert(
      {
        user_id: resolvedUserId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        status: sub.status,
        plan: planFromPrice(priceId),
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.client_reference_id as string | undefined) ?? undefined;
        if (session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub, userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[stripe webhook] handler error:", e);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
