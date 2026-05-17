import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { syncUserXP } from '@/lib/xp'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const progress = Number(body?.progress)
  if (isNaN(progress) || progress < 0) {
    return NextResponse.json({ error: 'Invalid progress value' }, { status: 400 })
  }

  const { data: participant } = await supabase
    .from('competition_participants')
    .select('user_id')
    .eq('competition_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!participant) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  const { error } = await supabase
    .from('competition_participants')
    .update({ progress })
    .eq('competition_id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const xpFeedback = await syncUserXP(supabase, user.id)
  return NextResponse.json({ ok: true, xpFeedback })
}
