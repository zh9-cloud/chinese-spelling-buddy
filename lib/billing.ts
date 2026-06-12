// ─────────────────────────────────────────────────────────────────────────────
//  Billing / freemium configuration (shared client + server).
//
//  The paywall stays DORMANT until billing is switched on, so the app behaves
//  exactly as before until Stripe is configured. Two independent switches:
//    • Server enforcement  → STRIPE_SECRET_KEY present (see lib/entitlements.ts)
//    • Client upgrade UI    → NEXT_PUBLIC_BILLING_ENABLED === "1"
//  Flip both on together once Stripe products + env vars are ready.
// ─────────────────────────────────────────────────────────────────────────────

export type Plan = "monthly" | "annual";

/** Free-tier lifetime quotas for the AI features (per signed-in account). */
export const FREE_AI_QUOTA = {
  import: 3, // photo / PDF → word-list OCR  (/api/import)
  grade: 3,  // AI handwriting grading        (/api/grade)
} as const;

export type AiFeature = keyof typeof FREE_AI_QUOTA;

/** Free tier allows ONE child; Pro unlocks more. */
export const FREE_MAX_CHILDREN = 1;
export const PRO_MAX_CHILDREN = 4;

/** Pricing shown on the upgrade page (display only — real amounts live in Stripe). */
export const PLAN_DISPLAY: Record<Plan, { label: string; price: string; per: string; note: string }> = {
  monthly: { label: "月付 Monthly", price: "S$2.99", per: "/ 月 month", note: "随时取消 Cancel anytime" },
  annual:  { label: "年付 Annual",  price: "S$20",   per: "/ 年 year",  note: "省 ~44% · 最划算 Best value" },
};

/** True when the client should show upgrade UI (set NEXT_PUBLIC_BILLING_ENABLED=1). */
export function billingEnabledClient(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === "1";
}
