// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/revenuecat/webhook
//
//  RevenueCat → our server. Keeps the `iap_entitlements` table in sync with
//  Apple App Store / Google Play subscriptions (purchase, renewal, cancel,
//  expiration, refund). This is the IAP counterpart of the Stripe webhook.
//
//  Setup (RevenueCat dashboard → Project → Integrations → Webhooks):
//    • URL    = https://www.sgspellingbuddy.com/api/revenuecat/webhook
//    • Header = Authorization: <REVENUECAT_WEBHOOK_AUTH>   (any shared secret)
//  Set the same value as the REVENUECAT_WEBHOOK_AUTH env var on Vercel.
//
//  appUserID is set to the Supabase user.id in the app, so `app_user_id` here is
//  that UUID — which is how phone purchases share Pro status with web/Stripe.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/entitlements";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** RevenueCat event (only the fields we use). */
interface RcEvent {
  type: string; // INITIAL_PURCHASE | RENEWAL | CANCELLATION | UNCANCELLATION | EXPIRATION | …
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  store?: string; // APP_STORE | PLAY_STORE | STRIPE | PROMOTIONAL …
  expiration_at_ms?: number | null;
  cancel_reason?: string | null; // UNSUBSCRIBE | BILLING_ERROR | CUSTOMER_SUPPORT | DEVELOPER_INITIATED …
}

/** Decide whether the entitlement is currently active given the event + expiry. */
function computeActive(ev: RcEvent, expiresAt: Date | null): boolean {
  const now = Date.now();
  switch (ev.type) {
    case "EXPIRATION":
      return false;
    case "CANCELLATION":
      // A refund (support / developer initiated) revokes immediately; a plain
      // unsubscribe just turns off auto-renew — Pro stays until the period end.
      if (ev.cancel_reason === "CUSTOMER_SUPPORT" || ev.cancel_reason === "DEVELOPER_INITIATED") {
        return false;
      }
      return expiresAt ? expiresAt.getTime() > now : true;
    default:
      // INITIAL_PURCHASE, RENEWAL, UNCANCELLATION, PRODUCT_CHANGE,
      // NON_RENEWING_PURCHASE, SUBSCRIPTION_EXTENDED, BILLING_ISSUE (grace) …
      return expiresAt ? expiresAt.getTime() > now : true;
  }
}

export async function POST(req: NextRequest) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  const sb = serviceSupabase();
  if (!expected || !sb) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // Shared-secret check (RevenueCat sends the configured value verbatim).
  if (req.headers.get("authorization") !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { event?: RcEvent };
  try {
    body = (await req.json()) as { event?: RcEvent };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ev = body.event;
  if (!ev?.type) return NextResponse.json({ error: "No event" }, { status: 400 });

  // TEST events from the dashboard have no real user — acknowledge and skip.
  if (ev.type === "TEST") return NextResponse.json({ received: true });

  const userId = ev.app_user_id ?? ev.original_app_user_id;
  // Only act on real Supabase users (skip RevenueCat anonymous ids).
  if (!userId || !UUID_RE.test(userId)) {
    console.warn("[revenuecat webhook] non-UUID app_user_id, skipping:", userId);
    return NextResponse.json({ received: true });
  }

  const expiresAt = ev.expiration_at_ms ? new Date(ev.expiration_at_ms) : null;
  const active = computeActive(ev, expiresAt);

  const { error } = await sb.from("iap_entitlements").upsert(
    {
      user_id: userId,
      store: ev.store ?? null,
      product_id: ev.product_id ?? null,
      rc_app_user_id: ev.app_user_id ?? null,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      active,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("[revenuecat webhook] upsert failed:", error.message);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
