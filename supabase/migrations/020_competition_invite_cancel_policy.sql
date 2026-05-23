DO $$
BEGIN
  IF to_regclass('public.competition_invites') IS NOT NULL THEN
    ALTER TABLE public.competition_invites
      DROP CONSTRAINT IF EXISTS competition_invites_status_check;

    ALTER TABLE public.competition_invites
      ADD CONSTRAINT competition_invites_status_check
      CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled'));

    DROP POLICY IF EXISTS "competition_invites_update_sender_cancel" ON public.competition_invites;

    CREATE POLICY "competition_invites_update_sender_cancel" ON public.competition_invites
      FOR UPDATE USING (auth.uid() = invited_by AND status = 'pending')
      WITH CHECK (auth.uid() = invited_by AND status = 'canceled');
  END IF;
END $$;
