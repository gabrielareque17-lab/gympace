import { getAvatarById } from '@/lib/avatar-registry'
import { AvatarSVG } from './avatar-svg'

interface AvatarDisplayProps {
  avatarId: string | null
  initials?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { container: 'size-8 rounded-xl', svgSize: 26 },
  md: { container: 'size-14 rounded-2xl', svgSize: 44 },
  lg: { container: 'size-24 rounded-3xl', svgSize: 76 },
}

export function AvatarDisplay({ avatarId, initials = '?', size = 'md' }: AvatarDisplayProps) {
  const { container, svgSize } = sizeMap[size]
  const definition = avatarId ? getAvatarById(avatarId) : null

  if (definition) {
    return (
      <div
        className={`${container} shrink-0 grid place-items-center bg-[#141414] border border-white/[0.08] overflow-hidden`}
        style={{ boxShadow: `0 0 16px ${definition.glowColor}` }}
      >
        <AvatarSVG
          avatarId={definition.id}
          accentColor={definition.accentColor}
          size={svgSize}
        />
      </div>
    )
  }

  return (
    <div
      className={`${container} shrink-0 grid place-items-center bg-[#B6FF00] shadow-[0_0_24px_rgba(182,255,0,0.2)]`}
    >
      <span
        className={`font-display font-bold text-[#080808] ${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-xl' : 'text-xs'}`}
      >
        {initials}
      </span>
    </div>
  )
}
