import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const VALID_TYPES = ['corrida', 'academia', 'streak', 'hibrido'] as const

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, type, target_value, start_date, end_date } = body

  if (!title?.trim())
    return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
  if (!VALID_TYPES.includes(type))
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  if (!target_value || Number(target_value) <= 0)
    return NextResponse.json({ error: 'Meta deve ser maior que zero' }, { status: 400 })
  if (!start_date || !end_date)
    return NextResponse.json({ error: 'Datas de início e término são obrigatórias' }, { status: 400 })
  if (new Date(end_date) <= new Date(start_date))
    return NextResponse.json({ error: 'Data de término deve ser após o início' }, { status: 400 })

  const { data, error } = await supabase
    .from('competitions')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      type,
      target_value: Number(target_value),
      start_date,
      end_date,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
