'use client'

import { useEffect } from 'react'
import { Zap } from 'lucide-react'

const RANK_STYLES: Record<string, { label: string; color: string }> = {
  rookie:   { label: 'Rookie',   color: '#94A3B8' },
  bronze:   { label: 'Bronze',   color: '#CD7F32' },
  silver:   { label: 'Silver',   color: '#A1A1AA' },
  gold:     { label: 'Gold',     color: '#EAB308' },
  platinum: { label: 'Platinum', color: '#22D3EE' },
  elite:    { label: 'Elite',    color: '#B6FF00' },
}

interface LevelUpOverlayProps {
  level: number
  rank: string
  totalXp: number
  levelProgress: number
  onClose: () => void
}

export function LevelUpOverlay({ level, rank, totalXp, levelProgress, onClose }: LevelUpOverlayProps) {
  const rankStyle = RANK_STYLES[rank] ?? RANK_STYLES.rookie

  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-xs overflow-hidden rounded-3xl border p-8 text-center animate-in fade-in zoom-in-95 duration-500"
        style={{
          borderColor: rankStyle.color + '38',
          background: 'linear-gradient(160deg, #101010, #0D0D0D)',
          boxShadow: `0 0 80px ${rankStyle.color}18, 0 0 200px ${rankStyle.color}08`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shimmer line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${rankStyle.color}80, transparent)` }}
        />

        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -top-16 left-1/2 size-56 -translate-x-1/2 rounded-full blur-[80px]"
          style={{ background: rankStyle.color + '14' }}
        />

        {/* Icon */}
        <div className="relative mb-6 flex justify-center">
          <div
            className="grid size-16 place-items-center rounded-2xl border"
            style={{
              borderColor: rankStyle.color + '30',
              background: rankStyle.color + '14',
              color: rankStyle.color,
              boxShadow: `0 0 36px ${rankStyle.color}28`,
            }}
          >
            <Zap className="size-8" strokeWidth={2.5} />
          </div>
        </div>

        {/* Label */}
        <p
          className="text-[10px] font-black uppercase tracking-[0.4em]"
          style={{ color: rankStyle.color + 'CC' }}
        >
          Level Up
        </p>

        {/* Level number */}
        <p
          className="font-display mt-1 text-8xl font-black leading-none tracking-tight"
          style={{ color: rankStyle.color }}
        >
          {level}
        </p>

        {/* Rank badge */}
        <div className="mt-4 flex justify-center">
          <span
            className="rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{
              background: rankStyle.color + '18',
              color: rankStyle.color,
              border: `1px solid ${rankStyle.color}28`,
            }}
          >
            {rankStyle.label}
          </span>
        </div>

        {/* XP total */}
        <p className="mt-5 font-display text-2xl font-bold tabular-nums text-[#F5F5F5]/65">
          {totalXp.toLocaleString('pt-BR')} XP
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-[4px] overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-all duration-1000 delay-300"
            style={{
              width: `${levelProgress}%`,
              background: rankStyle.color,
              boxShadow: `0 0 12px ${rankStyle.color}55`,
            }}
          />
        </div>

        {/* Dismiss hint */}
        <p className="mt-6 text-[11px] text-[#F5F5F5]/20">
          Clique em qualquer lugar para continuar
        </p>
      </div>
    </div>
  )
}
