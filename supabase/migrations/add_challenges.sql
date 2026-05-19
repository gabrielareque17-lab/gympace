-- 1v1 challenge duels between two users
CREATE TABLE IF NOT EXISTS public.challenges (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text,
  goal_type       text        NOT NULL,
  target_value    numeric     NOT NULL,
  duration_days   integer     NOT NULL DEFAULT 7,
  start_date      timestamptz,
  end_date        timestamptz,
  status          text        NOT NULL DEFAULT 'pending',
  winner_id       uuid        REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT challenges_no_self         CHECK (creator_id <> challenged_id),
  CONSTRAINT challenges_positive_target CHECK (target_value > 0),
  CONSTRAINT challenges_positive_dur    CHECK (duration_days > 0),
  CONSTRAINT challenges_goal_type       CHECK (goal_type IN (
    'runs_count', 'distance_km', 'gym_sessions', 'total_workouts'
  )),
  CONSTRAINT challenges_status          CHECK (status IN (
    'pending', 'accepted', 'active', 'finished', 'declined', 'canceled'
  ))
);

-- Prevent duplicate pending/active challenges between the same pair of users
CREATE UNIQUE INDEX IF NOT EXISTS challenges_no_duplicate_active
  ON public.challenges (
    LEAST(creator_id::text, challenged_id::text),
    GREATEST(creator_id::text, challenged_id::text)
  )
  WHERE status IN ('pending', 'accepted', 'active');

CREATE INDEX IF NOT EXISTS idx_challenges_creator    ON public.challenges (creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON public.challenges (challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status     ON public.challenges (status);
CREATE INDEX IF NOT EXISTS idx_challenges_created    ON public.challenges (created_at DESC);

-- Row-Level Security
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenges_select" ON public.challenges;
DROP POLICY IF EXISTS "challenges_insert" ON public.challenges;
DROP POLICY IF EXISTS "challenges_update" ON public.challenges;

-- Both participants can read their challenges
CREATE POLICY "challenges_select" ON public.challenges
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = challenged_id);

-- Only the creator can open a challenge (and only as themselves)
CREATE POLICY "challenges_insert" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Both participants can update status (respond / cancel)
CREATE POLICY "challenges_update" ON public.challenges
  FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = challenged_id);
