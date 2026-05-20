-- ──────────────────────────────────────────────────────────────────────────────
-- 011_profile_timezone.sql
-- User timezone preference for Brazil display contexts.
-- Defaults to Manaus and keeps existing profiles compatible.
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Manaus';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_timezone_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_timezone_check
  CHECK (timezone IN ('America/Manaus', 'America/Sao_Paulo'));

UPDATE profiles
SET timezone = 'America/Manaus'
WHERE timezone IS NULL OR timezone NOT IN ('America/Manaus', 'America/Sao_Paulo');
