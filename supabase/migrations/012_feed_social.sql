-- Feed social: feed_seen_at in profiles + feed_comments table
-- Idempotent migration

-- Track when each user last viewed their feed (for unread indicator)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feed_seen_at timestamptz;

-- Feed comments: basic comments without realtime
CREATE TABLE IF NOT EXISTS feed_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_event_id uuid NOT NULL REFERENCES activities_feed(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_event_created
  ON feed_comments(feed_event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_comments_user
  ON feed_comments(user_id);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read comments
DROP POLICY IF EXISTS "feed_comments_select" ON feed_comments;
CREATE POLICY "feed_comments_select" ON feed_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can insert their own comments
DROP POLICY IF EXISTS "feed_comments_insert" ON feed_comments;
CREATE POLICY "feed_comments_insert" ON feed_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "feed_comments_delete" ON feed_comments;
CREATE POLICY "feed_comments_delete" ON feed_comments
  FOR DELETE USING (auth.uid() = user_id);
