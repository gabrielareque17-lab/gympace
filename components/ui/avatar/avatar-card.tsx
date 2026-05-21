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
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
  seasonal: 'Temporada',
} as const

export function AvatarCard({ definition, isSelected, onSelect, isLoading, isLocked = false }: AvatarCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const showGlow = isSelected || isHovered
  const { accentColor, secondaryColor, glowColor } = definition

  return (
    <button
      type="button"
      onClick={() => !isLoading && !isLocked && onSelect(definition.id, definition.type)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading || isLocked}
      className={cn(
        'relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-2.5 text-left transition-all duration-200 [content-visibility:auto] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed sm:gap-3 sm:p-3.5',
        isSelected
          ? 'bg-[#141414]'
          : 'border-white/[0.06] bg-[#101010] hover:border-white/[0.14] hover:bg-[#141414]',
        isLocked && 'opacity-55 grayscale-[0.35]'
      )}
      style={{
        borderColor: isSelected ? `${accentColor}55` : undefined,
        boxShadow: showGlow ? `0 0 24px ${glowColor}` : 'none',
      }}
      aria-pressed={isSelected}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }}
      />

      {/* Selected checkmark */}
      {isSelected && (
        <span
          className="absolute right-2 top-2 grid size-4 place-items-center rounded-full sm:right-2.5 sm:top-2.5 sm:size-5"
          style={{ backgroundColor: accentColor }}
        >
          <Check className="size-2.5 text-[#080808] sm:size-3" strokeWidth={3} />
        </span>
      )}
      {isLocked && (
        <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full border border-white/[0.08] bg-black/70 text-white/45">
          <Lock className="size-3" strokeWidth={2} />
        </span>
      )}

      {/* Avatar illustration */}
      <div className="flex size-16 items-center justify-center rounded-2xl bg-black/25 sm:size-20">
        <AvatarSVG avatarId={definition.id} accentColor={accentColor} secondaryColor={secondaryColor} size={64} className="sm:hidden" />
        <AvatarSVG avatarId={definition.id} accentColor={accentColor} secondaryColor={secondaryColor} size={80} className="hidden sm:block" />
      </div>

      <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/36">
        {RARITY_LABELS[definition.rarity]}
      </span>

      {/* Label + description */}
      <div className="text-center">
        <p className="font-display text-xs font-semibold text-[#F5F5F5] sm:text-sm">{definition.label}</p>
        <p className="mt-0.5 text-[10px] text-[#F5F5F5]/40 sm:text-xs sm:text-[#F5F5F5]/45">
          {isLocked ? definition.unlock.label : definition.description}
        </p>
      </div>
    </button>
  )
}
