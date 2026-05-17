'use client'

import { useEffect, useState } from 'react'
import { Loader2, Search, Users } from 'lucide-react'

import { AthleteCard, type AthleteCardData } from './athlete-card'

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-white/[0.06] bg-[#111111] p-4">
      <div className="flex items-start gap-3">
        <div className="size-14 shrink-0 animate-pulse rounded-2xl bg-white/[0.06]" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-2.5 w-2/5 animate-pulse rounded-full bg-white/[0.04]" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full animate-pulse rounded-full bg-white/[0.04]" />
        <div className="h-2 w-4/5 animate-pulse rounded-full bg-white/[0.04]" />
      </div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 py-16 text-center">
      <div className="grid size-16 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
        <Users className="size-7 text-[#F5F5F5]/18" strokeWidth={1.5} />
      </div>
      {query ? (
        <>
          <p className="font-display text-base font-semibold text-[#F5F5F5]/55">
            Nenhum atleta encontrado
          </p>
          <p className="max-w-xs text-sm text-[#F5F5F5]/28">
            Nenhum resultado para{' '}
            <span className="font-semibold text-[#F5F5F5]/45">"{query}"</span>. Tente outro
            nome ou username.
          </p>
        </>
      ) : (
        <>
          <p className="font-display text-base font-semibold text-[#F5F5F5]/55">
            Nenhum atleta ainda
          </p>
          <p className="max-w-xs text-sm text-[#F5F5F5]/28">
            Seja o primeiro! Complete seu perfil e apareça aqui.
          </p>
        </>
      )}
    </div>
  )
}

interface AthleteSearchProps {
  initialAthletes: AthleteCardData[]
}

export function AthleteSearch({ initialAthletes }: AthleteSearchProps) {
  const [query, setQuery] = useState('')
  const [athletes, setAthletes] = useState<AthleteCardData[]>(initialAthletes)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setAthletes(initialAthletes)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/athletes/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setAthletes(data.athletes ?? [])
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, initialAthletes])

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-[#F5F5F5]/30" />
          ) : (
            <Search className="size-4 text-[#F5F5F5]/30" strokeWidth={2} />
          )}
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou @username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#111111] pl-11 pr-4 text-sm text-[#F5F5F5] placeholder-[#F5F5F5]/25 outline-none transition-all duration-200 focus:border-[#B6FF00]/30 focus:ring-1 focus:ring-[#B6FF00]/15 focus:shadow-[0_0_24px_rgba(182,255,0,0.05)]"
        />
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-[11px] text-[#F5F5F5]/28">
          {query.trim()
            ? `${athletes.length} ${athletes.length === 1 ? 'atleta encontrado' : 'atletas encontrados'}`
            : `${athletes.length} ${athletes.length === 1 ? 'atleta na comunidade' : 'atletas na comunidade'}`}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : athletes.length === 0
          ? <EmptyState query={query} />
          : athletes.map((a) => <AthleteCard key={a.user_id} athlete={a} />)}
      </div>
    </div>
  )
}
