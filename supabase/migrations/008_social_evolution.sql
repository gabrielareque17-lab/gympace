-- ──────────────────────────────────────────────────────────────────────────────
-- 008_social_evolution.sql
-- Streaks, Personal Records, Feed Reactions, Seasons
-- Run this in Supabase SQL Editor → New query → Run
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Streaks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streak_type     text NOT NULL CHECK (streak_type IN ('run', 'gym', 'hybrid', 'general')),
  current_streak  integer NOT NULL DEFAULT 0,
  best_streak     integer NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_public_read"  ON streaks FOR SELECT USING (true);
CREATE POLICY "streaks_own_write"    ON streaks FOR ALL    USING (auth.uid() = user_id);

-- ── Personal Records ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_type   text NOT NULL CHECK (record_type IN ('best_5k_pace', 'best_10k_pace', 'best_half_pace', 'longest_run', 'best_pace')),
  value_seconds integer,   -- seconds/km for pace records
  value_km      real,      -- km for distance records
  achieved_at   timestamptz DEFAULT now(),
  run_id        uuid,      -- nullable ref to runs(id)
  UNIQUE(user_id, record_type)
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_public_read" ON personal_records FOR SELECT USING (true);
CREATE POLICY "pr_own_write"   ON personal_records FOR ALL    USING (auth.uid() = user_id);

-- ── Feed Reactions (likes) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_reactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_event_id  uuid NOT NULL,  -- references activities_feed(id)
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type  text NOT NULL DEFAULT 'like',
  created_at     timestamptz DEFAULT now(),
  UNIQUE(feed_event_id, user_id)
);

ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_public_read"  ON feed_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_own_write"    ON feed_reactions FOR ALL    USING (auth.uid() = user_id);

-- ── Seasons ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seasons (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  theme          text DEFAULT 'ascension',
  description    text,
  color          text DEFAULT '#B6FF00',
  xp_multiplier  real DEFAULT 1.0,
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  is_active      boolean DEFAULT false,
  created_at     timestamptz DEFAULT now(),
  created_by     uuid REFERENCES auth.users(id)
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_public_read" ON seasons FOR SELECT USING (true);
CREATE POLICY "seasons_admin_write" ON seasons FOR ALL    USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Seed Season 1 if none exist
INSERT INTO seasons (name, theme, description, color, xp_multiplier, start_date, end_date, is_active)
SELECT 'Season 1 — Ascension', 'ascension',
       'A primeira temporada do GymPace. Estabeleça suas marcas, construa hábitos e suba no ranking.',
       '#B6FF00', 1.0,
       CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days',
       true
WHERE NOT EXISTS (SELECT 1 FROM seasons);

-- ── Profiles: add is_admin if not already present ─────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
