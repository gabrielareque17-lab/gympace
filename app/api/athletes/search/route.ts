import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  const limit = Math.min(Number(searchParams.get('limit') ?? '24'), 50)

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, avatar_id, avatar_type, level, rank')
    .not('username', 'is', null)
    .order('level', { ascending: false })
    .limit(limit)

  if (q.length > 0) {
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ athletes: data ?? [] })
}
