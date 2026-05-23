-- Persist competition winners and completion state.
-- Idempotent/additive: existing competitions keep their current date-based state.

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS finished_at timestamptz;

ALTER TABLE public.competitions
  DROP CONSTRAINT IF EXISTS competitions_status_check;

ALTER TABLE public.competitions
  ADD CONSTRAINT competitions_status_check
  CHECK (status IN ('active', 'finished', 'canceled'));

CREATE INDEX IF NOT EXISTS competitions_status_idx ON public.competitions (status);
CREATE INDEX IF NOT EXISTS competitions_winner_idx ON public.competitions (winner_id);
