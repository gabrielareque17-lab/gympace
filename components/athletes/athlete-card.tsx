'use client'

import Link from 'next/link'
import { useState } from 'react'

import { AvatarDisplay } from '@/components/ui/avatar/avatar-display'
import { getAthleteTitle } from '@/lib/athlete-title'
import { getAvatarById } from '@/lib/avatar-registry'

export interface AthleteCardData {
  user_id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_id: string | null
  avatar_type: string | null
  level: number
  rank: string
}

export function AthleteCard({ athlete }: { athlete: AthleteCardData }) {
  const [hovered, setHovered] = useState(false)

  if (!athlete.username) return null

  const displayName = athlete.display_name || athlete.username || 'Atleta'
  const initials = displayName[0]?.toUpperCase() ?? '?'
  const avatarDef = athlete.avatar_id ? getAvatarById(athlete.avatar_id) : null
  const accentColor = avatarDef?.accentColor ?? '#B6FF00'
  const glowColor = avatarDef?.glowColor ?? 'rgba(182,255,0,0.15)'

  const title = getAthleteTitle(athlete.rank)

  return (
    <Link
      href={`/atleta/${athlete.username}`}
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-200 hover:border-white/[0.12] hover:-translate-y-px"
      style={{ boxShadow: hovered ? `0 0 28px ${glowColor}` : 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {hovered && avatarDef && (
        <div
          className="pointer-events-none absolute -left-4 -top-4 size-32 rounded-full blur-[60px]"
          style={{ background: accentColor + '1A' }}
        />
      )}

      <div className="relative flex items-start gap-3">
        <AvatarDisplay avatarId={athlete.avatar_id} initials={initials} size="md" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold tracking-tight text-[#F5F5F5]">
            {displayName}
          </p>
          <p className="truncate text-[11px] text-[#F5F5F5]/35">@{athlete.username}</p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
              style={{ background: title.color + '20', color: title.color }}
            >
              Nív. {athlete.level ?? 1} · {title.label}
            </span>
          </div>
        </div>
      </div>

      {athlete.bio && (
        <p className="line-clamp-2 text-[11px] leading-relaxed text-[#F5F5F5]/35">
          {athlete.bio}
        </p>
      )}
    </Link>
  )
}
