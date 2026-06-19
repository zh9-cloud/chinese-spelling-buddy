-- ─────────────────────────────────────────────────────────────────────────────
--  Chinese Spelling Buddy — In-App Purchase (IAP) Entitlements
--
--  Run AFTER supabase-billing.sql, in Supabase Dashboard → SQL Editor.
--  Tracks Apple App Store / Google Play subscriptions, synced from RevenueCat.
--
--  This is the THIRD entitlement source (alongside Stripe `subscriptions` and
--  referral `pro_grants`). isProUser() ORs all three. Web/Stripe is untouched:
--  a user who bought on the web keeps Pro on phone (same Supabase user_id), and
--  a phone buyer is Pro on the web — no double charge.
--
--  Writes happen ONLY from the server with the SERVICE ROLE key (the RevenueCat
--  webhook at /api/revenuecat/webhook). The RLS policy lets each signed-in
--  parent READ their own row so the app can show plan status.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── IAP entitlements: one row per parent, kept in sync by the RevenueCat webhook
create table if not exists iap_entitlements (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  store          text,                                   -- "app_store" | "play_store" | "promotional" | …
  product_id     text,                                   -- the purchased subscription product id
  rc_app_user_id text,                                   -- RevenueCat appUserID (== Supabase user.id)
  expires_at     timestamptz,                            -- end of the current paid period
  active         boolean     not null default false,     -- false after EXPIRATION / REFUND
  updated_at     timestamptz default now()
);

create index if not exists iap_entitlements_active_idx on iap_entitlements (active);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table iap_entitlements enable row level security;

-- Each parent may READ their own entitlement (writes go via service role).
-- Drop-then-create so this script is safe to re-run.
drop policy if exists "read_own_iap_entitlement" on iap_entitlements;
create policy "read_own_iap_entitlement"
  on iap_entitlements for select
  using (user_id = auth.uid());
