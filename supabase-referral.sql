-- ─────────────────────────────────────────────────────────────────────────────
--  Chinese Spelling Buddy — Referral Schema
--
--  Run AFTER supabase-schema.sql + supabase-billing.sql, in Supabase SQL Editor.
--  Each parent has a referral code. A successful referral grants BOTH the
--  referrer and the new user +1 month of Pro (stacks). Pro grants live in a
--  separate table so they never collide with Stripe-managed subscriptions —
--  entitlement = active Stripe sub OR a pro_grant still in the future.
--
--  Writes happen from the server (service role); policies let each user READ
--  their own rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- One referral code per user.
create table if not exists referral_codes (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  code        text        unique not null,
  created_at  timestamptz default now()
);

-- One row per successful referral (the new user is referred exactly once).
create table if not exists referral_events (
  id                 uuid        primary key default gen_random_uuid(),
  referrer_user_id   uuid        references auth.users(id) on delete set null,
  referred_user_id   uuid        unique references auth.users(id) on delete cascade,
  code               text,
  created_at         timestamptz default now()
);

-- Non-Stripe Pro time (referral rewards). pro_until is the cumulative end.
create table if not exists pro_grants (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  pro_until   timestamptz not null,
  reason      text        default 'referral',
  updated_at  timestamptz default now()
);

create index if not exists referral_events_referrer_idx on referral_events (referrer_user_id);

-- ── Row Level Security (read own; writes via service role) ────────────────────
alter table referral_codes  enable row level security;
alter table referral_events enable row level security;
alter table pro_grants      enable row level security;

drop policy if exists "read_own_referral_code" on referral_codes;
create policy "read_own_referral_code" on referral_codes for select using (user_id = auth.uid());

drop policy if exists "read_own_referral_events" on referral_events;
create policy "read_own_referral_events" on referral_events for select
  using (referrer_user_id = auth.uid() or referred_user_id = auth.uid());

drop policy if exists "read_own_pro_grant" on pro_grants;
create policy "read_own_pro_grant" on pro_grants for select using (user_id = auth.uid());
