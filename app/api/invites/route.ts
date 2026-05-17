import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invites, error } = await supabase
    .from('competition_invites')
    .select('id, competition_id, invited_by, created_at')
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!invites || invites.length === 0) return NextResponse.json({ invites: [] })

  const compIds = [...new Set(invites.map(i => i.competition_id))]
  const inviterIds = [...new Set(invites.map(i => i.invited_by))]

  const [compResult, inviterResult] = await Promise.all([
    supabase.from('competitions').select('id, title, type').in('id', compIds),
    supabase.from('profiles').select('user_id, username, display_name, avatar_id').in('user_id', inviterIds),
  ])

  const result = invites.map(invite => ({
    id: invite.id,
    competition_id: invite.competition_id,
    invited_by: invite.invited_by,
    created_at: invite.created_at,
    competition: compResult.data?.find(c => c.id === invite.competition_id) ?? null,
    inviter: inviterResult.data?.find(p => p.user_id === invite.invited_by) ?? null,
  }))

  return NextResponse.json({ invites: result })
}
