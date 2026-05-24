'use client'

import { useState } from 'react'
import { Check, Lock } from 'lucide-react'

import { AvatarDefinition, AvatarType } from '@/lib/avatar-registry'
import { cn } from '@/lib/utils'
import { AvatarSVG } from './avatar-svg'

interface AvatarCardProps {
  definition: AvatarDefinition
  isSelected: boolean
  onSelect: (id: string, type: AvatarType) => void
  isLoading?: boolean
  isLocked?: boolean
}

const RARITY_LABELS = {
  core: 'Base',
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  seasonal: 'Temporada',
} as const

const RARITY_COLORS = {
  core: '#94A3B8',
  common: '#94A3B8',
  rare: '#38BDF8',
  epic: '#A78BFA',
  legendary: '#FACC15',
  seasonal: '#FACC15',
} as const

export function AvatarCard({ definition, isSelected, onSelect, isLoading, isLocked = false }: AvatarCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const showGlow = (isSelected || isHovered) && !isLocked
  const { accentColor, secondaryColor, glowColor, rarity } = definition
  const rarityColor = RARITY_COLORS[rarity]
  const isLegendary = rarity === 'legendary' || rarity === 'seasonal'
  const isEpic = rarity === 'epic'
  const hasRarityShimmer = (isLegendary || isEpic) && !isLocked

  return (
    <button
      type="button"
      onClick={() => !isLoading && !isLocked && onSelect(definition.id, definition.type)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading || isLocked}
      className={cn(
        'relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-2.5 text-left transition-all duration-200 [content-visibility:auto] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed sm:gap-2.5 sm:p-3',
        isSelected
          ? 'bg-[#141414]'
          : isLocked
            ? 'border-white/[0.05] bg-[#0B0B0B]'
            : 'border-white/[0.06] bg-[#101010] hover:border-white/[0.14] hover:bg-[#141414]',
      )}
      style={{
        borderColor: isSelected
          ? `${accentColor}60`
          : hasRarityShimmer
            ? `${rarityColor}28`
            : undefined,
        boxShadow: showGlow
          ? `0 0 20px ${glowColor}, 0 2px 16px rgba(0,0,0,0.5)`
          : hasRarityShimmer
            ? `0 0 14px ${rarityColor}14`
            : undefined,
      }}
      aria-pressed={isSelected}
    >
      {/* Top accent line — animated shimmer for legendary/epic */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px',
          hasRarityShimmer && 'gp-rarity-shimmer',
        )}
        style={{
          background: hasRarityShimmer
            ? `linear-gradient(90deg, transparent 0%, ${rarityColor}55 30%, ${rarityColor} 50%, ${rarityColor}55 70%, transparent 100%)`
            : `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
        }}
      />

      {/* Selected checkmark */}
      {isSelected && (
        <span
          className="absolute right-2 top-2 z-10 grid size-5 place-items-center rounded-full"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}60` }}
        >
          <Check className="size-3 text-[#080808]" strokeWidth={3} />
        </span>
      )}

      {/* Locked overlay — frosted with centered lock */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-black/55 backdrop-blur-[1.5px]">
          <span className="grid size-8 place-items-center rounded-full border border-white/[0.10] bg-black/60">
            <Lock className="size-3.5 text-white/40" strokeWidth={2} />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.10em] text-white/30">
            {definition.unlock.label}
          </span>
        </div>
      )}

      {/* Avatar illustration */}
      <div
        className={cn(
          'relative flex size-16 items-center justify-center rounded-xl sm:size-20',
          isLocked && 'opacity-30',
        )}
        style={{
          background: `radial-gradient(circle at 50% 35%, ${accentColor}16 0%, transparent 68%), rgba(0,0,0,0.22)`,
        }}
      >
        <AvatarSVG
          avatarId={definition.id}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          size={64}
          className="sm:hidden"
          definition={definition}
        />
        <AvatarSVG
          avatarId={definition.id}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          size={80}
          className="hidden sm:block"
          definition={definition}
        />
      </div>

      {/* Rarity badge */}
      <span
        className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
        style={{
          borderColor: `${rarityColor}38`,
          color: rarityColor,
          background: `${rarityColor}10`,
        }}
      >
        {RARITY_LABELS[rarity]}
      </span>

      {/* Label + description */}
      <div className={cn('text-center', isLocked && 'opacity-45')}>
        <p className="font-display text-xs font-semibold text-[#F5F5F5] sm:text-sm">{definition.label}</p>
        <p className="mt-0.5 text-[10px] text-[#F5F5F5]/40 sm:text-[11px]">
          {definition.description}
        </p>
      </div>
    </button>
  )
}
