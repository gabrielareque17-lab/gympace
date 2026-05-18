'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  Loader2,
  Route,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const TYPE_CFG: Record<string, { label: string; icon: LucideIcon; color: string; unit: string }> = {
  corrida: { label: 'Corrida', icon: Route, color: '#B6FF00', unit: 'km' },
  academia: { label: 'Academia', icon: Dumbbell, color: '#60A5FA', unit: 'sessões' },
  streak: { label: 'Sequência', icon: Flame, color: '#FB923C', unit: 'dias' },
  hibrido: { label: 'Híbrido', icon: Zap, color: '#A78BFA', unit: 'pts' },
}

interface PendingInviteCardProps {
  inviteId: string
  competitionId: string
  competitionTitle: string
  competitionType: string
  inviterUsername: string | null
  inviterDisplayName: string | null
  competitionDescription?: string | null
  targetValue?: number | null
  startDate?: string | null
  endDate?: string | null
  participantCount?: number | null
  createdAt?: string | null
  compact?: boolean
}

import { formatShortDate } from '@/lib/date-utils'

type Status = 'idle' | 'accepting' | 'rejecting' | 'accepted' | 'rejected'

function fmtDate(iso?: string | null) {
  if (!iso) return null
  return formatShortDate(iso)
}

export function PendingInviteCard({
  inviteId,
  competitionId,
  competitionTitle,
  competitionType,
  inviterUsername,
  inviterDisplayName,
  competitionDescription,
  targetValue,
  startDate,
  endDate,
  participantCount,
  createdAt,
  compact = false,
}: PendingInviteCardProps) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const cfg = TYPE_CFG[competitionType] ?? TYPE_CFG.corrida
  const Icon = cfg.icon
  const inviterName = inviterDisplayName || inviterUsername || 'Atleta'
  const period = [fmtDate(startDate), fmtDate(endDate)].filter(Boolean).join(' - ')
  const inviteDate = fmtDate(createdAt)

  async function respond(action: 'accept' | 'reject') {
    setError(null)
    setStatus(action === 'accept' ? 'accepting' : 'rejecting')

    try {
      const res = await fetch(`/api/competitions/${competitionId}/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus('idle')
        setError(data.error ?? 'Não foi possível responder ao convite.')
        return
      }

      setStatus(action === 'accept' ? 'accepted' : 'rejected')
      router.refresh()

      if (action === 'accept') {
        setTimeout(() => {
          router.push(`/competicoes/${competitionId}`)
        }, 850)
      }
    } catch {
      setStatus('idle')
      setError('Falha de conexão. Tente novamente.')
    }
  }

  if (status === 'rejected') return null

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#101010] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.13]"
      style={{ boxShadow: `0 0 34px ${cfg.color}0A` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}55, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-[70px]"
        style={{ background: cfg.color + '16' }}
      />

      <div className={compact ? 'relative p-4' : 'relative p-5 sm:p-6'}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className="grid size-11 shrink-0 place-items-center rounded-2xl border"
              style={{
                borderColor: cfg.color + '24',
                background: cfg.color + '16',
                color: cfg.color,
                boxShadow: `0 0 18px ${cfg.color}18`,
              }}
            >
              <Icon className="size-5" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ background: cfg.color + '18', color: cfg.color }}
                >
                  {cfg.label}
                </span>
                {inviteDate && (
                  <span className="text-[10px] font-semibold text-[#F5F5F5]/25">
                    Recebido em {inviteDate}
                  </span>
                )}
              </div>

              <h3 className="font-display text-base font-bold tracking-tight text-[#F5F5F5] sm:text-lg">
                {competitionTitle}
              </h3>
              <p className="mt-1 text-xs text-[#F5F5F5]/36">
                Convite de <span className="font-semibold text-[#F5F5F5]/62">{inviterName}</span>
                {inviterUsername && <span className="text-[#F5F5F5]/28"> · @{inviterUsername}</span>}
              </p>
              {!compact && competitionDescription && (
                <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-[#F5F5F5]/42">
                  {competitionDescription}
                </p>
              )}
            </div>
          </div>

          {status === 'accepted' ? (
            <div
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold"
              style={{ background: cfg.color + '18', color: cfg.color }}
            >
              <Check className="size-4" strokeWidth={2.5} />
              Entrada confirmada
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => respond('reject')}
                disabled={status !== 'idle'}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 text-xs font-semibold text-[#F5F5F5]/45 transition-all hover:border-red-500/25 hover:text-red-400/75 disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
              >
                {status === 'rejecting' ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                Recusar
              </button>
              <button
                type="button"
                onClick={() => respond('accept')}
                disabled={status !== 'idle'}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold text-[#080808] transition-all hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
                style={{ background: cfg.color, boxShadow: `0 0 18px ${cfg.color}35` }}
              >
                {status === 'accepting' ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Aceitar
              </button>
            </div>
          )}
        </div>

        {!compact && (
          <div className="mt-5 grid gap-2 border-t border-white/[0.05] pt-4 sm:grid-cols-3">
            <Meta icon={Trophy} label="Meta" value={targetValue ? `${targetValue} ${cfg.unit}` : 'Em aberto'} color={cfg.color} />
            <Meta icon={CalendarDays} label="Período" value={period || 'Sem data'} />
            <Meta icon={Users} label="Atletas" value={`${participantCount ?? 0} na disputa`} />
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-xs text-red-300/80">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}

function Meta({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.025] px-3 py-2.5">
      <Icon className="size-3.5 shrink-0 text-[#F5F5F5]/28" strokeWidth={1.8} />
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#F5F5F5]/25">{label}</p>
        <p className="truncate text-xs font-semibold" style={{ color: color ?? 'rgba(245,245,245,0.58)' }}>
          {value}
        </p>
      </div>
    </div>
  )
}
