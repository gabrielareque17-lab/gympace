-- Allow users to edit their own feed comments.
DROP POLICY IF EXISTS "feed_comments_update" ON feed_comments;
CREATE POLICY "feed_comments_update" ON feed_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
