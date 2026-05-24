'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Loader2, Lock, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

import {
  SELECTABLE_AVATARS,
  getAvatarById,
  getDefaultAvatar,
  isAvatarUnlocked,
  resolveAvatarId,
  type AvatarCategory,
  type AvatarType,
} from '@/lib/avatar-registry'
import { useProfileContext } from '@/components/providers/profile-provider'
import { AvatarCard } from './avatar-card'
import { AvatarSVG } from './avatar-svg'
import { cn } from '@/lib/utils'

interface AvatarSelectorProps {
  initialAvatarId: string | null
}

const CATEGORY_DEFS: Array<{ id: AvatarCategory; label: string; hint: string; accentColor: string }> = [
  { id: 'running', label: 'Corrida', hint: 'Mascotes leves para ritmo e velocidade', accentColor: '#B6FF00' },
  { id: 'gym', label: 'Musculação', hint: 'Mascotes fortes para treino de força', accentColor: '#A855F7' },
  { id: 'hybrid', label: 'Híbrido', hint: 'Mascotes para quem mistura corrida e academia', accentColor: '#C084FC' },
  { id: 'premium', label: 'Premium', hint: 'Temporada, troféus e conquistas especiais', accentColor: '#FACC15' },
]

const RARITY_LABELS_PT: Record<string, string> = {
  core: 'Base',
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  seasonal: 'Temporada',
}

const RARITY_COLORS_MAP: Record<string, string> = {
  core: '#94A3B8',
  common: '#94A3B8',
  rare: '#38BDF8',
  epic: '#A78BFA',
  legendary: '#FACC15',
  seasonal: '#FACC15',
}

export function AvatarSelector({ initialAvatarId }: AvatarSelectorProps) {
  const { profile, updateProfile } = useProfileContext()
  const router = useRouter()
  const resolvedInitial = resolveAvatarId(initialAvatarId)
  const initialAvatar = getAvatarById(resolvedInitial) ?? getDefaultAvatar()

  const [activeCategory, setActiveCategory] = useState<AvatarCategory>(initialAvatar.category)
  const [selectedId, setSelectedId] = useState<string>(initialAvatar.id)
  const [selectedType, setSelectedType] = useState<AvatarType>(initialAvatar.type)
  const [savedId, setSavedId] = useState<string>(initialAvatar.id)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userLevel = profile?.currentLevel ?? profile?.level ?? 1
  const isAdmin = profile?.isAdmin ?? false
  const unlockedAvatarIds = profile?.unlockedAvatarIds ?? []
  const selectableAvatars = useMemo(
    () => [...SELECTABLE_AVATARS, ...(profile?.customAvatars ?? [])],
    [profile?.customAvatars]
  )
  const selected = selectableAvatars.find((avatar) => avatar.id === selectedId) ?? getAvatarById(selectedId) ?? getDefaultAvatar()

  const activeAvatars = useMemo(
    () => selectableAvatars.filter((avatar) => avatar.category === activeCategory),
    [activeCategory, selectableAvatars]
  )

  const rarityColor = RARITY_COLORS_MAP[selected.rarity] ?? '#94A3B8'
  const rarityLabel = RARITY_LABELS_PT[selected.rarity] ?? selected.rarity
  const isEquipped = selectedId === savedId
  const activeCatDef = CATEGORY_DEFS.find((c) => c.id === activeCategory)

  function handleSelect(id: string, type: AvatarType) {
    const avatar = selectableAvatars.find((item) => item.id === id) ?? getAvatarById(id)
    if (!avatar || !isAvatarUnlocked(avatar, { level: userLevel, isAdmin, unlockedAvatarIds })) return
    setSelectedId(id)
    setSelectedType(type)
    setError(null)
  }

  async function handleSave() {
    if (!selectedId || !selectedType) return
    const avatar = selectableAvatars.find((item) => item.id === selectedId) ?? getAvatarById(selectedId)
    if (!avatar || !isAvatarUnlocked(avatar, { level: userLevel, isAdmin, unlockedAvatarIds })) {
      setError('Avatar bloqueado.')
      return
    }

    setIsSaving(true)
    setError(null)

    const result = await updateProfile({ avatarId: selectedId, avatarType: selectedType })

    if (result.error) {
      setError(result.error)
      setIsSaving(false)
      return
    }

    setSavedId(selectedId)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 1500)
    setIsSaving(false)
    router.refresh()
  }

  const isDirty = selectedId !== savedId

  return (
    <div className="space-y-4">
      {/* ── Preview card — collectible item feel ── */}
      <div
        className="relative overflow-hidden rounded-2xl border bg-[#080808] p-4"
        style={{
          borderColor: `${selected.accentColor}30`,
          boxShadow: `0 0 32px ${selected.glowColor}, 0 0 64px ${selected.glowColor}40`,
        }}
      >
        {/* Animated top line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${selected.accentColor}70, transparent)` }}
        />

        <div className="flex items-center gap-4">
          {/* Avatar frame */}
          <div
            className="relative grid size-24 shrink-0 place-items-center rounded-3xl border"
            style={{
              borderColor: `${selected.accentColor}32`,
              background: `radial-gradient(circle at 50% 35%, ${selected.accentColor}22 0%, transparent 72%), rgba(0,0,0,0.50)`,
              boxShadow: `0 0 18px ${selected.glowColor} inset`,
            }}
          >
            <AvatarSVG
              avatarId={selected.id}
              accentColor={selected.accentColor}
              secondaryColor={selected.secondaryColor}
              size={96}
              definition={selected}
            />
            {isEquipped && (
              <span
                className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em]"
                style={{
                  borderColor: `${selected.accentColor}30`,
                  color: `${selected.accentColor}90`,
                  background: `${selected.accentColor}10`,
                }}
              >
                Em uso
              </span>
            )}
          </div>

          {/* Info panel */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {/* Rarity badge */}
              <span
                className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                style={{
                  borderColor: `${rarityColor}40`,
                  color: rarityColor,
                  background: `${rarityColor}12`,
                }}
              >
                {rarityLabel}
              </span>
              {/* Category badge */}
              <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">
                {activeCatDef?.label ?? selected.category}
              </span>
            </div>
            <h3 className="font-display text-xl font-bold tracking-tight text-[#F5F5F5]">{selected.label}</h3>
            <p className="mt-1 text-xs leading-5 text-[#F5F5F5]/42">{selected.description}</p>
            {selected.unlock.kind !== 'free' && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#FACC15]/18 bg-[#FACC15]/[0.06] px-2 py-1 text-[10px] font-semibold text-[#FACC15]/78">
                <Lock className="size-3" strokeWidth={2} />
                {selected.unlock.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-1.5">
        {CATEGORY_DEFS.map((cat) => {
          const active = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'min-w-0 rounded-xl px-2 py-2 text-center transition-all duration-150 active:scale-[0.97]',
                active ? 'bg-white/[0.07]' : 'text-white/38 hover:bg-white/[0.04]'
              )}
              style={
                active
                  ? {
                      boxShadow: `0 0 16px ${cat.accentColor}22`,
                      borderColor: `${cat.accentColor}20`,
                    }
                  : undefined
              }
            >
              <span
                className="mx-auto mb-1 block size-2 rounded-full transition-all duration-150"
                style={{
                  background: active ? cat.accentColor : 'rgba(255,255,255,0.18)',
                  boxShadow: active ? `0 0 8px ${cat.accentColor}` : undefined,
                }}
              />
              <span
                className="block truncate text-[10px] font-bold uppercase tracking-[0.08em] transition-colors duration-150"
                style={active ? { color: cat.accentColor } : undefined}
              >
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: activeCatDef ? `${activeCatDef.accentColor}80` : 'rgba(182,255,0,0.6)' }}
          >
            {activeCatDef?.label}
          </p>
          <p className="mt-0.5 text-xs text-[#F5F5F5]/35">
            {activeCatDef?.hint}
          </p>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs font-semibold tabular-nums text-white/42">
          {activeAvatars.length}
        </span>
      </div>

      {/* ── Avatar grid ── */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {activeAvatars.map((def) => (
          <AvatarCard
            key={def.id}
            definition={def}
            isSelected={selectedId === def.id}
            onSelect={handleSelect}
            isLoading={isSaving}
            isLocked={!isAvatarUnlocked(def, { level: userLevel, isAdmin, unlockedAvatarIds })}
          />
        ))}
      </div>

      {error && <p className="text-xs font-medium text-red-400/80">{error}</p>}

      {/* ── Save button ── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving || !selectedId}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B6FF00] px-5 text-sm font-bold text-[#080808] shadow-[0_0_20px_rgba(182,255,0,0.15)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_0_28px_rgba(182,255,0,0.25)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-45 sm:w-auto"
      >
        {isSaving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : showSaved ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {isSaving ? 'Salvando...' : showSaved ? 'Avatar salvo!' : 'Usar avatar'}
      </button>
    </div>
  )
}
