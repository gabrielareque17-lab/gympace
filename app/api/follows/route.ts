import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendPushNotification } from '@/lib/send-push'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { following_id } = body as { following_id?: string }
  if (!following_id || typeof following_id !== 'string') {
    return NextResponse.json({ error: 'following_id required' }, { status: 400 })
  }
  if (following_id === user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: user.id, following_id })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ ok: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch follower display name for the notification message
  const { data: followerProfile } = await supabase
    .from('profiles')
    .select('display_name, username')
    .eq('user_id', user.id)
    .single()

  const followerName =
    followerProfile?.display_name || followerProfile?.username || 'Alguém'

  const adminSupabase = createSupabaseAdminClient()
  await adminSupabase.from('notifications').insert({
    user_id: following_id,
    type: 'new_follower',
    title: 'Novo seguidor',
    message: `${followerName} começou a seguir você.`,
    data: {
      follower_id: user.id,
      follower_username: followerProfile?.username ?? null,
    },
  })

  // Send push notification if the followed user has a player ID saved
  const { data: targetProfile } = await adminSupabase
    .from('profiles')
    .select('onesignal_player_id')
    .eq('user_id', following_id)
    .single()

  if (targetProfile?.onesignal_player_id) {
    await sendPushNotification({
      playerIds: [targetProfile.onesignal_player_id],
      title: 'Novo seguidor',
      message: `${followerName} começou a seguir você.`,
      data: { type: 'new_follower', follower_id: user.id },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { following_id } = body as { following_id?: string }
  if (!following_id || typeof following_id !== 'string') {
    return NextResponse.json({ error: 'following_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', following_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
