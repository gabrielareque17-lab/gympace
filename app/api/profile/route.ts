import { NextResponse } from 'next/server'

import { AVATAR_REGISTRY, type AvatarType } from '@/lib/avatar-registry'
import type { ProfilePatch } from '@/lib/profile'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getLevelProgress } from '@/lib/xp'

const VALID_TYPES: AvatarType[] = ['runner', 'gym_rat', 'hybrid_athlete', 'power_athlete']

type ProfileRow = {
  user_id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_id: string | null
  avatar_type: string | null
  level?: number | null
  current_level?: number | null
  total_xp?: number | null
  rank: string | null
  created_at: string | null
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, avatar_id, avatar_type, level, current_level, total_xp, rank, created_at')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: fallbackProfile } = profileError
    ? await supabase
        .from('profiles')
        .select('user_id, username, display_name, bio, avatar_id, avatar_type, level, rank, created_at')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  const resolvedProfile = (profile ?? fallbackProfile) as ProfileRow | null

  // Auto-assign username for existing users who don't have one yet
  if (resolvedProfile && !resolvedProfile.username) {
    const base =
      user.email
        ?.split('@')[0]
        ?.replace(/[^a-z0-9_]/gi, '')
        .toLowerCase() ?? 'atleta'
    await supabase
      .from('profiles')
      .update({
        username: base,
        display_name: resolvedProfile.display_name ?? user.email?.split('@')[0],
      })
      .eq('user_id', user.id)
    if (resolvedProfile) resolvedProfile.username = base
  }

  const totalXp = Number(resolvedProfile?.total_xp ?? 0)
  const currentLevel = Number(resolvedProfile?.current_level ?? resolvedProfile?.level ?? 1)
  const levelProgress = getLevelProgress(totalXp)

  return NextResponse.json({
    userId: user.id,
    username: resolvedProfile?.username ?? null,
    displayName: resolvedProfile?.display_name ?? null,
    bio: resolvedProfile?.bio ?? null,
    avatarId: resolvedProfile?.avatar_id ?? null,
    avatarType: (resolvedProfile?.avatar_type as AvatarType) ?? null,
    level: currentLevel,
    currentLevel,
    totalXp,
    ...levelProgress,
    rank: resolvedProfile?.rank ?? 'rookie',
    createdAt: resolvedProfile?.created_at ?? null,
  })
}

export async function PATCH(request: Request) {
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

  const patch = body as ProfilePatch
  const update: Record<string, unknown> = { user_id: user.id }

  if (patch.avatarId !== undefined || patch.avatarType !== undefined) {
    const { avatarId, avatarType } = patch
    if (typeof avatarId !== 'string' || typeof avatarType !== 'string') {
      return NextResponse.json({ error: 'avatarId and avatarType are required strings' }, { status: 400 })
    }
    if (!VALID_TYPES.includes(avatarType as AvatarType)) {
      return NextResponse.json({ error: 'Invalid avatarType' }, { status: 400 })
    }
    if (!AVATAR_REGISTRY.find((a) => a.id === avatarId)) {
      return NextResponse.json({ error: 'Unknown avatarId' }, { status: 400 })
    }
    update.avatar_id = avatarId
    update.avatar_type = avatarType
  }

  if (patch.displayName !== undefined) {
    const dn = patch.displayName
    if (dn !== null && (typeof dn !== 'string' || dn.length > 50)) {
      return NextResponse.json({ error: 'Nome muito longo (máx. 50 caracteres)' }, { status: 400 })
    }
    update.display_name = dn ?? null
  }

  if (patch.bio !== undefined) {
    const bio = patch.bio
    if (bio !== null && (typeof bio !== 'string' || bio.length > 200)) {
      return NextResponse.json({ error: 'Bio muito longa (máx. 200 caracteres)' }, { status: 400 })
    }
    update.bio = bio ?? null
  }

  if (patch.username !== undefined) {
    const u = patch.username
    if (u !== null) {
      if (typeof u !== 'string' || !/^[a-z0-9_]{3,20}$/.test(u)) {
        return NextResponse.json(
          { error: 'Username deve ter 3–20 caracteres: letras minúsculas, números ou _' },
          { status: 400 },
        )
      }
    }
    update.username = u ?? null
  }

  const fieldsToUpdate = Object.keys(update).filter((k) => k !== 'user_id')
  if (fieldsToUpdate.length === 0) return NextResponse.json({ ok: true })

  const { error } = await supabase.from('profiles').upsert(update, { onConflict: 'user_id' })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username já está em uso' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
