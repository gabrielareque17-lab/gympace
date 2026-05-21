'use client'

import { Zap } from 'lucide-react'
import { useProfile } from '@/hooks/use-profile'

const RANK_STYLES: Record<string, { label: string; color: string }> = {
  rookie:   { label: 'Rookie',   color: '#94A3B8' },
  bronze:   { label: 'Bronze',   color: '#CD7F32' },
  silver:   { label: 'Silver',   color: '#A1A1AA' },
  gold:     { label: 'Gold',     color: '#EAB308' },
  platinum: { label: 'Platinum', color: '#22D3EE' },
  elite:    { label: 'Elite',    color: '#B6FF00' },
}

export function XPCard() {
  const { profile, isLoading } = useProfile()

  if (isLoading) {
    return (
      <article className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
        <div className="mb-4 h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
        <div className="mb-5 h-9 w-12 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-[3px] w-full animate-pulse rounded-full bg-white/[0.06]" />
      </article>
    )
  }

  const rank = profile?.rank ?? 'rookie'
  const rankStyle = RANK_STYLES[rank] ?? RANK_STYLES.rookie
  const level = profile?.currentLevel ?? 1
  const levelProgress = profile?.levelProgress ?? 0
  const xpIntoLevel = profile?.xpIntoLevel ?? 0
  const xpForNextLevel = profile?.xpForNextLevel ?? null

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-5 transition-all duration-300 hover:border-white/[0.11] hover:bg-[#141414] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
      <div
        className="pointer-events-none absolute -right-4 -top-4 size-24 rounded-full blur-[40px]"
        style={{ background: rankStyle.color + '10' }}
      />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5F5F5]/38">
            Progressão XP
          </p>
          <div
            className="grid size-8 place-items-center rounded-lg transition-all duration-200 group-hover:scale-110"
            style={{ background: rankStyle.color + '15', color: rankStyle.color }}
          >
            <Zap className="size-4" strokeWidth={2.2} />
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-display text-xl font-bold leading-none tracking-tight sm:text-2xl"
              style={{ color: rankStyle.color }}
            >
              Nível {level}
            </span>
            <span className="text-sm font-bold text-[#F5F5F5]/18">·</span>
            <span
              className="rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ background: rankStyle.color + '18', color: rankStyle.color }}
            >
              {rankStyle.label}
            </span>
          </div>
          <p className="mt-2 font-mono text-sm font-semibold tabular-nums text-[#F5F5F5]/60">
            {xpIntoLevel.toLocaleString('pt-BR')} / {xpForNextLevel?.toLocaleString('pt-BR') ?? 'max'} XP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${levelProgress}%`,
                background: rankStyle.color,
                boxShadow: `0 0 8px ${rankStyle.color}55`,
              }}
            />
          </div>
          <span className="font-mono shrink-0 text-[11px] font-semibold tabular-nums text-[#F5F5F5]/32">
            {levelProgress}%
          </span>
        </div>
      </div>
    </article>
  )
}
