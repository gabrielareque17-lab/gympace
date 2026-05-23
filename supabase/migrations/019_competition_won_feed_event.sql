-- Allow explicit competition victory events in the social feed.

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
    'competition_won',
    'exclusive_trophy',
    'rank_reached',
    'season_started'
  )) NOT VALID;
