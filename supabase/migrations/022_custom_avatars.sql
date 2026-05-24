-- Custom exclusive avatars created from the admin panel.
-- The avatar id remains text because built-in avatars and profiles.avatar_id are text ids too.
-- This migration is additive and keeps the existing user_avatar_unlocks grant path.

CREATE TABLE IF NOT EXISTS public.custom_avatars (
  id text PRIMARY KEY,
  name text NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  rarity text NOT NULL DEFAULT 'legendary' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  gender text NOT NULL DEFAULT 'neutro' CHECK (gender IN ('masculino', 'feminino', 'neutro')),
  type text NOT NULL CHECK (type IN ('runner', 'gym_rat', 'hybrid_athlete', 'power_athlete')),
  category text NOT NULL DEFAULT 'premium' CHECK (category IN ('running', 'gym', 'hybrid', 'premium')),
  accent_color text NOT NULL DEFAULT '#FACC15',
  primary_color text NOT NULL DEFAULT '#FACC15',
  secondary_color text NOT NULL DEFAULT '#FFF4A3',
  background_color text NOT NULL DEFAULT '#080808',
  outfit_color text NOT NULL DEFAULT '#FACC15',
  hair_style text NOT NULL DEFAULT 'curto',
  hair_color text NOT NULL DEFAULT '#171717',
  face_style text NOT NULL DEFAULT 'confiante',
  accessory text NOT NULL DEFAULT 'none',
  glow_color text NOT NULL DEFAULT 'rgba(250,204,21,0.34)',
  unlock_kind text NOT NULL DEFAULT 'admin' CHECK (unlock_kind IN ('season', 'trophy', 'achievement', 'admin')),
  unlock_label text NOT NULL DEFAULT 'Exclusivo',
  female boolean NOT NULL DEFAULT false,
  exclusive boolean NOT NULL DEFAULT true,
  trophy_id uuid REFERENCES public.exclusive_trophies(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_avatars
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'neutro',
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#FACC15',
  ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#080808',
  ADD COLUMN IF NOT EXISTS outfit_color text NOT NULL DEFAULT '#FACC15',
  ADD COLUMN IF NOT EXISTS hair_style text NOT NULL DEFAULT 'curto',
  ADD COLUMN IF NOT EXISTS hair_color text NOT NULL DEFAULT '#171717',
  ADD COLUMN IF NOT EXISTS face_style text NOT NULL DEFAULT 'confiante',
  ADD COLUMN IF NOT EXISTS accessory text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.custom_avatars
SET name = COALESCE(NULLIF(name, ''), label, 'Avatar Personalizado')
WHERE name IS NULL OR name = '';

UPDATE public.custom_avatars
SET rarity = CASE
  WHEN rarity = 'core' THEN 'common'
  WHEN rarity = 'seasonal' THEN 'legendary'
  ELSE rarity
END
WHERE rarity IN ('core', 'seasonal');

ALTER TABLE public.custom_avatars
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.custom_avatars
  DROP CONSTRAINT IF EXISTS custom_avatars_rarity_check,
  DROP CONSTRAINT IF EXISTS custom_avatars_gender_check;

ALTER TABLE public.custom_avatars
  ADD CONSTRAINT custom_avatars_rarity_check CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  ADD CONSTRAINT custom_avatars_gender_check CHECK (gender IN ('masculino', 'feminino', 'neutro'));

CREATE INDEX IF NOT EXISTS custom_avatars_created_idx
  ON public.custom_avatars (created_at DESC);

CREATE INDEX IF NOT EXISTS custom_avatars_assigned_idx
  ON public.custom_avatars (assigned_to, is_active);

ALTER TABLE public.custom_avatars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_avatars_public_read" ON public.custom_avatars;
DROP POLICY IF EXISTS "custom_avatars_admin_write" ON public.custom_avatars;
DROP POLICY IF EXISTS "custom_avatars_assigned_read" ON public.custom_avatars;

CREATE POLICY "custom_avatars_assigned_read"
  ON public.custom_avatars FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
    OR (
      is_active = true
      AND (
        assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.user_avatar_unlocks
          WHERE user_id = auth.uid()
            AND avatar_id = custom_avatars.id
        )
      )
    )
  );

CREATE POLICY "custom_avatars_admin_write"
  ON public.custom_avatars FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE OR REPLACE FUNCTION public.set_custom_avatars_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_custom_avatars_updated_at ON public.custom_avatars;
CREATE TRIGGER set_custom_avatars_updated_at
  BEFORE UPDATE ON public.custom_avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.set_custom_avatars_updated_at();
