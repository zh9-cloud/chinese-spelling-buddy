-- ─────────────────────────────────────────────────────────────────────────────
--  Chinese Spelling Buddy — Billing / Freemium Schema
--
--  Run AFTER supabase-schema.sql, in Supabase Dashboard → SQL Editor.
--  Adds subscription tracking (synced from Stripe) + free-tier AI usage counters.
--
--  Writes happen only from the server with the SERVICE ROLE key (bypasses RLS).
--  The policies below let each signed-in parent READ their own rows so the app
--  can show plan status and remaining free quota.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Subscriptions: one row per parent, kept in sync by the Stripe webhook ─────
create table if not exists subscriptions (
  user_id                 uuid        primary key references auth.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  status                  text        not null default 'incomplete',  -- active | trialing | canceled | past_due | incomplete | …
  plan                    text,                                       -- "monthly" | "annual" | null
  current_period_end      timestamptz,
  updated_at              timestamptz default now()
);

create index if not exists subscriptions_customer_idx on subscriptions (stripe_customer_id);

-- ── AI usage: free-tier lifetime counters per (user, feature) ─────────────────
create table if not exists ai_usage (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  feature     text        not null,   -- "import" | "grade"
  count       int         not null default 0,
  updated_at  timestamptz default now(),
  primary key (user_id, feature)
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table subscriptions enable row level security;
alter table ai_usage      enable row level security;

-- Each parent may READ their own subscription + usage (writes go via service role).
create policy "read_own_subscription"
  on subscriptions for select
  using (user_id = auth.uid());

create policy "read_own_ai_usage"
  on ai_usage for select
  using (user_id = auth.uid());
