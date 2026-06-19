// ─────────────────────────────────────────────────────────────────────────────
//  RevenueCat (in-app purchase) wrapper — NATIVE ONLY.
//
//  The web/PWA never calls these (it uses Stripe). The upgrade page branches on
//  isNativePlatform() and only reaches here inside the iOS/Android Capacitor
//  shell. We configure RevenueCat with appUserID = Supabase user.id so a phone
//  purchase shares Pro status with the web Stripe subscription (same account).
//
//  Env (public SDK keys from the RevenueCat dashboard → API keys):
//    • NEXT_PUBLIC_REVENUECAT_ANDROID_KEY   (goog_…)
//    • NEXT_PUBLIC_REVENUECAT_IOS_KEY       (appl_…)
//    • NEXT_PUBLIC_REVENUECAT_ENTITLEMENT   (defaults to "pro")
//
//  The webhook (/api/revenuecat/webhook) is the source of truth that writes the
//  DB; these client calls drive the purchase UI and trigger an entitlement
//  re-read on success.
// ─────────────────────────────────────────────────────────────────────────────

import { getPlatform, isNativePlatform } from "@/lib/platform";
import type { Plan } from "@/lib/billing";

const ENTITLEMENT_ID = process.env.NEXT_PUBLIC_REVENUECAT_ENTITLEMENT || "pro";

export interface PurchaseResult {
  ok: boolean;
  isPro: boolean;
  userCancelled?: boolean;
  error?: string;
}

let configuredFor: string | null = null;

/** Lazily import the plugin so a missing native runtime never breaks the bundle. */
async function getPurchases() {
  const mod = await import("@revenuecat/purchases-capacitor");
  return mod.Purchases;
}

function apiKey(): string | null {
  return (
    (getPlatform() === "ios"
      ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY) || null
  );
}

/** Configure RevenueCat once per signed-in user (appUserID = Supabase id). */
async function ensureConfigured(appUserId: string): Promise<boolean> {
  if (!isNativePlatform()) return false;
  if (configuredFor === appUserId) return true;
  const key = apiKey();
  if (!key) return false;
  const Purchases = await getPurchases();
  await Purchases.configure({ apiKey: key, appUserID: appUserId });
  configuredFor = appUserId;
  return true;
}

/** Does this CustomerInfo grant our Pro entitlement right now? */
function hasPro(customerInfo: unknown): boolean {
  const active = (customerInfo as { entitlements?: { active?: Record<string, unknown> } })
    ?.entitlements?.active;
  return !!active && Object.prototype.hasOwnProperty.call(active, ENTITLEMENT_ID);
}

/** Map our plan toggle to the matching RevenueCat package in the current offering. */
async function packageForPlan(plan: Plan) {
  const Purchases = await getPurchases();
  const offerings = await Purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  const wantType = plan === "annual" ? "ANNUAL" : "MONTHLY";
  return (
    pkgs.find((p) => p.packageType === wantType) ??
    pkgs.find((p) => p.identifier.toLowerCase().includes(plan)) ??
    pkgs[0] ??
    null
  );
}

/** Purchase the selected plan via the App Store / Play Store. */
export async function purchasePlan(appUserId: string, plan: Plan): Promise<PurchaseResult> {
  try {
    if (!(await ensureConfigured(appUserId))) {
      return { ok: false, isPro: false, error: "应用内购买不可用 · In-app purchase unavailable." };
    }
    const aPackage = await packageForPlan(plan);
    if (!aPackage) return { ok: false, isPro: false, error: "暂无可购买的套餐 · No products available." };

    const Purchases = await getPurchases();
    const { customerInfo } = await Purchases.purchasePackage({ aPackage });
    return { ok: true, isPro: hasPro(customerInfo) };
  } catch (e) {
    const err = e as { code?: string; message?: string; userCancelled?: boolean };
    if (err?.userCancelled || err?.code === "1" /* PURCHASE_CANCELLED */) {
      return { ok: false, isPro: false, userCancelled: true };
    }
    return { ok: false, isPro: false, error: err?.message || "购买失败 · Purchase failed." };
  }
}

/** Restore previous purchases (Apple requires a visible Restore button). */
export async function restorePurchases(appUserId: string): Promise<PurchaseResult> {
  try {
    if (!(await ensureConfigured(appUserId))) {
      return { ok: false, isPro: false, error: "应用内购买不可用 · In-app purchase unavailable." };
    }
    const Purchases = await getPurchases();
    const { customerInfo } = await Purchases.restorePurchases();
    return { ok: true, isPro: hasPro(customerInfo) };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, isPro: false, error: err?.message || "恢复失败 · Restore failed." };
  }
}
