-- GPS tracking fields for runs table.
-- All new columns are optional so existing rows are unaffected.
ALTER TABLE runs ADD COLUMN IF NOT EXISTS duration_seconds integer;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS avg_speed real;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS calories integer;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS route_points jsonb DEFAULT '[]'::jsonb;

-- Back-fill duration_seconds from duration string for existing rows (best-effort).
-- Format is 'MM:SS' or 'HH:MM:SS'.
UPDATE runs
SET duration_seconds = CASE
  WHEN duration ~ '^\d+:\d{2}:\d{2}$' THEN
    SPLIT_PART(duration, ':', 1)::int * 3600 +
    SPLIT_PART(duration, ':', 2)::int * 60 +
    SPLIT_PART(duration, ':', 3)::int
  WHEN duration ~ '^\d+:\d{2}$' THEN
    SPLIT_PART(duration, ':', 1)::int * 60 +
    SPLIT_PART(duration, ':', 2)::int
  ELSE NULL
END
WHERE duration_seconds IS NULL AND duration IS NOT NULL;
