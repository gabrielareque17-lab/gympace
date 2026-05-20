import { NextResponse } from 'next/server'

import { updateActiveCompetitionProgressForUser } from '@/lib/competition-progress'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { syncUserXP } from '@/lib/xp'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: participant } = await supabase
    .from('competition_participants')
    .select('user_id')
    .eq('competition_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  const progressUpdates = await updateActiveCompetitionProgressForUser(supabase, user.id)
  const xpFeedback = await syncUserXP(supabase, user.id)

  return NextResponse.json({ ok: true, progressUpdates, xpFeedback })
}
