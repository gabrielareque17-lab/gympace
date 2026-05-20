-- Future-ready avatar unlocks for premium, seasonal, trophy, achievement and admin grants.
CREATE TABLE IF NOT EXISTS user_avatar_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('level', 'season', 'trophy', 'achievement', 'admin')),
  source_ref text,
  unlocked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, avatar_id)
);

CREATE INDEX IF NOT EXISTS idx_user_avatar_unlocks_user
  ON user_avatar_unlocks(user_id, unlocked_at DESC);

ALTER TABLE user_avatar_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_avatar_unlocks_select_own" ON user_avatar_unlocks;
CREATE POLICY "user_avatar_unlocks_select_own" ON user_avatar_unlocks
  FOR SELECT USING (auth.uid() = user_id);
