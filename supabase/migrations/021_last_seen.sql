-- Add last_seen_at for user presence tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
CREATE INDEX IF NOT EXISTS profiles_last_seen_at_idx ON profiles(last_seen_at DESC);
