import { getAvatarById, type AvatarDefinition } from '@/lib/avatar-registry'
import { AvatarSVG } from './avatar-svg'

interface AvatarDisplayProps {
  avatarId: string | null
  initials?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  definition?: AvatarDefinition | null
}

const sizeMap = {
  xs: { container: 'size-6 rounded-lg', svgSize: 24 },
  sm: { container: 'size-8 rounded-xl', svgSize: 32 },
  md: { container: 'size-14 rounded-2xl', svgSize: 56 },
  lg: { container: 'size-24 rounded-3xl', svgSize: 96 },
}

function buildGlow(def: AvatarDefinition, size: 'xs' | 'sm' | 'md' | 'lg'): string {
  const { glowColor, accentColor } = def
  if (size === 'xs') return `0 0 8px ${glowColor}`
  if (size === 'sm') return `0 0 12px ${glowColor}`
  if (size === 'md') return `0 0 22px ${glowColor}, 0 0 6px ${accentColor}28 inset, 0 4px 14px rgba(0,0,0,0.55)`
  return `0 0 36px ${glowColor}, 0 0 72px ${glowColor}50, 0 0 10px ${accentColor}22 inset, 0 8px 28px rgba(0,0,0,0.65)`
}

function buildBorder(def: AvatarDefinition, size: 'xs' | 'sm' | 'md' | 'lg'): string {
  const { accentColor, rarity } = def
  if (size === 'xs' || size === 'sm') return 'rgba(255,255,255,0.08)'
  const isLegendary = rarity === 'legendary' || rarity === 'seasonal'
  const isEpic = rarity === 'epic'
  if (isLegendary) return `${accentColor}48`
  if (isEpic) return `${accentColor}32`
  return `${accentColor}22`
}

export function AvatarDisplay({ avatarId, initials = '?', size = 'md', definition: definitionOverride }: AvatarDisplayProps) {
  const { container, svgSize } = sizeMap[size]
  const definition = definitionOverride ?? (avatarId ? getAvatarById(avatarId) : null)

  if (definition) {
    return (
      <div
        className={`${container} shrink-0 grid place-items-center overflow-hidden bg-[#080808]`}
        style={{
          boxShadow: buildGlow(definition, size),
          border: `1px solid ${buildBorder(definition, size)}`,
        }}
      >
        <AvatarSVG
          avatarId={definition.id}
          accentColor={definition.accentColor}
          secondaryColor={definition.secondaryColor}
          size={svgSize}
          definition={definition}
        />
      </div>
    )
  }

  return (
    <div
      className={`${container} shrink-0 grid place-items-center border border-[#B6FF00]/20 bg-[#0B0B0B] shadow-[0_0_24px_rgba(182,255,0,0.2)]`}
    >
      <span
        className={`font-display font-bold text-[#B6FF00] ${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-[9px]'}`}
      >
        {initials}
      </span>
    </div>
  )
}
