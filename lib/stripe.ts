import Stripe from "stripe";

// Server-only Stripe client. Returns null when the secret key isn't set, so the
// app degrades gracefully (no billing) until Stripe is configured.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) _stripe = new Stripe(key);
  return _stripe;
}

/** The Stripe Price ID for a given plan, from env. */
export function priceIdFor(plan: "monthly" | "annual"): string | undefined {
  return plan === "annual"
    ? process.env.STRIPE_PRICE_ANNUAL
    : process.env.STRIPE_PRICE_MONTHLY;
}
