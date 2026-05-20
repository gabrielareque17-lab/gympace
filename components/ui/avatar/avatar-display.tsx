import { getAvatarById } from '@/lib/avatar-registry'
import { AvatarSVG } from './avatar-svg'

interface AvatarDisplayProps {
  avatarId: string | null
  initials?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeMap = {
  xs: { container: 'size-6 rounded-lg', svgSize: 24 },
  sm: { container: 'size-8 rounded-xl', svgSize: 32 },
  md: { container: 'size-14 rounded-2xl', svgSize: 56 },
  lg: { container: 'size-24 rounded-3xl', svgSize: 96 },
}

export function AvatarDisplay({ avatarId, initials = '?', size = 'md' }: AvatarDisplayProps) {
  const { container, svgSize } = sizeMap[size]
  const definition = avatarId ? getAvatarById(avatarId) : null

  if (definition) {
    return (
      <div
        className={`${container} shrink-0 grid place-items-center overflow-hidden border border-white/[0.08] bg-[#080808]`}
        style={{ boxShadow: `0 0 16px ${definition.glowColor}` }}
      >
        <AvatarSVG
          avatarId={definition.id}
          accentColor={definition.accentColor}
          secondaryColor={definition.secondaryColor}
          size={svgSize}
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
