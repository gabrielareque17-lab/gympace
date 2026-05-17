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
        'relative flex flex-col items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60',
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
          className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full"
          style={{ backgroundColor: accentColor }}
        >
          <Check className="size-3 text-[#080808]" strokeWidth={3} />
        </span>
      )}

      {/* Avatar illustration */}
      <div className="flex items-center justify-center">
        <AvatarSVG avatarId={definition.id} accentColor={accentColor} size={52} />
      </div>

      {/* Category dot */}
      <span
        className="block size-1.5 rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Label + description */}
      <div className="text-center">
        <p className="font-display text-sm font-semibold text-[#F5F5F5]">{definition.label}</p>
        <p className="mt-0.5 text-xs text-[#F5F5F5]/45">{definition.description}</p>
      </div>
    </button>
  )
}
