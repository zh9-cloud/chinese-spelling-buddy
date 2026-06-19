# Native apps (Capacitor + RevenueCat IAP)

Thin native shell around the live PWA. The app loads `https://www.sgspellingbuddy.com`
via `server.url` (see [`capacitor.config.ts`](./capacitor.config.ts)); Next.js API
routes stay on Vercel. Native value-add = camera OCR, push, and **in-app purchase
via RevenueCat**. Web/Stripe billing is unchanged. Google Play ships first, then App Store.

## What's already wired (code, done)

- **Dual-billing backend** — `iap_entitlements` table ([`supabase-iap.sql`](./supabase-iap.sql)),
  RevenueCat webhook ([`app/api/revenuecat/webhook/route.ts`](./app/api/revenuecat/webhook/route.ts)).
- **Entitlement OR** — `isProUser` ([`lib/entitlements.ts`](./lib/entitlements.ts)) and
  `useEntitlement` ([`lib/useEntitlement.ts`](./lib/useEntitlement.ts)) now OR Stripe + referral + IAP.
- **Platform-aware upgrade** — [`app/parent/upgrade/page.tsx`](./app/parent/upgrade/page.tsx)
  branches: native → RevenueCat purchase ([`lib/revenuecat.ts`](./lib/revenuecat.ts)),
  web → Stripe. Restore-purchases button + store-managed cancel note on native.
- **Account linking** — RevenueCat `appUserID` is set to the Supabase `user.id`, so a
  web buyer is already Pro on the phone (no re-purchase) and vice-versa.

## Env vars

Server (Vercel):
- `REVENUECAT_WEBHOOK_AUTH` — shared secret; set the SAME value in the RevenueCat
  webhook's `Authorization` header.

Client (Vercel, `NEXT_PUBLIC_…`, inlined at build):
- `NEXT_PUBLIC_REVENUECAT_ANDROID_KEY` — `goog_…` public SDK key.
- `NEXT_PUBLIC_REVENUECAT_IOS_KEY` — `appl_…` public SDK key (for the later iOS build).
- `NEXT_PUBLIC_REVENUECAT_ENTITLEMENT` — entitlement id; defaults to `pro`.

## Remaining steps (need your machine + accounts — not doable from the repo)

1. **DB:** run `supabase-iap.sql` in Supabase → SQL Editor (prod project).
2. **Add the Android platform** (needs Android Studio + JDK 17):
   ```
   npm run cap:add:android
   npm run cap:sync
   npm run cap:open:android
   ```
   Native folders aren't generated in this repo yet — these run on your dev machine.
3. **App assets:** add app icon + splash (use `@capacitor/assets`).
4. **RevenueCat dashboard:** create project → add the Google Play app → create the
   `pro` **entitlement** → create monthly + annual **products/offerings** mapped to the
   Play subscription products → copy the Android public SDK key into Vercel env →
   add a **webhook** to `/api/revenuecat/webhook` with the `Authorization` secret.
5. **Play Console:** create the dev account (US$25 one-time), app listing, content
   rating, data-safety form; create the matching subscription products; upload an
   internal-test build, then promote to production.
6. **Pricing:** set the Play tiers nearest to S$2.99 / S$20 (Google/Apple take 15% on
   the small-business tier; ~S$17 net on the annual).
7. **iOS later:** reuse the same RevenueCat project + entitlement. Extra: Apple Dev
   account (US$99/yr, in progress), Apple Sign-In, App Review. The native camera +
   push features should clear Guideline 4.2 ("not just a website").

## Notes

- `capacitor-www/` is a tiny offline fallback bundle; the real UI loads from the live site.
- The webhook is the source of truth for Pro status; the client purchase call also
  refreshes the entitlement immediately for snappy UX.
