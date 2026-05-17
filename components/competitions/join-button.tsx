'use client'

import { useState } from 'react'
import { Check, Loader2, UserMinus, UserPlus } from 'lucide-react'

import { useProfile } from '@/hooks/use-profile'

interface JoinButtonProps {
  competitionId: string
  initialIsJoined: boolean
  disabled?: boolean
}

type XPFeedback = {
  gainedXp: number
  currentLevel: number
  leveledUp: boolean
}

export function JoinButton({ competitionId, initialIsJoined, disabled }: JoinButtonProps) {
  const { refetch: refetchProfile } = useProfile()
  const [isJoined, setIsJoined] = useState(initialIsJoined)
  const [isHovered, setIsHovered] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [xpFeedback, setXpFeedback] = useState<XPFeedback | null>(null)

  async function handleToggle() {
    if (isPending || disabled) return
    setIsPending(true)
    const prev = isJoined
    setIsJoined(!isJoined)

    try {
      const res = await fetch(`/api/competitions/${competitionId}/join`, {
        method: isJoined ? 'DELETE' : 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setIsJoined(prev)
      } else if (!prev && data.xpFeedback?.gainedXp > 0) {
        setXpFeedback(data.xpFeedback)
        refetchProfile()
        setTimeout(() => setXpFeedback(null), 3600)
      }
    } catch {
      setIsJoined(prev)
    } finally {
      setIsPending(false)
    }
  }

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 text-sm font-semibold text-[#F5F5F5]/28 disabled:pointer-events-none"
      >
        Encerrada
      </button>
    )
  }

  if (isJoined) {
    return (
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50"
          style={
            isHovered
              ? { borderColor: 'rgba(239,68,68,0.35)', color: 'rgba(252,165,165,0.8)', background: 'rgba(239,68,68,0.06)' }
              : { borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(245,245,245,0.65)', background: 'rgba(255,255,255,0.04)' }
          }
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isHovered ? (
            <>
              <UserMinus className="size-3.5" strokeWidth={2} />
              Sair
            </>
          ) : (
            <>
              <Check className="size-3.5" strokeWidth={2.5} />
              Participando
            </>
          )}
        </button>
        {xpFeedback && <CompetitionXPToast feedback={xpFeedback} />}
      </div>
    )
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#B6FF00] px-4 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(182,255,0,0.15)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_28px_rgba(182,255,0,0.25)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <UserPlus className="size-3.5" strokeWidth={2.5} />
        )}
        Participar
      </button>
      {xpFeedback && <CompetitionXPToast feedback={xpFeedback} />}
    </div>
  )
}

function CompetitionXPToast({ feedback }: { feedback: XPFeedback }) {
  return (
    <div className="pointer-events-none absolute right-0 top-11 z-20 min-w-32 rounded-xl border border-[#B6FF00]/25 bg-[#101010] px-3 py-2 text-right shadow-[0_0_24px_rgba(182,255,0,0.16)] animate-in fade-in slide-in-from-top-1 duration-300">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#B6FF00]/75">
        {feedback.leveledUp ? 'Level up' : 'XP'}
      </p>
      <p className="text-xs font-bold text-[#F5F5F5]/80">
        +{feedback.gainedXp} XP · Nv. {feedback.currentLevel}
      </p>
    </div>
  )
}
