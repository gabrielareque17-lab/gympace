import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('competition_invites')
    .select('id, invited_user_id, status')
    .eq('competition_id', id)
    .eq('invited_by', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invites: data ?? [] })
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { invited_user_id } = body

  if (!invited_user_id)
    return NextResponse.json({ error: 'invited_user_id required' }, { status: 400 })
  if (invited_user_id === user.id)
    return NextResponse.json({ error: 'Você não pode se convidar' }, { status: 400 })

  const { data: comp } = await supabase
    .from('competitions')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (!comp) return NextResponse.json({ error: 'Competição não encontrada' }, { status: 404 })

  const { data: alreadyIn } = await supabase
    .from('competition_participants')
    .select('user_id')
    .eq('competition_id', id)
    .eq('user_id', invited_user_id)
    .maybeSingle()

  if (alreadyIn) return NextResponse.json({ error: 'Atleta já é participante' }, { status: 409 })

  const { data: existing } = await supabase
    .from('competition_invites')
    .select('id')
    .eq('competition_id', id)
    .eq('invited_user_id', invited_user_id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Convite já enviado' }, { status: 409 })

  const { data, error } = await supabase
    .from('competition_invites')
    .insert({ competition_id: id, invited_user_id, invited_by: user.id, status: 'pending' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}
