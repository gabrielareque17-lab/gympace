-- Persistent public changelog / updates feed for all authenticated users.
CREATE TABLE IF NOT EXISTS app_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  summary text,
  features text NOT NULL CHECK (char_length(features) BETWEEN 1 AND 2000),
  update_type text NOT NULL DEFAULT 'feature' CHECK (update_type IN ('feature', 'bugfix', 'season', 'announcement')),
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_updates_published_created
  ON app_updates(is_published, created_at DESC);

ALTER TABLE app_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_updates_select_published" ON app_updates;
CREATE POLICY "app_updates_select_published" ON app_updates
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_published = true);
