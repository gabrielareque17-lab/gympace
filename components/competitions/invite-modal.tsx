'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Search, UserPlus, X } from 'lucide-react'

import { AvatarDisplay } from '@/components/ui/avatar/avatar-display'
import { getAvatarById } from '@/lib/avatar-registry'

interface Athlete {
  user_id: string
  username: string | null
  display_name: string | null
  avatar_id: string | null
  level: number
  rank: string
}

interface InviteModalProps {
  competitionId: string
  onClose: () => void
}

export function InviteModal({ competitionId, onClose }: InviteModalProps) {
  const [query, setQuery] = useState('')
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [searching, setSearching] = useState(false)
  const [invited, setInvited] = useState<Set<string>>(new Set())
  const [inviting, setInviting] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    fetch(`/api/competitions/${competitionId}/invites`)
      .then(r => r.json())
      .then(d => {
        const ids = (d.invites ?? []).map((i: { invited_user_id: string }) => i.invited_user_id)
        setInvited(new Set(ids))
      })
      .catch(() => {})
  }, [competitionId])

  useEffect(() => {
    if (!query.trim()) { setAthletes([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/athletes/search?q=${encodeURIComponent(query.trim())}&limit=12`)
        if (res.ok) setAthletes((await res.json()).athletes ?? [])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function invite(userId: string) {
    setInviting(p => new Set([...p, userId]))
    try {
      const res = await fetch(`/api/competitions/${competitionId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invited_user_id: userId }),
      })
      if (res.ok || res.status === 409) {
        setInvited(p => new Set([...p, userId]))
      }
    } finally {
      setInviting(p => { const n = new Set(p); n.delete(userId); return n })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0C0C0C] shadow-[0_0_80px_rgba(182,255,0,0.05),0_30px_80px_rgba(0,0,0,0.75)]">
        {/* Top neon line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6FF00]/30 to-transparent" />

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full blur-[80px]"
          style={{ background: 'rgba(182,255,0,0.04)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B6FF00]/55">
              Competição
            </p>
            <h2 className="font-display text-base font-bold tracking-tight">Convidar Atleta</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-xl border border-white/[0.07] text-[#F5F5F5]/40 transition-all hover:border-white/[0.13] hover:text-[#F5F5F5]/75"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
              {searching
                ? <Loader2 className="size-4 animate-spin text-[#F5F5F5]/28" />
                : <Search className="size-4 text-[#F5F5F5]/28" strokeWidth={2} />
              }
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar por nome ou @username…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/22 outline-none transition-all focus:border-[#B6FF00]/28 focus:shadow-[0_0_20px_rgba(182,255,0,0.04)] focus:ring-1 focus:ring-[#B6FF00]/12"
            />
          </div>
        </div>

        {/* Results */}
        <div className="min-h-[88px] max-h-72 overflow-y-auto px-5 pb-5 space-y-2">
          {!query.trim() && (
            <p className="py-8 text-center text-xs text-[#F5F5F5]/25">
              Digite para buscar atletas
            </p>
          )}
          {query.trim() && !searching && athletes.length === 0 && (
            <p className="py-8 text-center text-xs text-[#F5F5F5]/25">
              Nenhum atleta encontrado para &ldquo;{query}&rdquo;
            </p>
          )}

          {athletes.map(a => {
            const name = a.display_name || a.username || 'Atleta'
            const initials = name[0]?.toUpperCase() ?? '?'
            const avatarDef = a.avatar_id ? getAvatarById(a.avatar_id) : null
            const accentColor = avatarDef?.accentColor ?? '#B6FF00'
            const isInvited = invited.has(a.user_id)
            const isInviting = inviting.has(a.user_id)

            return (
              <div
                key={a.user_id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] px-3.5 py-2.5 transition-colors hover:border-white/[0.09]"
                style={isInvited ? { borderColor: accentColor + '20' } : undefined}
              >
                <AvatarDisplay avatarId={a.avatar_id} initials={initials} size="sm" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#F5F5F5]/85">{name}</p>
                  {a.username && (
                    <p className="text-[10px] text-[#F5F5F5]/28">@{a.username}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => !isInvited && invite(a.user_id)}
                  disabled={isInvited || isInviting}
                  className={
                    isInvited
                      ? 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 text-[11px] font-bold text-[#F5F5F5]/28 disabled:pointer-events-none'
                      : 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#B6FF00] px-3 text-[11px] font-bold text-[#080808] shadow-[0_0_14px_rgba(182,255,0,0.18)] transition-all hover:-translate-y-px hover:shadow-[0_0_22px_rgba(182,255,0,0.3)] disabled:pointer-events-none disabled:opacity-60'
                  }
                >
                  {isInviting ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : isInvited ? (
                    <><Check className="size-3" strokeWidth={2.5} />Convidado</>
                  ) : (
                    <><UserPlus className="size-3" strokeWidth={2.5} />Convidar</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
