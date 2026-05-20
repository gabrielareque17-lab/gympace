-- Add muscle_groups array column to workouts table.
-- muscle_group (text) remains as the primary/legacy field; muscle_groups is the multi-select array.
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS muscle_groups text[] DEFAULT '{}';

-- Back-fill existing rows so the array matches the existing single value.
UPDATE workouts SET muscle_groups = ARRAY[muscle_group] WHERE muscle_groups = '{}' AND muscle_group IS NOT NULL;
