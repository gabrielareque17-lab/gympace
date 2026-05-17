-- Run this migration in your Supabase SQL Editor before deploying the updated code.

-- Add run type and notes to runs table
ALTER TABLE runs ADD COLUMN IF NOT EXISTS run_type text DEFAULT 'leve';
ALTER TABLE runs ADD COLUMN IF NOT EXISTS notes text;

-- Add intensity and notes to workouts table
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS intensity text;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS notes text;
