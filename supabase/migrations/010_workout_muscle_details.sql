-- ──────────────────────────────────────────────────────────────────────────────
-- 010_workout_muscle_details.sql
-- Professional muscle selection metadata for workouts.
-- Keeps muscle_group and muscle_groups intact for backwards compatibility.
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS muscle_groups text[] DEFAULT '{}';
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS muscle_details text[] DEFAULT '{}';
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS workout_split text;

UPDATE workouts
SET muscle_groups = ARRAY[muscle_group]
WHERE (muscle_groups IS NULL OR muscle_groups = '{}')
  AND muscle_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS workouts_muscle_groups_gin_idx
  ON workouts USING gin (muscle_groups);

CREATE INDEX IF NOT EXISTS workouts_muscle_details_gin_idx
  ON workouts USING gin (muscle_details);

CREATE INDEX IF NOT EXISTS workouts_user_created_idx
  ON workouts (user_id, created_at DESC);
