import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

import { updateActiveCompetitionProgressForUser } from '@/lib/competition-progress'
import { createFeedEvent } from '@/lib/feed'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { awardXP } from '@/lib/xp'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: competition } = await supabase
    .from('competitions')
    .select('id, end_date')
    .eq('id', id)
    .maybeSingle()

  if (!competition) return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
  if (new Date(competition.end_date) < new Date()) {
    return NextResponse.json({ error: 'Competition has ended' }, { status: 400 })
  }

  const { error } = await supabase
    .from('competition_participants')
    .insert({ competition_id: id, user_id: user.id })

  if (error) {
    if (error.code === '23505') {
      const xpFeedback = await awardXP(supabase, { userId: user.id, source: 'competition', sourceId: id })
      return NextResponse.json({ ok: true, xpFeedback })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await updateActiveCompetitionProgressForUser(supabase, user.id)
  const xpFeedback = await awardXP(supabase, { userId: user.id, source: 'competition', sourceId: id })

  await createFeedEvent(supabase, {
    userId: user.id,
    eventType: 'competition_joined',
    dedupeKey: `competition_joined:${id}`,
    payload: { competition_id: id },
  })

  revalidatePath('/competicoes')
  revalidatePath(`/competicoes/${id}`)
  revalidatePath('/feed')

  return NextResponse.json({ ok: true, xpFeedback })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('competition_participants')
    .delete()
    .eq('competition_id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
