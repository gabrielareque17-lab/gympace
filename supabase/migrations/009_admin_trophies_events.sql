-- ──────────────────────────────────────────────────────────────────────────────
-- 009_admin_trophies_events.sql
-- Exclusive trophies, user trophy grants, admin events
-- Idempotent and additive: does not alter existing data.
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS exclusive_trophies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  rarity      text NOT NULL DEFAULT 'rare'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  visual      text NOT NULL DEFAULT 'trophy',
  is_unique   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS user_trophies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trophy_id   uuid NOT NULL REFERENCES exclusive_trophies(id) ON DELETE CASCADE,
  awarded_at  timestamptz NOT NULL DEFAULT now(),
  awarded_by  uuid REFERENCES auth.users(id),
  note        text
);

CREATE UNIQUE INDEX IF NOT EXISTS user_trophies_unique_once
  ON user_trophies (user_id, trophy_id);

CREATE INDEX IF NOT EXISTS user_trophies_user_awarded_idx
  ON user_trophies (user_id, awarded_at DESC);

CREATE TABLE IF NOT EXISTS admin_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES auth.users(id),
  event_type  text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id),
  payload     jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_events_created_idx
  ON admin_events (created_at DESC);

ALTER TABLE exclusive_trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trophies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exclusive_trophies_public_read" ON exclusive_trophies;
DROP POLICY IF EXISTS "exclusive_trophies_admin_write" ON exclusive_trophies;
DROP POLICY IF EXISTS "user_trophies_public_read" ON user_trophies;
DROP POLICY IF EXISTS "user_trophies_admin_write" ON user_trophies;
DROP POLICY IF EXISTS "admin_events_admin_read" ON admin_events;
DROP POLICY IF EXISTS "admin_events_admin_write" ON admin_events;

CREATE POLICY "exclusive_trophies_public_read"
  ON exclusive_trophies FOR SELECT
  USING (true);

CREATE POLICY "exclusive_trophies_admin_write"
  ON exclusive_trophies FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "user_trophies_public_read"
  ON user_trophies FOR SELECT
  USING (true);

CREATE POLICY "user_trophies_admin_write"
  ON user_trophies FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_events_admin_read"
  ON admin_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "admin_events_admin_write"
  ON admin_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));
