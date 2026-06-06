-- ─────────────────────────────────────────────────────────────────────────────
--  Chinese Dictation Buddy — Supabase Schema
--
--  Run this SQL in the Supabase Dashboard → SQL Editor
--  (Project → SQL Editor → New query → paste → Run)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tables ──────────────────────────────────────────────────────────────────

-- Children: one parent (Supabase auth user) can have multiple children
create table if not exists children (
  id            text        primary key,
  parent_id     uuid        not null references auth.users(id) on delete cascade,
  name          text        not null,
  grade         text        not null,   -- "P3" | "P4" | "P5" | "P6"
  chinese_type  text        not null,   -- "Standard" | "Higher" | "Foundation"
  created_at    timestamptz default now()
);

-- Dictation lists: each list belongs to one child
create table if not exists dictation_lists (
  id              text        primary key,
  child_id        text        not null references children(id) on delete cascade,
  title           text        not null,
  dictation_date  text        not null,   -- "YYYY-MM-DD"
  reminder_date   text,
  words           jsonb       not null default '[]',   -- Word[]
  created_at      timestamptz default now()
);

-- Practice sessions: recorded when a student finishes a test/practice run
create table if not exists practice_sessions (
  id                  text    primary key,
  dictation_list_id   text    not null references dictation_lists(id) on delete cascade,
  child_id            text    not null references children(id) on delete cascade,
  mode                text    not null,   -- "test" | "practice" | "handwriting"
  started_at          text    not null,
  completed_at        text,
  word_results        jsonb   not null default '[]'   -- WordResult[]
);

-- Mistakes: per-word, per-child; upserted on each wrong answer
create table if not exists mistakes (
  word_id         text    not null,
  child_id        text    not null references children(id) on delete cascade,
  word            text    not null,
  pinyin          text,
  meaning         text,
  wrong_count     int     not null default 0,
  last_practiced  text    not null,
  primary key (word_id, child_id)
);

-- Coins: reward balance per child
create table if not exists coins (
  child_id  text  not null references children(id) on delete cascade primary key,
  amount    int   not null default 0
);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table children          enable row level security;
alter table dictation_lists   enable row level security;
alter table practice_sessions enable row level security;
alter table mistakes          enable row level security;
alter table coins             enable row level security;

-- Children: a parent can only see and modify their own children
create policy "parent_own_children"
  on children for all
  using  (parent_id = auth.uid())
  with check (parent_id = auth.uid());

-- Dictation lists: accessible if the child belongs to the logged-in parent
create policy "parent_own_dictation_lists"
  on dictation_lists for all
  using (
    child_id in (select id from children where parent_id = auth.uid())
  )
  with check (
    child_id in (select id from children where parent_id = auth.uid())
  );

-- Practice sessions
create policy "parent_own_sessions"
  on practice_sessions for all
  using (
    child_id in (select id from children where parent_id = auth.uid())
  )
  with check (
    child_id in (select id from children where parent_id = auth.uid())
  );

-- Mistakes
create policy "parent_own_mistakes"
  on mistakes for all
  using (
    child_id in (select id from children where parent_id = auth.uid())
  )
  with check (
    child_id in (select id from children where parent_id = auth.uid())
  );

-- Coins
create policy "parent_own_coins"
  on coins for all
  using (
    child_id in (select id from children where parent_id = auth.uid())
  )
  with check (
    child_id in (select id from children where parent_id = auth.uid())
  );
