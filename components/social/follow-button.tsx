'use client'

import { useState } from 'react'
import { Check, Loader2, UserMinus, UserPlus } from 'lucide-react'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isHovered, setIsHovered] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleToggle() {
    if (isPending) return
    setIsPending(true)
    const prev = isFollowing
    setIsFollowing(!isFollowing)

    try {
      const res = await fetch('/api/follows', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: targetUserId }),
      })
      if (!res.ok) setIsFollowing(prev)
    } catch {
      setIsFollowing(prev)
    } finally {
      setIsPending(false)
    }
  }

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50"
        style={
          isHovered
            ? {
                borderColor: 'rgba(239,68,68,0.35)',
                color: 'rgba(252,165,165,0.8)',
                background: 'rgba(239,68,68,0.06)',
              }
            : {
                borderColor: 'rgba(255,255,255,0.12)',
                color: 'rgba(245,245,245,0.65)',
                background: 'rgba(255,255,255,0.04)',
              }
        }
      >
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : isHovered ? (
          <>
            <UserMinus className="size-3.5" strokeWidth={2} />
            Deixar de seguir
          </>
        ) : (
          <>
            <Check className="size-3.5" strokeWidth={2.5} />
            Seguindo
          </>
        )}
      </button>
    )
  }

  return (
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
      Seguir
    </button>
  )
}
