'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

import { AvatarDefinition, AvatarType } from '@/lib/avatar-registry'
import { cn } from '@/lib/utils'
import { AvatarSVG } from './avatar-svg'

interface AvatarCardProps {
  definition: AvatarDefinition
  isSelected: boolean
  onSelect: (id: string, type: AvatarType) => void
  isLoading?: boolean
}

export function AvatarCard({ definition, isSelected, onSelect, isLoading }: AvatarCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const showGlow = isSelected || isHovered
  const { accentColor, glowColor } = definition

  return (
    <button
      type="button"
      onClick={() => !isLoading && onSelect(definition.id, definition.type)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-3 sm:p-4',
        isSelected
          ? 'bg-[#141414]'
          : 'border-white/[0.06] bg-[#111111] hover:bg-[#141414] hover:border-white/[0.14]'
      )}
      style={{
        borderColor: isSelected ? `${accentColor}55` : undefined,
        boxShadow: showGlow ? `0 0 24px ${glowColor}` : 'none',
      }}
      aria-pressed={isSelected}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <span
          className="absolute right-2 top-2 grid size-4 place-items-center rounded-full sm:right-2.5 sm:top-2.5 sm:size-5"
          style={{ backgroundColor: accentColor }}
        >
          <Check className="size-2.5 text-[#080808] sm:size-3" strokeWidth={3} />
        </span>
      )}

      {/* Avatar illustration */}
      <div className="flex items-center justify-center">
        <AvatarSVG avatarId={definition.id} accentColor={accentColor} size={42} className="sm:hidden" />
        <AvatarSVG avatarId={definition.id} accentColor={accentColor} size={52} className="hidden sm:block" />
      </div>

      {/* Category dot */}
      <span
        className="block size-1.5 rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Label + description */}
      <div className="text-center">
        <p className="font-display text-xs font-semibold text-[#F5F5F5] sm:text-sm">{definition.label}</p>
        <p className="mt-0.5 text-[10px] text-[#F5F5F5]/40 sm:text-xs sm:text-[#F5F5F5]/45">{definition.description}</p>
      </div>
    </button>
  )
}
