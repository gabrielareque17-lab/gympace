-- Security hardening for RLS, trusted writes, XP fields and private notification data.
-- Additive/idempotent: no data deletion.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rank text DEFAULT 'rookie',
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE SELECT (onesignal_player_id) ON public.profiles FROM anon, authenticated;
REVOKE UPDATE (total_xp, current_level, level, rank, is_admin) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_client_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF OLD.total_xp IS DISTINCT FROM NEW.total_xp
      OR OLD.current_level IS DISTINCT FROM NEW.current_level
      OR OLD.level IS DISTINCT FROM NEW.level
      OR OLD.rank IS DISTINCT FROM NEW.rank
      OR OLD.is_admin IS DISTINCT FROM NEW.is_admin
    THEN
      RAISE EXCEPTION 'Sensitive profile fields can only be changed by trusted server code.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_sensitive_client_update ON public.profiles;
CREATE TRIGGER trg_prevent_profile_sensitive_client_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_sensitive_client_update();

DROP POLICY IF EXISTS "authenticated_insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;

CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

REVOKE INSERT ON public.notifications FROM anon, authenticated;

DROP POLICY IF EXISTS "feed_insert" ON public.activities_feed;
DROP POLICY IF EXISTS "feed_delete" ON public.activities_feed;

REVOKE INSERT, UPDATE, DELETE ON public.activities_feed FROM anon, authenticated;

ALTER TABLE public.activities_feed
  DROP CONSTRAINT IF EXISTS activities_feed_event_type_check;

ALTER TABLE public.activities_feed
  ADD CONSTRAINT activities_feed_event_type_check CHECK (event_type IN (
    'run',
    'workout',
    'level_up',
    'streak',
    'personal_record',
    'streak_milestone',
    'hybrid_bonus',
    'challenge_accepted',
    'challenge_won',
    'competition_joined',
    'exclusive_trophy',
    'rank_reached',
    'season_started'
  )) NOT VALID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activities_feed_user_id_fkey'
  ) THEN
    ALTER TABLE public.activities_feed
      ADD CONSTRAINT activities_feed_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

DROP POLICY IF EXISTS "reactions_public_read" ON public.feed_reactions;
DROP POLICY IF EXISTS "reactions_own_write" ON public.feed_reactions;
DROP POLICY IF EXISTS "feed_reactions_select" ON public.feed_reactions;
DROP POLICY IF EXISTS "feed_reactions_insert_own" ON public.feed_reactions;
DROP POLICY IF EXISTS "feed_reactions_delete_own" ON public.feed_reactions;

CREATE POLICY "feed_reactions_select" ON public.feed_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "feed_reactions_insert_own" ON public.feed_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND reaction_type = 'like');

CREATE POLICY "feed_reactions_delete_own" ON public.feed_reactions
  FOR DELETE USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'feed_reactions_feed_event_id_fkey'
  ) THEN
    ALTER TABLE public.feed_reactions
      ADD CONSTRAINT feed_reactions_feed_event_id_fkey
      FOREIGN KEY (feed_event_id) REFERENCES public.activities_feed(id) ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

ALTER TABLE public.feed_reactions
  DROP CONSTRAINT IF EXISTS feed_reactions_type_check;

ALTER TABLE public.feed_reactions
  ADD CONSTRAINT feed_reactions_type_check CHECK (reaction_type = 'like');

DO $$
BEGIN
  IF to_regclass('public.runs') IS NOT NULL THEN
    ALTER TABLE public.runs
      DROP CONSTRAINT IF EXISTS runs_distance_safe_check;
    ALTER TABLE public.runs
      ADD CONSTRAINT runs_distance_safe_check
      CHECK (distance > 0 AND distance <= 200) NOT VALID;

    ALTER TABLE public.runs
      DROP CONSTRAINT IF EXISTS runs_duration_seconds_safe_check;
    ALTER TABLE public.runs
      ADD CONSTRAINT runs_duration_seconds_safe_check
      CHECK (duration_seconds IS NULL OR (duration_seconds > 0 AND duration_seconds <= 86400)) NOT VALID;

    ALTER TABLE public.runs
      DROP CONSTRAINT IF EXISTS runs_avg_speed_safe_check;
    ALTER TABLE public.runs
      ADD CONSTRAINT runs_avg_speed_safe_check
      CHECK (avg_speed IS NULL OR (avg_speed > 0 AND avg_speed <= 45)) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.workouts') IS NOT NULL THEN
    ALTER TABLE public.workouts
      DROP CONSTRAINT IF EXISTS workouts_duration_safe_check;
    ALTER TABLE public.workouts
      ADD CONSTRAINT workouts_duration_safe_check
      CHECK (duration_minutes > 0 AND duration_minutes <= 360) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.competition_participants') IS NOT NULL THEN
    ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "competition_participants_select" ON public.competition_participants;
    DROP POLICY IF EXISTS "competition_participants_insert_own" ON public.competition_participants;
    DROP POLICY IF EXISTS "competition_participants_delete_own" ON public.competition_participants;
    DROP POLICY IF EXISTS "competition_participants_update_own" ON public.competition_participants;

    CREATE POLICY "competition_participants_select" ON public.competition_participants
      FOR SELECT USING (auth.uid() IS NOT NULL);

    CREATE POLICY "competition_participants_insert_own" ON public.competition_participants
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "competition_participants_delete_own" ON public.competition_participants
      FOR DELETE USING (auth.uid() = user_id);

    REVOKE UPDATE (progress) ON public.competition_participants FROM anon, authenticated;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.competition_invites') IS NOT NULL THEN
    ALTER TABLE public.competition_invites ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "competition_invites_select_involved" ON public.competition_invites;
    DROP POLICY IF EXISTS "competition_invites_insert_sender" ON public.competition_invites;
    DROP POLICY IF EXISTS "competition_invites_update_invited" ON public.competition_invites;

    CREATE POLICY "competition_invites_select_involved" ON public.competition_invites
      FOR SELECT USING (auth.uid() = invited_by OR auth.uid() = invited_user_id);

    CREATE POLICY "competition_invites_insert_sender" ON public.competition_invites
      FOR INSERT WITH CHECK (auth.uid() = invited_by);

    CREATE POLICY "competition_invites_update_invited" ON public.competition_invites
      FOR UPDATE USING (auth.uid() = invited_user_id)
      WITH CHECK (auth.uid() = invited_user_id);
  END IF;
END $$;
