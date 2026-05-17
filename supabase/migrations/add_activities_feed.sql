-- Run this migration in your Supabase SQL Editor before deploying feed functionality.

CREATE TABLE IF NOT EXISTS activities_feed (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('run', 'workout', 'level_up', 'streak')),
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_feed_user_created
  ON activities_feed(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_feed_payload
  ON activities_feed USING gin(payload);

ALTER TABLE activities_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_select" ON activities_feed FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IN (SELECT following_id FROM follows WHERE follower_id = auth.uid())
  );

CREATE POLICY "feed_insert" ON activities_feed FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feed_delete" ON activities_feed FOR DELETE
  USING (user_id = auth.uid());
